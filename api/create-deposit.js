import { getDb } from './_lib/firebase.js';
import { makeOrderNo, requiredEnv, signFields } from './_lib/fzpay.js';

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const { amount, phone, method } = req.body || {};
    const numericAmount = Number(amount);
    const cleanPhone = String(phone || '').trim();
    const cleanMethod = String(method || '').toUpperCase();
    if (!cleanPhone || /[.#$\[\]/]/.test(cleanPhone) || cleanPhone.length > 100) {
      return send(res, 400, { ok: false, message: 'Invalid account' });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 10000000) {
      return send(res, 400, { ok: false, message: 'Invalid amount' });
    }
    if (!['BKASH', 'NAGAD'].includes(cleanMethod)) {
      return send(res, 400, { ok: false, message: 'Unsupported payment method' });
    }

    const db = getDb();
    const userSnap = await db.ref(`users/${cleanPhone}`).get();
    if (!userSnap.exists()) return send(res, 404, { ok: false, message: 'Account not found. Please log in again.' });
    const user = userSnap.val() || {};
    const orderNo = makeOrderNo();
    const amountText = numericAmount.toFixed(2);
    const baseUrl = requiredEnv('APP_BASE_URL').replace(/\/$/, '');
    const callbackUrl = process.env.FZ_CALLBACK_URL || `${baseUrl}/api/fzpay-callback`;
    const returnUrl = `${baseUrl}/`;

    const savedPayment = {
      order_no: orderNo,
      amount: amountText,
      method: cleanMethod,
      name: String(user.memberName || 'StarLight Member').slice(0, 80),
      phone: cleanPhone,
      callback_url: callbackUrl,
      return_url: returnUrl
    };
    await db.ref(`fzpayOrders/${orderNo}`).set({
      ...savedPayment,
      status: 'Pending',
      currency: 'BDT',
      createdAt: Date.now(),
      provider: 'FZPay'
    });
    // Persist the pending deposit for the existing deposit-history UI.
    await db.ref(`deposits/${orderNo}`).set({
      phone: cleanPhone,
      amount: numericAmount,
      method: cleanMethod.toLowerCase(),
      status: 'Pending',
      date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }),
      timestamp: Date.now(),
      gateway: 'FZPay',
      orderNo
    });

    const fields = {
      ...savedPayment,
      app_id: requiredEnv('FZ_APP_ID'),
      timestamp: String(Math.floor(Date.now() / 1000)),
      action: 'deposit'
    };
    fields.sign = signFields(fields, requiredEnv('FZ_SECRET'));
    const response = await fetch(process.env.FZ_API || 'https://fzpay.site/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(110000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true || !result.payUrl) {
      await db.ref(`fzpayOrders/${orderNo}`).update({ providerResponse: result, providerHttpStatus: response.status, updatedAt: Date.now() });
      await db.ref(`deposits/${orderNo}`).update({ gatewayMessage: result.message || 'Gateway rejected order' });
      return send(res, 502, { ok: false, message: result.message || 'Payment order could not be created. Contact support before retrying.' });
    }
    await db.ref(`fzpayOrders/${orderNo}`).update({
      providerReference: result.reference || '',
      payUrl: result.payUrl,
      providerResponse: result,
      updatedAt: Date.now()
    });
    await db.ref(`deposits/${orderNo}`).update({ reference: result.reference || '' });
    return send(res, 200, { ok: true, payUrl: result.payUrl, orderNo });
  } catch (error) {
    console.error('FZPay create-deposit error:', error);
    return send(res, 500, { ok: false, message: 'Gateway setup error. Please contact support.' });
  }
}

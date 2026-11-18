import { getDb } from './_lib/firebase.js';
import { requiredEnv, verifySignature } from './_lib/fzpay.js';

function reply(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { ok: false, message: 'Method not allowed' });
  try {
    const data = req.body || {};
    if (String(data.app_id || '') !== requiredEnv('FZ_APP_ID')) return reply(res, 401, { ok: false, message: 'Invalid app id' });
    if (!verifySignature(data, requiredEnv('FZ_SECRET'))) return reply(res, 401, { ok: false, message: 'Invalid signature' });
    if (String(data.type || '').toLowerCase() !== 'deposit') return reply(res, 400, { ok: false, message: 'Invalid transaction type' });

    const orderNo = String(data.order_no || '');
    if (!orderNo || orderNo.length > 100 || /[.#$\[\]/]/.test(orderNo)) return reply(res, 400, { ok: false, message: 'Invalid order number' });
    const db = getDb();
    const orderRef = db.ref(`fzpayOrders/${orderNo}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists()) return reply(res, 404, { ok: false, message: 'Order not found' });
    const order = orderSnap.val() || {};
    if (String(data.currency || '').toUpperCase() !== 'BDT') return reply(res, 400, { ok: false, message: 'Currency mismatch' });
    if (Number(data.amount).toFixed(2) !== Number(order.amount).toFixed(2)) return reply(res, 400, { ok: false, message: 'Amount mismatch' });

    const status = String(data.status || '').toLowerCase();
    if (status !== 'success' && status !== 'successful') {
      await orderRef.update({ status: 'Failed', callback: data, updatedAt: Date.now() });
      await db.ref(`deposits/${orderNo}`).update({ status: 'Failed', callbackAt: Date.now() });
      return reply(res, 200, { ok: true, message: 'Failure recorded' });
    }

    const creditPolicy = (process.env.FZ_DEPOSIT_CREDIT_POLICY || 'gross').toLowerCase();
    const creditAmount = Number((creditPolicy === 'net' ? data.net_amount : data.amount));
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) return reply(res, 400, { ok: false, message: 'Invalid credit amount' });
    const userRef = db.ref(`users/${order.phone}`);
    const creditResult = await userRef.transaction((user) => {
      if (!user) return;
      const receipts = user.fzpayCreditReceipts || {};
      if (receipts[orderNo]) return user;
      user.balance = Number(user.balance || 0) + creditAmount;
      user.fzpayCreditReceipts = { ...receipts, [orderNo]: true };
      return user;
    });
    if (!creditResult.committed || !creditResult.snapshot.exists()) return reply(res, 409, { ok: false, message: 'User account not found or credit not committed' });

    await orderRef.update({ status: 'Success', callback: data, creditedAmount: creditAmount, updatedAt: Date.now() });
    await db.ref(`deposits/${orderNo}`).update({
      status: 'Success',
      reference: String(data.reference || ''),
      utr: String(data.utr || ''),
      fee: Number(data.fee || 0),
      netAmount: Number(data.net_amount || 0),
      callbackAt: Date.now()
    });
    return reply(res, 200, { ok: true, message: 'Deposit credited' });
  } catch (error) {
    console.error('FZPay callback error:', error);
    return reply(res, 500, { ok: false, message: 'Callback processing error' });
  }
}

StarLight + FZPay — Vercel deployment

Included
- index.html: original page retained; only bKash/Nagad deposit submission uses FZPay. Binance remains unchanged.
- api/create-deposit.js: server-side signed deposit request and Firebase pending order.
- api/fzpay-callback.js: signed callback validation and idempotent Firebase balance credit.
- api/_lib/fzpay.js: HMAC signing and Firebase Admin helpers.

ROTATE CREDENTIALS
The previous Secret Key and password were exposed in chat. Revoke/rotate them in FZPay. Never put the new secret in HTML or send it in chat.

Vercel → Settings → Environment Variables
FZ_APP_ID = your merchant App ID
FZ_SECRET = newly rotated merchant secret
FZ_API = https://fzpay.site/api.php
APP_BASE_URL = https://YOUR-DEPLOYED-DOMAIN
FZ_CALLBACK_URL = https://YOUR-DEPLOYED-DOMAIN/api/fzpay-callback
FIREBASE_DATABASE_URL = https://pay-admin-98aca-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT = complete Firebase Admin service-account JSON (private)
FZ_DEPOSIT_CREDIT_POLICY = net (or gross; choose deliberately)

Firebase service account
Firebase Console → Project Settings → Service Accounts → generate private key.
Put the entire JSON only in Vercel's FIREBASE_SERVICE_ACCOUNT environment variable.
Never put it in index.html, public files or Git.

Callback behaviour
- Uses existing paths users/{phone}.balance, users/{phone}.depositReceipts and deposits/{orderNo}.
- A verified successful callback credits balance exactly once and marks deposit history Success.
- A verified failed callback marks history Failed without credit.
- Existing page's 5% referral listener sees the Success deposit record and processes commission.
- Browser return URL is not treated as payment proof.
- Default `net` credits amount minus fee. `gross` credits the full deposit amount.

Deploy
1. Import this folder/repository into Vercel.
2. Add environment variables.
3. Deploy, then set APP_BASE_URL and FZ_CALLBACK_URL to the final domain and redeploy.
4. Register/approve the exact callback URL with FZPay.
5. FZPay requires the merchant server's outbound public IP to be allowlisted. Standard Vercel deployments may not have a fixed outbound IP; if required, enable a static-egress option available to your Vercel plan or use a fixed-IP backend.
6. Test with a small amount before enabling normal deposits.

Security limitation
The supplied HTML stores the logged-in phone in localStorage; this is not a server-verified Firebase Auth session. The API verifies that the account exists and pins the order beneficiary server-side, but it does not replace proper authentication. Before handling substantial real-money payments, migrate login to Firebase Authentication and verify ID tokens in create-deposit.js.

This project handles deposits only, not withdrawals. If a gateway timeout occurs, keep the same order number and reconcile it; do not create a replacement payment blindly.

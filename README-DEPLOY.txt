DEPLOYMENT NOTES
================
Runtime: Vercel Node.js serverless functions (Node 20+)
API endpoints:
  POST /api/create-deposit
  POST /api/fzpay-callback

The frontend calls /api/create-deposit for bKash/Nagad. Binance remains unchanged.
Never commit secrets or Firebase service-account JSON.
Set all environment variables from README-BN.txt, then redeploy.
The callback verifies HMAC-SHA256 and checks order, BDT currency and amount before crediting a user once.
Production note: migrate the current custom/localStorage login to Firebase Authentication and verify ID tokens in create-deposit before accepting real-money deposits.

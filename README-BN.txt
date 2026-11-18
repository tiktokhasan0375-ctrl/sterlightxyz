StarLight + FZ PAY Gateway (Vercel)
==================================

এই প্রজেক্টে মূল StarLight index.html-এর ডিজাইন/অন্যান্য ফিচার অপরিবর্তিত রাখা হয়েছে। bKash/Nagad ডিপোজিটের বর্তমান /api/create-deposit কলটি FZ PAY সার্ভার API-তে পাঠানোর জন্য Vercel serverless backend যুক্ত করা হয়েছে। Binance-এর আগের লিংক/পদ্ধতি অপরিবর্তিত।

GitHub-এ আপলোড
--------------
1. ZIP Extract করুন।
2. ZIP-এর ভেতরের index.html, package.json, vercel.json, api ফোল্ডার এবং README ফাইলগুলো repository-এর root-এ আপলোড করুন।
3. Vercel-এ repository Import/Deploy করুন।

Vercel > Settings > Environment Variables-এ যোগ করুন:
------------------------------------------------------
FZ_APP_ID = FZ1E7369189F45
FZ_SECRET = Merchant Dashboard থেকে নতুন/rotate করা Secret Key (পুরোনো চ্যাটে দেওয়া key ব্যবহার করবেন না)
FZ_API = https://fzpay.site/api.php
APP_BASE_URL = https://আপনার-সাইটের-domain
FZ_CALLBACK_URL = https://আপনার-সাইটের-domain/api/fzpay-callback
FIREBASE_DATABASE_URL = https://pay-admin-98aca-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT = Firebase Admin service account-এর সম্পূর্ণ JSON এক লাইনে
FZ_DEPOSIT_CREDIT_POLICY = gross

FZ_DEPOSIT_CREDIT_POLICY:
- gross: callback-এর amount অনুযায়ী ইউজারের ব্যালেন্সে জমা হবে।
- net: callback-এর net_amount অনুযায়ী জমা হবে।

তারপর Vercel-এ Redeploy করুন।

গুরুত্বপূর্ণ
-----------
- FZ_APP_ID এবং FZ_SECRET আপনার merchant dashboard থেকে নিতে হবে। এখানে placeholder দেওয়া হয়নি।
- Firebase Console > Project Settings > Service Accounts থেকে Admin SDK private key JSON তৈরি করুন। JSON কখনো GitHub-এ আপলোড করবেন না; শুধু Vercel Environment Variable-এ রাখবেন।
- FZ PAY-তে callback URL approve এবং merchant server IP whitelist করতে হতে পারে। Vercel-এর outbound IP স্থায়ী নাও হতে পারে; FZ PAY-কে Vercel-compatible whitelist বা fixed-egress সমাধান নিশ্চিত করতে বলুন।
- আপনার বর্তমান HTML-এ custom login/localStorage-ভিত্তিক session আছে, Firebase Authentication ID token নেই। তাই API-তে phone পাঠানোটি পূর্ণ user authentication নয়। বাস্তব অর্থ চালুর আগে Firebase Authentication/ID-token যাচাই যুক্ত করা আবশ্যক; নইলে কেউ request পরিবর্তন করে অন্য account-এর phone পাঠাতে পারে।
- আগের Secret Key/password যদি কোথাও চ্যাট বা GitHub-এ প্রকাশ হয়ে থাকে, নতুন key/password তৈরি করুন।
- প্রথমে ছোট অঙ্কে sandbox/test transaction চালিয়ে callback, credited amount, fee এবং duplicate callback যাচাই করুন।


পরিবেশ ভেরিয়েবল নমুনা
---------------------
ZIP-এর .env.example ফাইলে App ID ও প্রয়োজনীয় ভেরিয়েবলের নমুনা আছে। Secret Key এবং Firebase Admin JSON শুধু Vercel Environment Variables-এ দিন; GitHub-এ দেবেন না।

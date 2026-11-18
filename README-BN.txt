StarLight + FZPay — Vercel সেটআপ

১. আগের Secret Key প্রকাশিত হয়েছে। FZPay থেকে নতুন Secret Key তৈরি করুন।
২. এই প্রজেক্ট Vercel-এ Import করুন।
৩. Settings → Environment Variables-এ দিন:

FZ_APP_ID = আপনার Merchant App ID
FZ_SECRET = নতুন Secret Key
FZ_API = https://fzpay.site/api.php
APP_BASE_URL = https://আপনার-সাইট.vercel.app
FZ_CALLBACK_URL = https://আপনার-সাইট.vercel.app/api/fzpay-callback
FIREBASE_DATABASE_URL = https://pay-admin-98aca-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT = Firebase Admin service-account সম্পূর্ণ JSON
FZ_DEPOSIT_CREDIT_POLICY = net

৪. Firebase Console → Project Settings → Service Accounts থেকে Admin SDK JSON তৈরি করুন।
   JSON শুধু Vercel Environment Variable-এ রাখবেন; HTML/GitHub-এ নয়।
৫. Deploy করে নিজের আসল domain বসিয়ে APP_BASE_URL ও FZ_CALLBACK_URL আপডেট করে আবার Deploy করুন।
৬. FZPay-কে callback URL অনুমোদন করতে দিন এবং প্রয়োজন হলে server-এর outbound public IP whitelist করুন।
   সাধারণ Vercel deployment-এ স্থায়ী outbound IP নাও থাকতে পারে; fixed IP বাধ্যতামূলক হলে static egress বা fixed-IP hosting লাগবে।
৭. প্রথমে ছোট অঙ্কে পরীক্ষা করুন।

Verified FZPay callback সফল হলে users/{phone}.balance একবারই বাড়ে এবং deposits/{orderNo}
ইতিহাসে Success হয়। Failed callback-এ ব্যালেন্স বাড়ে না। Browser return দেখে কখনো
ব্যালেন্স যোগ হয় না। net policy-তে gateway fee বাদ দিয়ে টাকা যোগ হয়; gross policy-তে
পুরো amount যোগ হয়।

এই প্রজেক্টে bKash/Nagad deposit আছে; withdrawal নেই। বর্তমান HTML-এর login phone
localStorage থেকে আসে, তাই বড় অঙ্কের live payment-এর আগে Firebase Authentication
token verification যোগ করা উচিত।

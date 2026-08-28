# Dreamscope — Search Console & Indexing Setup

الموقع live على: **https://dream-interpreter-alpha-ruddy.vercel.app**
ملف الـ sitemap: **https://dream-interpreter-alpha-ruddy.vercel.app/sitemap.xml** (15,289 صفحة)

---

## 1) Google Search Console (مطلوب منك — عندي limit أمان مانعني أدخل حسابك)

1. افتح https://search.google.com/search-console
2. اختَر **URL prefix** وحط: `https://dream-interpreter-alpha-ruddy.vercel.app`
3. في طريقة التحقق اختَر **HTML tag** وانسخ الكود (شكله `content="...."`).
4. ابعتهولي (أو حطه مكان `GSC_VERIFICATION_CODE_PLACEHOLDER` في `index.html` سطر 8) وأنا أعمل commit + deploy.
5. بعد ما يتحقق: **Sitemaps** ← حط `sitemap.xml` ← Submit.
6. انتظر 2–3 أيام وستقبل أول impressions.

> بديل بدون تعديل كود: في Search Console اختَر **Google Analytics** أو **DNS** كطريقة تحقق لو سهل عليك.

---

## 2) Bing Webmaster (مجاني، يفهرس أسرع + Yahoo)

1. https://www.bing.com/webmasters
2. أضف الموقع → تحقق بـ **sitemap**: `https://dream-interpreter-alpha-ruddy.vercel.app/sitemap.xml`
3. شغّل **URL Submission API** (مجاني، يدفع 10k URL/day) — بديل عن انتظار الزحف.

---

## 3) IndexNow (يخلي قوقل+Bing يفهرسوا في دقائق بدل أسابيع)

الموقع عنده `api/seo-data.json` جاهز. عشان نفعّل IndexNow محتاجين:
- مفتاح (نطلبه مجاناً من https://www.indexnow.org)
- سكربت `scripts/indexnow-submit.mjs` يدفع الـ 15k URL

ده بيسرّع الظهور في نتائج البحث بشكل كبير.

---

## 4) Backlinks (أهم عامل لزيادة الزيارات)

الزيارات الحقيقية بتجي من الروابط الخارجية + المحتوى. قوائم جاهزة في `BACKLINKS.md`.

> ملاحظة: أنا مش أقدر أنشر من حساباتك (Reddit/Quora) بسبب حد الأمان. بجهّز النصوص + الروابط جاهزة؛ إنت بس تضغط Post. أو لو عايز automation، محتاج تفوضني بـ API keys (ماfeedوش).

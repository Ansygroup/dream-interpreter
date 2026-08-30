# 🌙 Dreamscope — دليل التشغيل (Workflow)

> **المرجع الرسمي لأي أتمتة أو جلسة عمل على هذا المشروع.** اتبع هذا الملف حرفياً.

- **الموقع:** https://dream-interpreter-alpha-ruddy.vercel.app
- **الريبو:** https://github.com/Ansygroup/dream-interpreter
- **المنصة:** Vercel (project: `dream-interpreter`, team: `ansygroups-projects`)
- **الستاك:** React 18 + Vite + TS + Tailwind (واجهة) • Vercel Functions (API) • i18n خاص بـ 60 لغة

---

## 1) دورة النشر (Deployment)

⚠️ **تكامل Git→Vercel غير مفعّل في هذا المشروع** — الـ push وحده لا ينشر!

```bash
# بعد كل تغييرات:
git add -A && git commit -m "..." && git push origin master
npx vercel deploy --prod --yes     # إلزامي بعد كل push
```

- مدة النشر ~20 ثانية، لكن قد يدخل **طابور انتظار** (حتى ساعات في أوقات الازدحام) — تحقق بـ `npx vercel ls dream-interpreter`
- **بديل تلقائي (يفضَّل تفعيله):** GitHub Actions جاهز في `.github/workflows/deploy.yml` — يتطلب إضافة 3 أسرار في إعدادات الريبو: `VERCEL_TOKEN` (من vercel.com/account/tokens) و`VERCEL_ORG_ID` و`VERCEL_PROJECT_ID` (من `.vercel/project.json`). بعد إضافة الأسرار سينشر تلقائياً مع كل push ويمكن تجاهل النشر اليدوي.

## 2) دورة التطور الذاتي اليومية (Evolve)

**وقت التشغيل:** يومياً 03:00 صباحاً (أتمتة ZCode: "تطور Dreamscope اليومي")

```bash
cd "C:\Users\ansy0\ZCodeProject\projects\repos\dream-interpreter"
node scripts/evolve.mjs
# ثم إن تغيّر ملفات:
git add -A && git commit -m "evolve: daily translations + dream of the day" && git push origin master
npx vercel deploy --prod --yes
```

ماذا يفعل:
1. **يكمل ترجمات الواجهة الناقصة** (44 لغة ذاتية الأساس حالياً) عبر `POST /api/translate` — المفتاح لا يترك Vercel، وسلسلة نماذج مجانية داخلية (GLM → MiniMax → Nemotron → Gemma → Ling)
2. **يولّد "حلم اليوم"** (عربي + إنجليزي) عبر `POST /api/interpret` → `public/dream-today.json` — تظهر تلقائياً في الصفحة الرئيسية

قواعد:
- السكربت يتخطى "حلم اليوم" إذا كان مولّداً لنفس اليوم — لا تشغّله مرتين يدوياً
- إذا فشلت الترجمة بـ HTTP 429 (استنزاف الحصة المجانية 50/يوم) — **توقف بهدوء**، ستُكمل غداً تلقائياً
- أي ملف لغة ينقصه قسم `about` يُعتبر "ناقصاً" ويُعاد ترجمته كاملاً

## 3) محرك التفسير (API)

- `POST /api/interpret` — `{ dream, language, perspective }` → تفسير + رموز + محرك
- **سلسلة هجينة:** 5 نماذج مجانية (بالترتيب) → قاعدة رموز أوفلاين (لا تفشل أبداً)
- **المنظورات الثمانية:** general, islamic, christian, jewish, hindu, buddhist, psychology, chinese — كل منها system prompt مخصص في `api/interpret.js`
- `POST /api/feedback` — 👍/👎 (يُخزَّن سحابياً عند تفعيل Supabase)
- `POST /api/translate` — ترجمة الواجهة (للاستخدام الآلي فقط)
- متغيرات البيئة: `OPENROUTER_API_KEY` (موجود في Vercel Production). اختياري: `DREAMSCOPE_AI_MODEL` لإجبار نموذج مدفوع

## 4) الحسابات والسحابة (Phase 4 — بانتظار المفاتيح)

عند توفّر مفاتيح Supabase (URL + anon key):
1. أضفها في Vercel: `npx vercel env add SUPABASE_URL production` و `SUPABASE_ANON_KEY`
2. نفّذ مخطط قاعدة البيانات: `profiles` (اللغة، المنظور، الثيم) • `dreams` (اليومية السحابية) • `feedback`
3. فعّل Auth: Magic Link + Google OAuth
4. ارفع الأحلام المحلية (localStorage) عند أول تسجيل دخول — **وضع الزائر يبقى كاملاً بدون حساب**

## 5) مشاكل شائعة وحلولها

| المشكلة | الحل |
|---|---|
| التغييرات لا تظهر على الموقع | النشر اليدوي لم يُنفذ (`npx vercel deploy --prod --yes`) أو النشر في الطابور (`vercel ls`) |
| التفسير يظهر بجودة قوالب | المحرك في وضع offline — الحصة المجانية استُنزفت (429) أو انتهى الرصيد (402). تُجَدَّد الحصة يومياً، أو اشحن رصيداً |
| ترجمة ناقصة في لغة ما | طبيعي في اللغات ذاتية الأساس — الـ cron اليومي يكملها تدريجياً |
| نص عربي/عبري حروفه منفصلة | لا تضف letter-spacing لأي عنصر RTL — القاعدة في `index.css` تحت `[dir="rtl"]` |
| خطأ JSON في ملف ترجمة | `python -c "import json,glob,io; [json.load(io.open(f,encoding='utf-8')) for f in glob.glob('src/i18n/locales/*.json')]"` يعطي الملف المعطوب |

## 6) قواعد ثابتة (لا تُخترق)

- **الأداء:** ملفات اللغات تُحمَّل كسولاً — لا تستورد locale في أعلى ملف
- **RTL:** استخدم CSS logical properties؛ عربية/عبرية/فارسية/أردية = rtl تلقائياً من `languages.ts`
- **SEO:** صفحات `/seo/*` تُقدَّم من `api/seo.js` (سيرفر) — تعديلات الواجهة SPA لا تمسّها؛ 26,573 صفحة
- **الإيرادات:** AdSense (`ca-pub-4665838048081250`) والروابط المتبادلة (AI Blog, Ansy Group) — لا تُزال
- **الخصوصية:** لا نُرسل نصوص الأحلام لأي طرف ثالث غير مزود الـ LLM لحظة التفسير

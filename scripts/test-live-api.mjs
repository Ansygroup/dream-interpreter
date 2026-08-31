#!/usr/bin/env node
/**
 * test-live-api.mjs — REAL end-to-end check of the live interpret API.
 *
 * Calls the DEPLOYED endpoint (default https://dream-interpreter-alpha-ruddy.vercel.app)
 * across all 8 perspectives and several languages, asserting each returns a real,
 * non-empty reading. This is the "actually test it" proof the brief demands.
 *
 * Run after a deploy:  BASE_URL=https://your-site.vercel.app node scripts/test-live-api.mjs
 * Network + LLM required — NOT part of `npm test` (which is offline/fast).
 */
const BASE = process.env.BASE_URL || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const URL = `${BASE}/api/interpret`;

const cases = [
  ['en', 'general'],
  ['ar', 'islamic'],
  ['es', 'psychology'],
  ['zh', 'chinese'],
  ['fr', 'christian'],
  ['hi', 'hindu'],
  ['ru', 'buddhist'],
  ['de', 'jewish'],
];

// Distinctive markers per perspective — a reading must contain at least one of its
// tradition's signature terms to prove it is actually read through THAT lens
// (not just a generic reply). Kept permissive; LLM phrasing varies.
const MARKERS = {
  general: [/universal|world traditions|inclusive|many traditions/i],
  islamic: [/ibn sirin|islam|muslim|qur|sunnah|salah|dhikr|شرع|إسلام|ابن سيرين|صلاة|ذكر|الرؤيا|تأويل/i],
  psychology: [/jung|freud|archetype|shadow|psyche|psycholog|يونغ|فرويد|لاوعي|نفس|ظل|تحليل/i],
  chinese: [/zhou gong|yin|yang|five elements|wuxing|zhougong|يين|يانغ|خمسة عناصر|تشو غونغ|传统解梦|易经|阴阳|五行|周公/i],
  christian: [/joseph|daniel|bible|scripture|christ|gospel|prayer|مسيح|يوسف|دانيال|إنجيل|صلاة|chrétien|chrétienne|église|biblique|pastoral/i],
  hindu: [/ved|upanishad|karma|deity|dharma|samskara|هند|فيد|كارما|دارما|إله|تأمل|वेद|कर्म|धर्म|देव|शुभ|संस्कार/i],
  buddhist: [/buddh|impermanence|tibet|mindful|dhamma|samsara|nirvana|بوذ|زوال|تيب|تأمل|سامسارا|тибет|будд|дхарм|сансар| imperman|освобожд/i],
  jewish: [/torah|talmud|prophet|jewish|hebrew|choni|توراة|تلمود|يهود|نبي|عبري|טורה|יהוד|תלמוד|נבי/i],
};

let pass = 0, fail = 0;
console.log(`[live-api] probing ${BASE}\n`);
for (const [lang, persp] of cases) {
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: 'I saw a snake leaving my house', language: lang, perspective: persp }),
    });
    const j = await r.json();
    const text = j.interpretation || '';
    const responds = r.status === 200 && text.trim().length > 20;
    const onLens = (MARKERS[persp] || []).some((re) => re.test(text));
    const ok = responds && onLens;
    const peek = text.replace(/\s+/g, ' ').slice(0, 64);
    if (ok) { pass++; console.log(`  PASS ${lang}/${persp} (${r.status}) lens✓ — ${peek}…`); }
    else if (responds) { fail++; console.log(`  FAIL ${lang}/${persp} (${r.status}) responds but NO lens marker — ${peek}`); }
    else { fail++; console.log(`  FAIL ${lang}/${persp} (${r.status}) — ${(j.error || '').slice(0, 60)}`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL ${lang}/${persp} — network error: ${e.message}`);
  }
}
console.log(`\nLIVE API (responds + distinct lens): ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

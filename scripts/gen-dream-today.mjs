#!/usr/bin/env node
/**
 * gen-dream-today.mjs — generates public/dream-today.json (the "Dream of the day"
 * card on the home page). Self-completing daily feed: picks a symbol, synthesizes
 * a short dream, interprets it in EN + AR via the live /api/interpret, and writes
 * the JSON in the exact shape Home.tsx expects.
 *
 * Usage (cron, daily):
 *   node scripts/gen-dream-today.mjs
 * Then deploy (vercel-auto-deploy.mjs handles quota + verify).
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const OUT = path.join(root, 'public', 'dream-today.json');
const API = process.env.API_BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app/api/interpret';

// Mirror of the SYMBOLS list in Home.tsx (en/ar labels).
const SYMBOLS = [
  { key: 'snake', en: 'Snake', ar: 'الثعبان' }, { key: 'water', en: 'Water', ar: 'الماء' },
  { key: 'flying', en: 'Flying', ar: 'الطيران' }, { key: 'falling', en: 'Falling', ar: 'السقوط' },
  { key: 'teeth', en: 'Teeth', ar: 'الأسنان' }, { key: 'death', en: 'Death', ar: 'الموت' },
  { key: 'house', en: 'House', ar: 'البيت' }, { key: 'fire', en: 'Fire', ar: 'النار' },
  { key: 'dog', en: 'Dog', ar: 'الكلب' }, { key: 'marriage', en: 'Marriage', ar: 'الزواج' },
  { key: 'cat', en: 'Cat', ar: 'القطة' }, { key: 'bird', en: 'Bird', ar: 'الطائر' },
  { key: 'fish', en: 'Fish', ar: 'السمكة' }, { key: 'tree', en: 'Tree', ar: 'الشجرة' },
  { key: 'sun', en: 'Sun', ar: 'الشمس' }, { key: 'moon', en: 'Moon', ar: 'القمر' },
  { key: 'baby', en: 'Baby', ar: 'الرضيع' }, { key: 'money', en: 'Money', ar: 'المال' },
  { key: 'pregnancy', en: 'Pregnancy', ar: 'الحمل' }, { key: 'blood', en: 'Blood', ar: 'الدم' },
];
// Short dream templates keyed by symbol — gives a plausible dream sentence.
const DREAMS = {
  snake: { en: 'I saw a green snake leave the house through the garden gate.', ar: 'رأيتُ ثعباناً أخضر يغادر المنزل عبر بوابة الحديقة.' },
  water: { en: 'I stood at the edge of a vast calm lake at sunrise.', ar: 'وقفتُ على حافة بحيرة هادئة ممتدة عند شروق الشمس.' },
  flying: { en: 'I was flying above my city at dawn and the streets glowed beneath me.', ar: 'كنتُ أطير فوق مدينتي عند الفجر وتألقت الشوارع تحتي.' },
  falling: { en: 'I fell through the air but never hit the ground.', ar: 'سقطتُ عبر الهواء لكنني لم ألمس الأرض.' },
  teeth: { en: 'A tooth came loose and crumbled in my hand.', ar: 'تزعزع سنٌ وسقط متفتتاً في يدي.' },
  death: { en: 'I watched someone I love fade like morning mist.', ar: 'راقبتُ من أحبّ يتلاشى كضباب الصباح.' },
  house: { en: 'I wandered through rooms of my childhood home I had forgotten.', ar: 'تجوّلتُ في غرف من بيت طفولتي كنتُ قد نسيتها.' },
  fire: { en: 'A small fire warmed a cold empty room.', ar: 'أضاءت نارٌ صغيرة غرفةً باردةً خالية.' },
  dog: { en: 'A dog I had never met followed me home and stayed.', ar: 'تبعني كلبٌ لم أقابله من قبل حتى المنزل وبقي.' },
  marriage: { en: 'I was invited to a wedding where everyone I knew was dancing.', ar: 'دُعيتُ إلى زفاف وكل من أعرفهم يرقصون.' },
  cat: { en: 'A cat watched me from a windowsill and then vanished.', ar: 'راقبتني قطةٌ من على حافة نافذة ثم اختفت.' },
  bird: { en: 'A white bird landed on my open palm and sang.', ar: 'هبط طائرٌ أبيض على راحتي المفتوحة وغرّد.' },
  fish: { en: 'I swam with a school of fish in clear blue water.', ar: 'سبحتُ مع مجموعة من الأسماك في ماءٍ أزرق صافٍ.' },
  tree: { en: 'An old tree in my garden bloomed overnight.', ar: 'أزهرت شجرةٌ عتيقة في حديقتي في ليلة.' },
  sun: { en: 'The sun broke through grey clouds and lit the whole valley.', ar: 'انفرجت الغيوم الرمادية وأضاءت الشمس الوادي كله.' },
  moon: { en: 'I walked under a full moon that seemed close enough to touch.', ar: 'مشيتُ تحت بدرٍ بدا قريباً كأنه في متناول اليد.' },
  baby: { en: 'I held a calm sleeping baby I somehow knew was mine.', ar: 'احتضنتُ رضيعاً هادئاً نائماً علمتُ أنه لي.' },
  money: { en: 'I found coins in the lining of an old coat.', ar: 'وجدتُ قطعاً نقدية في بطانة معطفٍ قديم.' },
  pregnancy: { en: 'Someone told me news that would change a family forever.', ar: 'أخبرني أحدهم بخبرٍ سيغيّر عائلةً للأبد.' },
  blood: { en: 'I noticed a single drop of red on a white page.', ar: 'لاحظتُ قطرةً حمراء وحيدة على صفحة بيضاء.' },
};
const PERSPECTIVE = { en: 'general', ar: 'islamic' };

// A reading is only accepted if it looks like a COMPLETE answer. Without this
// guard the API's occasionally-truncated AR reply ships verbatim: 2026-10-02
// cut off mid-word ("...ذي مكانةٍ رفي") and 2026-10-03 at 284 chars
// ("... قلباً يفتقر إلى الدفء الروحي، وش"), both written to public/ and served
// live. A short reading that does not end on sentence-final punctuation is a
// truncated response, not a short interpretation - reject and retry it.
const MIN_READING = 80;
const SENTENCE_END = /[.!?؟।۔\n"'\u201d]\s*$/;
const looksComplete = (t) => t.length >= MIN_READING && SENTENCE_END.test(t.trim());

// A reading can pass every other check and still be visibly broken: the free
// gateway sometimes emits literal U+FFFD REPLACEMENT CHARACTER mid-word
// (2026-10-04: "ابن سي��ين" for سيرين, "ش��وراً" for شعوراً). Those bytes are
// valid UTF-8 and end on punctuation, so the length/terminator gate passed them
// straight to production and the Arabic card rendered with black diamonds.
// Corrupted letters are unrecoverable without guessing the word, so reject and
// re-read rather than ship them.
const hasMojibake = (t) => /\ufffd/.test(t);

const post = (lang, dream, persp) => new Promise((res) => {
  const body = JSON.stringify({ dream, perspective: persp, language: lang });
  const rq = https.request(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    (r) => {
      let b = ''; r.on('data', (c) => (b += c));
      r.on('end', () => {
        try {
          const j = JSON.parse(b);
          res({ text: j.interpretation || '', engine: j.engine || '' });
        } catch { res({ text: '', engine: '' }); }
      });
    });
  rq.on('error', () => res({ text: '', engine: '' }));
  rq.write(body); rq.end();
});

// The API answers 200 even when every LLM failed: it falls back to a hardcoded
// keyword template and reports engine:"offline". That fallback is LONG and ends
// in punctuation, so looksComplete() alone accepted it and 2026-10-04 shipped a
// 206-char boilerplate card instead of a real reading (10-03 was 922 chars).
// Offline means "the free-model quota is exhausted" - a reading from it is not
// an interpretation, so it must never reach public/.
// 'cache' is fine: it is a real LLM reading replayed from the 24h cache.
const isRealEngine = (engine) => engine && engine !== 'offline';

/* ---------------- Direct-provider fallback ---------------- */

// The site API only knows OpenRouter. When OpenRouter's shared free pool is
// exhausted it answers HTTP 429 "free-models-per-day" for every model and the
// site serves engine:"offline" boilerplate — which is exactly the state that
// left the 2026-10-04 card as a 194-char keyword template. Free quotas are
// per-gateway, so a SECOND gateway's pool is still fresh: try it directly
// before giving up on the day's card. Reads its key from the environment
// (DREAMSCOPE_FALLBACK_KEY / UNOROUTER_API_KEY) — never hardcode a secret.
const FALLBACK_BASE = process.env.DREAMSCOPE_FALLBACK_BASE || 'https://api.unorouter.com/v1/chat/completions';
// Ordered by measured reliability ON THIS GATEWAY for Arabic: gemini-3.6-flash
// writes clean RTL with zero replacement chars, while deepseek-v4-flash
// returned U+FFFD mid-word ("ح��ى" for حتى) on the same prompt. A second
// gateway's quota being free does not mean its first model is text-clean, so
// the chain must try more than one model before giving up on the day.
const FALLBACK_MODELS = (process.env.DREAMSCOPE_FALLBACK_MODELS || 'gemini-3.6-flash:free,deepseek-v4-flash:free')
  .split(',').map((s) => s.trim()).filter(Boolean);
const fallbackKey = () => process.env.DREAMSCOPE_FALLBACK_KEY || process.env.UNOROUTER_API_KEY || '';

const LANG_NAME = { en: 'English', ar: 'Arabic' };

// The direct model is a raw LLM, not the site's shaped pipeline, so it must be
// told the house rules itself. A model that answers an Arabic prompt in English
// would pass looksComplete() and ship a wrong-language card.
const systemFor = (lang, persp) => `You are Dreamscope, a wise and culturally-grounded dream interpreter writing in ${LANG_NAME[lang]}.
${persp === 'islamic' ? 'Ground the reading in the Islamic tradition (dream symbolism as in Ibn Sirin); never declare death, illness or misfortune as fact.' : 'Draw on classical and cross-cultural dream symbolism.'}
Rules:
- Respond ONLY in ${LANG_NAME[lang]}. No English words at all in an Arabic reading.
- 2 to 4 short paragraphs, warm and reflective. No headings, no markdown, no bullet lists.
- Name the key symbols and what they traditionally mean, tied gently to life circumstances.
- End with one grounding sentence of reflection or gentle guidance.`;

// Reject a "complete" answer written in the wrong script.
const looksRightScript = (t, lang) => {
  if (lang !== 'ar') return true;
  const letters = t.replace(/[^\p{L}]/gu, '');
  if (!letters) return false;
  const ar = (letters.match(/[\u0600-\u06FF]/g) || []).length;
  return ar / letters.length > 0.7;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Free models on this gateway allow ~1 request per minute PER ACCOUNT, so the
// two languages must not race: run them through one serialised queue with a
// minimum gap, or whichever arrives second is refused and the day is lost.
const FALLBACK_MIN_GAP_MS = 65000;
let fbQueue = Promise.resolve();
let fbLastAt = 0;
const runSerialised = (fn) => {
  const run = fbQueue.then(async () => {
    const wait = fbLastAt + FALLBACK_MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    try { return await fn(); } finally { fbLastAt = Date.now(); }
  });
  // Keep the chain alive even if this call rejects.
  fbQueue = run.then(() => {}, () => {});
  return run;
};

// One raw call. Resolves { text, engine, retryAfterMs } — retryAfterMs > 0 means
// the gateway refused on rate limit and the caller should wait and try again.
const callFallbackOnce = (lang, dream, persp, model) => new Promise((res) => {
  const key = fallbackKey();
  if (!key) return res({ text: '', engine: '', retryAfterMs: 0 });
  const payload = JSON.stringify({
    model,
    temperature: 0.7,
    max_tokens: 900,
    messages: [
      { role: 'system', content: systemFor(lang, persp) },
      { role: 'user', content: `Dream (as the dreamer wrote it):\n"""${dream.slice(0, 2000)}"""\n\nWrite the ${LANG_NAME[lang]} reading now.` },
    ],
  });
  const u = new URL(FALLBACK_BASE);
  const rq = https.request(
    {
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), Authorization: `Bearer ${key}` },
      timeout: 90000,
    },
    (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => {
        if (r.statusCode === 429 || r.statusCode === 503) {
          // 429: free models here are limited to ~1 request/minute per account,
          // so EN and AR fired together race and the second one loses.
          // 503: the gateway has no free provider capacity right now.
          // Both are transient — let the caller retry through the queue gap.
          const secs = Number((String(b).match(/retry in (\d+)s/i) || [])[1] || 65);
          return res({ text: '', engine: '', retryAfterMs: (secs + 5) * 1000 });
        }
        try {
          const j = JSON.parse(b);
          const msg = j?.choices?.[0]?.message || {};
          // Reasoning-only models put the answer in `reasoning`; using it beats
          // shipping nothing at all.
          const text = String(msg.content || msg.reasoning || '').trim();
          res({ text, engine: text ? `fallback:${j.model || model}` : '', retryAfterMs: 0 });
        } catch { res({ text: '', engine: '', retryAfterMs: 0 }); }
      });
    },
  );
  rq.on('timeout', () => rq.destroy());
  rq.on('error', () => res({ text: '', engine: '', retryAfterMs: 0 }));
  rq.write(payload);
  rq.end();
});

// Try each fallback model in turn, one language at a time. runSerialised already
// enforces the per-account gap, so a 429 needs no extra sleep here — adding one
// on top double-waits and can push the run past daily-feed's timeout.
const callFallback = async (lang, dream, persp) => {
  for (const model of FALLBACK_MODELS) {
    const r = await runSerialised(() => callFallbackOnce(lang, dream, persp, model));
    if (r.text) return r;
    console.warn(`[gen-dream-today] ${lang}: fallback model ${model} unusable${r.retryAfterMs ? ' (rate-limited)' : ''} — trying next model`);
  }
  return { text: '', engine: '', retryAfterMs: 0 };
};

// Retry a language until it returns a complete reading FROM A REAL ENGINE.
// Without this a single partial or offline response permanently poisons the card.
const postVerified = async (lang, dream, persp, attempts = 3) => {
  let offlineSeen = false;
  const acceptable = (t) => looksComplete(t) && looksRightScript(t, lang) && !hasMojibake(t);
  for (let i = 1; i <= attempts; i++) {
    const { text, engine } = await post(lang, dream, persp);
    if (!isRealEngine(engine)) {
      offlineSeen = true;
      console.warn(`[gen-dream-today] ${lang}: rejected attempt ${i} — engine=${engine || 'none'} (site LLM quota down)`);
      continue;
    }
    if (acceptable(text)) {
      if (i > 1) console.warn(`[gen-dream-today] ${lang}: accepted on attempt ${i} (earlier reads were truncated)`);
      return { text, engine };
    }
    const why = hasMojibake(text) ? 'mojibake' : !looksRightScript(text, lang) ? 'wrong script' : 'unterminated/empty';
    console.warn(`[gen-dream-today] ${lang}: rejected attempt ${i} (engine=${engine}, len ${text.length}, ${why})`);
  }
  if (!offlineSeen) return { text: '', engine: '' };

  // Site pool exhausted — try the second gateway before giving up on the day.
  for (let round = 1; round <= 2; round++) {
    const { text, engine } = await callFallback(lang, dream, persp);
    if (text && acceptable(text)) {
      console.log(`[gen-dream-today] ${lang}: site engine down — recovered via fallback gateway (${engine}, ${text.length}ch)`);
      return { text, engine };
    }
    if (!text) break;
    console.warn(`[gen-dream-today] ${lang}: fallback round ${round} rejected (${hasMojibake(text) ? 'mojibake' : !looksRightScript(text, lang) ? 'wrong script' : 'unterminated'})`);
  }
  console.warn(`[gen-dream-today] ${lang}: no clean reading from any engine — not shipping a degraded card`);
  return { text: '', engine: '' };
};

(async () => {
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const d = DREAMS[sym.key] || { en: `I dreamed of ${sym.en.toLowerCase()}.`, ar: `حلمتُ بـ${sym.ar}.` };
  const [en, ar] = await Promise.all([
    postVerified('en', d.en, PERSPECTIVE.en),
    postVerified('ar', d.ar, PERSPECTIVE.ar),
  ]);
  if (!en.text || !ar.text) { console.error('[gen-dream-today] API never returned a complete reading — abort (a partial one must not ship).'); process.exit(1); }
  const engines = [en.engine, ar.engine];
  const out = {
    date: new Date().toISOString().slice(0, 10),
    symbol: { key: sym.key, en: sym.en, ar: sym.ar },
    dream: { en: d.en, ar: d.ar },
    reading: { en: en.text, ar: ar.text },
    // Records WHICH engine produced each reading. daily-feed.mjs treats only a
    // real engine as done, so a card later written by the fallback gateway is
    // still recognised as a genuine interpretation and can be upgraded when the
    // site pool recovers. Cards written before this field existed have
    // engine === undefined and count as done.
    engine: engines[0] === engines[1] ? engines[0] : engines.join('+'),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`[gen-dream-today] wrote ${OUT} — ${sym.en} (${out.date})`);
})();

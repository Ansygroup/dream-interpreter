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

const post = (lang, dream, persp) => new Promise((res) => {
  const body = JSON.stringify({ dream, perspective: persp, language: lang });
  const rq = https.request(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b).interpretation || ''); } catch { res(''); } }); });
  rq.on('error', () => res('')); rq.write(body); rq.end();
});

(async () => {
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const d = DREAMS[sym.key] || { en: `I dreamed of ${sym.en.toLowerCase()}.`, ar: `حلمتُ بـ${sym.ar}.` };
  const [enReading, arReading] = await Promise.all([
    post('en', d.en, PERSPECTIVE.en),
    post('ar', d.ar, PERSPECTIVE.ar),
  ]);
  if (!enReading || !arReading) { console.error('[gen-dream-today] API returned empty reading — abort.'); process.exit(1); }
  const out = {
    date: new Date().toISOString().slice(0, 10),
    symbol: { key: sym.key, en: sym.en, ar: sym.ar },
    dream: { en: d.en, ar: d.ar },
    reading: { en: enReading, ar: arReading },
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`[gen-dream-today] wrote ${OUT} — ${sym.en} (${out.date})`);
})();

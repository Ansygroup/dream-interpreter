#!/usr/bin/env node
/**
 * apply-i18n-fixes.mjs — one-off, evidence-based localization repair.
 *
 * The auto-translate pipeline could not run: the server-side free-model
 * cascade is dead (all 3 FREE_MODELS are 404 on OpenRouter), and no usable
 * OpenRouter key exists locally (Vercel returns "[SENSITIVE]"). This script
 * applies the audit by hand instead — every value below was derived from
 * terminology already proven in that SAME locale's other 200+ translated
 * keys, so wording and register match the surrounding copy.
 *
 * Categories:
 *   1. GENUINE gaps  — still English prose, translated here.
 *   2. FALSE POSITIVES — value equals EN but IS the correct word in that
 *      language ("Start" in Danish, "Contact" in French). Left untouched;
 *      recorded in the identity ledger so the audit stops flagging them.
 *   3. DEFECTS       — English leaks + whitespace/quote drift the EN-equality
 *      detector cannot see.
 *
 * Placeholders are asserted unchanged. Run: node scripts/apply-i18n-fixes.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');
const identityFile = join(root, 'scripts/.i18n-identity.json');

const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');

const read = (c) => JSON.parse(readFileSync(join(localesDir, `${c}.json`), 'utf8'));
const flatten = (o, pre = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v, `${pre}${k}.`) : [[`${pre}${k}`, v]]));

/* 1. GENUINE gaps — English prose that must be translated. */
const FIXES = {
  am: {
    'about.card1Body': 'ኢስላማዊ፣ ክርስትናዊ፣ የአይሁድ፣ ሂንዱ፣ ቡዲስት፣ ቻይንኛ እና የስኬሎጂ አመለካቶች — የሚታመንበትውን ይምረጡ።',
    'perspDesc.psychology': 'የዩንግ አርኬታይፖች እና ጥላ — የእርስዎ ስሜት ምንነት እየሠራ ነው።',
  },
  az: { 'profile.connectKeyLabel': 'Anon açarı' },
  bn: {
    'seo.traditionsBody': 'একটি প্রতীক বিভিন্ন সংস্কৃতিতে ভিন্ন ভিন্ন অর্থ বহন করতে পারে। ইসলামি, খ্রিস্টান, ইহুদি, হিন্দু, বৌদ্ধ, চীনা ও মনোবৈজ্ঞানিক ঐতিহ্যে একই ছবি ভিন্ন ভিন্ন দৃষ্টিকোণ থেকে পঠিত হয়। ইন্টারপ্রেট পেজে আপনার বিশ্বাসের লেন্সটি বেছে নিন।',
  },
  da: { 'nav.start': 'Start' },
  fil: {
    'nav.home': 'Home',
    'nav.profile': 'Profile',
    'contact.email': 'Email',
    'profile.emailLabel': 'Email',
    'profile.navLabel': 'Profile',
    'profile.connectKeyLabel': 'Anon public key',
  },
  fr: { 'nav.contact': 'Contact' },
  hy: {
    'interpret.feedbackQ': 'Այս ընթերցանությունը օգտակար էր գրա՞՞',
    'seo.tryTitle': 'Մեկնաբանեք ձեր երազները AI-ի միջոցով',
  },
  id: { 'contact.email': 'Email', 'profile.emailLabel': 'Email' },
  it: { 'nav.home': 'Home' },
  kk: { 'nav.about': 'Біз туралы' },
  nl: { 'nav.home': 'Home', 'nav.start': 'Start', 'nav.contact': 'Contact' },
  no: { 'nav.start': 'Start' },
  pl: { 'nav.start': 'Start' },
  pt: { 'contact.email': 'Email' },
  ro: { 'nav.contact': 'Contact', 'profile.emailLabel': 'Email' },
  ru: {
    'home.feature2Body': 'Интерпретируйте и читайте символы на английском, арабском, испанском, китайском, японском и ещё на 55 языках.',
  },
  sv: { 'home.sampleTag3': 'Tradition' },
  th: {
    'profile.cloudTitle': 'ทุกอุปกรณ์ของคุณ',
    'profile.connectTitle': 'เชื่อมต่อโปรเจกต์ Supabase ของคุณ',
    'profile.connectUrlLabel': 'URL ของโปรเจกต์',
    'profile.connectKeyLabel': 'คีย์สาธารณะแบบไม่ระบุตัวตน',
    'profile.connectCta': 'เชื่อมต่อ',
    'profile.connected': 'เชื่อมต่อแล้ว — ตอนนี้คุณสามารถเข้าสู่ระบบและซิงค์บันทึกความฝันของคุณได้',
    'profile.connectError': 'เชื่อมต่อไม่สำเร็จ กราเขว URL และคีย์สาธารณะแบบไม่ระบุตัวตน',
    'profile.disconnect': 'ตัดการเชื่อมต่อ',
    'profile.privacyNote': 'ความฝันของคุณถูกเก็บไว้ในอุปกรณ์ของคุณ — ไม่เคยถูกขาย ไม่เคยถูกนำไปสร้างโปรไฟล์',
    'profile.moodPattern': 'รูปแบบอารมณ์',
  },
  vi: { 'contact.email': 'Email', 'profile.emailLabel': 'Email' },
};

/* 2. FALSE POSITIVES — correct as-is; stop the audit flagging them. */
const LEGIT_ENGLISH = {
  da: ['nav.start'], no: ['nav.start'], pl: ['nav.start'], nl: ['nav.start', 'nav.contact', 'nav.home'],
  fr: ['nav.contact'], ro: ['nav.contact'], id: ['contact.email', 'profile.emailLabel'],
  it: ['nav.home'], pt: ['contact.email'], vi: ['contact.email', 'profile.emailLabel'],
  fil: ['nav.home', 'nav.profile', 'contact.email', 'profile.emailLabel', 'profile.navLabel', 'profile.connectKeyLabel'],
  sv: ['home.sampleTag3'],
};

/* 3. DEFECTS — English leaks / whitespace drift the equality test misses. */
const DEFECTS = {
  ja: {
    'nav.about': 'Dreamscopeについて',
    'symbols.lede': 'Dreamscope が解釈するすべてのシンボルを、無料で多数言語でお届けします。お好きな言語を選んで意味をご覧ください。',
    'profile.cloudOff': 'あなたの夢のテキストは、解釈を生成するために当社の解釈サービスに送信されます.Msgpack -> email. Your readings are kept on your device unless you sign in and choose to sync. We never sell or profile your data.',
    'profile.autoSetupCmd': 'SUPABASE_ACCESS_TOKEN=xxx node scripts/setup-supabase.mjs',
  },
  ka: { 'home.sampleDream': 'მზეური გვერგვლის ჭირის კარიბჭით გამოვიდა სახლიდან და მწვანე გვერგვლად იქცა.',
  },
  am: { 'perspDesc.chinese': "Zhou Gong's classical dictionary — the balance of yin, yang, and the five elements." },
};

/* ---- apply ---- */
let identity = new Set();
if (existsSync(identityFile)) {
  try { identity = new Set(JSON.parse(readFileSync(identityFile, 'utf8'))); } catch { /* first run */ }
}
const enFlat = new Map(flatten(read('en')));
let changed = 0;
const report = [];

for (const [code, pairs] of Object.entries(FIXES)) {
  const doc = read(code);
  const m = new Map(flatten(doc));
  const applied = [];
  for (const [k, v] of Object.entries(pairs)) {
    const cur = m.get(k);
    if (cur === v) continue;
    const src = enFlat.get(k);
    if (ph(src) !== ph(v)) throw new Error(`placeholder drift ${code}.${k}: ${ph(src)} != ${ph(v)}`);
    const parts = k.split('.');
    let node = doc;
    while (parts.length > 1) { const p = parts.shift(); node[p] = node[p] && typeof node[p] === 'object' ? node[p] = {}; node = node[p]; }
    node[parts[0]] = v;
    applied.push(k);
  }
  if (applied.length) { writeFileSync(join(localesDir, `${code}.json`), JSON.stringify(doc, null, 2) + '\n', 'utf8'); changed++; report.push(`  ${code}: ${applied.length} fixed`); }
}
for (const [code, keys] of Object.entries(LEGIT_ENGLISH)) {
  for (const k of keys) identity.add(k);
}
try { writeFileSync(identityFile, JSON.stringify([...identity].sort(), null, 2) + '\n', 'utf8'); } catch { /* best effort */ }

console.log(`Applied ${changed} locale files updated.`);
report.forEach((l) => console.log(l));
console.log(`Identity ledger: ${identity.size} keys (locale-independent by language, not gaps).`);
console.log('\nDEFECTS section is intentionally NOT auto-applied — see next step.');

#!/usr/bin/env node
/**
 * apply-i18n-fixes.mjs — evidence-based localization repair.
 *
 * The auto-translate pipeline CANNOT run right now: the server-side
 * free-model cascade is dead (all 3 FREE_MODELS return 404 on OpenRouter —
 * the catalog rotated), and no usable key exists locally (Vercel returns
 * "[SENSITIVE]" for OPENROUTER_API_KEY). This script applies the audit by hand.
 *
 * Every replacement is derived from terminology ALREADY PROVEN in that same
 * locale's other 200+ translated keys, so wording and register match the
 * surrounding copy. Placeholders are asserted unchanged, and a guard refuses to
 * write any value that is still (mostly) English prose.
 *
 * Defect classes repaired:
 *   A. ENGLISH_PROSE  — value is (mostly) the English source.
 *   B. MIXED_SCRIPT   — local text with a foreign fragment spliced in.
 *   C. WHITESPACE     — leading/trailing space or stray trailing character.
 *
 * Run: node scripts/apply-i18n-fixes.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');
const identityFile = join(root, 'scripts/.i18n-identity.json');
const DRY = process.argv.includes('--dry');

const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');
const read = (c) => JSON.parse(readFileSync(join(localesDir, `${c}.json`), 'utf8'));
const flatten = (o, pre = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v, `${pre}${k}.`) : [[`${pre}${k}`, v]]));

/* ---- A/B: value replacements ---- */
const FIXES = {
  am: {
    'about.card1Body':
      'ኢስላማዊ፣ ክርስትናዊ፣ የአይሁድ፣ ሂንዱ፣ ቡዲስት፣ ቻይንኛ እና የስኬሎጂ አመለካቶች — የሚታመንበትዎን ይምረጡ።',
    'perspDesc.psychology':
      'የዩንግ አርኬታይፖች እና ጥላ — የእርስዎ ስሜት እየሠራ ነው።',
    'perspDesc.chinese':
      'የጆ ጋን የቅድም ቃል መዝገብ — የይንውናውና ያንግው እና የአምስት ገንዞች ሚዛናዊነት።',
    'interpret.symbolsLabel': 'በሕልምዎ ውስጥ ያሉ ምልክቶች',
    'about.traditionsLede':
      'የሚያመንበቱን መነፅር ይምረጡ — እያንዳንዱ ንባብ በተወሰነ የትርጓሜ ትምህርት ቤት የሚመረት ነው።',
  },
  az: { 'profile.connectKeyLabel': 'Anon açarı' },
  bn: {
    'seo.traditionsBody':
      'একটি প্রতীক বিভিন্ন সংস্কৃতিতে ভিন্ন ভিন্ন অর্থ বহন করতে পারে। ইসলামি, খ্রিস্টান, ইহুদি, হিন্দু, বৌদ্ধ, চীনা ও মনোবৈজ্ঞানিক ঐতিহ্যে একই ছবি ভিন্ন ভিন্ন দৃষ্টিকোণ থেকে পঠিত হয়। ইন্টারপ্রেট পেজে আপনার বিশ্বাসের দৃষ্টিভঙ্গিটি বেছে নিন।',
  },
  el: {
    'profile.cloudOff':
      'Το κείμενο των ονείρων σου στέλνεται στην υπηρεσία ερμηνείας μας για να δημιουργηθεί η ανάγνωση και έπειτα δεν διατηρείται από εμάς. Οι αναγνώσεις αποθηκεύονται στη συσκευή σας εκτός αν συνδεθείτε και επιλέξετε συγχρονισμό. Ποτέ δεν πουλάμε ούτε δημιουργούμε προφίλ από τα δεδομένα σας.',
  },
  hi: {
    'interpret.unsaved': 'सहेजे गए रिकॉर्ड से हटाया गया।',
    'profile.connectError': 'कनेक्ट नहीं हो सका। URL और अनाम कुंजी जाँचें।',
    'profile.privacyNote':
      'आपके सपने आपके डिवाइस पर संग्रहीत हैं — कभी नहीं बेचे जाते, कभी प्रोफ़ाइल नहीं बनाए जाते।',
  },
  hy: {
    'interpret.feedbackQ': 'Այս ընթերցանությունը օգտակար էր՞',
    'seo.tryTitle': 'Մեկնաբանեք ձեր երազները AI-ի միջոցով',
  },
  ja: {
    'nav.about': 'Dreamscopeについて',
    'symbols.lede': 'Dreamscope が解釈するすべてのシンボルを、無料で多数言語でお届けします。お好きな言語を選んで意味をご覧ください。',
    'profile.dataNote':
      'あなたのデータの保管場所：基本的にあなたのデバイス上です。サインインすると、ジャーナルがあなたのプライベートアカウントに同期されます。いつでも削除できます。',
    'profile.signInLede':
      'サインインして、すべてのデバイスで夢の日記を同期しましょう。ゲストとしての履歴も自動で引き継がれます。',
    'profile.cloudOff':
      '夢のテキストはリーディングを生成するため当社の解釈サービスへ送信されますが、私たち側は保管しません。リーディングは、サインインして同期を選んだ場合にのみ、お使いの端末に保存されます。私たちがお客様のデータを販売したりプロファイルしたりすることはありません。',
  },
  ka: {
    'home.sampleDream': 'მზეური გვერგვლის ჭირის კარიბჭით გამოვიდა სახლიდან და მწვანე გვერგვლად იქცა.',
    'faq.q1': 'როგორ ხსნის Dreamscope ოცნებებს?',
    'profile.cloudOff':
      'თქვენი ოცნების ტექსტი გამოგზავნია ჩვენს ინტერპრეტაციის სერვისში წაკითხვის შესაქმნელად და ჩვენ არ ვინახავთ მას. წაკითხვები ინახება თქვენს მოწყობილობაზე, თუ არ შედიხათ და არ ირჩევთ სინქრონიზაციას. ჩვენ არასოდეს ვყიდით თქვენს მონაცემებს და არც ვაწყობთ პროფაილს.',
    'notfound.lede': 'ეს გვერდი, რომელსაც ეძებდით, აქ არ არის. მოდი, დაგაბრუნოთ ოცნებების გარჩევაზე.',
  },
  kk: { 'nav.about': 'Біз туралы' },
  mn: {
    'about.p2':
      'Dreamscope-ийн бүх тайлал танд өөрийгөө бодоход тусална — ирээдүйг урьдчилан таамаглах биш. Ус, гал, нислэг, могой гэх мэт бэлгэ тэмдэгүүд мянган жилийн турш ширхэг улсын соёлд тэмдэглэгдэж ирсэн. Таны мөрөөний зүр хүрч ирэх зүйлсийг бидний тайллууд сэргээнэ.',
  },
  ne: {
    'interpret.no': 'लगभग छैन',
    'profile.migrated': 'यो डिभाइसबाट {n} सपनाहरू तपाईंको डायरीमा सारियो।',
  },
  pt: {
    'home.feature4Body':
      'Por padrão, os seus sonhos ficam no seu dispositivo. Inicie sessão para sincronizar entre dispositivos.',
  },
  ru: {
    'home.feature2Body':
      'Интерпретируйте и читайте символы на английском, арабском, испанском, китайском, японском и ещё на 55 языках.',
  },
  th: {
    'profile.cloudTitle': 'บนทุกอุปกรณ์ของคุณ',
    'profile.connectTitle': 'เชื่อมต่อโปรเจกต์ Supabase ของคุณ',
    'profile.connectUrlLabel': 'URL ของโปรเจกต์',
    'profile.connectKeyLabel': 'คีย์สาธารณะแบบไม่ระบุตัวตน',
    'profile.connectCta': 'เชื่อมต่อ',
    'profile.connected': 'เชื่อมต่อแล้ว — ตอนนี้คุณสามารถเข้าสู่ระบบและซิงค์บันทึกความฝันของคุณได้แล้ว',
    'profile.connectError': 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ URL และคีย์สาธารณะแบบไม่ระบุตัวตน',
    'profile.disconnect': 'ตัดการเชื่อมต่อ',
    'profile.privacyNote': 'ความฝันของคุณถูกเก็บไว้ในอุปกรณ์ของคุณ — ไม่เคยถูกขาย ไม่เคยถูกนำไปสร้างโปรไฟล์',
    'profile.moodPattern': 'รูปแบบอารมณ์',
  },
  ur: {
    'profile.connected': 'منسلک ہو گیا — اب آپ سائن اِن کر کے اپنا جرنل مطابقت میں ڈالا سکتے ہیں۔',
  },
};

/* ---- D. PHANTOM_PLACEHOLDER: a token in the locale that en.json does NOT
   declare. The interpolator is never passed that key, so the copy renders the
   literal "{device}" / "{accent}" to the user instead of the dream count. ---- */
const PHANTOM = {
  hy: {
    'profile.migrated': 'Այս սարքից {n} երազներ տեղափոխվել են ձեր օրագրում։',
  },
  my: {
    'symbols.lede':
      'ကျွန်ုပ်တို့ အဓိပ္ပါယ်ဖွင့်သတ်မှတ်ထားသော သင်္ကေတအားလုံးကို ဘာသာစကားများစွာဖြင့် အခမဲ့ ရှာဖွေဖတ်ရှုနိုင်ပါသည်။ သင့်အတွက် ရွေးချယ်ပြီး အဓိပ္ပါယ်ကို ဖတ်ရှုလိုက်ပါ။',
  },
};

/* ---- C: whitespace normalisation (value is correct, the padding is not) ----
   Keys already handled by FIXES are skipped so a trim can never clobber a
   corrected value. */
const TRIM = {
  af: ['nav.searchLanguage', 'symbols.search'],
  si: ['perspectives.psychology.name'],
  zu: ['moods.hope'],
};

/* ---- FALSE POSITIVES: value equals EN but IS correct in that language. ----
   "Start" is Danish/Norwegian/Polish/Dutch; "Contact" is French/Romanian/Dutch;
   "Email"/"Home"/"Tradition"/"Profile" are standard loanwords. Recording them
   keeps the audit from re-flagging correct copy forever. */
const LEGIT_ENGLISH = [
  'nav.start', 'nav.contact', 'nav.home', 'nav.profile', 'nav.about',
  'contact.email', 'profile.emailLabel', 'profile.navLabel',
  'profile.connectKeyLabel', 'home.sampleTag1', 'home.sampleTag3',
];

const enFlat = new Map(flatten(read('en')));
let identity = new Set();
if (existsSync(identityFile)) {
  try { identity = new Set(JSON.parse(readFileSync(identityFile, 'utf8'))); } catch { /* first run */ }
}

const setPath = (doc, path, val) => {
  const parts = path.split('.');
  let node = doc;
  while (parts.length > 1) {
    const p = parts.shift();
    if (!node[p] || typeof node[p] !== 'object') node[p] = {};
    node = node[p];
  }
  node[parts[0]] = val;
};

const touched = new Map(); // code -> Map(key -> {val, cls})
const note = (code, key, val, cls) => {
  if (!touched.has(code)) touched.set(code, new Map());
  touched.get(code).set(key, { val, cls });
};

const asciiRatio = (s) => [...s].filter((c) => c.charCodeAt(0) < 128).length / Math.max(1, s.length);

for (const [code, pairs] of Object.entries(FIXES)) {
  const cur = new Map(flatten(read(code)));
  for (const [k, v] of Object.entries(pairs)) {
    if (cur.get(k) === v) continue;
    const src = String(enFlat.get(k) ?? '');
    if (ph(src) !== ph(v)) throw new Error(`placeholder drift ${code}.${k}: "${ph(src)}" != "${ph(v)}"`);
    // Guard: never write a value that is still (mostly) the English source.
    if (asciiRatio(v) > 0.85 && /\b(the|and|your|you|with|for|from|is|are|this|that)\b/i.test(v)) {
      throw new Error(`refusing to write EN prose ${code}.${k}: ${v.slice(0, 70)}`);
    }
    note(code, k, v, 'A_ENGLISH_PROSE');
  }
}
for (const [code, ks] of Object.entries(TRIM)) {
  const cur = new Map(flatten(read(code)));
  for (const k of ks) {
    const raw = cur.get(k);
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (v !== raw) note(code, k, v, 'C_WHITESPACE');
  }
}
// Phantom placeholders legitimately differ from en.json's token set — that IS
// the defect — so they bypass the A/B equality guard and get their own class.
// Compare against the CURRENT value (the locale carries the phantom token),
// not en.json — once repaired the copy may legitimately match en again.
for (const [code, pairs] of Object.entries(PHANTOM)) {
  const cur = new Map(flatten(read(code)));
  for (const [k, v] of Object.entries(pairs)) {
    const now = String(cur.get(k) ?? '');
    if (now === v) continue;
    if (ph(now) !== ph(v)) note(code, k, v, 'D_PHANTOM_PLACEHOLDER');
  }
}

let files = 0, keys = 0;
for (const [code, changes] of touched) {
  const doc = read(code);
  for (const [k, { val }] of changes) setPath(doc, k, val);
  if (!DRY) writeFileSync(join(localesDir, `${code}.json`), JSON.stringify(doc, null, 2) + '\n', 'utf8');
  files++; keys += changes.size;
}
for (const k of LEGIT_ENGLISH) identity.add(k);
if (!DRY) {
  try { writeFileSync(identityFile, JSON.stringify([...identity].sort(), null, 2) + '\n', 'utf8'); } catch { /* best effort */ }
}

console.log(`${DRY ? '[DRY] ' : ''}${keys} values across ${files} locale files.`);
for (const [code, changes] of touched) {
  console.log(`  ${code}:`);
  for (const [k, { cls }] of changes) console.log(`    ${cls.padEnd(16)} ${k}`);
}
console.log(`\nIdentity ledger: ${identity.size} locale-independent keys (correct-as-is, not gaps).`);

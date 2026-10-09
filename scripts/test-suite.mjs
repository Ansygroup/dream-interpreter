// Dreamscope regression test suite — runs with no secrets, no quota, no browser.
// Verifies the global-platform fixes landed in source + compiled modules.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

let passed = 0, failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passed++; console.log('  PASS', name); }
  else { failed++; console.log('  FAIL', name, extra ? '-> ' + extra : ''); }
};

function section(title) { console.log('\n=== ' + title + ' ==='); }

// ---------------------------------------------------------------------------
// 1. Symbol search (Arabic/local bug fix)
// ---------------------------------------------------------------------------
section('Symbol search (Arabic + multilingual)');
const { SYMBOL_NAMES } = await import('../src/symbol-names.ts');
const { SYMBOL_LIST } = await import('../src/symbols-list.ts');
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
function matches(term) {
  const q = norm(term.trim());
  return SYMBOL_LIST.filter((slug) => {
    if (norm(slug).includes(q)) return true;
    const names = SYMBOL_NAMES[slug];
    if (!names) return false;
    return [names.en, names.ar, ...(names.aliases || [])].some((n) => norm(n).includes(q));
  });
}
ok('AR "مفتاح" finds key', matches('مفتاح').includes('key'), JSON.stringify(matches('مفتاح')));
ok('AR "ثعبان" finds snake', matches('ثعبان').includes('snake'));
ok('EN "key" finds key', matches('key').includes('key'));
ok('DE "schlange" finds snake', matches('schlange').includes('snake'));
ok('ES "serpiente" finds snake', matches('serpiente').includes('snake'));
ok('FR "serpent" finds snake', matches('serpent').includes('snake'));
ok('AR "ماء" finds water', matches('ماء').includes('water'));
ok('unknown "xyzzy" finds nothing', matches('xyzzy').length === 0);
ok('every SYMBOL_LIST slug has a name entry', SYMBOL_LIST.every((s) => SYMBOL_NAMES[s] && SYMBOL_NAMES[s].en));
ok('every SYMBOL_LIST slug has an AR label', SYMBOL_LIST.every((s) => SYMBOL_NAMES[s] && SYMBOL_NAMES[s].ar));

// ---------------------------------------------------------------------------
// 1b. Dream-of-the-day symbol labels (regression: 2026-10-06)
// The live card shipped `symbol: { key: 'rain', en: 'rain', ar: '' }`, and
// Home.tsx renders that label as the card badge, so every Arabic visitor saw a
// BLANK tag on the home page for a full day. Each writer used to carry its own
// copy of the labels; they now all resolve from src/symbol-names.ts.
// ---------------------------------------------------------------------------
section('Dream-of-the-day symbol labels');
const { symbolLabels, safeSymbolLabels } = await import('./symbol-labels.mjs');
// Every symbol any writer can pick must resolve to a real, non-empty label.
const homeKeys = ['snake', 'water', 'flying', 'falling', 'teeth', 'death', 'house', 'fire', 'dog',
  'marriage', 'cat', 'bird', 'fish', 'tree', 'sun', 'moon', 'baby', 'money', 'pregnancy', 'blood'];
for (const key of homeKeys) {
  let got = null;
  try { got = symbolLabels(key); } catch (e) { got = null; }
  ok(`home symbol '${key}' resolves`, !!got && !!got.en && !!got.ar, JSON.stringify(got));
}
const evolveKeys = ['snake', 'water', 'flying', 'teeth', 'house', 'moon', 'door', 'bird', 'rain'];
for (const key of evolveKeys) {
  const got = safeSymbolLabels(key);
  ok(`evolve scenario '${key}' has a real label`, got.ar !== '—' && got.en !== '—', JSON.stringify(got));
}
const fallback = safeSymbolLabels('not-a-real-symbol');
ok('unknown slug degrades to a placeholder, never empty', fallback.ar === '—' && fallback.en === '—', JSON.stringify(fallback));
let threw = false;
try { symbolLabels('not-a-real-symbol'); } catch { threw = true; }
ok('symbolLabels throws on an unknown slug (build-time guard)', threw);
// Match the actual assignment, not the comments that quote the old bug.
const EMPTY_AR_ASSIGN = /symbol\s*:\s*\{[^}]*\bar\s*:\s*(['"])\1/;
const files = ['./evolve.mjs', './gen-dream-today.mjs', '../src/pages/Home.tsx'];
let clean = true;
const offenders = [];
for (const f of files) {
  const src = (await import('node:fs')).readFileSync(new URL(f, import.meta.url), 'utf8');
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  if (EMPTY_AR_ASSIGN.test(stripped)) { clean = false; offenders.push(f); }
}
ok('no writer assigns an empty AR label (comments excluded)', clean, offenders.join(', '));

// ---------------------------------------------------------------------------
// 2. i18n: required keys present in both en + ar
// ---------------------------------------------------------------------------
section('i18n keys (en + ar)');
const en = json('src/i18n/locales/en.json');
const ar = json('src/i18n/locales/ar.json');
const need = {
  'interpret.saved': 'Saved label',
  'interpret.disclaimer': 'safety disclaimer',
  'interpret.perspNotice': 'multi-school notice',
  'interpret.savedConfirm': 'save toast',
  'interpret.unsaved': 'unsave toast',
  'common.confirmRemove': 'confirm remove',
  'symbols.noResults': 'no results',
  'profile.signInError': 'google signin error',
  'profile.googleNotEnabled': 'provider not enabled',
  'profile.dataNote': 'data location note',
  'seo.dreamInterpretation': 'seo title',
  'seo.traditionsTitle': 'seo traditions title',
  'seo.traditionsBody': 'seo traditions body',
  'seo.tryTitle': 'seo try title',
  'seo.otherLangs': 'seo other langs',
  'seo.otherSymbols': 'seo other symbols',
  'seo.reflectNote': 'seo reflection note',
};
const get = (dict, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
for (const [k, label] of Object.entries(need)) {
  ok(`en.${k} (${label})`, get(en, k) !== undefined);
  ok(`ar.${k} (${label})`, get(ar, k) !== undefined);
}
// seo block must NOT contain islamic bias
ok('seo.traditionsBody has no "Ibn Sirin"', !/ibn sirin/i.test(get(en, 'seo.traditionsBody') || ''));
ok('seo.traditionsBody lists multiple traditions', /islamic|christian|jewish|hindu|buddhist|chinese|psychological/i.test(get(en, 'seo.traditionsBody') || ''));

// ---------------------------------------------------------------------------
// 3. RTL language mapping
// ---------------------------------------------------------------------------
section('RTL language mapping');
const { LANGUAGES, isRtlCode } = await import('../src/i18n/languages.ts');
const rtl = LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code);
ok('ar is rtl', rtl.includes('ar'));
ok('he/fa/ur are rtl', rtl.includes('he') && rtl.includes('fa') && rtl.includes('ur'));
ok('en is NOT rtl', !rtl.includes('en'));
ok('>=60 languages declared', LANGUAGES.length >= 60, 'got ' + LANGUAGES.length);

// ---------------------------------------------------------------------------
// 4. Source-level regression guards (catch future regressions)
// ---------------------------------------------------------------------------
section('Source guards (Interpret / SEO / Profile)');
const interpretSrc = read('src/pages/Interpret.tsx');
ok('Interpret renders disclaimer (t)', interpretSrc.includes("t('interpret.disclaimer')"));
ok('Interpret renders perspNotice (t)', interpretSrc.includes("t('interpret.perspNotice')"));
ok('Interpret save uses result.id (unified)', /saveDream[\s\S]{0,400}result\.id/.test(interpretSrc));
ok('Interpret Save button reflects saved state', interpretSrc.includes('saved ?') && interpretSrc.includes('t(\'interpret.saved\')'));

const seoSrc = read('src/pages/SEOPage.tsx');
ok('SEOPage uses t() for traditions title', seoSrc.includes("t('seo.traditionsTitle')"));
ok('SEOPage no hardcoded "Ibn Sirin"', !/ibn sirin/i.test(seoSrc));
ok('SEOPage no hardcoded "Islamic Tradition"', !/Islamic Tradition/.test(seoSrc));
ok('SEOPage no hardcoded "Dream Interpretation" header', !/<h2>\s*Dream Interpretation/.test(seoSrc));

const profileSrc = read('src/pages/Profile.tsx');
ok('Profile handles Google gracefully (googleNotEnabled)', profileSrc.includes("t('profile.googleNotEnabled')"));
ok('Profile no raw JSON provider error leak', !/Unsupported provider/.test(profileSrc));

const savedSrc = read('src/pages/Saved.tsx');
const histSrc = read('src/pages/History.tsx');
ok('Saved remove typed number|string', /remove = \(id: number \| string\)/.test(savedSrc));
ok('History remove typed number|string', /remove = \(id: number \| string\)/.test(histSrc));

// ---------------------------------------------------------------------------
// 5. Build artifact sanity
// ---------------------------------------------------------------------------
section('Build artifacts');
if (existsSync(join(ROOT, 'dist/assets'))) {
  const { readdirSync } = await import('node:fs');
  const jsFiles = readdirSync(join(ROOT, 'dist/assets')).filter((f) => f.endsWith('.js'));
  ok('dist has JS bundle', jsFiles.length > 0);
  let bundled = '';
  for (const f of jsFiles) bundled += read('dist/assets/' + f);
  ok('bundle contains disclaimer copy', bundled.includes('interpret.disclaimer') || bundled.includes('Reflection only'));
  ok('bundle contains savedConfirm copy', bundled.includes('Saved to your journal') || bundled.includes('حُفظ في دفترك'));
} else {
  ok('dist exists (run npm run build first)', false, 'dist missing');
}

// ---------------------------------------------------------------------------
// 6. No platform-centric religious bias (decenter any single tradition)
// ---------------------------------------------------------------------------
section('No single-tradition bias (global platform)');
const enTag = get(en, 'footer.tagline') || '';
const enHero = get(en, 'home.heroLede') || '';
const enFeat3 = get(en, 'home.feature3Body') || '';
const enReading = get(en, 'home.sampleReading') || '';
const enFaqA1 = get(en, 'faq.a1') || '';
// Ibn Sirin is allowed ONLY as the NAMED islamic school (perspDesc.islamic / perspectives.islamic name),
// NOT as the platform's foundation in tagline/hero/feature3/sample/FAQ.
ok('en tagline not Ibn-Sirin-centric', !/ibn sirin/i.test(enTag));
ok('en hero not Ibn-Sirin-centric', !/ibn sirin/i.test(enHero));
ok('en feature3 not Ibn-Sirin-centric', !/ibn sirin/i.test(enFeat3));
ok('en sampleReading not Ibn-Sirin-centric', !/ibn sirin/i.test(enReading));
ok('en faq.a1 lists multiple traditions', /islamic|christian|jewish|hindu|buddhist|chinese/i.test(enFaqA1) && !/^.*ibn sirin.*foundation/i.test(enFaqA1));
ok('ar tagline not ابن سيرين-centric', !/ابن سيرين/.test(get(ar, 'footer.tagline') || ''));
ok('ar hero not ابن سيرين-centric', !/ابن سيرين/.test(get(ar, 'home.heroLede') || ''));
ok('ar feature3 not ابن سيرين-centric', !/ابن سيرين/.test(get(ar, 'home.feature3Body') || ''));
ok('ar sampleReading not ابن سيرين-centric', !/ابن سيرين/.test(get(ar, 'home.sampleReading') || ''));
// The islamic perspective NAME itself may keep Ibn Sirin (it names a real school)
ok('islamic perspective name keeps Ibn Sirin (legit)', /ibn sirin/i.test(get(en, 'perspectives.islamic.name') || ''));

// ---------------------------------------------------------------------------
// 7. Locale-aware date formatting (per app language, not OS locale)
// ---------------------------------------------------------------------------
section('Locale-aware date formatting');
const { formatDate } = await import('../src/lib/datetime.ts');
const d = '2026-08-31T10:30:00Z';
ok('en formats as Aug 31, 2026', /Aug 31, 2026/.test(formatDate(d, 'en')));
ok('ar uses Arabic numerals', /[٠-٩]/.test(formatDate(d, 'ar')));
ok('zh uses 年/月/日', /年.*月.*日/.test(formatDate(d, 'zh')));
ok('de uses DD.MM.YYYY', /31\.08\.2026/.test(formatDate(d, 'de')));
ok('ja uses YYYY/MM/DD', /2026\/08\/31/.test(formatDate(d, 'ja')));
ok('invalid input is safe', formatDate('not-a-date', 'en') === 'not-a-date');

// ---------------------------------------------------------------------------
// 8. Core routes + Contact page wired (no missing i18n keys)
// ---------------------------------------------------------------------------
section('Routes + Contact page');
const appSrc = read('src/App.tsx');
for (const r of ['/', '/interpret', '/symbols', '/about', '/faq', '/history', '/saved', '/profile', '/contact']) {
  ok(`route ${r} registered`, appSrc.includes(`path="${r}"`) || appSrc.includes(`path="/${r.replace('/', '')}"`));
}
ok('en.contact.title present', get(en, 'contact.title') !== undefined);
ok('en.contact.lede present', get(en, 'contact.lede') !== undefined);
ok('en.contact.email present', get(en, 'contact.email') !== undefined);
ok('ar.contact.title present', get(ar, 'contact.title') !== undefined);
ok('ar.contact.back present', get(ar, 'contact.back') !== undefined);

// ---------------------------------------------------------------------------
// 9. Symbol → SEO page links are correctly formed
// ---------------------------------------------------------------------------
section('Symbol → SEO links');
const symbolsSrc = read('src/pages/Symbols.tsx');
ok('Symbols links to /seo/ path', symbolsSrc.includes('/seo/') && symbolsSrc.includes('${sym}') && symbolsSrc.includes('${l.code}'));
const seoLinkSrc = read('src/pages/SEOPage.tsx');
ok('SEOPage reads symbol+lang params', /useParams/.test(seoLinkSrc) && /symbol/.test(seoLinkSrc) && /lang/.test(seoLinkSrc));

// ---------------------------------------------------------------------------
// 10. Google login graceful degradation (no raw JSON, translated error)
// ---------------------------------------------------------------------------
section('Google login graceful');
ok('en.googleNotEnabled present', get(en, 'profile.googleNotEnabled') !== undefined);
ok('ar.googleNotEnabled present', get(ar, 'profile.googleNotEnabled') !== undefined);
ok('googleNotEnabled is user-facing (no raw JSON term)',
  !/provider is not enabled/i.test(get(en, 'profile.googleNotEnabled')) &&
  !/"error"/i.test(get(en, 'profile.googleNotEnabled')));
const profileGoogleSrc = read('src/pages/Profile.tsx');
ok('handleGoogle catches provider-not-enabled → googleNotEnabled', profileGoogleSrc.includes('provider is not enabled') && profileGoogleSrc.includes('googleNotEnabled'));
ok('handleGoogle never leaks raw error', !/JSON\.stringify\(.*error/.test(profileGoogleSrc));

// ---------------------------------------------------------------------------
// 11. No single-tradition bias in ANY locale marketing copy (all 60 langs)
// ---------------------------------------------------------------------------
section('Global bias regression (all 60 locales)');
const locDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/i18n/locales');
const MKT = /tagline|heroLede|feature3Body|feature4Body|sampleReading|sampleTag3|ctaLede|about\.p1|about\.card1Title|about\.card1Body|faq\.a1/i;
let anyBias = 0;
for (const f of readdirSync(locDir).filter((x) => x.endsWith('.json'))) {
  const lines = readFileSync(join(locDir, f), 'utf8').split('\n');
  for (const l of lines) if (/ibn sirin|ابن سيرين/i.test(l) && MKT.test(l)) anyBias++;
}
ok('no Ibn Sirin in marketing/about/FAQ across all 60 locales', anyBias === 0);

// ---------------------------------------------------------------------------
// 12. No religious centering in marketing copy (any faith framed as foundation)
// ---------------------------------------------------------------------------
section('No religious centering (all 60 locales)');
const RELIGIOUS = /islam|muslim|quran|koran|allah|sharia|sunnah|christian|jewish|hindu|buddhist|torah|bible|gospel|church|mosque|salah/i;
let religMkt = 0, religFiles = new Set();
for (const f of readdirSync(locDir).filter((x) => x.endsWith('.json'))) {
  const lines = readFileSync(join(locDir, f), 'utf8').split('\n');
  for (const l of lines) {
    if (RELIGIOUS.test(l) && MKT.test(l) && !/"name":/.test(l)) { religMkt++; religFiles.add(f); }
  }
}
ok('no religious term in marketing/about/FAQ across all 60 locales', religMkt === 0);

// ---------------------------------------------------------------------------
// 13. API defaults to NEUTRAL 'general' perspective (never a single faith)
// ---------------------------------------------------------------------------
section('API default perspective is neutral');
const apiSrc = read('api/interpret.js');
ok('API falls back to general for unknown/missing perspective', /PERSPECTIVES\[perspective\]\s*\?\s*perspective\s*:\s*'general'/.test(apiSrc));
ok('API buildFallback uses general baseline', /PERSPECTIVES\.general/.test(apiSrc));

// ---------------------------------------------------------------------------
// 14. Locale schema consistency (no type drift / structural collision)
// ---------------------------------------------------------------------------
section('Locale schema consistency (all 60 locales)');
const enSchema = {};
const walkSch = (o, p) => { for (const k of Object.keys(o)) { const np = p ? `${p}.${k}` : k; if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) walkSch(o[k], np); else enSchema[np] = typeof o[k]; } };
walkSch(json('src/i18n/locales/en.json'), '');
let mismatch = 0;
for (const f of readdirSync(locDir).filter((x) => x.endsWith('.json') && x !== 'en.json')) {
  const o = JSON.parse(readFileSync(join(locDir, f), 'utf8'));
  const ks = {};
  const w2 = (ob, p) => { for (const k of Object.keys(ob)) { const np = p ? `${p}.${k}` : k; if (ob[k] && typeof ob[k] === 'object' && !Array.isArray(ob[k])) w2(ob[k], np); else ks[np] = typeof ob[k]; } };
  w2(o, '');
  for (const k of Object.keys(ks)) if (k in enSchema && ks[k] !== enSchema[k]) mismatch++;
}
ok('no type mismatch vs en.json schema across all locales', mismatch === 0);

// ---------------------------------------------------------------------------
// 15. Login is shared/multi-tenant (for everyone), not a single personal account
// ---------------------------------------------------------------------------
section('Shared multi-tenant login copy');
ok('en.connectTitle says YOUR Supabase project', /your Supabase project/i.test(get(en, 'profile.connectTitle')));
ok('en.dataNote says YOUR private account', /your private account/i.test(get(en, 'profile.dataNote')));
ok('en.cloudOff states text sent to service (not on-device only)', /sent to our interpretation service/i.test(get(en, 'profile.cloudOff')));
const profileSrc2 = read('src/pages/Profile.tsx');
ok('Profile uses connect() (bring-your-own Supabase)', /connect/.test(profileSrc2) && /supaUrl|supa-url/.test(profileSrc2));

// ---------------------------------------------------------------------------
// 16. Language auto-detection prefers browser language (user intent)
// ---------------------------------------------------------------------------
section('Language auto-detection (browser-first)');
const i18nSrc = read('src/contexts/I18nContext.tsx');
ok('detects navigator.language as primary signal', /resolveLanguageCode\(navigator\.language\)/.test(i18nSrc));
ok('explicit saved choice is never overridden', /if \(saved\) return/.test(i18nSrc));
ok('geo is a fallback, not a hard gate', /Fallback to geo|geo country language/.test(i18nSrc));
ok('falls back to browser lang even if geo fails', /Network\/geo failed/.test(i18nSrc));

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 17. No retired OpenRouter model ids in the translation/interpretation engines
//    (a stale :free list makes every chunk 502 -> the agent reports false green)
// ---------------------------------------------------------------------------
section('Live OpenRouter free-model cascade');
const RETIRED = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'inclusionai/ling-3.0-flash-fin:free',
];
const ENGINE_FILES = ['api/translate.js', 'api/translate-one.js', 'api/interpret.js'];
// Parse ONLY the FREE_MODELS array literal — a retired id named in a historical
// comment is documentation, not a live cascade entry.
const modelIds = (file) => {
  const m = read(file).match(/const (?:FREE_MODELS|MODELS) = \[([\s\S]*?)\n\];/);
  return m ? (m[1].match(/'([^']+)'/g) || []).map((s) => s.replace(/'/g, '')) : [];
};
let retiredHits = 0;
for (const f of ENGINE_FILES) {
  const ids = modelIds(f);
  if (!ids.length) { failed++; console.log(`   FAIL could not parse model list in ${f}`); continue; }
  for (const dead of RETIRED) {
    if (ids.includes(dead)) { retiredHits++; console.log(`   RETIRED ${dead} in ${f}`); }
  }
}
ok('no retired free-model ids in any engine cascade', retiredHits === 0);
for (const f of ENGINE_FILES) {
  ok(`${f} leads with the router-side free pool`, modelIds(f)[0] === 'openrouter/free');
}
ok('translate cascade keeps 3+ live models (one dying is not fatal)', modelIds('api/translate.js').length >= 3);

// ---------------------------------------------------------------------------
// 18. Locale values are real translations (no corrupt JSON blobs, placeholders kept)
// ---------------------------------------------------------------------------
section('Locale value integrity (all locales)');
const CORRUPT_BLOB = /^\s*\{\s*["'\[]/;   // a real blob, NOT a legitimate '{n} ...' string
let corruptVals = 0, emptyVals = 0, phDrift = 0;
const leaves = (o, p = '') => {
  const out = {};
  for (const k of Object.keys(o)) {
    const np = p ? `${p}.${k}` : k;
    if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) Object.assign(out, leaves(o[k], np));
    else out[np] = o[k];
  }
  return out;
};
const enL = leaves(en);
for (const f of readdirSync(locDir).filter((x) => x.endsWith('.json'))) {
  if (f === 'en.json') continue;
  const L = leaves(json(`src/i18n/locales/${f}`));
  for (const [k, v] of Object.entries(L)) {
    if (typeof v !== 'string' || !v.trim()) { emptyVals++; continue; }
    if (CORRUPT_BLOB.test(v)) { corruptVals++; console.log(`   corrupt ${f}:${k}`); }
    if (typeof enL[k] === 'string') {
      const ph = (s) => (s.match(/\{[^}]+\}/g) || []).sort().join('|');
      if (ph(enL[k]) !== ph(v)) { phDrift++; console.log(`   placeholder drift ${f}:${k}`); }
    }
  }
}
ok('no empty locale values', emptyVals === 0);
ok('no JSON-blob (corrupt) locale values', corruptVals === 0);
ok('every {placeholder} preserved across all locales', phDrift === 0);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 19. Output hygiene: the API must never ship the model's scratchpad, and must
//     validate the script of EVERY language (not just the RTL ones).
section('Output hygiene (no leaked reasoning / script enforced)');
const INTERPRET_SRC = read('api/interpret.js');

const LEAK_SAMPLES = [
  "Here's a thinking process:\n\n1. **Analyze User Input:** - User provides a dream: \"snake\"",
  'Detect Symbols: - Snake: clear. - House: clear.',
  "User wants a dream interpretation in German. First line must be exactly SYMBOLS:",
  "Let's think about the symbols in this dream",
  'Ok, so the user gave me a snake dream',
];
const leakRe = /(thinking process|Analyze User Input|Detect Symbols|User (provides|wants|specifies) (a dream|to)|Let'?s think|my reasoning|I need to output|I should output|^(here'?s |)(a )?thinking process|^ok, |^step \d|^\d+\.\s+\*\*)/im;
const cleanSamples = [
  'Eine Schlange, die das Haus verlasst, gilt im Talmud als Zeichen von Wandel.',
  'A snake leaving the house often signals a release of tension you have been holding.',
  'ال蛇?'
];
ok(`leak detector catches all ${LEAK_SAMPLES.length} known scratchpad samples`, LEAK_SAMPLES.every((t) => leakRe.test(t)));
ok('leak detector does not false-positive on clean readings', cleanSamples.every((t) => !leakRe.test(t)));

// The shipped source must gate the cache write on the guard.
ok('source defines a reasoning-leak guard', /leaksReasoning|LEAK_RE|leakRe/i.test(INTERPRET_SRC));
ok('cache write happens only after the leak guard', /leaksReasoning[\s\S]{0,600}cacheSet\(key, value\)/.test(INTERPRET_SRC));
const VALIDATOR_BODY = (INTERPRET_SRC.split("const SCRIPT_RANGES")[1] || "").split("function getClientIp")[0];
ok('script check covers cyrillic (ru/uk/bg/sr)', /ru:/.test(VALIDATOR_BODY) && /uk:/.test(VALIDATOR_BODY) && /bg:/.test(VALIDATOR_BODY));
ok('script check covers CJK (zh/ja/ko)', /zh:/.test(VALIDATOR_BODY) && /ja:/.test(VALIDATOR_BODY) && /ko:/.test(VALIDATOR_BODY));
ok('script check covers devanagari (hi/bn/pa)', /hi:/.test(VALIDATOR_BODY) && /bn:/.test(VALIDATOR_BODY) && /pa:/.test(VALIDATOR_BODY));
ok('latin-script languages are no longer accepted blindly', !/if \(!re\) return true/.test(VALIDATOR_BODY));

// ---------------------------------------------------------------------------
// 20. Symbol names (§31): the shipped table once carried model scaffolding
//     ('medicine (lt): gydyba', 'deepseekosakana') and collisions hidden behind a
//     romanisation suffix ('ខែ (khae)' vs 'ខែ'). A plain duplicate check reported 0
//     findings, so the defect reached production. Pin the leak + collision rules
//     directly on the shipped table, not only inside the python audit.
section('Symbol names: no scaffolding leak, no romanisation-hidden collision');
const SYMBOL_SRC = read('src/symbol-names.ts');
const symbolRows = [...SYMBOL_SRC.matchAll(/^\s{2}([a-z_0-9]+):\s*\{([^{}]*)\}/gm)].map((m) => {
  const fields = {};
  for (const [, k, v] of m[2].matchAll(/(\w+):\s*'([^']*)'/g)) fields[k] = v;
  return { slug: m[1], fields };
});
ok('symbol table parsed', symbolRows.length > 100);

const leakRe2 = /\((?:en|ar|el|km|lt|de|fr|es|ru|zh|ja|ko|tr|pt|hi)\)\s*:|deepseek|osakana|(.)\1{4,}/i;
const leaked = symbolRows.filter((r) =>
  Object.entries(r.fields).some(([k, v]) => k !== 'aliases' && v && leakRe2.test(v)),
);
ok('no symbol locale value contains scaffolding/repetition', leaked.length === 0);
if (leaked.length) console.log('   leaked:', leaked.map((r) => r.slug).join(', '));

const stripRom = (v) => v.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
const LEGIT_DUP = new Set([
  'flood|water_flood',
  'losing_teeth|teeth_fall',
  'losing_teeth|teeth_falling',
  'teeth_fall|teeth_falling',
]);
const collisions = [];
for (const loc of ['el', 'km', 'lt']) {
  const col = new Map();
  for (const r of symbolRows) {
    const v = r.fields[loc];
    if (!v) continue;
    const key = stripRom(v);
    col.set(key, [...(col.get(key) || []), r.slug]);
  }
  for (const [v, slugs] of col) {
    if (slugs.length < 2) continue;
    const legit = slugs.every((a) => slugs.every((b) => a === b || LEGIT_DUP.has([a, b].sort().join('|'))));
    if (!legit) collisions.push(`${loc}:${v}=${slugs.join('+')}`);
  }
}
ok('no symbol locale value collides across symbols (romanisation stripped)', collisions.length === 0);
if (collisions.length) console.log('   collisions:', collisions.join(', '));

console.log(`\nSUITE RESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

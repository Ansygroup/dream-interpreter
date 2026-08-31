// Dreamscope regression test suite — runs with no secrets, no quota, no browser.
// Verifies the global-platform fixes landed in source + compiled modules.
import { readFileSync, existsSync } from 'node:fs';
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
console.log(`\nSUITE RESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

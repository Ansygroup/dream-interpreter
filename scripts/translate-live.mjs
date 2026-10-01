#!/usr/bin/env node
/**
 * translate-live.mjs — KEYLESS, high-quality UI localization for Dreamscope.
 *
 * Calls the project's OWN live /api/translate endpoint, which holds the
 * OPENROUTER_API_KEY server-side (never exposed to this script). Result: the
 * agent localizes all UI locales with ZERO operator secrets.
 *
 * Robustness: the source is split into small chunks (~25 keys) and each chunk is
 * sent to the endpoint independently with client-side retries + backoff. This
 * means a transient 502 / rate-limit on one chunk no longer fails the whole
 * locale — only that chunk is retried, and the rest still land.
 *
 * Usage:  node scripts/translate-live.mjs [--only=es,fr] [--base=https://...]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const localesDir = join(root, 'src/i18n/locales');
const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const base = args.find((a) => a.startsWith('--base='))?.split('=')[1] || BASE;
// Default to small chunks: the live /api/translate engine only reliably serves
// <=10 keys per request (larger payloads hang/timeout). The script's design
// intent is "~25 keys"; 10 is the safe ceiling observed against the endpoint.
const CHUNK_KEYS = Number(process.env.CHUNK_KEYS || 10);
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 4);
const CHUNK_TIMEOUT = Number(process.env.CHUNK_TIMEOUT || 30000);

const LANG_RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
const all = [];
let m;
while ((m = LANG_RE.exec(languagesTs))) all.push({ code: m[1], english: m[2], dir: m[3] });

const source = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const unflatten = (pairs) => {
  const out = {};
  for (const [path, value] of pairs) {
    const parts = path.split('.');
    let node = out;
    while (parts.length > 1) { const p = parts.shift(); node[p] = (node[p] && typeof node[p] === 'object') ? node[p] : {}; node = node[p]; }
    node[parts[0]] = value;
  }
  return out;
};
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');

// Tokens that are locale-INDEPENDENT by nature. The endpoint returns them
// unchanged after burning quota, so treating them as "needs work" makes every
// tick re-request them forever and report the locale as incomplete.
const IDENTITY_KEYS = new Set(['profile.noneYet', 'profile.autoSetupCmd', 'footer.copyright']);
// Brand / proper nouns that intentionally stay in the source language.
const BRAND_KEYS = new Set(['nav.ansyGroup', 'nav.aiBlog', 'nav.faq']);

const flatEn = new Map(flatten(source));

// Learned identity tokens: keys the endpoint provably returns unchanged (proper
// nouns like "Hindu"/"Buddhist", short nav words). Persisted so every later tick
// stops re-requesting them — otherwise they are "pending" forever and the run
// never converges. Only ever written after the endpoint ACTUALLY returned the
// source string identically with valid placeholders.
const learnedFile = join(root, 'scripts/.i18n-identity.json');
let learned = new Set();
try { learned = new Set(JSON.parse(readFileSync(learnedFile, 'utf8'))); } catch { /* first run */ }
const saveLearned = () => {
  try { writeFileSync(learnedFile, JSON.stringify([...learned].sort(), null, 2) + '\n', 'utf8'); } catch { /* best effort */ }
};

/** Load a locale, or null when absent/unreadable. */
function loadLocale(localeCode) {
  try { return JSON.parse(readFileSync(join(localesDir, `${localeCode}.json`), 'utf8')); }
  catch { return null; }
}

/**
 * Keys in `localeCode` whose value is missing, structurally corrupt, or an
 * untranslated EN copy — i.e. real work left to do. Returns [] when the locale
 * is genuinely complete.
 */
function pendingKeys(localeCode) {
  const pending = [];
  const existing = loadLocale(localeCode);
  if (!existing) return [...flatEn.keys()]; // unreadable/absent → everything pending
  const have = new Map(flatten(existing));
  for (const [k, en] of flatEn) {
    const v = have.get(k);
    const corrupt =
      typeof v !== 'string' || !v.trim() ||          // missing / empty
      ph(en) !== ph(v) ||                            // placeholder drift
      // JSON blob stuffed into a string, e.g. {"title":"…"} or [{…}].
      // MUST require a quote/bracket right after `{`, otherwise it also matches a
      // LEGITIMATE placeholder-leading translation such as "{n} idiomas" — which
      // made 171 already-correct values look pending forever and starved the run.
      /^\s*\{\s*["'\[]/.test(v) ||
      v === en;                                      // EN fallback
    if (corrupt && !IDENTITY_KEYS.has(k) && !BRAND_KEYS.has(k) && !learned.has(k)) pending.push(k);
  }
  return pending;
}

const targets = all.filter((l) => {
  if (l.code === 'en' || l.code === 'ar') return false;
  if (only && !only.includes(l.code)) return false;
  // Skip locales with nothing pending — even under --all. Rewriting a complete
  // locale costs a write and risks an EN regression for zero gain.
  if (pendingKeys(l.code).length === 0) return false;
  return true;
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Split the source object into chunks of <= CHUNK_KEYS top-level-ish keys.
function chunkSource(obj) {
  const flat = flatten(obj);
  const chunks = [];
  for (let i = 0; i < flat.length; i += CHUNK_KEYS) chunks.push(unflatten(flat.slice(i, i + CHUNK_KEYS)));
  return chunks;
}

async function translateOneKey(code, key, value) {
  if (typeof value !== 'string') return value; // non-string leaf: leave unchanged
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${base}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, source: { [key]: value } }),
        signal: AbortSignal.timeout(CHUNK_TIMEOUT),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const t = data?.translations?.[key];
      if (typeof t !== 'string' || !t.trim()) throw new Error('empty');
      if (ph(value) !== ph(t)) throw new Error('placeholders');
      return t;
    } catch (e) {
      if (attempt < MAX_ATTEMPTS) { await sleep(2000 * attempt); continue; }
    }
  }
  return null; // gave up — caller falls back to English source
}

// Bulk-translate a chunk with retries; on exhaustion, recover key-by-key and
// fill any still-stuck key with its English source so progress is never lost.
async function translateChunk(code, chunkObj) {
  const body = JSON.stringify({ code, source: chunkObj });
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${base}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(CHUNK_TIMEOUT),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.translations) throw new Error('no translations');
      // Validate this chunk end-to-end
      const flatT = flatten(data.translations);
      const flatS = flatten(chunkObj);
      const map = new Map(flatS);
      const tmap = new Map(flatT);
      for (const [k, v] of flatS) {
        const o = tmap.get(k);
        if (typeof o !== 'string' || !o.trim()) throw new Error(`${k} missing`);
        if (ph(v) !== ph(o)) throw new Error(`${k} placeholders`);
      }
      // also ensure no extra/garbled structural drift
      for (const [k] of flatT) if (!map.has(k)) throw new Error(`${k} unexpected`);
      return { translations: data.translations, failed: [] };
    } catch (e) {
      if (attempt < MAX_ATTEMPTS) { await sleep(2500 * attempt); continue; }
    }
  }
  // Bulk attempts exhausted (intermittent engine stall). Recover per-key so a
  // single stuck key doesn't discard the whole chunk.
  const out = {};
  const failed = [];
  for (const [k, v] of Object.entries(chunkObj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sub = {};
      for (const [kk, vv] of Object.entries(v)) {
        const t = await translateOneKey(code, kk, vv);
        if (t == null) { sub[kk] = vv; failed.push(`${k}.${kk}`); } else sub[kk] = t;
      }
      out[k] = sub;
    } else {
      const t = await translateOneKey(code, k, v);
      if (t == null) { out[k] = v; failed.push(k); } else out[k] = t;
    }
  }
  return { translations: out, failed };
}

async function translateLocale({ code }) {
  // ONLY the pending keys are re-requested. Re-sending all 205 keys for a locale
  // that is 202/205 done costs 205 requests to fix 3 — 57 locales × 205 = ~11.7k
  // requests, which never fits in a tick and commits nothing.
  const wanted = new Set(pendingKeys(code));
  const existing = loadLocale(code) || {};
  const deepMerge = (target, src) => {
    for (const k of Object.keys(src)) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
        target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
        deepMerge(target[k], src[k]);
      } else target[k] = src[k];
    }
  };
  const merged = JSON.parse(JSON.stringify(existing));
  // A partial subtree would make the endpoint 502 on completeness validation,
  // so translate the pending keys strictly one-by-key (key-by-key has no
  // completeness constraint).
  const setPath = (rootObj, path, val) => {
    const parts = path.split('.'); let node = rootObj;
    while (parts.length > 1) { const p = parts.shift(); node[p] = (node[p] && typeof node[p] === 'object') ? node[p] : {}; node = node[p]; }
    node[parts[0]] = val;
  };
  let failedTotal = 0, englishFill = 0, learnedCount = 0;
  for (const k of wanted) {
    const en = flatEn.get(k);
    if (typeof en !== 'string') continue; // non-string leaf
    const t = await translateOneKey(code, k, en);
    if (t == null) { englishFill++; failedTotal++; continue; }
    setPath(merged, k, t);
    // Endpoint returned the source verbatim: the string is locale-independent
    // (proper noun, brand, code). Record it so this key never blocks a tick.
    if (t === en) { learned.add(k); learnedCount++; }
  }
  if (learnedCount) saveLearned();

  // Structural guard: keep the file complete and valid even when some keys fell
  // back to English. Untranslated gaps stay visible as EN fallback and get
  // retried on the next tick.
  for (const [k, v] of flatEn) {
    const o = merged && k.split('.').reduce((n, kk) => (n && typeof n === 'object' ? n[kk] : undefined), merged);
    if (typeof o !== 'string' || !o.trim() || ph(v) !== ph(o)) { setPath(merged, k, v); if (!wanted.has(k)) englishFill++; }
  }
  return { merged, failedTotal, englishFill, pending: wanted.size, learnedCount };
}

let ok = 0, failed = [];
for (const lang of targets) {
  const n = pendingKeys(lang.code).length;
  process.stdout.write(`→ ${lang.code} (${lang.english}) ${n} pending … `);
  try {
    const { merged, failedTotal, englishFill, pending, learnedCount } = await translateLocale(lang);
    writeFileSync(join(localesDir, `${lang.code}.json`), JSON.stringify(merged, null, 2) + '\n', 'utf8');
    const keys = flatten(merged).length;
    let note = ` of ${pending} translated`;
    if (learnedCount) note += `, ${learnedCount} identity`;
    if (failedTotal) note += ` (${failedTotal} failed→EN)`;
    console.log(`✓ ${keys} keys${note}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed.push(lang.code);
  }
  await sleep(200);
}
console.log(`\nDone: ${ok} translated, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);

// 4. Honest completion report. "Done" above only counts files written — it says
//    nothing about whether the locale is actually complete. An endpoint outage
//    fills gaps with EN source, so report real coverage instead of a false green.
const phF = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');
const IDENTITY = new Set(['profile.noneYet', 'profile.autoSetupCmd', 'footer.copyright',
  'nav.ansyGroup', 'nav.aiBlog', 'nav.faq']);
const enFlat = new Map(flatten(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'))));
let done = 0, incomplete = [];
for (const l of all) {
  if (l.code === 'en' || l.code === 'ar') continue;
  const p = pendingKeys(l.code);
  if (p.length) incomplete.push(`${l.code}(${p.length})`); else done++;
}
console.log(`Coverage: ${done}/${all.length - 2} locales complete` +
  (incomplete.length ? ` | incomplete: ${incomplete.join(' ')}` : ' | ALL LOCALES COMPLETE'));
if (incomplete.length) console.log(`⚠️  localization NOT finished — ${incomplete.length} locale(s) still need work (endpoint may be rate-limited; retried next tick).`);

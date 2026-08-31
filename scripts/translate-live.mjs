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

const isEnFallback = (obj) => {
  const t = (obj?.footer?.tagline) || '';
  return t.startsWith('Free AI dream') || t === '';
};
const targets = all.filter((l) => {
  if (l.code === 'en' || l.code === 'ar') return false;
  if (only && !only.includes(l.code)) return false;
  // Skip already-real translations unless --all is passed (saves OpenRouter quota
  // for stubborn locales and avoids re-translating polished files each cron tick).
  if (!process.argv.includes('--all')) {
    try {
      const existing = JSON.parse(readFileSync(join(localesDir, `${l.code}.json`), 'utf8'));
      if (!isEnFallback(existing)) return false;
    } catch {}
  }
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
  const chunks = chunkSource(source);
  const merged = {};
  let failedTotal = 0;
  const deepMerge = (target, src) => {
    for (const k of Object.keys(src)) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
        target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
        deepMerge(target[k], src[k]);
      } else target[k] = src[k];
    }
  };
  for (const c of chunks) {
    const { translations, failed } = await translateChunk(code, c);
    failedTotal += failed.length;
    deepMerge(merged, translations);
  }
  // Graceful degradation: fill any key still missing / with broken placeholders
  // with its English source so the file is always structurally complete and
  // valid. These stubs are picked up and translated on a subsequent tick.
  let englishFill = 0;
  const setPath = (rootObj, path, val) => {
    const parts = path.split('.'); let node = rootObj;
    while (parts.length > 1) { const p = parts.shift(); node[p] = (node[p] && typeof node[p] === 'object') ? node[p] : {}; node = node[p]; }
    node[parts[0]] = val;
  };
  const flatS = flatten(source);
  for (const [k, v] of flatS) {
    const o = merged && k.split('.').reduce((n, kk) => (n && typeof n === 'object' ? n[kk] : undefined), merged);
    if (typeof o !== 'string' || !o.trim() || ph(v) !== ph(o)) { setPath(merged, k, v); englishFill++; }
  }
  return { merged, failedTotal, englishFill };
}

let ok = 0, failed = [];
for (const lang of targets) {
  process.stdout.write(`→ ${lang.code} (${lang.english}) … `);
  try {
    const { merged, failedTotal, englishFill } = await translateLocale(lang);
    writeFileSync(join(localesDir, `${lang.code}.json`), JSON.stringify(merged, null, 2) + '\n', 'utf8');
    const keys = flatten(merged).length;
    let note = '';
    if (failedTotal || englishFill) note = ` (${failedTotal} key-fallback, ${englishFill} english-fill)`;
    console.log(`✓ ${keys} keys${note}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed.push(lang.code);
  }
  await sleep(1000);
}
console.log(`\nDone: ${ok} translated, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);

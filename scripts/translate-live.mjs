#!/usr/bin/env node
/**
 * translate-live.mjs — KEYLESS, high-quality UI localization for Dreamscope.
 *
 * Calls the project's OWN live /api/translate endpoint, which holds the
 * OPENROUTER_API_KEY server-side (never exposed to this script). Result: the
 * agent localizes all 58 UI locales with ZERO operator secrets — fully
 * self-completing. The endpoint deep-validates and returns the full object.
 *
 * Usage:  node scripts/translate-live.mjs [--only=es,fr] [--base=https://...]
 * Cron:   part of auto-translate.mjs (preferred over MyMemory when reachable).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const localesDir = join(root, 'src', 'i18n', 'locales');
const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const base = args.find((a) => a.startsWith('--base='))?.split('=')[1] || BASE;

const LANG_RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
const all = [];
let m;
while ((m = LANG_RE.exec(languagesTs))) all.push({ code: m[1], english: m[2], dir: m[3] });

const source = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const unflatten = (pairs) => {
  const out = {};
  for (const [path, value] of pairs) {
    const parts = path.split('.');
    let node = out;
    while (parts.length > 1) { const p = parts.shift(); node[p] = node[p] && typeof node[p] === 'object' ? node[p] : {}; node = node[p]; }
    node[parts[0]] = value;
  }
  return out;
};

const targets = all.filter((l) => {
  if (l.code === 'en' || l.code === 'ar') return false; // protected hand-curated
  if (only && !only.includes(l.code)) return false;
  return true; // translate every non-en/ar locale
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateLocale({ code }) {
  const flat = flatten(source);
  const res = await fetch(`${base}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, source: unflatten(flat.map(([k, v]) => [k, v])) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.translations) throw new Error('no translations');
  return data.translations;
}

let ok = 0, failed = [];
for (const lang of targets) {
  process.stdout.write(`→ ${lang.code} (${lang.english}) … `);
  try {
    let t;
    try { t = await translateLocale(lang); }
    catch (firstErr) {
      // Transient: free models queue up; back off and retry once before giving up.
      console.log(`↻ retrying after 4s…`);
      await sleep(4000);
      t = await translateLocale(lang);
    }
    writeFileSync(join(localesDir, `${lang.code}.json`), JSON.stringify(t, null, 2) + '\n', 'utf8');
    const keys = Object.keys(flatten(t)).length;
    console.log(`✓ ${keys} keys`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    failed.push(lang.code);
  }
  // 1.2s after success, 3s after failure — keep below Vercel burst thresholds.
  const last = failed[failed.length - 1] === lang.code;
  await sleep(last ? 3000 : 1200);
}
console.log(`\nDone: ${ok} translated, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);

#!/usr/bin/env node
/**
 * translate-free.mjs — KEYLESS UI localization for Dreamscope.
 *
 * Self-completing agent that needs NO operator secret: it translates the UI
 * strings to every language using a free, open translation API (MyMemory —
 * no API key required). This makes the platform genuinely multilingual with
 * zero credentials from the operator.
 *
 * If a literal OPENROUTER_API_KEY is present in .dreamscope-secrets, the higher
 * quality LLM path (translate-ui.mjs) is preferred; otherwise this keyless path
 * runs so the site is never stuck in English-only.
 *
 * Usage: node scripts/translate-free.mjs [--only=es,fr]
 * Cron:  node scripts/auto-translate.mjs   (tries OpenRouter, falls back here)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src', 'i18n', 'locales');
const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());

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
  // Translate every non-en/ar locale (they currently hold neutral EN placeholder copy).
  return true;
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateKey(text, lang) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    const t = d?.responseData?.translatedText;
    return typeof t === 'string' && t.trim() ? t.trim() : null;
  } catch { return null; }
}

let ok = 0, failed = [];
for (const { code, english, dir } of targets) {
  process.stdout.write(`→ ${code} (${english}) … `);
  const flat = flatten(source);
  const out = [];
  let miss = 0;
  for (const [key, val] of flat) {
    // Keep placeholders + brand name intact
    const translated = await translateKey(String(val), code);
    if (translated && /\{[\w]+\}/g.test(val) === /\{[\w]+\}/g.test(translated)) out.push([key, translated]);
    else { out.push([key, val]); miss++; } // fallback to English on failure
    await sleep(120); // gentle pacing (MyMemory free tier)
  }
  writeFileSync(join(localesDir, `${code}.json`), JSON.stringify(unflatten(out), null, 2) + '\n', 'utf8');
  console.log(miss ? `✓ ${out.length - miss} keys (${miss} EN fallback)` : `✓ ${out.length} keys`);
  ok++;
  await sleep(500);
}
console.log(`\nDone: ${ok} translated${failed.length ? ', ' + failed.length + ' failed: ' + failed.join(', ') : ''}`);

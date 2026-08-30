#!/usr/bin/env node
/**
 * seo-expand.mjs — Phase 6: expand on-demand SEO pages to more languages.
 *
 * For each target language, translates the per-symbol SEO content
 * (title / headline / meaning) + FAQ questions from the English source via
 * the site's own /api/translate (key stays server-side, free-model cascade).
 *
 * Resumable: progress is tracked in scripts/.seo-expand-state.json — each run
 * continues where the previous one stopped, so the nightly cron grows the
 * index a few languages at a time within the free quota.
 *
 * Usage:
 *   node scripts/seo-expand.mjs [--langs=ar,es] [--batch=20] [--max-calls=40] [--dry]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('--base='))?.split('=')[1] || 'https://dream-interpreter-alpha-ruddy.vercel.app').replace(/\/$/, '');
const BATCH = Number(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || 20);
const MAX_CALLS = Number(args.find((a) => a.startsWith('--max-calls='))?.split('=')[1] || 40);
const DRY = args.includes('--dry');
const only = args.find((a) => a.startsWith('--langs='))?.split('=')[1]?.split(',').map((s) => s.trim());

const seoPath = join(root, 'api', 'seo-data.json');
const statePath = join(root, 'scripts', '.seo-expand-state.json');
const languagesTs = readFileSync(join(root, 'src', 'i18n', 'languages.ts'), 'utf8');

const data = JSON.parse(readFileSync(seoPath, 'utf8'));
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { done: {} };

const LANG_META = {};
let m;
const RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
while ((m = RE.exec(languagesTs))) LANG_META[m[1]] = { english: m[2], dir: m[3] };

const ENGLISH_NAMES = {
  en: 'English', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Simplified Chinese',
  ja: 'Japanese', ko: 'Korean', tr: 'Turkish', hi: 'Hindi', it2: '',
};

const symbolKeys = Object.keys(data.SYM);
const existingLangs = new Set(Object.keys(data.LANGS));
const uiFull = existsSync(join(root, 'src', 'i18n', 'locales', 'en.json'))
  ? Object.keys(data.LANGS) : [];

// Target: every UI language that has a FULL locale file but no SEO content yet
const fullUiLangs = [];
for (const code of Object.keys(LANG_META)) {
  const localePath = join(root, 'src', 'i18n', 'locales', `${code}.json`);
  if (!existsSync(localePath)) continue;
  try {
    const d = JSON.parse(readFileSync(localePath, 'utf8'));
    if (d.about) fullUiLangs.push(code); // only fully translated UI languages
  } catch { /* skip */ }
}

const targets = (only || fullUiLangs).filter(
  (c) => LANG_META[c] && !existingLangs.has(c) && !state.done[c]
);

console.log(`SEO expansion: ${symbolKeys.length} symbols × ${existingLangs.size} langs now`);
console.log(`Targets (${targets.length}): ${targets.join(', ') || 'none — all done'}`);
if (DRY) process.exit(0);

let calls = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateChunk(code, chunk) {
  const res = await fetch(`${BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, source: chunk }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  return d.translations;
}

for (const code of targets) {
  if (calls >= MAX_CALLS) {
    console.log(`\nReached --max-calls=${MAX_CALLS} — stopping (resume next run).`);
    break;
  }
  const meta = LANG_META[code];
  const langName = meta?.english || ENGLISH_NAMES[code] || code;
  console.log(`\n→ ${code} (${langName})`);

  // Register the language
  data.LANGS[code] = { name: langName, dir: meta?.dir || 'ltr' };

  // Translate QUESTIONS (3 short strings)
  try {
    const q = await translateChunk(code, Object.fromEntries((data.QUESTIONS.en || []).map((qq, i) => [`q${i}`, qq])));
    data.QUESTIONS[code] = (data.QUESTIONS.en || []).map((_, i) => q[`q${i}`]);
    calls++;
    console.log(`  ✓ questions`);
  } catch (e) {
    console.log(`  ✗ questions failed (${e.message}) — skipping language`);
    delete data.LANGS[code];
    continue;
  }
  await sleep(1200);

  // Translate symbols in batches
  const syms = Object.fromEntries(
    symbolKeys.map((k) => {
      const en = data.SYM[k].en || {};
      return [k, { t: en.t, h: en.h, m: en.m }];
    })
  );
  const batches = [];
  for (let i = 0; i < symbolKeys.length; i += BATCH) {
    batches.push(symbolKeys.slice(i, i + BATCH));
  }

  let ok = true;
  for (const batch of batches) {
    if (calls >= MAX_CALLS) {
      console.log(`  … reached max-calls mid-language — will resume`);
      ok = false;
      break;
    }
    const chunk = Object.fromEntries(batch.map((k) => [k, syms[k]]));
    try {
      const t = await translateChunk(code, chunk);
      for (const k of batch) {
        data.SYM[k][code] = { t: t[k].t, h: t[k].h, m: t[k].m };
      }
      calls++;
      process.stdout.write(`  ✓ ${batch.length} symbols (${calls}/${MAX_CALLS})\n`);
      // Persist progress after every batch so a crash never loses work
      writeFileSync(seoPath, JSON.stringify(data), 'utf8');
    } catch (e) {
      console.log(`  ✗ batch failed: ${e.message} — will resume`);
      ok = false;
      break;
    }
    await sleep(1500);
  }

  if (ok) {
    state.done[code] = true;
    console.log(`  ✓ ${code} complete: 146 symbols + questions`);
  }
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

// Final write + stats
writeFileSync(seoPath, JSON.stringify(data), 'utf8');
const langs = Object.keys(data.LANGS);
console.log(`\nDone. LANGS now: ${langs.length} (${langs.join(', ')})`);
console.log('Next: npm run build (regenerates sitemap) then npm run deploy.');

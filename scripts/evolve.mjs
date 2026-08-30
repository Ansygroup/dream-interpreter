#!/usr/bin/env node
/**
 * evolve.mjs — Dreamscope's self-evolution loop. Runs daily via cron;
 * the existing auto-complete workflow commits & pushes afterwards.
 *
 *  1. Complete partial UI translations via the site's own /api/translate
 *     (key stays server-side; free-model cascade inside)
 *  2. Generate "Dream of the day" (EN + AR) via /api/interpret
 *     -> public/dream-today.json
 *
 * Usage: node scripts/evolve.mjs [--no-translate] [--no-daily] [--base=URL]
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('--base='))?.split('=')[1] || 'https://dream-interpreter-alpha-ruddy.vercel.app').replace(/\/$/, '');
const localesDir = join(root, 'src', 'i18n', 'locales');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 1. Complete partial UI translations ---------- */

if (!args.includes('--no-translate')) {
  console.log('== 1. Completing partial UI translations (via /api/translate) ==');
  const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));

  const codes = readFileSync(join(root, 'src', 'i18n', 'languages.ts'), 'utf8')
    .match(/code: '([a-z-]+)'/g)
    ?.map((m) => m.match(/'([a-z-]+)'/)[1]) ?? [];

  const partial = codes.filter((code) => {
    if (code === 'en') return false;
    try {
      const d = JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'));
      return !d.about; // partial files lack the full "about" section
    } catch {
      return true;
    }
  });

  console.log(`  partial locales: ${partial.length ? partial.join(', ') : 'none'}`);

  for (const code of partial) {
    process.stdout.write(`  → ${code} … `);
    try {
      const res = await fetch(`${BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, source: en }),
      });
      if (!res.ok) {
        console.log(`HTTP ${res.status} (quota? stopping this pass)`);
        break;
      }
      const data = await res.json();
      writeFileSync(join(localesDir, `${code}.json`), JSON.stringify(data.translations, null, 2) + '\n', 'utf8');
      console.log(`✓ via ${data.engine}`);
    } catch (e) {
      console.log(`error ${e?.message || e}`);
    }
    await sleep(1500); // gentle pacing
  }
  console.log('');
}

/* ---------- 2. Dream of the day ---------- */

if (!args.includes('--no-daily')) {
  console.log('== 2. Dream of the day (via /api/interpret) ==');
  const today = new Date().toISOString().slice(0, 10);
  const outFile = join(root, 'public', 'dream-today.json');

  let dailyDone = false;
  if (existsSync(outFile)) {
    try {
      const prev = JSON.parse(readFileSync(outFile, 'utf8'));
      if (prev.date === today) {
        console.log('  already generated for', today);
        dailyDone = true;
      }
    } catch { /* regenerate */ }
  }

  // Rotating dream scenarios (two per symbol family, EN source of truth)
  const SCENARIOS = [
    { key: 'snake', en: 'A green snake slipped through the garden gate and left its old skin on the doorstep', ar: 'أفعى خضراء انسلّت من باب الحديقة وتركت جلدها القديم على العتبة' },
    { key: 'water', en: 'Clear water was rising gently in an old well behind my childhood home', ar: 'ماء صافٍ كان يرتفع بهدوء في بئر قديمة خلف بيت طفولتي' },
    { key: 'flying', en: 'I was flying above my city at dawn and the streets glowed beneath me', ar: 'كنت أحلّق فوق مدينتي عند الفجر والشوارع تتوهج تحتية' },
    { key: 'teeth', en: 'My teeth turned to pearls one by one as I smiled at a crowd', ar: 'أسناني تحوّلت إلى لؤلؤ واحدة تلو الأخرى وأنا أبتسم لحشد' },
    { key: 'house', en: 'I discovered a beautiful room in my house I had never noticed before', ar: 'اكتشفت غرفة جميلة في بيتي لم ألاحظها من قبل' },
    { key: 'moon', en: 'The full moon descended and rested beside me on the rooftop', ar: 'البدر هبط واستقر بجانبي على السطح' },
    { key: 'garden', en: 'I walked into a garden where every tree bore a different fruit in season', ar: 'دخلت حديقة كانت كل شجرة فيها تحمل ثمرة موسمها' },
    { key: 'door', en: 'A door appeared in a wall where there had never been one, and it was unlocked', ar: 'ظهر باب في جدار لم يكن فيه باب قط، وكان مفتوح القفل' },
    { key: 'bird', en: 'A white bird landed on my hand and spoke my name softly', ar: 'طائر أبيض حطّ على يدي وقال اسمي بهدوء' },
    { key: 'rain', en: 'Warm rain fell only over my street, and children danced in it', ar: 'مطر دافئ هطل فوق شارعي وحده، وأطفال يرقصون تحته' },
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const scenario = SCENARIOS[dayOfYear % SCENARIOS.length];

  const interpret = async (dreamText, language) => {
    const res = await fetch(`${BASE}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: dreamText, language, perspective: 'general' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (d.engine === 'offline') throw new Error('engine offline');
    return d.interpretation;
  };

  try {
    const readingEn = await interpret(scenario.en, 'en');
    await sleep(2000);
    const readingAr = await interpret(scenario.ar, 'ar');
    const out = {
      date: today,
      symbol: { key: scenario.key, en: scenario.key, ar: '' },
      dream: { en: scenario.en, ar: scenario.ar },
      reading: { en: readingEn, ar: readingAr },
    };
    writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ✓ dream of the day (${scenario.key}) generated`);
  } catch (e) {
    console.log(`  ✗ dream of the day failed: ${e?.message || e}`);
    process.exitCode = 1;
  }
}

/* ---------- 3. SEO language expansion (Phase 6, quota permitting) ---------- */

if (!args.includes('--no-seo')) {
  console.log('== 3. SEO language expansion ==');
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'seo-expand.mjs'), '--max-calls=20'], {
    stdio: 'inherit',
    env: process.env,
    cwd: root,
  });
  console.log(`seo-expand exited with ${r.status}\n`);
}

console.log('\nEvolve pass done. (The auto-complete workflow will commit & push.)');

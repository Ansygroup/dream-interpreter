#!/usr/bin/env node
/**
 * evolve.mjs — Dreamscope's self-evolution loop. Designed to run daily via
 * cron (the existing auto-complete workflow commits & pushes afterwards).
 *
 *  1. Complete partial UI translations (free-model cascade, quota-aware)
 *  2. Generate "Dream of the day" (EN + AR) -> public/dream-today.json
 *
 * Usage: OPENROUTER_API_KEY=... node scripts/evolve.mjs [--no-translate] [--no-daily]
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const KEY = process.env.OPENROUTER_API_KEY;

const FREE_MODELS = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-fin:free',
];

async function chat(system, user, maxTokens = 900) {
  if (!KEY) throw new Error('no-key');
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreamscope.app',
          'X-Title': 'Dreamscope Evolve',
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) {
        console.log(`  [llm] ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return { text, model };
    } catch (e) {
      console.log(`  [llm] ${model} error ${e?.message || e}`);
    }
  }
  throw new Error('all models failed');
}

/* ---------- 1. Complete partial UI translations ---------- */

if (!args.includes('--no-translate')) {
  console.log('== 1. Completing partial UI translations ==');
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'translate-ui.mjs'), '--complete'], {
    stdio: 'inherit',
    env: process.env,
    cwd: root,
  });
  console.log(`translate-ui exited with ${r.status}\n`);
}

/* ---------- 2. Dream of the day ---------- */

if (!args.includes('--no-daily')) {
  console.log('== 2. Dream of the day ==');
  const SYMBOLS = [
    { key: 'snake', en: 'Snake', ar: 'الثعبان' },
    { key: 'water', en: 'Water', ar: 'الماء' },
    { key: 'flying', en: 'Flying', ar: 'الطيران' },
    { key: 'teeth', en: 'Teeth', ar: 'الأسنان' },
    { key: 'house', en: 'House', ar: 'البيت' },
    { key: 'moon', en: 'Moon', ar: 'القمر' },
    { key: 'sea', en: 'Sea', ar: 'البحر' },
    { key: 'mountain', en: 'Mountain', ar: 'الجبل' },
    { key: 'garden', en: 'Garden', ar: 'الحديقة' },
    { key: 'door', en: 'Door', ar: 'الباب' },
    { key: 'bird', en: 'Bird', ar: 'الطائر' },
    { key: 'mirror', en: 'Mirror', ar: 'المرآة' },
    { key: 'rain', en: 'Rain', ar: 'المطر' },
    { key: 'road', en: 'Road', ar: 'الطريق' },
    { key: 'star', en: 'Star', ar: 'النجمة' },
    { key: 'tree', en: 'Tree', ar: 'الشجرة' },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const outFile = join(root, 'public', 'dream-today.json');

  // Skip if already generated today
  if (existsSync(outFile)) {
    try {
      const prev = JSON.parse(readFileSync(outFile, 'utf8'));
      if (prev.date === today) {
        console.log('  already generated for', today);
        process.exit(0);
      }
    } catch { /* regenerate */ }
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const symbol = SYMBOLS[dayOfYear % SYMBOLS.length];

  try {
    const { text, model } = await chat(
      `You are Dreamscope's daily dream muse. Write a short, beautiful "dream of the day" piece. Respond ONLY with valid JSON, no markdown fences:
{"dream_en":"...","dream_ar":"...","reading_en":"...","reading_ar":"..."}
- dream_en/dream_ar: one vivid first-person dream sentence featuring ${symbol.en}.
- reading_en/reading_ar: a warm 2-3 sentence interpretation blending Ibn Sirin's tradition and depth psychology.
- The Arabic must be natural, eloquent Modern Standard Arabic. Keep "Ibn Sirin" as ابن سيرين in Arabic.`,
      `Today's symbol: ${symbol.en} (${symbol.ar}). Write today's piece.`,
      900
    );
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const out = {
      date: today,
      symbol: symbol,
      dream: { en: parsed.dream_en, ar: parsed.dream_ar },
      reading: { en: parsed.reading_en, ar: parsed.reading_ar },
      engine: model,
    };
    writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ✓ dream of the day (${symbol.en}) via ${model}`);
  } catch (e) {
    console.log(`  ✗ dream of the day failed: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('\nEvolve pass done. (The auto-complete workflow will commit & push.)');

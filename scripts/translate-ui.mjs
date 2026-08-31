#!/usr/bin/env node
/**
 * translate-ui.mjs — machine-translate the UI strings to every supported language.
 *
 * Reads src/i18n/locales/en.json (canonical), asks the LLM to translate it into
 * each target language, validates the result (same key set, {placeholders}
 * preserved), and writes src/i18n/locales/{code}.json.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/translate-ui.mjs [--only=ar,he] [--model=google/gemini-2.5-flash]
 *
 * Idempotent: languages with an existing locale file are skipped unless --force.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src', 'i18n', 'locales');
const languagesTs = readFileSync(join(root, 'src', 'i18n', 'languages.ts'), 'utf8');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const force = args.includes('--force');
/** --complete: only (re)translate files that are partial (missing the "about" section). */
const complete = args.includes('--complete');
const MODEL = args.find((a) => a.startsWith('--model='))?.split('=')[1] || '';

// Free-first cascade — mirrors api/interpret.js
const FREE_MODELS = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-fin:free',
];
const MODELS = MODEL ? [MODEL] : FREE_MODELS;

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error('OPENROUTER_API_KEY is required (env var).');
  process.exit(1);
}

// Extract language codes + English names from the canonical language list
const LANG_RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
const all = [];
let m;
while ((m = LANG_RE.exec(languagesTs))) all.push({ code: m[1], english: m[2], dir: m[3] });

const source = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const sourceKeys = Object.keys(source).length;

const isPartial = (code) => {
  try {
    const d = JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'));
    return !d.about; // full files carry the "about" section
  } catch {
    return true;
  }
};

const targets = all.filter((l) => {
  if (l.code === 'en') return false;
  if (only && !only.includes(l.code)) return false;
  if (complete) return existsSync(join(localesDir, `${l.code}.json`)) && isPartial(l.code);
  return force || !existsSync(join(localesDir, `${l.code}.json`));
});

console.log(`Source: en.json → ${targets.length} language(s) via ${MODELS.join(' → ')}\n`);

// Flatten nested JSON to "a.b.c" paths so the model sees a flat map (safer JSON out)
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  );
const flat = flatten(source);
const placeholderOf = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');

function unflatten(pairs) {
  const out = {};
  for (const [path, value] of pairs) {
    const parts = path.split('.');
    let node = out;
    while (parts.length > 1) {
      const p = parts.shift();
      node[p] = node[p] && typeof node[p] === 'object' ? node[p] : {};
      node = node[p];
    }
    node[parts[0]] = value;
  }
  return out;
}

async function translate({ code, english, dir }) {
  const pairs = flat.map(([k, v]) => [k, v]);
  const prompt = `Translate the UI strings of "Dreamscope", a dream-interpretation website, from English to ${english}${dir === 'rtl' ? ' (a right-to-left language)' : ''}.

Rules:
- Natural, warm, respectful product copy — not word-for-word.
- Keep every {placeholder} like {accent}, {n}, {year} EXACTLY as-is.
- Keep the brand name "Dreamscope" untranslated.
- Dreamscope is a GLOBAL, MULTI-FAITH platform: do NOT frame any single tradition (e.g. Ibn Sirin / Islamic) as the foundation or center of the product. Translate "Ibn Sirin" only where it NAMES the Islamic perspective school (e.g. the perspDesc.islamic line), rendered appropriately for the language (ابن سيرين in Arabic). Everywhere else, use neutral phrasing like "your chosen tradition" / "many cultures and faiths".
- Dreams/spiritual content: neutral and inclusive tone.
- Respond with ONLY a valid JSON object mapping the SAME keys to the ${english} translations. No markdown fences, no commentary.

Input JSON:
${JSON.stringify(Object.fromEntries(pairs), null, 0)}`;

  let text = '';
  for (const model of MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreamscope.app',
          'X-Title': 'Dreamscope UI Localization',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 8000,
          messages: [
            { role: 'system', content: 'You are a professional UI localizer. You output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        console.log(`[${code}] ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content ?? '';
      if (text.trim()) break;
    } catch (e) {
      console.log(`[${code}] ${model} error ${e?.message || e}`);
    }
  }
  if (!text.trim()) throw new Error('all models failed');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const outPairs = [];
  const missing = [];
  for (const [key, original] of pairs) {
    const value = parsed[key];
    if (typeof value !== 'string' || !value.trim()) { missing.push(key); continue; }
    if (placeholderOf(original) !== placeholderOf(value)) {
      throw new Error(`placeholder mismatch on ${key}: "${original}" → "${value}"`);
    }
    outPairs.push([key, value]);
  }
  if (missing.length) throw new Error(`missing ${missing.length} keys: ${missing.slice(0, 5).join(', ')}`);

  const out = unflatten(outPairs);
  writeFileSync(join(localesDir, `${code}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8');
  return outPairs.length;
}

let ok = 0;
const failed = [];
for (const lang of targets) {
  process.stdout.write(`→ ${lang.code} (${lang.english}) … `);
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const n = await translate(lang);
      console.log(`✓ ${n} keys`);
      ok++;
      done = true;
    } catch (err) {
      if (attempt === 3) {
        console.log(`✗ ${err.message}`);
        failed.push(lang.code);
      } else {
        process.stdout.write(`retry ${attempt + 1} (${err.message.slice(0, 60)}) … `);
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
  }
  await new Promise((r) => setTimeout(r, 800)); // gentle pacing
}

console.log(`\nDone: ${ok} translated, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);
console.log('Next: npm run build — AVAILABLE_LANGUAGES updates automatically from the new files.');

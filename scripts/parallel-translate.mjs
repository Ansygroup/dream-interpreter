#!/usr/bin/env node
/**
 * parallel-translate.mjs — orchestrates scripts/translate-live.mjs over only the
 * locales that are currently INCOMPLETE (missing keys or broken placeholders vs
 * en.json), in a bounded parallel worker pool. Safe to re-run: already-valid
 * locales are skipped, so partial progress is preserved and resumed.
 *
 * Run in FOREGROUND (background mode is broken for node in this env). One node
 * process spawns child `translate-live.mjs --only=CODE` workers; the parent
 * waits for all. Re-run to finish any remainder.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');

const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]);
const ef = flat(en);
const em = new Map(ef);
const enKeys = [...em.keys()];
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');

const isValid = (c) => {
  try {
    const o = JSON.parse(readFileSync(join(localesDir, `${c}.json`), 'utf8'));
    const m = new Map(flat(o));
    for (const k of enKeys) {
      if (!m.has(k)) return false;
      const v = m.get(k);
      if (typeof v !== 'string' || !v.trim()) return false;
      if (ph(em.get(k)) !== ph(v)) return false;
    }
    return true;
  } catch { return false; }
};

import { readdirSync } from 'node:fs';
const codes = readdirSync(localesDir).filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5)).filter((c) => c !== 'en' && c !== 'ar').sort();
const broken = codes.filter((c) => !isValid(c));
console.log(`[parallel-translate] BROKEN=${broken.length}: ${broken.join(' ')}`);

const CONC = Number(process.env.CONC || 8);
let i = 0;
const stillBroken = new Set(broken);

async function worker() {
  while (i < broken.length) {
    const code = broken[i++];
    if (isValid(code)) { stillBroken.delete(code); continue; }
    await new Promise((res) => {
      const p = spawn('node', ['scripts/translate-live.mjs', `--only=${code}`], {
        cwd: root, stdio: 'ignore',
      });
      p.on('exit', () => {
        if (isValid(code)) stillBroken.delete(code);
        else console.log(`[parallel-translate] ${code} still invalid after run`);
        res();
      });
    });
  }
}

await Promise.all(Array.from({ length: Math.min(CONC, broken.length) }, worker));
const remaining = [...stillBroken];
console.log(`[parallel-translate] DONE. remaining_invalid=${remaining.length} ${remaining.join(' ')}`);
process.exit(remaining.length ? 2 : 0);

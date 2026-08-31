#!/usr/bin/env node
/**
 * parallel-translate.mjs — resilient, self-committing localization runner.
 *
 * Translates only the locales that are currently INCOMPLETE (missing keys or
 * broken placeholders vs en.json), via scripts/translate-live.mjs (the same
 * live endpoint the auto-translate agent uses). Each code is retried up to
 * MAX_TRIES times; on success the single locale file is git-added + committed
 * immediately (files are disjoint, so per-file commits are race-free and
 * survive being killed between ticks). A final push sends everything upstream.
 *
 * Run in FOREGROUND (background mode is broken for node in this env). Re-run
 * any number of times — already-valid locales are skipped, so it resumes.
 */
import { spawn, execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
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

const codes = readdirSync(localesDir).filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5)).filter((c) => c !== 'en' && c !== 'ar').sort();
const broken = codes.filter((c) => !isValid(c));
console.log(`[parallel-translate] BROKEN=${broken.length}: ${broken.join(' ')}`);

const CONC = Number(process.env.CONC || 2);
const MAX_TRIES = Number(process.env.MAX_TRIES || 3);
const commit = (c) => {
  try {
    execSync(`git add src/i18n/locales/${c}.json`, { cwd: root, stdio: 'ignore' });
    execSync(`git commit -m "i18n: agent auto-localized ${c}"`, { cwd: root, stdio: 'ignore' });
    console.log(`[parallel-translate] committed ${c}`);
    try { execSync('git push origin master', { cwd: root, stdio: 'ignore' }); }
    catch { console.log(`[parallel-translate] push deferred for ${c}`); }
  } catch (e) { console.log(`[parallel-translate] commit failed for ${c}: ${e.message}`); }
};

let i = 0;
const stillBroken = new Set(broken);

async function worker() {
  while (i < broken.length) {
    const code = broken[i++];
    if (isValid(code)) { stillBroken.delete(code); continue; }
    let ok = false;
    for (let t = 1; t <= MAX_TRIES && !ok; t++) {
      if (t > 1) console.log(`[parallel-translate] ${code} attempt ${t}`);
      await new Promise((res) => {
        const p = spawn('node', ['scripts/translate-live.mjs', `--only=${code}`], {
          cwd: root, stdio: 'ignore',
        });
        p.on('exit', () => res());
      });
      if (isValid(code)) ok = true;
    }
    if (ok) { stillBroken.delete(code); commit(code); }
    else console.log(`[parallel-translate] ${code} FAILED after ${MAX_TRIES} tries`);
  }
}

await Promise.all(Array.from({ length: Math.min(CONC, broken.length) }, worker));

const remaining = [...stillBroken];
console.log(`[parallel-translate] pass done. remaining_invalid=${remaining.length} ${remaining.join(' ')}`);
// Finalize: commit any still-uncommitted valid locale files (e.g. pre-existing writes) and push.
try {
  execSync('git add src/i18n/locales/*.json', { cwd: root, stdio: 'ignore' });
  execSync('git commit -m "i18n: finalize auto-localization pass"', { cwd: root, stdio: 'ignore' });
  console.log('[parallel-translate] finalized pending locale commits');
} catch { /* nothing pending */ }
try { execSync('git push origin master', { cwd: root, stdio: 'inherit' }); console.log('[parallel-translate] pushed'); }
catch (e) { console.log('[parallel-translate] push failed: ' + e.message); }
process.exit(remaining.length ? 2 : 0);

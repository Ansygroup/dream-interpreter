import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');
const BASE = 'https://dream-interpreter-alpha-ruddy.vercel.app';
const code = process.argv[2] || 'am';
const source = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}$k.`) : [[`${prefix}${k}`, v]]);
const unflatten = (pairs) => { const out = {}; for (const [path, value] of pairs) { const parts = path.split('.'); let node = out; while (parts.length > 1) { const p = parts.shift(); node[p] = (node[p] && typeof node[p] === 'object') ? node[p] : {}; node = node[p]; } node[parts[0]] = value; } return out; };
const flat = flatten(source);
const CH = 10;
const chunks = []; for (let i = 0; i < flat.length; i += CH) chunks.push(unflatten(flat.slice(i, i + CH)));
process.stderr.write(`locale=${code} totalKeys=${flat.length} chunks=${chunks.length}\n`);
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');
let okChunks = 0, badChunks = 0;
const merged = {};
const deepMerge = (t, s) => { for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { t[k] = t[k] && typeof t[k] === 'object' ? t[k] : {}; deepMerge(t[k], s[k]); } else t[k] = s[k]; } };
for (let ci = 0; ci < chunks.length; ci++) {
  const c = chunks[ci];
  let done = false;
  for (let a = 1; a <= 5 && !done; a++) {
    try {
      const res = await fetch(`${BASE}/api/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, source: c }), signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data?.translations) throw new Error('no translations');
      const ft = flatten(data.translations); const fs2 = flatten(c);
      const tm = new Map(ft); const sm = new Map(fs2);
      let bad = null;
      for (const [k, v] of fs2) { const o = tm.get(k); if (typeof o !== 'string' || !o.trim()) { bad = k + ' missing'; break; } if (ph(v) !== ph(o)) { bad = k + ' ph'; break; } }
      if (bad) throw new Error(bad);
      for (const [k] of ft) if (!sm.has(k)) { /* extra key ok */ }
      deepMerge(merged, data.translations);
      okChunks++; done = true;
    } catch (e) {
      if (a === 5) { badChunks++; process.stderr.write(`  chunk ${ci} FAILED after 5 tries: ${e.message}\n`); }
      else await new Promise(r => setTimeout(r, 1500 * a));
    }
  }
}
const fm = flatten(merged); const sm = new Map(flat);
let missing = [];
for (const [k, v] of flat) { const o = merged && k.split('.').reduce((n, kk) => (n && typeof n === 'object' ? n[kk] : undefined), merged); if (typeof o !== 'string' || !o.trim()) missing.push(k); }
process.stderr.write(`DONE okChunks=${okChunks} badChunks=${badChunks} mergedKeys=${fm.length} missing=${missing.length}\n`);
if (missing.length) process.stderr.write('missing sample: ' + missing.slice(0, 8).join(', ') + '\n');

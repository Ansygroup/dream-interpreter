import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// Load a real key from the dreamer profile env (NOT Vercel's) to test the code path.
const p = path.join(os.homedir(), 'AppData', 'Local', 'hermes', 'profiles', 'dreamer', '.env');
for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
console.log('key present:', !!process.env.OPENROUTER_API_KEY);
const { default: handler } = await import('../api/interpret.js');
const mkRes = () => ({ _code: 200, _json: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this._code = c; return this; }, json(o) { this._json = o; return this; }, end() { return this; } });
let i = 0;
for (const [lang, persp] of [['en', 'general'], ['ar', 'islamic'], ['de', 'jewish']]) {
  const req = { method: 'POST', body: { dream: `glass flowers under a red moon, my father waited at the gate #${++i}`, language: lang, perspective: persp }, headers: { 'x-forwarded-for': `10.9.9.${i}` } };
  const res = mkRes();
  await handler(req, res);
  const j = res._json || {};
  console.log(`${lang}/${persp} -> HTTP ${res._code} engine=${j.engine} chars=${(j.interpretation || '').length} symbols=${JSON.stringify(j.symbols)}`);
  console.log('    ', (j.interpretation || j.error || '').slice(0, 160).replace(/\n/g, ' '));
}

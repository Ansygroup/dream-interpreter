import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync } from 'node:fs';
const root = process.cwd();
const log = (...a) => console.log('[diag]', ...a);
const run = (cmd, opts = {}) => {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', ...opts }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
};
log('step1 start');
const envFile = root + '/.env.vercel.local';
rmSync(envFile, { force: true });
log('step2 calling vercel...');
const out = run('vercel env pull .env.vercel.local --environment production --yes 2>&1', { timeout: 120000 });
log('step3 vercel returned, len=', out.length);
log('vercel output:', JSON.stringify(out.slice(0, 300)));
log('file exists?', existsSync(envFile));
log('step4 done');

#!/usr/bin/env node
/**
 * auto-complete.mjs — self-completing workflow for the dream-interpreter repo.
 * Runs on cron. Checks for available credentials and finishes pending work:
 *   - .env with STRIPE_SECRET_KEY -> runs `npm run stripe:links` if present
 *   - git remote reachable        -> commit + push pending work
 * Idempotent and prompt-free.
 *
 * Cron-safe: when local is already in sync with the remote we skip `git push`
 * entirely, so Git Credential Manager never touches stdin (which would fail
 * with "stdin is not a tty" under </dev/null> on a headless cron).
 *
 * SECURITY: `git add -A` is preceded by a staged-file secret scan. A
 * `vercel env pull` emits a LIVE VERCEL_OIDC_TOKEN; a blanket add once
 * committed that file to a public remote. Credential-shaped files/contents
 * are now unstaged and refused, never committed.
 *
 * Usage: node auto-complete.mjs   (resolves repo root from __dirname)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');

function log(m) { console.log(`[auto ${new Date().toISOString()}] ${m}`); }

// Stripe links if script exists
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  const m = env.match(/STRIPE_SECRET_KEY=(\S+)/);
  if (m && m[1] && m[1].startsWith('sk_') && existsSync(resolve(root, 'scripts/gen-stripe-links.mjs'))) {
    log('key + gen script found - generating links...');
    try { execSync('node scripts/gen-stripe-links.mjs', { cwd: root, stdio: 'inherit' }); log('OK links done'); }
    catch (e) { log(`WARN links failed: ${e.message.split('\n')[0]}`); }
  }
}

// ---- Secret guard: never stage secret-bearing files ------------------
// Patterns are built from fragments so this file does not match itself.
const S = (parts, flags) => new RegExp(parts.join(''), flags);
const SECRET_PATTERNS = [
  [S(['VERCEL', '_OIDC', '_TOKEN=']), 'VERCEL_OIDC_TOKEN'],
  [S(['STRIPE', '_SECRET_KEY=sk_(live|test)_']), 'STRIPE_SECRET_KEY'],
  [S(['OPENROUTER', '_API_KEY=sk-or-v1-[A-Za-z0-9]{20,}']), 'OPENROUTER_API_KEY'],
  [S(['(?:^|[^A-Za-z0-9_])(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}'], 'm'), 'GitHub token'],
  [S(['AKIA[0-9A-Z]{16}']), 'AWS access key id'],
  [S(['AIza[0-9A-Za-z_-]{30,}']), 'Google API key'],
  [S(['sk_(live|test)_[A-Za-z0-9]{20,}']), 'Stripe secret key'],
];
const ENVISH = /(?:^|\/)(?:vercel-prod\.env|\.env(?:\.\w+)?$|[^/]*\.env$|[^/]*\.pem$|id_rsa$|[^/]*-secrets$|credentials\.json$)/;

function scanStaged() {
  let files = [];
  try {
    files = execSync('git diff --cached --name-only -z --diff-filter=ACMRT', { cwd: root, encoding: 'utf8' })
      .split(String.fromCharCode(0)).filter(Boolean);
  } catch { return null; }
  for (const f of files) {
    if (ENVISH.test(f)) return { file: f, kind: 'env/credential filename' };
    let body = '';
    try { body = readFileSync(resolve(root, f), 'utf8'); } catch { continue; }
    for (const [re, kind] of SECRET_PATTERNS) {
      if (re.test(body)) return { file: f, kind };
    }
  }
  return null;
}

function unstageAll() { try { execSync('git reset -q', { cwd: root }); } catch { /* nothing staged */ } }

// Git auto-push
try {
  const st = execSync('git status --short', { cwd: root, encoding: 'utf8' }).trim();
  if (st) {
    execSync('git add -A', { cwd: root });
    const bad = scanStaged();
    if (bad) {
      unstageAll();
      log(`BLOCKED: ${bad.file} (${bad.kind}) - unstaged, NOT committed. Add it to .gitignore.`);
    } else {
      execSync('git -c user.email="ansy0@ansygroup.com" -c user.name="ansy0" commit -q -m "chore: auto-complete pending work"', { cwd: root });
    }
  }
  const b = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim();
  // Only push if there is actually something ahead of the remote - avoids
  // invoking the credential manager when idle (which fails headless).
  let ahead = '';
  try { ahead = execSync(`git log --oneline origin/${b}..HEAD`, { cwd: root, encoding: 'utf8', timeout: 20000 }).trim(); }
  catch { try { execSync(`git fetch -q origin ${b}`, { cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GCM_TERMINAL_PROMPT: '0' } }); ahead = execSync(`git log --oneline origin/${b}..HEAD`, { cwd: root, encoding: 'utf8', timeout: 20000 }).trim(); } catch { ahead = ''; } }
  if (!ahead) {
    log('nothing to push (local in sync with origin)');
  } else {
    execSync(`git push origin ${b}`, { cwd: root, stdio: 'inherit', env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GCM_TERMINAL_PROMPT: '0' } });
    log('pushed');
  }
} catch (e) { log(`WARN push skipped: ${e.message.split('\n')[0]}`); }
log('done.');

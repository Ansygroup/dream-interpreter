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

// ---- Debris guard: never stage transient scratch output -------------
// A translation probe that 502s leaves curl debris (body.txt, headers.txt,
// vlogs.txt) in the repo root. A blanket add -A once committed that junk to a
// PUBLIC remote. Such files are unstaged and never committed.
const DEBRIS = /^(body|headers|vlogs|out|resp|response|debug|tmp|temp|log).txt$/;

// Git auto-push
try {
  const st = execSync('git status --short', { cwd: root, encoding: 'utf8' }).trim();
  if (st) {
    execSync('git add -A', { cwd: root });
    // Drop known transient debris from the index before the secret scan.
    try {
      const staged = execSync('git diff --cached --name-only -z', { cwd: root, encoding: 'utf8' })
        .split(String.fromCharCode(0)).filter(Boolean);
      const junk = staged.filter(f => DEBRIS.test(f.split('/').pop() || ''));
      for (const f of junk) {
        execSync('git rm -q --cached -- ' + JSON.stringify(f), { cwd: root });
        log('ignored debris: ' + f + ' (not committed; add to .gitignore)');
      }
    } catch { /* nothing to unstage */ }
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
  //
  // A MISSING origin/<branch> ref does NOT mean "in sync": it means the branch
  // has never been pushed. The old code let that rev-parse failure land in a
  // catch that blanked 'ahead', so a first push was reported as
  // "local in sync with origin" forever and its commits never left the box.
  const NOPROMPT = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GCM_TERMINAL_PROMPT: '0' };
  const refExists = (ref) => {
    try { execSync(`git rev-parse --verify --quiet ${ref}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }); return true; }
    catch { return false; }
  };
  const upstream = `origin/${b}`;
  let ahead = '';
  const firstPush = !refExists(upstream);
  if (firstPush) {
    // Unpublished branch: every local commit is unpushed work.
    ahead = execSync('git log --oneline -1 HEAD', { cwd: root, encoding: 'utf8', timeout: 20000 }).trim();
    log(`no remote ref ${upstream} -> first push of ${b}`);
  } else {
    try { execSync(`git fetch -q origin ${b}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], timeout: 45000, env: NOPROMPT }); } catch { /* offline: trust cached ref */ }
    ahead = execSync(`git log --oneline ${upstream}..HEAD`, { cwd: root, encoding: 'utf8', timeout: 20000 }).trim();
  }
  if (!ahead) {
    log('nothing to push (local in sync with origin)');
  } else {
    // Transient connect timeouts to github.com:443 hit this repo regularly:
    // ls-remote / --dry-run succeed, then the real push dies with
    // 'Failed to connect to github.com port 443'. Retry instead of dropping
    // the commit on the floor.
    const cmd = `git push ${firstPush ? '-u ' : ''}origin ${b}`;
    let lastErr = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        execSync(cmd, { cwd: root, stdio: 'inherit', env: NOPROMPT, timeout: 120000 });
        log(attempt > 1 ? `pushed (after ${attempt} attempts)` : 'pushed');
        break;
      } catch (e) {
        lastErr = e.message.split(String.fromCharCode(10))[0];
        if (attempt === 3) { log(`WARN push failed after 3 attempts: ${lastErr}`); break; }
        log(`push attempt ${attempt} failed (${lastErr}) - retrying`);
      }
    }
  }
} catch (e) { log(`WARN push skipped: ${e.message.split('\n')[0]}`); }
log('done.');

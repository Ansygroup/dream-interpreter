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
  // Sweep EVERY local branch, not just the checked-out one. A branch parked in
  // another worktree (master lives in ../dream-interpreter-feed) or left behind
  // after a checkout stays unpublished forever if only HEAD's branch is checked.
  const NL_CHR = String.fromCharCode(10);
  const NOPROMPT = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GCM_TERMINAL_PROMPT: '0' };
  const git = (cmd, extra = {}) =>
    execSync(cmd, { cwd: root, encoding: 'utf8', env: NOPROMPT, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'], ...extra });
  const err1 = (e) => String((e && e.message) || '').split(NL_CHR)[0];
  const isAncestor = (a, ref) => { try { git('git merge-base --is-ancestor ' + a + ' ' + ref, { timeout: 20000 }); return true; } catch { return false; } };

  const branches = git('git for-each-ref --format=%(refname:short) refs/heads')
    .split(NL_CHR).map((s) => s.trim()).filter(Boolean);
  log('sweeping ' + branches.length + ' local branch(es)');

  // One fetch for the whole sweep: per-branch fetches multiply the transient
  // github.com:443 timeouts this repo is prone to.
  let fetched = false;
  for (let a = 1; a <= 2 && !fetched; a++) {
    try { git('git fetch -q --prune origin', { timeout: 60000 }); fetched = true; }
    catch (e) { log('WARN fetch attempt ' + a + ' failed (' + err1(e) + ')'); }
  }

  // A cached origin/* ref can be stale, which turns "in sync" into a lie when
  // the remote has moved on. ls-remote is far lighter than fetch and usually
  // survives where fetch times out, so prefer real remote SHAs for the
  // comparison and only fall back to the cached refs.
  const remoteShas = new Map();
  try {
    for (const line of git('git ls-remote --heads origin', { timeout: 60000 }).split(NL_CHR)) {
      const parts = line.trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2 || !parts[1].startsWith('refs/heads/')) continue;
      remoteShas.set(parts[1].slice('refs/heads/'.length), parts[0]);
    }
    log('ls-remote: ' + remoteShas.size + ' remote branch(es)');
  } catch (e) { log('WARN ls-remote failed (' + err1(e) + ') - comparing against cached origin/* refs'); }

  const localSha = (ref) => { try { return git('git rev-parse ' + ref, { timeout: 20000 }).trim(); } catch { return ''; } };
  const remoteShaFor = (b) => {
    const live = remoteShas.get(b);
    if (live) return live;
    try { return git('git rev-parse --verify --quiet origin/' + b, { timeout: 20000 }).trim(); } catch { return ''; }
  };

  const pushBranch = (b) => {
    const upstream = 'origin/' + b;
    const head = localSha(b);
    if (!head) { log('WARN ' + b + ': local HEAD unresolvable - skipped'); return; }
    const remoteSha = remoteShaFor(b);
    const firstPush = !remoteSha;
    if (!firstPush && remoteSha === head) { log(b + ': in sync with ' + upstream); return; }
    if (firstPush) {
      log('no remote ref ' + upstream + ' -> first push of ' + b);
    } else if (!isAncestor(remoteSha, b)) {
      const behind = git('git rev-list --count ' + b + '..' + remoteSha, { timeout: 20000 }).trim();
      log('WARN ' + b + ': remote has ' + behind + ' commit(s) missing locally - push would be rejected, merge/rebase first');
      return;
    }
    const pending = git('git rev-list --count ' + (firstPush ? b : remoteSha + '..' + b), { timeout: 20000 }).trim();
    if (pending === '0') { log(b + ': nothing local to push'); return; }
    log(b + ': ' + pending + ' commit(s) to push');
    // Transient connect timeouts to github.com:443 hit this repo regularly:
    // ls-remote / --dry-run succeed, then the real push dies with
    // 'Failed to connect to github.com port 443'. Retry instead of dropping
    // the commit on the floor.
    const cmd = 'git push ' + (firstPush ? '-u ' : '') + 'origin ' + b;
    let lastErr = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        execSync(cmd, { cwd: root, stdio: 'inherit', env: NOPROMPT, timeout: 120000 });
        log(attempt > 1 ? b + ': pushed (after ' + attempt + ' attempts)' : b + ': pushed');
        return;
      } catch (e) {
        lastErr = err1(e);
        if (attempt === 3) { log('WARN push failed for ' + b + ' after 3 attempts: ' + lastErr); return; }
        log('push attempt ' + attempt + ' for ' + b + ' failed (' + lastErr + ') - retrying');
      }
    }
  };

  for (const b of branches) {
    try { pushBranch(b); }
    catch (e) { log('WARN ' + b + ' push skipped: ' + err1(e)); }
  }
} catch (e) { log(`WARN push skipped: ${e.message.split('\n')[0]}`); }
log('done.');

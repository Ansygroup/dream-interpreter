#!/usr/bin/env bash
# Ansy Group autonomous deploy — batches all 3 active projects in ONE run.
# GUARDS: checks Vercel 100/day quota before spending; verifies live after.
# Run: bash deploy-all.sh   (from anywhere; absolute repo paths)
set -u

REPOS="/c/Users/ansy0/ZCodeProject/projects/repos"
LOG="$REPOS/deploy-all.log"
ts() { date '+%Y-%m-%d %H:%M'; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

log "=== Ansy Group deploy run start ==="

# --- Quota guard: refuse if we already burned deploys today ---
# HISTORY (3 dead-guard generations, all fixed here):
#  1. `vercel ls` prints an AGE column ("10m"), never a date -> grepping the
#     table for YYYY-MM-DD always matched 0, so the guard never aborted.
#  2. Switched to `vercel ls --format=json` + parse `createdAt` (ms epoch).
#     `vercel ls` prints `status` to STDERR, so 2>/dev/null polling sees nothing.
#  3. The query MUST run from a dir with NO .vercel/project.json: a linked cwd
#     makes `vercel ls` return ONLY that project and silently ignore --scope,
#     under-counting the team-wide 100/day cap ~5x (saw 5 when truth was 25).
#  4. `--limit` is PER PAGE and saturates at 100. `if len(deps) >= 100: print(100)`
#     misread a SATURATED PAGE as an EXHAUSTED QUOTA: those 100 rows spanned 35
#     days (2026-08-29 -> today) while only 12 deploys were actually spent today.
#     Result: deploy-all.sh aborted (exit 2) on EVERY run with ~86 quota left.
# The counting now lives in scripts/vercel-quota.py, which pages forward until a
# page's OLDEST deployment predates today, and fails CLOSED (prints 100) on any
# error. Verified: real count 14 vs old false 100; fail-closed on bad scope AND
# on vercel-off-PATH; stable at --limit 50/100.
QUOTA_PY="$REPOS/dream-interpreter/scripts/vercel-quota.py"
# MSYS path (/c/Users/...) handed to NATIVE Windows python resolves to C:\c\Users\...
# and dies "can't open file", which fail-closed then reads as "quota exhausted".
# Normalize to a forward-slash native path before invoking python.
QUOTA_PY_WIN=$(printf '%s' "$QUOTA_PY" | sed -e 's|^/\([a-zA-Z]\)/|\1:/|')
DEPLOYS_TODAY=$(cd "$TMPDIR" 2>/dev/null || cd /; python "$QUOTA_PY_WIN" 2>>"$LOG" || echo 100)
[ -z "$DEPLOYS_TODAY" ] && DEPLOYS_TODAY=100
if [ "$DEPLOYS_TODAY" -gt 90 ] 2>/dev/null; then
  log "QUOTA WARNING: $DEPLOYS_TODAY deploys today. ABORTING to avoid 100/day lockout."
  exit 2
fi
log "Quota check OK (deploys today ~$DEPLOYS_TODAY / 100)"

deploy() {
  local repo="$1" name="$2" require_branch="${3:-}"
  log "[deploy] $name ($repo)"
  cd "$repo" || { log "MISSING repo $repo"; return 1; }
  # Production deploys must come from the canonical branch. dream-interpreter's
  # master is a SEPARATE WORKTREE (../dream-interpreter-feed); the main checkout
  # can sit on a feature branch, and deploying that would silently drop every
  # master-only commit (e.g. the live AI feed fix). Refuse instead of regressing.
  if [ -n "$require_branch" ] && [ -d .git ]; then
    local cur; cur="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
    if [ "$cur" != "$require_branch" ]; then
      log "$name: REFUSING — on branch '$cur', production expects '$require_branch'. Skipping (no deploy spent)."
      return 3
    fi
  fi
  # DRY_RUN=1 exercises the whole guard/branch path and spends ZERO deploys.
  # Use it to prove the release wiring before committing quota.
  if [ "${DRY_RUN:-0}" = "1" ]; then
    local dirty; dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    log "$name: DRY_RUN — branch OK, $dirty uncommitted file(s), 0 deploys spent."
    return 0
  fi
  if [ ! -d .git ] && [ ! -f vercel.json ]; then log "$name: not a project, skip"; return 0; fi
  # link if no .vercel/project.json
  if [ ! -f .vercel/project.json ]; then
    vercel link --yes --project "$name" 2>&1 | tail -1 | tee -a "$LOG" || log "$name: link skipped/failed (may already be linked)"
  fi
  # deploy (works whether linked or not)
  vercel --prod --yes 2>&1 | tail -3 | tee -a "$LOG" || {
    log "$name: first deploy attempt failed, retrying without link check"
    vercel --prod --yes 2>&1 | tail -3 | tee -a "$LOG"
  }
}

deploy "$REPOS/ansygroup.com"   "ansygroup.com"   ""      # domain not on Vercel DNS (SSL Error) - see report
# dream-interpreter: production is `master`, which lives in the SEPARATE WORKTREE
# ../dream-interpreter-feed. Point at that checkout, NOT the main one — the main
# checkout sits on a feature branch and would make the branch guard refuse
# (or, worse, ship the wrong tree).
deploy "$REPOS/dream-interpreter-feed" "dream-interpreter" "master"
deploy "$REPOS/ai-blog"               "ai-blog"          "main"

# --- IndexNow ping (only if INDEXNOW_KEY env is present) ---
ping_indexnow() {
  local key="${INDEXNOW_KEY:-}"
  [ -z "$key" ] && { log "INDEXNOW_KEY not set -> skip IndexNow ping (user withheld key)"; return 0; }
  log "[indexnow] pinging with key ${key:0:8}..."
  curl -s -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"host\":\"dream-interpreter-alpha-ruddy.vercel.app\",\"key\":\"$key\",\"keyLocation\":\"https://dream-interpreter-alpha-ruddy.vercel.app/$key.txt\",\"urlList\":[\"https://dream-interpreter-alpha-ruddy.vercel.app/sitemap.xml\"]}" \
    | tee -a "$LOG"
  log "[indexnow] done"
}

log "=== deploy run complete ==="

# --- Post-deploy verification (curl live) ---
log "=== VERIFY ==="
B="https://dream-interpreter-alpha-ruddy.vercel.app"
AB="https://ai-blog-ansygroups-projects.vercel.app"
curl -s -o /dev/null -w "dream-interpreter:%{http_code}\n" -L "$B" --max-time 20 | tee -a "$LOG"
curl -s -o /dev/null -w "ai-blog:%{http_code}\n" -L "$AB" --max-time 20 | tee -a "$LOG"
curl -s -L "$B" --max-time 20 | grep -o "ca-pub-4665838048081250" | head -1 | sed 's/^/di_adsense:/' | tee -a "$LOG"
curl -s -L "$B/seo/snake/ar" --max-time 20 | grep -o "Explore our network" | head -1 | sed 's/^/di_network:/' | tee -a "$LOG"
curl -s -L "$AB" --max-time 20 | grep -o "Dream Interpreter" | head -1 | sed 's/^/blog_link:/' | tee -a "$LOG"
log "=== VERIFY done ==="
ping_indexnow
log "USER ACTION: submit sitemap.xml in Bing Webmaster + GSC (already verified)."

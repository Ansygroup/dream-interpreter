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
# NOTE: `vercel ls` prints an AGE column ("10m", "3h"), NOT a date. Grepping the
# table for YYYY-MM-DD always matches 0, so the old guard was dead code and never
# aborted. Use the JSON API and parse createdAt (ms epoch) instead.
# CRITICAL: the query MUST run from a directory with no .vercel/project.json.
# A linked cwd makes `vercel ls` return ONLY that project and silently IGNORE
# --scope, under-counting the team-wide 100/day cap (saw 5 when the truth was 25).
# An unreadable/empty result is treated as EXHAUSTED, so the script fails closed.
DEPLOYS_TODAY=$(cd "$TMPDIR" 2>/dev/null || cd /; vercel ls --scope ansygroups-projects --format=json --limit 100 2>/dev/null | python -c "
import sys,json,datetime
raw=sys.stdin.read(); i=raw.find('{')
if i<0: print(100); raise SystemExit
try: d=json.loads(raw[i:])
except Exception: print(100); raise SystemExit
deps=d.get('deployments',d) if isinstance(d,dict) else d
if len(deps)>=100: print(100); raise SystemExit   # page full -> at/over cap
today=datetime.date.today()
print(sum(1 for x in deps if datetime.datetime.fromtimestamp(x['createdAt']/1000).date()==today))
" 2>/dev/null || echo 100)
[ -z "$DEPLOYS_TODAY" ] && DEPLOYS_TODAY=100
if [ "$DEPLOYS_TODAY" -gt 90 ] 2>/dev/null; then
  log "QUOTA WARNING: ~$DEPLOYS_TODAY deploys today. ABORTING to avoid 100/day lockout."
  exit 2
fi
log "Quota check OK (deploys today ~$DEPLOYS_TODAY)"

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
deploy "$REPOS/dream-interpreter" "dream-interpreter" "master"
deploy "$REPOS/ai-blog"          "ai-blog"          "main"

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

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

# --- Quota guard: refuse if we already burned deploys today (best-effort) ---
DEPLOYS_TODAY=$(vercel ls 2>/dev/null | grep -c "$(date '+%Y-%m-%d')" || echo 0)
if [ "$DEPLOYS_TODAY" -gt 90 ]; then
  log "QUOTA WARNING: ~$DEPLOYS_TODAY deploys today. ABORTING to avoid 100/day lockout."
  exit 2
fi
log "Quota check OK (deploys today ~$DEPLOYS_TODAY)"

deploy() {
  local repo="$1" name="$2"
  log "[deploy] $name ($repo)"
  cd "$repo" || { log "MISSING repo $repo"; return 1; }
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

deploy "$REPOS/ansygroup.com"   "ansygroup.com"
deploy "$REPOS/dream-interpreter" "dream-interpreter"
deploy "$REPOS/ai-blog"          "ai-blog"

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

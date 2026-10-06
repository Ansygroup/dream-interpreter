#!/usr/bin/env bash
# Ansy Group autonomous deploy — batches all 3 active projects in ONE run.
# GUARDS: checks Vercel 100/day quota before spending; verifies live after.
# Run: bash deploy-all.sh   (from anywhere; absolute repo paths)
set -u

REPOS="/c/Users/ansy0/ZCodeProject/projects/repos"
LOG="$REPOS/deploy-all.log"
LIVE_DI="https://dream-interpreter-alpha-ruddy.vercel.app"
LIVE_AB="https://ai-blog-ansygroups-projects.vercel.app"
ts() { date '+%Y-%m-%d %H:%M'; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }
# TMPDIR must exist and be writable: the pre-deploy parity gate writes its
# probe files (sitemap + seo-data.json) there. Resolve it ONCE, up front, so the
# gate can never silently write nowhere and read back an empty file.
[ -n "${TMPDIR:-}" ] && [ -d "$TMPDIR" ] && [ -w "$TMPDIR" ] || TMPDIR="$REPOS"
mkdir -p "$TMPDIR" 2>/dev/null

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
  # Use it to prove the release wiring before committing quota. NOTE: the parity
  # gate below runs BEFORE this early-return on purpose — a guard that is skipped
  # in dry-run cannot be proven, and this is exactly the inversion that made
  # master look safe. DRY_RUN costs no deploys but does spend two curl probes.
  if [ "${DRY_RUN:-0}" = "1" ] && [ "$name" != "dream-interpreter" ]; then
    local dirty; dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    log "$name: DRY_RUN — branch OK, $dirty uncommitted file(s), 0 deploys spent."
    return 0
  fi
  if [ ! -d .git ] && [ ! -f vercel.json ]; then log "$name: not a project, skip"; return 0; fi
  # PRE-DEPLOY LIVE PARITY GATE (2026-10-06). The branch guard above only says
  # "this checkout is the expected branch" — it cannot catch the branch being
  # wrong, i.e. production having been published from somewhere else entirely
  # (a worktree, a nightly pipeline, a second checkout). That inversion cost a
  # near-miss: master was "the expected branch" while prod actually served the
  # fix branch, and deploying would have deleted 13 published languages.
  # For dream-interpreter, compare the CONTENT FINGERPRINT (sitemap URL count +
  # published SEO language count), not just the git ref. Abort on regression.
  if [ "$name" = "dream-interpreter" ]; then
    local live_locs live_sitemap live_lang_i live_lang_fix
    live_sitemap="$TMPDIR/parity-sitemap.xml"
    curl -s -L --max-time 90 "$LIVE_DI/sitemap.xml" -o "$live_sitemap" 2>/dev/null
    live_locs=$(grep -c '<loc>' "$live_sitemap" 2>/dev/null | tr -d ' ')
    curl -s -L --max-time 30 "$LIVE_DI/api/seo-data.json" -o "$TMPDIR/parity-seo.json" 2>/dev/null
    live_lang_i=$(python -c "import json;print(len(json.load(open(r'$TMPDIR/parity-seo.json')).get('LANGS',{})))" 2>/dev/null || echo 0)
    live_lang_fix=$(python -c "import json;print(len(json.load(open('api/seo-data.json')).get('LANGS',{})))" 2>/dev/null || echo 0)
    log "$name: PARITY live[sitemap=${live_locs:-?} langs=${live_lang_i:-?}] checkout[langs=${live_lang_fix:-?}]"
    # Live must never serve MORE languages than this checkout can build, else
    # publishing deletes already-indexed URLs. Fail closed on an unreadable live.
    if [ -z "${live_lang_i:-}" ] || [ "${live_lang_i:-0}" = "0" ] || [ "${live_lang_fix:-0}" = "0" ]; then
      log "$name: REFUSING — parity probe could not read live/checkout langs (fail-closed). Skipping (no deploy spent)."
      return 4
    fi
    if [ "$live_lang_i" -gt "$live_lang_fix" ]; then
      log "$name: REFUSING — live serves $live_lang_i langs but this checkout only builds $live_lang_fix. Deploying would DELETE $((live_lang_i - live_lang_fix)) published language(s). Skipping (no deploy spent)."
      return 4
    fi
    # Parity holds. In DRY_RUN stop here (all guards proven, 0 deploys spent);
    # otherwise fall through to the real deploy.
    if [ "${DRY_RUN:-0}" = "1" ]; then
      local dirty; dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
      log "$name: DRY_RUN — branch + parity OK (live $live_lang_i langs <= checkout $live_lang_fix), $dirty uncommitted file(s), 0 deploys spent."
      return 0
    fi
  fi
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
# dream-interpreter: INVERTED 2026-10-06 — production is NOT master.
# Measured against live before deploying:
#   live /api/seo-data.json      LANGS=35, dream date=2026-10-06 ("rain")
#   main checkout (fix branch)   LANGS=35, dream date=2026-10-06 ("rain")  <-- prod
#   ../dream-interpreter-feed    LANGS=22, dream date=2026-10-05 ("moon")  <-- master
# The daily feed pipeline (gen-dream-today.mjs -> daily-feed.mjs -> vercel deploy)
# runs IN THE MAIN CHECKOUT, so master has been abandoned as the publish source
# and is now 93 commits BEHIND the branch production actually serves.
# Deploying master here would delete 13 published languages (bg fa he hr sr sl
# uk lv et cs hu ro km...) and revert the dream card by a day. Refuse instead.
deploy "$REPOS/dream-interpreter" "dream-interpreter" "fix/api-reasoning-leak"
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

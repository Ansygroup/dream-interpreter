# Ansy Group — Problems & Gaps Log (2026-08-29 → 08-30 session)

## LIVE STATUS (verified 2026-08-30 via curl)
- dream-interpreter-alpha-ruddy.vercel.app → **200** ✅
  - AdSense NEW `ca-pub-4665838048081250` ✅ (deployed)
  - batch4+5 symbols LIVE (doctor/ar, ambulance/ar → 200) → **26,573 pages deployed** ✅
  - "Explore our network" block present on SEO pages ✅
  - sitemap.xml / GSC / Bing verify → 200 ✅
- ai-blog-ansygroups-projects.vercel.app → **200** ✅
- ebook-store / ai-company-store → **200** ✅
- ansygroup.com → **503** ⚠️ (domain reserved, NO deployment yet — needs `vercel --prod` + DNS A 76.76.21.21)

## PROBLEMS FOUND & FIXED
| # | Problem | Root cause | Fix | Status |
|---|---------|-----------|-----|--------|
| 1 | `vercel.json` `.txt` route `\\\\.txt` broken regex | bad edit | `/([a-zA-Z0-9-]{8,128}\.txt)` | ✅ fixed+deployed |
| 2 | SEO audit "669 uncat" false alarm | nested FM in MDX | first-block regex + guard | ✅ fixed |
| 3 | `expand-thin.cjs` crash | same FM bug | `if (!m||!m[1])` guard | ✅ fixed |
| 4 | AdSense old client | not swapped | → `ca-pub-4665838048081250` (3 spots) | ✅ deployed |
| 5 | ai-blog 79 thin posts | thin content | expand→0 thin, avg 1213 | ✅ deployed |
| 6 | cross-links missing | no network | nav + server-rendered network block | ✅ deployed |
| 7 | `category: "AI News"` quotes | bad FM | `fix-category-quotes.cjs` | ✅ deployed |
| 8 | Vercel 100/day limit | wasted deploys | batched + curl-verify | ✅ RESOLVED (quota opened) |

## GAPS REMAINING
- [x] **ai-blog daily auto-publish** — cron `7ecf4205e099` runs 10:00 UTC daily, `--batch 15` + queue auto-refill + dup-cover guard. Rate: ~15 posts/day free.
- [x] **ai-blog duplicate covers** — were 50 posts sharing 1 image; fixed via `fix-duplicate-covers.cjs` (49 unique loremflickr images). 0 real duplicates. Committed `60c95ca`.
- [ ] **ansygroup.com hub** — BLOCKED: Vercel Authentication wall (project-level Deployment Protection). USER ACTION: Vercel console → project → Settings → Deployment Protection → OFF "Vercel Authentication" + Password Protection. Then `vercel --prod` serves it.
- [ ] **ansygroup.com DNS** — bind `ansygroup.com` → A `76.76.21.21` (USER action, Cloudflare/Vercel).
- [ ] **ai-blog video** — no VideoObject schema / no video gen yet. DEFERRED (post-priority). Option: local slideshow+TTS or YouTube embed schema. User said "تمام" to do after priorities.
- [ ] **IndexNow** — endpoint 500 (no key). If provided: set `INDEXNOW_KEY` env → `deploy-all.sh` auto-pings.
- [ ] **User action**: submit `sitemap.xml` in Bing Webmaster + GSC (verified already).
- [ ] **dream-interpreter batch6** — optional, target 30k+ pages

## AUTONOMOUS WORKFLOW (created this session)
- `deploy-all.sh` — batched deploy (ansygroup → dream-interpreter → ai-blog) with quota guard + post-deploy curl verify + gated IndexNow ping
- Cronjob `084d798d4270` `ansy-group-portfolio-deploy` — runs 05:00 UTC daily, self-completes when quota open
- Skill `ansygroup-deploy-playbook` — cross-project deploy playbook

## AUTONOMOUS RULES
- NEVER deploy just to verify a regex — curl the LIVE url.
- ALWAYS `find` for repo before `cd` (CWD moves between sessions).
- ALWAYS `git config user.email/name` after repo move.
- Write `.cjs` files, never inline `node -e` multi-line.
- Guard all FM regex with `if (!m || !m[1])`.
- Respect user's "don't pressure me" on keys — guide, don't demand.
- `projects/repos` is INSIDE `ZCodeProject` mega-repo (has `.dsh` deep tree) → NEVER `git add -A` there; commit per-file in sub-repos.

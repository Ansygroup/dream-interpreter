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
- [ ] **Deploy ansygroup.com hub** — BLOCKED: project `ansygroup.com` (and new `ansy-group-hub`) show "Login – Vercel" wall = Vercel Authentication/Password Protection ENABLED at project level. Agent cannot disable (no console access, no VERCEL_TOKEN). **USER ACTION**: Vercel console → project → Settings → Deployment Protection → turn OFF "Vercel Authentication" + any Password Protection. Then `vercel --prod` serves the static hub.
- [ ] **ansygroup.com DNS** — bind `ansygroup.com` → A `76.76.21.21` (USER action in Cloudflare/Vercel; agent cannot touch DNS)
- [ ] **IndexNow** — endpoint 500 (no key). If key provided: set `INDEXNOW_KEY` env → `deploy-all.sh` auto-pings. Respect user's decline.
- [ ] **User action**: submit `sitemap.xml` in Bing Webmaster + GSC (verified already)
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

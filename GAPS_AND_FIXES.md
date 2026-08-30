# Ansy Group — Problems & Gaps Log (2026-08-29 session)

## PROBLEMS FOUND & FIXED THIS SESSION
| # | Problem | Root cause | Fix | Status |
|---|---------|-----------|-----|--------|
| 1 | `vercel.json` `.txt` route had `\\\\.txt` (4 backslashes) — broken regex | bad edit/compaction | rewrote to `/([a-zA-Z0-9-]{8,128}\.txt)` | ✅ fixed, committed (not deployed) |
| 2 | SEO audit reported "669 uncat" — false alarm | nested `---` frontmatter inside MDX code blocks broke naive regex | anchor to first FM block `/^---\r?\n([\s\S]*?)\r?\n---\r?\n/` + guard | ✅ fixed in scripts |
| 3 | `expand-thin.cjs` crashed `Cannot read fm[1]` | same nested-FM regex bug | added `if (!m || !m[1])` guard | ✅ fixed |
| 4 | AdSense client still old `ca-pub-3423159322001021` | not swapped | replaced ALL 3 spots (index.html, api/seo.js, SEOPage.tsx) → `ca-pub-4665838048081250` | ✅ committed |
| 5 | ai-blog 79 posts <700 words | thin auto-generated content | `expand-thin.cjs` type-aware sections → 0 thin, avg 1213 | ✅ committed |
| 6 | cross-links missing between projects | no network | added mutual nav links + server-rendered "Explore our network" block | ✅ committed |
| 7 | `category: "AI News"` stray quotes | bad frontmatter | `fix-category-quotes.cjs` | ✅ committed |
| 8 | Hit Vercel 100 deploy/day limit | ~10 wasted redeploys | batched; verify via curl not deploy | ⚠️ pending quota reset |

## GAPS REMAINING (need deploy / user action)
- [ ] **Deploy ansygroup.com hub** — repo ready, needs `vercel link` + `vercel --prod` (new project or link to existing empty one)
- [ ] **Deploy dream-interpreter** — 26,573 pages + AdSense + links + network block + `.txt` route fix (ONE deploy, post-quota)
- [ ] **Deploy ai-blog** — cross-link Header + expanded content (ONE deploy)
- [ ] **IndexNow**: endpoint returns 500 (no key). User declined to provide key → respected. If provided later: set `INDEXNOW_KEY` env + run `scripts/postdeploy-indexnow.mjs`
- [ ] **User action (own browser)**: submit `sitemap.xml` in Bing Webmaster + GSC (GSC/Bing verified already)
- [ ] **dream-interpreter batch6**: optional, target 30k+ pages
- [ ] **ansygroup.com DNS**: currently `.vercel.app`; bind `ansygroup.com` domain when ready (Cloudflare/DNS A 76.76.21.21)

## STRUCTURAL GAPS (not blocking)
- AGENTS.md in ai-blog says "195 posts" — actual 669. Docs stale, trust live audit.
- ai-blog `no_excerpt` in frontmatter for many posts — but excerpts render via `excerpt:` field (YAML block). Verify render, don't blindly add.
- `vercel dev` unusable on host (needs yarn) — use build-output grep for local checks.

## AUTONOMOUS RULES (from this session)
- NEVER deploy just to verify a regex — curl the LIVE url.
- ALWAYS `find` for repo before `cd` (CWD moves between sessions).
- ALWAYS set `git config user.email/name` after repo move.
- Write `.cjs` files, never inline `node -e` multi-line.
- Guard all FM regex with `if (!m || !m[1])`.
- Respect user's "don't pressure me" on credentials/keys — guide, don't demand.

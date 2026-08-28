# Google Search Console — Submission Guide

Site: https://dream-interpreter-alpha-ruddy.vercel.app
Sitemap: https://dream-interpreter-alpha-ruddy.vercel.app/sitemap.xml
Pages indexed: 6,162 (+ homepage, interpret, history, saved)

## Steps (you do this — needs your Google account)
1. Go to https://search.google.com/search-console
2. Add property → "URL prefix" → paste `https://dream-interpreter-alpha-ruddy.vercel.app`
3. Verification: choose "HTML tag" → copy the `content="..."` value
4. Paste that value into `index.html` → replace `GSC_VERIFICATION_CODE_PLACEHOLDER`
5. Rebuild + redeploy (or tell Hermes to do it)
6. In GSC left menu → Sitemaps → paste `sitemap.xml` → Submit
7. Request indexing: Inspect any URL → "Request Indexing"

## Why this ranks
- 6,162 programmatic pages (13 symbols × 13 langs × 6 question-variants + base)
- Full hreflang alternates per language
- schema.org Article + FAQPage on every page
- Clean static HTML (fast, crawlable)
- Geo auto-language via /api/geo

## To reach 1M visits/month
- More symbols (50+ → ~15k pages)
- Backlinks: Reddit r/Dreams, Quora, Medium, Arabic forums
- Google Business Profile (if local)
- Social: TikTok/Instagram dream snippets → site
- Internal linking from ai-blog (ansygroup.com)

// One-off refactor: replace the static-HTML generation tail of seo-gen.mjs
// with on-demand data export (api/seo-data.json) + sitemap only.
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'scripts', 'seo-gen.mjs');
let src = fs.readFileSync(file, 'utf8');

const marker = 'const outDir = path.join(process.cwd(), \'dist\', \'seo\');';
const idx = src.indexOf(marker);
if (idx === -1) { console.error('marker not found'); process.exit(1); }

const head = src.slice(0, idx);

const tail = `// ---- Build-time output: data module for on-demand serverless rendering ----
const outDir = path.join(process.cwd(), 'dist');
fs.mkdirSync(outDir, { recursive: true });

// Write SEO data for the serverless function (api/seo.js) — single file, no per-page files
const dataJson = JSON.stringify({ BASE, LANGS, SYM, QUESTIONS, CSS });
fs.writeFileSync(path.join(process.cwd(), 'api', 'seo-data.json'), dataJson);

// Build sitemap URL list (on-demand pages, no static files needed)
const pages = [];
for (const sk of Object.keys(SYM)) {
  for (const lang of Object.keys(LANGS)) {
    if (!SYM[sk][lang]) continue;
    pages.push('/seo/' + sk + '/' + lang);
    for (const q of (QUESTIONS[lang] || [])) {
      const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-\$/g, '');
      pages.push('/seo/' + sk + '/' + lang + '/' + slug);
    }
  }
}
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
  '  <url><loc>' + BASE + '/</loc><lastmod>2024-12-01</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\\n' +
  pages.map((p) => '  <url><loc>' + BASE + p + '</loc><lastmod>2024-12-01</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>').join('\\n') +
  '\\n</urlset>';
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\\nAllow: /\\nSitemap: ' + BASE + '/sitemap.xml');

console.log('On-demand SEO mode: data module + sitemap generated');
console.log('Sitemap: ' + (pages.length + 1) + ' URLs');
`;

fs.writeFileSync(file, head + tail);
console.log('seo-gen.mjs refactored to on-demand mode');

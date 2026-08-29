// IndexNow bulk submit — pushes all SEO URLs to Bing/Google/Yandex instantly.
// Free, no daily crawl wait. Requires INDEXNOW_KEY (free at https://www.indexnow.org).
// Usage: INDEXNOW_KEY=xxxx node scripts/indexnow-submit.mjs
import fs from 'fs';
import https from 'https';
import path from 'path';

const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error('Set INDEXNOW_KEY env (free from https://www.indexnow.org)');
  process.exit(1);
}
const HOST = 'dream-interpreter-alpha-ruddy.vercel.app';
const BASE = 'https://' + HOST;

// Build the full SEO URL list from the data module (same source the sitemap uses)
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'api', 'seo-data.json'), 'utf8'));
const SYM = data.SYM;
const LANGS = Object.keys(data.LANGS);
const urls = [];
for (const sk of Object.keys(SYM)) {
  for (const lang of LANGS) {
    if (!SYM[sk][lang]) continue;
    urls.push(`${BASE}/seo/${sk}/${lang}`);
    if (data.SCENARIOS) {
      for (let i = 0; i < data.SCENARIOS.length; i++) urls.push(`${BASE}/seo/${sk}/${lang}/s${i + 1}`);
    }
  }
}

const payload = JSON.stringify({ host: HOST, key: KEY, urlList: urls });
const endpoints = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://search.mysite.com/indexnow'];

function post(ep) {
  return new Promise((res) => {
    const req = https.request(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => res({ ep, status: r.statusCode, body: b.slice(0, 80) }));
    });
    req.on('error', (e) => res({ ep, err: e.message }));
    req.write(payload);
    req.end();
  });
}

console.log(`Submitting ${urls.length} SEO URLs to IndexNow...`);
const results = await Promise.all(endpoints.map(post));
for (const r of results) console.log(JSON.stringify(r));

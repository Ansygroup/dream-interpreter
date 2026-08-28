// IndexNow bulk submit — pushes all sitemap URLs to Bing/Google/Yandex instantly.
// Free, no daily crawl wait. Requires INDEXNOW_KEY (get free at https://www.indexnow.org).
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
const sitemap = fs.readFileSync(path.join(process.cwd(), 'dist', 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes('/seo/'));

const payload = JSON.stringify({ host: HOST, key: KEY, urlList: urls });
const endpoints = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'];

function post(ep) {
  return new Promise((res) => {
    const req = https.request(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (r) => {
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

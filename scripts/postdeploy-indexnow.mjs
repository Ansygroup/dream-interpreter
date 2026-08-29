// Post-deploy IndexNow automation — call this after every `vercel --prod`.
// If INDEXNOW_KEY is set, it bulk-submits all SEO URLs (no manual step).
// If the key is absent, it exits silently (safe for cron/unattended runs).
import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';

const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.log('[indexnow] No INDEXNOW_KEY set — skipping (set it in Vercel env to auto-submit).');
  process.exit(0);
}

const HOST = 'dream-interpreter-alpha-ruddy.vercel.app';
const BASE = 'https://' + HOST;

// Verify the key file is live (IndexNow Option 1 ownership proof)
const keyUrl = `${BASE}/${KEY}.txt`;
https.get(keyUrl, (r) => {
  let b = '';
  r.on('data', (c) => (b += c));
  r.on('end', () => {
    if (r.statusCode !== 200 || b.trim() !== KEY) {
      console.error(`[indexnow] Key file check failed: ${keyUrl} -> ${r.statusCode} "${b.slice(0,40)}"`);
      process.exit(1);
    }
    pushUrls();
  });
}).on('error', (e) => { console.error('[indexnow] key file fetch error', e.message); process.exit(1); });

function pushUrls() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'api', 'seo-data.json'), 'utf8'));
  const urls = [];
  for (const sk of Object.keys(data.SYM)) {
    for (const lang of Object.keys(data.LANGS)) {
      if (!data.SYM[sk][lang]) continue;
      urls.push(`${BASE}/seo/${sk}/${lang}`);
      if (data.SCENARIOS) for (let i = 0; i < data.SCENARIOS.length; i++) urls.push(`${BASE}/seo/${sk}/${lang}/s${i + 1}`);
    }
  }
  const payload = JSON.stringify({ host: HOST, key: KEY, urlList: urls });
  const endpoints = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'];
  let done = 0;
  for (const ep of endpoints) {
    const req = https.request(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' } }, (r) => {
      console.log(`[indexnow] ${ep} -> ${r.statusCode}`);
      if (++done === endpoints.length) console.log(`[indexnow] Submitted ${urls.length} URLs.`);
    });
    req.on('error', (e) => console.error(`[indexnow] ${ep} err`, e.message));
    req.write(payload);
    req.end();
  }
}

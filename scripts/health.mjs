#!/usr/bin/env node
/**
 * health.mjs — one-shot health check of the live site.
 * Usage: npm run health  (BASE=https://... to override)
 */
const BASE = (process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app').replace(/\/$/, '');
const results = [];

async function check(name, fn) {
  try {
    const msg = await fn();
    results.push(`✓ ${name}${msg ? ` — ${msg}` : ''}`);
  } catch (e) {
    results.push(`✗ ${name} — ${e?.message || e}`);
    process.exitCode = 1;
  }
}

const get = (path) => fetch(BASE + path).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
});

await check('homepage', async () => {
  const r = await get('/');
  const html = await r.text();
  if (!html.includes('ds-theme')) throw new Error('theme bootstrap missing');
});

await check('SEO page (/seo/snake/ar)', () => get('/seo/snake/ar'));
await check('sitemap', async () => {
  const r = await get('/sitemap.xml');
  const xml = await r.text();
  const n = (xml.match(/<url>/g) || []).length;
  return `${n} URLs`;
});
await check('dream of the day', async () => {
  const r = await get('/dream-today.json');
  const d = await r.json();
  if (!d.date) throw new Error('empty');
  return d.date;
});
await check('interpret API (free AI)', async () => {
  const res = await fetch(BASE + '/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dream: 'I dreamed of a quiet garden', language: 'en', perspective: 'general' }),
  });
  const d = await res.json();
  if (!d.interpretation) throw new Error('no interpretation');
  return `engine: ${d.engine}`;
});
await check('symbols count', async () => {
  const r = await get('/symbols');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
});

console.log(`\nDreamscope health — ${BASE}\n` + results.join('\n'));

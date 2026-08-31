#!/usr/bin/env node
/**
 * setup-supabase.mjs — one-command Supabase project bootstrap for Dreamscope.
 *
 * CREATES a new Supabase project, runs the schema (profiles/dreams/feedback + RLS),
 * and prints the URL + anon key you paste into /profile (Connect your Supabase project).
 *
 * SECURITY: reads SUPABASE_ACCESS_TOKEN from the environment ONLY — never hardcodes it,
 * never prints it back. Run it yourself with your token:
 *   SUPABASE_ACCESS_TOKEN=eyJ... node scripts/setup-supabase.mjs
 *
 * Google OAuth still requires a GOOGLE_CLIENT_ID/SECRET (see enable-google.mjs) — this
 * script only provisions the project + DB + keys.
 */
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('SUPABASE_ACCESS_TOKEN not set. Run: SUPABASE_ACCESS_TOKEN=xxx node scripts/setup-supabase.mjs'); process.exit(1); }

const api = (method, urlPath, body) => new Promise((res, rej) => {
  const data = body ? JSON.stringify(body) : null;
  const rq = https.request(`https://api.supabase.com/v1${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
  }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res({ code: r.statusCode, json: b ? JSON.parse(b) : null }); } catch { res({ code: r.statusCode, json: null }); } }); });
  rq.on('error', rej); if (data) rq.write(data); rq.end();
});

const orgId = process.env.SUPABASE_ORG_ID || '';
const dbPass = process.env.SUPABASE_DB_PASSWORD || Math.random().toString(36).slice(2, 18) + 'Aa1!';

(async () => {
  console.log('[setup] creating Supabase project…');
  const proj = await api('POST', '/projects', {
    name: 'dreamscope',
    organization_id: orgId,
    db_pass: dbPass,
    region: 'us-east-1',
  });
  if (proj.code !== 200 && proj.code !== 201) { console.error('[setup] create failed:', proj.code, JSON.stringify(proj.json)); process.exit(1); }
  const p = proj.json;
  console.log(`[setup] project created: ${p.id} (${p.name})`);
  console.log(`[setup] DB password (SAVE THIS): ${dbPass}`);

  // wait for project to be ready (poll)
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const st = await api('GET', `/projects/${p.id}`);
    if (st.json && st.json.status === 'ACTIVE_HEALTHY') { ready = true; break; }
    await new Promise((r) => setTimeout(r, 4000));
  }
  if (!ready) { console.error('[setup] project not ready in time — check dashboard.'); process.exit(1); }

  // run schema
  const schema = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
  // Supabase Management API doesn't run SQL directly; use the psql-less approach via /database/query
  const q = await api('POST', `/projects/${p.id}/database/query`, { query: schema });
  if (q.code !== 200 && q.code !== 201) console.error('[setup] schema run returned:', q.code, JSON.stringify(q.json));
  else console.log('[setup] schema applied (profiles / dreams / feedback + RLS).');

  // fetch anon key via project API keys
  const keys = await api('GET', `/projects/${p.id}/api-keys`);
  const anon = keys.json?.find((k) => k.name === 'anon' || k.tags?.includes?.('anon')) || keys.json?.[0];
  console.log('\n=== DREAMSCOPE SUPABASE CREDENTIALS ===');
  console.log(`URL:   ${p.supabase_url}`);
  console.log(`ANON:  ${anon?.api_key || '(see dashboard: Settings → API → anon public)'}`);
  console.log('\nPaste these into /profile → Connect your Supabase project. Then enable Google in');
  console.log('Supabase dashboard: Authentication → Providers → Google (needs Google Cloud OAuth).');
})();

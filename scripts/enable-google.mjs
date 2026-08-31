#!/usr/bin/env node
/**
 * enable-google.mjs — activate Google OAuth on a Supabase project (Dreamscope).
 *
 * PREREQUISITES (you do these in Google Cloud Console):
 *   1. https://console.cloud.google.com/apis/credentials → Create OAuth client ID
 *      - Application type: Web application
 *      - Authorized redirect URIs: https://<ref>.supabase.co/auth/v1/callback
 *   2. You get a GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.
 *
 * Then run (token + google creds from env, never hardcoded):
 *   SUPABASE_ACCESS_TOKEN=eyJ... GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com GOOGLE_CLIENT_SECRET=xxx \
 *     node scripts/enable-google.mjs --project <project-id-or-ref>
 *
 * Sets the provider + a sane redirectTo so /profile login works after connect.
 */
import https from 'node:https';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const GID = process.env.GOOGLE_CLIENT_ID;
const GSEC = process.env.GOOGLE_CLIENT_SECRET;
const args = process.argv.slice(2);
const projIdx = args.indexOf('--project');
const PROJECT = projIdx >= 0 ? args[projIdx + 1] : process.env.SUPABASE_PROJECT_REF;
if (!TOKEN) { console.error('SUPABASE_ACCESS_TOKEN not set.'); process.exit(1); }
if (!GID || !GSEC) { console.error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set.'); process.exit(1); }
if (!PROJECT) { console.error('pass --project <ref> or set SUPABASE_PROJECT_REF.'); process.exit(1); }

const api = (method, urlPath, body) => new Promise((res) => {
  const data = body ? JSON.stringify(body) : null;
  const rq = https.request(`https://api.supabase.com/v1${urlPath}`, {
    method, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
  }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res({ code: r.statusCode, json: b ? JSON.parse(b) : null }); } catch { res({ code: r.statusCode, json: null }); } }); });
  rq.on('error', (e) => res({ code: 0, json: { error: e.message } })); if (data) rq.write(data); rq.end();
});

(async () => {
  console.log(`[google] enabling Google provider on ${PROJECT}…`);
  const r = await api('PUT', `/projects/${PROJECT}/config/auth/providers/google`, {
    enabled: true,
    client_id: GID,
    client_secret: GSEC,
    redirect_to: '',
  });
  if (r.code === 200 || r.code === 204) console.log('[google] ✅ Google provider enabled. Login button works after you connect the project in /profile.');
  else { console.error('[google] failed:', r.code, JSON.stringify(r.json)); process.exit(1); }
})();

#!/usr/bin/env node
/**
 * force-deploy.mjs — force a production deploy to activate newly-set Vercel env vars
 * (e.g. VITE_SUPABASE_URL / ANON_KEY). Unlike vercel-auto-deploy.mjs, this does NOT skip
 * when the feature set is already live — env changes require a real redeploy to propagate.
 *
 * Quota-safe: if blocked, exits 0 and retries next cron tick. Idempotent: writes a marker
 * on success so it won't redeploy again (saving quota).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const MARKER = path.join(root, '.deploy-env-sha');

const sh = (cmd, t) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };

console.log(`[force-deploy] ${new Date().toISOString()}`);
if (fs.existsSync(MARKER)) { console.log('[force-deploy] already deployed for env change — nothing to do.'); process.exit(0); }

const out = sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
if (/api-deployments-free-per-day/.test(out)) { console.log('[force-deploy] QUOTA BLOCKED — will retry next tick.'); process.exit(0); }
if (!/https?:\/\/\S+\.vercel\.app/.test(out)) { console.log('[force-deploy] deploy did not return a URL:\n' + out.slice(0, 300)); process.exit(0); }
fs.writeFileSync(MARKER, new Date().toISOString());
console.log('[force-deploy] ✅ deployed — Vercel env vars (Supabase) now active.');

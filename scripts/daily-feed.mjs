#!/usr/bin/env node
/**
 * daily-feed.mjs — self-completing daily "Dream of the day" publisher.
 *   1. generate public/dream-today.json (gen-dream-today.mjs)
 *   2. commit + push to origin/master
 *   3. vercel deploy --prod (quota-safe: exits cleanly if blocked)
 *   4. verify the live file matches today's date
 * Runs on a daily cron. Idempotent: if the live file is already today's, skip deploy.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = process.env.API_BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const OUT = path.join(root, 'public', 'dream-today.json');
const today = new Date().toISOString().slice(0, 10);

const sh = (cmd, t) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
const getJson = (u) => new Promise((res) => {
  https.get(u, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch { res(null); } }); }).on('error', () => res(null));
});

console.log(`[daily-feed] ${new Date().toISOString()}`);
// Already live for today?
const live = await getJson(`${BASE}/dream-today.json`);
if (live && live.date === today) { console.log('[daily-feed] live already has today\'s dream — nothing to do.'); process.exit(0); }

// 1. generate
sh('node scripts/gen-dream-today.mjs', 120000);
if (!fs.existsSync(OUT)) { console.error('[daily-feed] generation failed.'); process.exit(1); }
const local = JSON.parse(fs.readFileSync(OUT, 'utf8'));
if (local.date !== today) { console.error('[daily-feed] generated date mismatch.'); process.exit(1); }

// 2. commit + push
sh('git add public/dream-today.json');
sh('git -c user.email="ansy@ansygroup.com" -c user.name="Hermes" commit -q -m "chore: dream of the day — ' + local.symbol.en + ' (' + today + ')"');
sh('git push origin master', 60000);

// 3. deploy (quota-safe)
const out = sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
if (/api-deployments-free-per-day/.test(out)) { console.log('[daily-feed] QUOTA BLOCKED — will retry next tick.'); process.exit(0); }

// 4. verify
const verify = await getJson(`${BASE}/dream-today.json`);
if (verify && verify.date === today) console.log(`[daily-feed] VERIFIED — live dream of the day: ${local.symbol.en}`);
else console.log('[daily-feed] deployed but live not yet updated — will retry next tick.');

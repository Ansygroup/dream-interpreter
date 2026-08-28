// Generates branded OG images (SVG) for SEO symbol pages -> public/og/<sym>.svg
// Lightweight, no deps. Vercel serves SVG as image; social cards render the brand.
import fs from 'fs';
import path from 'path';
import { EXTRA_SYMBOLS } from './symbols-extra.mjs';
import { BATCH2_SYMBOLS } from './symbols-batch2.mjs';
import { SYM } from './seo-gen-data.mjs';

const outDir = path.join(process.cwd(), 'public', 'og');
fs.mkdirSync(outDir, { recursive: true });

const W = 1200, H = 630;
function svg(sym, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#0f1a14"/>
      <stop offset="100%" stop-color="#070a08"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="960" cy="120" r="220" fill="none" stroke="#34d399" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="960" cy="120" r="150" fill="none" stroke="#34d399" stroke-opacity="0.28" stroke-width="2"/>
  <text x="80" y="120" fill="#34d399" font-family="ui-monospace,monospace" font-size="22" letter-spacing="4">DREAMSCOPE</text>
  <text x="80" y="320" fill="#ffffff" font-family="Georgia,serif" font-size="78" font-weight="700">${label}</text>
  <text x="80" y="400" fill="#b6bfb8" font-family="-apple-system,sans-serif" font-size="34">Free AI Dream Interpretation</text>
  <text x="80" y="560" fill="#7e8a82" font-family="-apple-system,sans-serif" font-size="26">Ibn Sirin tradition · 36 languages · Private on device</text>
</svg>`;
}

let n = 0;
for (const sk of Object.keys(SYM)) {
  const label = sk.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  fs.writeFileSync(path.join(outDir, sk + '.svg'), svg(sk, label));
  n++;
}
console.log('Generated ' + n + ' OG images');

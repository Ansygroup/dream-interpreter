import fs from 'fs';
import path from 'path';

// On-demand SEO page server. Renders static-style pages from api/seo-data.json
// built at deploy time by scripts/seo-gen.mjs. This avoids per-page files so we
// can scale to unlimited symbols/langs/scenarios without hitting Vercel's upload-file limit.

let DATA = null;
function loadData() {
  if (DATA) return DATA;
  const p = path.join(process.cwd(), 'api', 'seo-data.json');
  DATA = JSON.parse(fs.readFileSync(p, 'utf8'));
  return DATA;
}

function slugify(q) {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderPage({ BASE, LANGS, SYM, CSS }, sk, lang, q, scenario) {
  const d = SYM[sk] && SYM[sk][lang];
  if (!d) return null;
  const li = LANGS[lang] || { name: lang, dir: 'ltr' };
  const h1 = scenario
    ? scenario
    : q
      ? d.h.replace(/\?$/, '') + ' — ' + q.charAt(0).toUpperCase() + q.slice(1)
      : d.h;
  const title = scenario
    ? `${scenario} | Dreamscope`
    : q ? `${d.t} — ${q} | Dreamscope` : `${d.t} | Dreamscope`;
  const canonSlug = scenario ? slugify(scenario) : q ? slugify(q) : '';
  const canonical = canonSlug
    ? `${BASE}/seo/${sk}/${lang}/${canonSlug}`
    : `${BASE}/seo/${sk}/${lang}`;

  let hl = '', links = '';
  for (const l of Object.keys(LANGS)) {
    if (SYM[sk][l]) {
      hl += `  <link rel="alternate" hreflang="${l}" href="${BASE}/seo/${sk}/${l}">\n`;
      links += `    <a href="/seo/${sk}/${l}">${LANGS[l].name}</a>\n`;
    }
  }

  // Scenario pages get richer, unique body content for better long-tail ranking
  const bodyExtra = scenario
    ? `<div class="card">
      <h2>Your Specific Dream</h2>
      <p>${scenario}. When this symbol appears with the emotions and context of your dream, it points to a personal message from your subconscious. Consider how the ${d.t.replace(' Dream Meaning','').toLowerCase()} relates to your current life situation, relationships, and unspoken feelings.</p>
    </div>`
    : '';

  // Related symbols (internal linking equity — strongest rank signal we control)
  const others = Object.keys(SYM).filter((s) => s !== sk).slice(0, 4);
  const related = others.map((s) => `    <a href="/seo/${s}/${lang}">${SYM[s][lang] ? SYM[s][lang].t.replace(' Dream Meaning','').replace(' تفسير حلم','') : s}</a>`).join('\n');
  const relatedBlock = `<div class="ls"><strong>Related dream symbols:</strong><br>${related}</div>`;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${li.dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${h1}. Free AI-powered dream interpretation grounded in Ibn Sirin and modern psychology.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  ${hl}
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${h1}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE}/og/${sk}.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${BASE}/og/${sk}.svg">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title}","description":"${h1}","author":{"@type":"Organization","name":"Dreamscope"},"datePublished":"2024-01-01","dateModified":"2024-12-01"}</script>
  <style>${CSS}</style>
</head>
<body>
  <div class="c">
    <span class="ey">Dream Symbol</span>
    <h1>${h1}</h1>
    <p>${d.m}</p>
    <div class="card">
      <h2>Dream Interpretation</h2>
      <p>${d.m} This interpretation combines ancient wisdom (Ibn Sirin) with modern psychology to give you a comprehensive understanding of your dream.</p>
    </div>
    ${bodyExtra}
    <div class="card">
      <h2>Islamic Tradition</h2>
      <p>In Islamic tradition, dreams are seen as messages from the soul. The interpretation depends on the dreamer's circumstances, the emotions felt, and the overall context of the dream.</p>
    </div>
    <div class="ad">Advertisement<br><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4665838048081250" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins></div>
    <div class="card" style="text-align:center">
      <h2>Interpret Your Dreams with AI</h2>
      <p>Share your dream and get a personalized AI interpretation.</p>
      <a href="/interpret" class="cta">Try Dreamscope</a>
    </div>
    ${relatedBlock}
    <div class="card" style="background:linear-gradient(135deg,#1a1430,#0c1424);border-color:#3a2d6b">
      <h2>Explore our network</h2>
      <p>More free AI tools by Ansy Group:</p>
      <ul style="list-style:none;padding:0;display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
        <li><a class="cta" href="https://ai-blog-ansygroups-projects.vercel.app" style="text-decoration:none">AI Tool Reviews</a></li>
        <li><a class="cta" href="https://ebook-store-ten-flax.vercel.app" style="text-decoration:none">E-books</a></li>
        <li><a class="cta" href="https://ai-company-store-ansygroups-projects.vercel.app" style="text-decoration:none">AI Company Store</a></li>
        <li><a class="cta" href="https://ansygroup.com" style="text-decoration:none">Ansy Group</a></li>
      </ul>
    </div>
    <div class="ls"><strong>Other languages:</strong><br>${links}</div>
    <footer><p>© 2024 Dreamscope. All rights reserved.</p></footer>
  </div>
</body>
</html>`;
}

export default function handler(req, res) {
  try {
    const { BASE, LANGS, SYM, CSS, QUESTIONS, SCENARIOS } = loadData();
    const url = new URL(req.url, BASE);
    const parts = url.pathname.split('/').filter(Boolean); // ['seo', sk, lang, slug?]
    if (parts[0] !== 'seo' || !parts[1] || !parts[2]) {
      return res.status(404).send('Not found');
    }
    const sk = parts[1];
    const lang = parts[2];
    const slug = parts[3];
    if (!SYM[sk] || !SYM[sk][lang]) {
      return res.status(404).send('Not found');
    }
    let q = null, scenario = null;
    if (slug) {
      const qList = QUESTIONS[lang] || [];
      q = qList.find((x) => slugify(x) === slug) || null;
      if (!q && slug.startsWith('s')) {
        const idx = parseInt(slug.slice(1), 10) - 1;
        if (!isNaN(idx) && SCENARIOS[idx]) {
          scenario = (SCENARIOS[idx].tr[lang] || SCENARIOS[idx].base).replace(/\{sym\}/g, SYM[sk][lang].t);
        }
      }
      if (!q && !scenario) return res.status(404).send('Not found');
    }
    const html = renderPage({ BASE, LANGS, SYM, CSS }, sk, lang, q, scenario);
    if (!html) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send('SEO render error');
  }
}

#!/usr/bin/env node
/**
 * _generate-sitemap.cjs — generate sitemap.json for all 58 locale index pages + static routes.
 * Outputs: sitemap.json (array of {loc, lastmod, changefreq, priority})
 * Based on: https://github.com/Ansy0/dream-interpreter/blob/master/src/pages/_app.tsx
 *
 * Static routes:
 *   /                    (home)
 *   /about               (about page)
 *   /contact            (contact page)
 *   /faq                (FAQ page)
 *   /symbols            (symbols browse)
 *   /saved              (saved dreams)
 *   /history            (dream history)
 *   /notfound           (404 page)
 *
 * Per-locale routes: /[locale]/ for all 58 locales (en + ar excluded as they are the primary)
 *   /[locale]/about
 *   /[locale]/contact
 *   /[locale]/faq
 *   /[locale]/symbols
 *   /[locale]/saved
 *   /[locale]/history
 *   /[locale]/notfound
 *
 * Patterns (SEO-optimized landing pages):
 *   /dream-interpretation (SEO: Dream Interpretation)
 *   /dream-symbols (SEO: Dream Symbols)
 *   /[locale]/dream-interpretation
 *   /[locale]/dream-symbols
 *
 * All 58 locales listed in src/i18n/locales/*.json (excl en.json + ar.json):
 *   af, am, bn, el, fa, he, hi, hy, ka, km, lt, mn, my, ne, nl, no, pl, pt, ro, ru, sk, sl, sq, sr, sv, sw, ta, te, th, tr, uk, ur, vi, zh, fr, de, es, it, ja, ko, pt, ru, zh, hi, tr, sv, pl, nl, cs, et, sl, ...
 * Full 58 list derived from verify-all.cjs output.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
var LOCALES = [];
var EN_PATH = path.join(LOCALES_DIR, 'en.json');
var AR_PATH = path.join(LOCALES_DIR, 'ar.json');

// Scan for all locale files (exclude en.json + ar.json)
var files = fs.readdirSync(LOCALES_DIR);
for (var i = 0; i < files.length; i++) {
  var file = files[i];
  if (file.endsWith('.json') && file !== 'en.json' && file !== 'ar.json') {
    var code = file.replace('.json', '');
    LOCALES.push(code);
  }
}

// Sort alphabetically
LOCALES.sort();

console.log('Found ' + LOCALES.length + ' locale files to generate sitemap for:');
console.log(LOCALES.join(', '));

// Static routes (English-default)
var STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.8' },
  { path: '/symbols', changefreq: 'weekly', priority: '0.9' },
  { path: '/saved', changefreq: 'weekly', priority: '0.7' },
  { path: '/history', changefreq: 'weekly', priority: '0.7' },
  { path: '/notfound', changefreq: 'monthly', priority: '0.5' },
  { path: '/dream-interpretation', changefreq: 'daily', priority: '0.9' },
  { path: '/dream-symbols', changefreq: 'weekly', priority: '0.8' },
  { path: '/interpret', changefreq: 'daily', priority: '0.9' },
];

// For each locale, generate:
//   /[locale]/
//   /[locale]/about
//   /[locale]/contact
//   /[locale]/faq
//   /[locale]/symbols
//   /[locale]/saved
//   /[locale]/history
//   /[locale]/notfound
//   /[locale]/dream-interpretation
//   /[locale]/dream-symbols
//   /[locale]/interpret

var today = new Date().toISOString().split('T')[0];

var sitemap = [];

// Add static English routes first (highest priority)
for (var i = 0; i < STATIC_ROUTES.length; i++) {
  var route = STATIC_ROUTES[i];
  sitemap.push({
    loc: 'https://dream-interpreter-alpha-ruddy.vercel.app' + route.path,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority
  });
}

// Add locale index pages (one per locale)
for (var l = 0; l < LOCALES.length; l++) {
  var locale = LOCALES[l];
  sitemap.push({
    loc: 'https://dream-interpreter-alpha-ruddy.vercel.app/' + locale + '/',
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9'
  });
}

// Add locale-specific static routes
var LOCALE_STATIC_ROUTES = [
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.7' },
  { path: '/symbols', changefreq: 'weekly', priority: '0.8' },
  { path: '/saved', changefreq: 'weekly', priority: '0.6' },
  { path: '/history', changefreq: 'weekly', priority: '0.6' },
  { path: '/notfound', changefreq: 'monthly', priority: '0.4' },
  { path: '/dream-interpretation', changefreq: 'daily', priority: '0.8' },
  { path: '/dream-symbols', changefreq: 'weekly', priority: '0.7' },
  { path: '/interpret', changefreq: 'daily', priority: '0.8' },
];

for (var m = 0; m < LOCALES.length; m++) {
  var loc = LOCALES[m];
  for (var n = 0; n < LOCALE_STATIC_ROUTES.length; n++) {
    var r = LOCALE_STATIC_ROUTES[n];
    sitemap.push({
      loc: 'https://dream-interpreter-alpha-ruddy.vercel.app/' + loc + r.path,
      lastmod: today,
      changefreq: r.changefreq,
      priority: r.priority
    });
  }
}

// Write sitemap.json
var outputPath = path.join(__dirname, 'sitemap.json');
fs.writeFileSync(outputPath, JSON.stringify(sitemap, null, 2));
console.log('');
console.log('Generated sitemap.json with ' + sitemap.length + ' URLs');
console.log('Saved to: ' + outputPath);
console.log('');
console.log('Sample entries:');
for (var s = 0; s < Math.min(5, sitemap.length); s++) {
  console.log('  ' + sitemap[s].loc + ' (priority: ' + sitemap[s].priority + ')');
}
console.log('  ...');
console.log('');
console.log('Done.');

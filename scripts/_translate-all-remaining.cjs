#!/usr/bin/env node
/**
 * _translate-all-remaining.cjs — batch-translate ALL same-as-EN keys across ALL locales.
 * Scans every locale file, finds same-as-EN keys (excl. identity tokens),
 * sends them in one /api/translate call per locale, writes results back.
 *
 * Usage: node scripts/_translate-all-remaining.cjs
 */
'use strict';
var fs = require('fs');
var path = require('path');
var https = require('https');

var LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
var EN_PATH = path.join(LOCALES_DIR, 'en.json');
var BASE_URL = 'https://dream-interpreter-alpha-ruddy.vercel.app';

// ─── Load EN source ───
var EN;
try {
  EN = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
} catch(e) {
  console.error('Fatal: cannot load en.json: ' + e.message);
  process.exit(1);
}

// Build flat EN for comparison
function flattenObj(obj, prefix) {
  prefix = prefix || '';
  var out = {};
  for (var key in obj) {
    var full = prefix ? prefix + '.' + key : key;
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      var nested = flattenObj(obj[key], full);
      for (var k in nested) out[k] = nested[k];
    } else {
      out[full] = obj[key];
    }
  }
  return out;
}

var EN_FLAT = flattenObj(EN);

function isIdentityToken(v) {
  if (typeof v !== 'string') return false;
  return v === '—' ||
    v.indexOf('{year}') !== -1 ||
    v.indexOf('{version}') !== -1 ||
    v.indexOf('SUPABASE_ACCESS_TOKEN') === 0 ||
    v.indexOf('npm ') === 0 ||
    v.length <= 2;
}

// ─── Find same-as-EN keys (nested-aware) ───
function analyzeLocale(locData) {
  var flatLoc = flattenObj(locData);
  var same = [];
  var missing = [];
  var real = 0;
  var identity = 0;

  for (var k in EN_FLAT) {
    var ev = EN_FLAT[k];
    var lv = flatLoc[k];

    if (lv === undefined) {
      missing.push(k);
      continue;
    }
    if (isIdentityToken(ev)) {
      identity++;
      continue;
    }
    if (lv === ev) {
      same.push({ path: k, value: ev });
    } else {
      real++;
    }
  }

  return { same: same, missing: missing, real: real, identity: identity };
}

// ─── Build partial source from same-keys list ───
function buildPartial(sameKeys) {
  var src = {};
  for (var i = 0; i < sameKeys.length; i++) {
    var item = sameKeys[i];
    var parts = item.path.split('.');
    var cur = src;
    for (var j = 0; j < parts.length - 1; j++) {
      var p = parts[j];
      if (cur[p] === undefined || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
        cur[p] = {};
      }
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = item.value;
  }
  return src;
}

// ─── Deep merge translated result into target ───
function mergeDeep(target, src) {
  for (var key in src) {
    if (src[key] === undefined) continue;
    if (typeof src[key] === 'object' && src[key] !== null && !Array.isArray(src[key])) {
      if (target[key] === undefined || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      mergeDeep(target[key], src[key]);
    } else {
      target[key] = src[key];
    }
  }
}

// ─── Process one locale ───
function processLocale(locale) {
  return new Promise(function(resolve) {
    console.log('=== ' + locale + ' ===');

    var locPath = path.join(LOCALES_DIR, locale + '.json');
    if (!fs.existsSync(locPath)) {
      console.log('  ✗ File missing');
      resolve({ locale: locale, translated: 0, failed: 0, elapsed: 0, status: 'file missing' });
      return;
    }

    var locData = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    var fileSize = fs.statSync(locPath).size;

    var analysis = analyzeLocale(locData);

    if (analysis.same.length === 0 && analysis.missing.length === 0) {
      console.log('  ✓ Already complete (' + analysis.real + ' real, ' + analysis.identity + ' identity)');
      resolve({ locale: locale, translated: 0, failed: 0, elapsed: 0, status: 'already complete' });
      return;
    }

    console.log('  ' + analysis.real + ' real + ' + analysis.same.length + ' same-as-EN + ' +
      analysis.identity + ' identity + ' + analysis.missing.length + ' missing');
    console.log('  File size: ' + fileSize + ' bytes');

    if (analysis.same.length > 0) {
      console.log('  Translating ' + analysis.same.length + ' same-as-EN keys...');
      for (var i = 0; i < analysis.same.length; i++) {
        console.log('    - ' + analysis.same[i].path);
      }
    }

    if (analysis.same.length === 0) {
      // Only missing keys remain — nothing to translate here
      console.log('  ✓ Only missing keys remain — nothing to translate via batch');
      resolve({ locale: locale, translated: 0, failed: 0, elapsed: 0, status: 'no same-as-EN, only missing' });
      return;
    }

    var t0 = Date.now();

    // Build partial source
    var partialSrc = buildPartial(analysis.same);
    var body = JSON.stringify({ code: locale, source: partialSrc });

    console.log('  Sending ' + body.length + ' bytes to /api/translate...');

    var req = https.request({
      hostname: 'dream-interpreter-alpha-ruddy.vercel.app',
      port: 443,
      path: '/api/translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json'
      },
      timeout: 60000
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        var elapsed = ((Date.now() - t0) / 1000).toFixed(1);

        try {
          var j = JSON.parse(data);

          if (j && j.translated) {
            // Merge translated result
            mergeDeep(locData, j.translated);

            // Write to disk
            fs.writeFileSync(locPath, JSON.stringify(locData, null, 2), 'utf8');

            // Verify
            var afterAnalysis = analyzeLocale(locData);
            console.log('  ✓ Translated ' + j.translated + ' keys in ' + elapsed + 's');
            console.log('  After: ' + afterAnalysis.real + ' real + ' + afterAnalysis.same.length + ' same-as-EN + ' +
              afterAnalysis.identity + ' identity + ' + afterAnalysis.missing.length + ' missing');

            if (afterAnalysis.same.length === 0 && afterAnalysis.missing.length === 0) {
              console.log('  ✓✓✓ ' + locale + '.json COMPLETE!');
              resolve({ locale: locale, translated: analysis.same.length, failed: 0, elapsed: elapsed, status: 'complete' });
            } else {
              console.log('  ⚠ ' + afterAnalysis.same.length + ' keys still same-as-EN, ' + afterAnalysis.missing.length + ' missing');
              resolve({ locale: locale, translated: analysis.same.length - afterAnalysis.same.length - afterAnalysis.missing.length, failed: afterAnalysis.same.length + afterAnalysis.missing.length, elapsed: elapsed, status: afterAnalysis.same.length + ' same-as-EN remaining' });
            }
          } else if (j && j.error) {
            console.log('  ✗ API error: ' + j.error);
            resolve({ locale: locale, translated: 0, failed: analysis.same.length, elapsed: elapsed, status: 'API error: ' + j.error });
          } else {
            console.log('  ✗ Unexpected response: ' + data.slice(0, 500));
            resolve({ locale: locale, translated: 0, failed: analysis.same.length, elapsed: elapsed, status: 'unexpected response' });
          }
        } catch(e) {
          console.log('  ✗ Parse error: ' + e.message);
          console.log('  Raw: ' + data.slice(0, 300));
          resolve({ locale: locale, translated: 0, failed: analysis.same.length, elapsed: elapsed, status: 'parse error' });
        }
      });
    });

    req.on('error', function(e) {
      console.log('  ✗ Network error: ' + e.message);
      resolve({ locale: locale, translated: 0, failed: analysis.same.length, elapsed: 0, status: 'network error: ' + e.message });
    });

    req.on('timeout', function() {
      req.destroy();
      console.log('  ✗ Timeout after 60s');
      resolve({ locale: locale, translated: 0, failed: analysis.same.length, elapsed: 60, status: 'timeout' });
    });

    req.write(body);
    req.end();
  });
}

// ─── Main ───
console.log('═══════════════════════════════════════════════════════════');
console.log('  Dreamscope — Translate ALL Remaining Same-as-EN Keys');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Scan all locales
var allLocales = fs.readdirSync(LOCALES_DIR)
  .filter(function(f) { return f.endsWith('.json') && f !== 'en.json'; })
  .map(function(f) { return f.replace('.json', ''); })
  .sort();

console.log('Found ' + allLocales.length + ' locale files to check');
console.log('');

// Process all locales sequentially
var results = [];
var totalTranslated = 0;
var totalFailed = 0;
var idx = 0;

function processNext() {
  if (idx >= allLocales.length) {
    // Done — print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Locale files processed: ' + results.length);
    console.log('Total keys translated: ' + totalTranslated);
    console.log('Total keys failed: ' + totalFailed);
    console.log('');

    var allComplete = true;
    var completeCount = 0;
    var incompleteList = [];

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.status === 'complete') {
        completeCount++;
      } else {
        allComplete = false;
        incompleteList.push(r.locale + ': ' + r.status);
      }
    }

    console.log('Complete: ' + completeCount + '/' + results.length);
    console.log('');

    if (incompleteList.length > 0) {
      console.log('Incomplete locales (' + incompleteList.length + '):');
      for (var i = 0; i < incompleteList.length; i++) {
        console.log('  - ' + incompleteList[i]);
      }
    }

    console.log('');
    if (allComplete) {
      console.log('✓✓✓ ALL LOCALES COMPLETE ✓✓✓');
    } else {
      console.log('⚠ ' + incompleteList.length + ' LOCALES STILL INCOMPLETE');
    }
    console.log('═══════════════════════════════════════════════════════════');

    process.exit(allComplete ? 0 : 1);
    return;
  }

  var locale = allLocales[idx];
  idx++;
  console.log('');
  console.log('─── ' + locale + ' (' + idx + '/' + allLocales.length + ') ───');
  console.log('');

  processLocale(locale).then(function(result) {
    results.push(result);
    if (result.translated) totalTranslated += result.translated;
    if (result.failed) totalFailed += result.failed;
    // Small delay before next locale to reduce API pressure
    setTimeout(processNext, 300);
  }).catch(function(e) {
    console.log('  ✗ Fatal error processing ' + locale + ': ' + e.message);
    results.push({ locale: locale, translated: 0, failed: 1, elapsed: 0, status: 'fatal: ' + e.message });
    setTimeout(processNext, 300);
  });
}

processNext();

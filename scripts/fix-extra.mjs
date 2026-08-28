import fs from 'fs';
let s = fs.readFileSync('scripts/symbols-extra.mjs', 'utf8');
// Replace every double-backslash-quote with single-backslash-quote
s = s.split('\\\\' + "'").join('\\' + "'");
fs.writeFileSync('scripts/symbols-extra.mjs', s);
console.log('fixed apostrophes');

const fs = require('fs');
const files = ['api/interpret.js', 'api/translate.js'];
const bad = 'Authorization: *** ${key}`';
const good = 'Authorization: `Bearer ${key}`';
for (const f of files) {
  const p = require('path').resolve(__dirname, '..', f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes(bad)) {
    console.log(`${f}: not present (already fixed or differs)`);
    continue;
  }
  s = s.split(bad).join(good);
  fs.writeFileSync(p, s);
  console.log(`${f}: fixed ->`, s.includes(good) ? 'Bearer present' : 'STILL BAD');
}

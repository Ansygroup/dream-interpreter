const fs = require('fs');
const files = ['api/interpret.js', 'api/translate.js'];
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  // Replace the corrupted header token: `Authorization: *** ${key}`` (+ stray backticks)
  // with the correct: `Authorization: `Bearer ${key}``
  s = s.replace(/Authorization:\s*\*\*\*\s*\$\{key\}\`+/g, 'Authorization: `Bearer ${key}`');
  if (s !== before) {
    fs.writeFileSync(f, s);
    console.log(f, '-> FIXED');
  } else {
    console.log(f, '-> no match (already correct or pattern differs)');
    // diagnostic: show the Authorization line
    const m = s.match(/Authorization:[^\n]*/);
    console.log('   found:', JSON.stringify(m && m[0]));
  }
}

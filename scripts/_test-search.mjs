// Real functional test of the symbol search logic (mirrors Symbols.tsx matches()).
import { SYMBOL_NAMES } from '../src/symbol-names.ts';
import { SYMBOL_LIST } from '../src/symbols-list.ts';

function matches(slug, q) {
  if (!q) return true;
  const query = q.trim().toLowerCase();
  if (slug.includes(query)) return true;
  const names = SYMBOL_NAMES[slug];
  if (!names) return false;
  if (names.en.toLowerCase().includes(query)) return true;
  if (names.ar.includes(q.trim())) return true;
  if (names.ar.toLowerCase().includes(query)) return true;
  if (names.aliases?.some((a) => a.toLowerCase().includes(query))) return true;
  return false;
}

function search(q) { return SYMBOL_LIST.filter((s) => matches(s, q)); }

const tests = [
  ['مفتاح', ['key']],          // the reported bug: Arabic must find key
  ['key', ['key']],            // English still works
  ['schlange', ['snake']],     // German alias -> snake
  ['ثعبان', ['snake']],        // Arabic name -> snake
  ['water', ['water', 'water_drink', 'water_flood']],
  ['xyzzy', []],               // no match
];

let pass = 0, fail = 0;
for (const [q, expected] of tests) {
  const got = search(q);
  const ok = expected.length === 0 ? got.length === 0 : got.includes(expected[0]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${q}" -> [${got.join(', ')}]`);
  ok ? pass++ : fail++;
}
console.log(`\nSEARCH TESTS: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

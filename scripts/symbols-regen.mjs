#!/usr/bin/env node
/**
 * symbols-regen.mjs — regenerate src/symbols-list.ts from api/seo-data.json
 * so the Symbols page always matches the real SEO symbol index.
 * (Replaces the earlier python one-liner; no python needed.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const data = JSON.parse(readFileSync(join(root, 'api', 'seo-data.json'), 'utf8'));
const keys = Object.keys(data.SYM ?? {}).sort();

const out =
  '// Auto-generated from api/seo-data.json by `npm run symbols:regen` — do not edit by hand.\n' +
  'export const SYMBOL_LIST: string[] = [\n' +
  keys.map((k) => `  '${k}',`).join('\n') +
  '\n];\n';

writeFileSync(join(root, 'src', 'symbols-list.ts'), out, 'utf8');
console.log(`✓ symbols-list.ts regenerated: ${keys.length} symbols`);

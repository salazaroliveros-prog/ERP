#!/usr/bin/env node
/**
 * Valida firebase.json contra el schema oficial de firebase-tools.
 * Uso: node scripts/validate-firebase-config.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const Ajv = require('ajv');
const schema = require(resolve(root, 'node_modules/firebase-tools/schema/firebase-config.json'));

const ajv = new Ajv({ strict: false, allErrors: true });
const validate = ajv.compile(schema);

const file = resolve(root, 'firebase.json');
const raw = readFileSync(file, 'utf8');
let cfg;
try {
  cfg = JSON.parse(raw);
} catch (e) {
  console.error('firebase.json NO es JSON valido:', e.message);
  process.exit(1);
}

const ok = validate(cfg);
console.log('firebase.json:', file);
console.log('schema valid :', ok);
if (!ok) {
  for (const err of validate.errors ?? []) {
    console.log(`  - ${err.instancePath || '/'} ${err.message}${err.params && Object.keys(err.params).length ? ' ' + JSON.stringify(err.params) : ''}`);
  }
  process.exit(1);
}

const fs = cfg.firestore;
const list = Array.isArray(fs) ? fs : [fs];
for (const entry of list) {
  console.log('  database :', entry.database ?? '(default)');
  console.log('  rules    :', entry.rules ?? '(none)');
  console.log('  edition  :', entry.edition ?? '(default STANDARD)');
  console.log('  access   :', entry.dataAccessMode ?? '(unset)');
}
console.log('OK');

#!/usr/bin/env node
// Validate this repository's data file, and optionally an open-data entry
// metadata file (the YAML submitted to a data directory).
//
//   node validate-entry.mjs                          # data file only
//   node validate-entry.mjs path/to/Entry-Name.yml   # data file + entry metadata
//
// Node 18+, no dependencies. Exits non-zero on the first problem it finds.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(ROOT, 'data/cost-index.json');

// The full figureKind vocabulary. A record whose kind is not here is a defect:
// a consumer filtering on a known kind would silently miss it.
const KINDS = [
  'whole_job_range',
  'annual_running_cost',
  'hourly_wage',
  'single_average',
  'scope_banded',
  'state_average_spread',
  'supplier_spread',
  'combined_benchmarks',
  'unit_price',
  'non_dollar',
];

// Present and non-empty on every record.
const REQUIRED_STRINGS = [
  'url', 'title', 'category', 'query', 'figureKind',
  'source_name', 'updated', 'license', 'license_url', 'attribution',
];

const fail = (msg) => {
  console.error('FAIL: ' + msg);
  process.exit(1);
};

const records = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
if (!Array.isArray(records)) fail('data/cost-index.json is not a JSON array');
if (records.length === 0) fail('data/cost-index.json is empty');

const kinds = new Map();
let nullLow = 0, nullHigh = 0, nullFigure = 0, nullSourceDate = 0, figureNoLow = 0;
const categories = new Set(), sources = new Set();

records.forEach((r, i) => {
  const where = 'record ' + i + ' (' + (r.url || 'no url') + ')';

  for (const f of REQUIRED_STRINGS) {
    if (typeof r[f] !== 'string' || !r[f].trim()) fail(where + ': missing ' + f);
  }
  if (!r.url.startsWith('https://')) fail(where + ': url is not https://');
  if (!KINDS.includes(r.figureKind)) fail(where + ': unknown figureKind ' + r.figureKind);
  if (r.license !== 'CC BY 4.0') fail(where + ': license is ' + r.license);

  for (const f of ['low', 'high']) {
    if (r[f] !== null && !Number.isFinite(r[f])) fail(where + ': ' + f + ' is neither null nor a number');
  }
  if (r.low !== null && r.high !== null && r.low > r.high) fail(where + ': low > high');

  if (r.figure === null) nullFigure++;
  if (r.low === null) nullLow++;
  if (r.high === null) nullHigh++;
  if (r.source_date === null || r.source_date === undefined) nullSourceDate++;
  if (r.figure !== null && r.low === null) figureNoLow++;

  kinds.set(r.figureKind, (kinds.get(r.figureKind) || 0) + 1);
  categories.add(r.category);
  sources.add(r.source_name);
});

const sum = [...kinds.values()].reduce((a, b) => a + b, 0);
if (sum !== records.length) fail('figureKind counts sum to ' + sum + ', not ' + records.length);

console.log('records          :', records.length);
console.log('categories       :', categories.size);
console.log('distinct sources :', sources.size);
console.log('nulls            : figure ' + nullFigure + ', low ' + nullLow + ', high ' + nullHigh +
  ', currency ' + records.filter((r) => r.currency === null).length +
  ', source_date ' + nullSourceDate);
console.log('figure but no low:', figureNoLow);
for (const k of KINDS) console.log('  ' + k.padEnd(22) + (kinds.get(k) || 0));

const entryPath = process.argv[2];
if (entryPath) {
  const yml = readFileSync(resolve(entryPath), 'utf8');

  // The entry file is a flat YAML mapping. Only the scalar keys we assert on are
  // read here, so no YAML parser (and no dependency) is needed.
  const scalar = (key) => {
    const m = yml.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  const description = (() => {
    const m = yml.match(/^description:\s*(?:>-?|\|)\s*\n((?:[ \t]+.*\n?)+)/m);
    if (!m) return scalar('description');
    return m[1].split('\n').map((l) => l.trim()).join(' ');
  })();

  console.log('entry file       :', entryPath);
  for (const key of ['title', 'homepage', 'category', 'description']) {
    const v = key === 'description' ? description : scalar(key);
    if (!v) fail('entry file: missing ' + key);
  }
  if (scalar('category') !== 'Economics') fail('entry file: category is ' + scalar('category'));
  if (scalar('homepage') !== 'https://github.com/Desmond711/searchright-cost-index') {
    fail('entry file: homepage is ' + scalar('homepage'));
  }

  // The description states the record count in prose. It must match the file.
  const stated = description.match(/(\d+)\s+sourced/);
  if (!stated) fail('entry file: description does not state a record count');
  if (Number(stated[1]) !== records.length) {
    fail('entry file: description says ' + stated[1] + ' records, file has ' + records.length);
  }
  console.log('entry title      :', scalar('title'));
  console.log('entry category   :', scalar('category'));
  console.log('entry states     :', stated[1], 'records (matches file)');
}

console.log('VALIDATION PASS');

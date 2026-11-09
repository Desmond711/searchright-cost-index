#!/usr/bin/env node
/**
 * check-readme-counts.mjs — fail the repo if the docs disagree with the data.
 *
 * The dataset's whole value is that a number cannot be used for a claim it does not
 * support. The same rule has to apply to the README: every count it prints is a claim
 * about data/cost-index.json, so every count is checked against data/cost-index.json.
 *
 * Nothing here is hand-typed as "expected". Each expected value is recomputed from the
 * file. If the data is reclassified (a record moves out of whole_job_range, a new figure
 * kind appears), this script fails until the prose is updated to match — which is the
 * point.
 *
 * Usage:  node scripts/check-readme-counts.mjs
 * Exit:   0 = docs agree with data, 1 = mismatch(es) listed on stdout.
 *
 * No dependencies. Node 18+.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---------------------------------------------------------------- the data

const records = JSON.parse(read('data/cost-index.json'));
if (!Array.isArray(records)) {
  console.error('data/cost-index.json is not a JSON array');
  process.exit(1);
}

const kindCounts = {};
for (const r of records) kindCounts[r.figureKind] = (kindCounts[r.figureKind] || 0) + 1;

const isNull = (v) => v === null || v === undefined;

const actual = {
  records: records.length,
  categories: new Set(records.map((r) => r.category)).size,
  sources: new Set(records.map((r) => r.source_name)).size,
  noSourceDate: records.filter((r) => isNull(r.source_date)).length,
  figureNoLow: records.filter((r) => !isNull(r.figure) && isNull(r.low)).length,
  kinds: kindCounts,
  nulls: {
    figure: records.filter((r) => isNull(r.figure)).length,
    low: records.filter((r) => isNull(r.low)).length,
    high: records.filter((r) => isNull(r.high)).length,
    currency: records.filter((r) => isNull(r.currency)).length,
    source_date: records.filter((r) => isNull(r.source_date)).length,
  },
};

// Years actually present in source_date, for the "range from A to B" sentence.
const years = records
  .map((r) => (r.source_date == null ? '' : String(r.source_date).slice(0, 4)))
  .filter((y) => /^\d{4}$/.test(y))
  .map(Number);
actual.firstYear = Math.min(...years);
actual.lastYear = Math.max(...years);

// ---------------------------------------------------------------- the prose

/** Collapse all whitespace so a sentence wrapped across lines still matches. */
const norm = (t) => t.replace(/\s+/g, ' ');

const docs = {
  'README.md': norm(read('README.md')),
  'CITATION.cff': norm(read('CITATION.cff')),
  'SCHEMA.md': norm(read('SCHEMA.md')),
};

/** Pull group `g` out of the first match of `re` in `doc`. NaN-free: null if absent. */
function grab(doc, re, g = 1) {
  const m = docs[doc].match(re);
  return m ? Number(m[g]) : null;
}

/**
 * Flat list of assertions. `found: null` means the sentence asserting the number could
 * not be located at all — also a failure, because a check that silently passes when its
 * subject disappears is not a check.
 */
const failures = [];
const push = (doc, what, found, expected) => {
  if (found !== expected) failures.push({ doc, what, found, expected });
};

// --- README.md -------------------------------------------------------------
push('README.md', 'intro "N records across M trades" — records',
  grab('README.md', /(\d+) records across (\d+) trades/, 1), actual.records);
push('README.md', 'intro "N records across M trades" — trades',
  grab('README.md', /(\d+) records across (\d+) trades/, 2), actual.categories);

push('README.md', 'file listing "data/cost-index.json   N records"',
  grab('README.md', /data\/cost-index\.json (\d+) records/), actual.records);

push('README.md', 'limits "N records is not N comparable prices"',
  grab('README.md', /(\d+) records is not \d+ comparable prices/), actual.records);
push('README.md', 'limits "N of them carry no dollar figure"',
  grab('README.md', /(\d+) of them carry no dollar figure/), actual.kinds.non_dollar);
push('README.md', 'limits "only N are whole-job ranges"',
  grab('README.md', /only (\d+) are whole-job ranges/), actual.kinds.whole_job_range);

push('README.md', 'provenance "N distinct named sources"',
  grab('README.md', /(\d+) distinct named sources/), actual.sources);
push('README.md', 'provenance "source dates range from N to M" — first year',
  grab('README.md', /source dates in this release range from (\d{4}) to (\d{4})/i, 1), actual.firstYear);
push('README.md', 'provenance "source dates range from N to M" — last year',
  grab('README.md', /source dates in this release range from (\d{4}) to (\d{4})/i, 2), actual.lastYear);

push('README.md', 'limits "N records have no source_date"',
  grab('README.md', /(\d+) records have no `source_date`/), actual.noSourceDate);

push('README.md', 'bibtex note "N sourced ... records"',
  grab('README.md', /note = \{(\d+) sourced U\.S\. household-service cost records/), actual.records);

// --- CITATION.cff ----------------------------------------------------------
push('CITATION.cff', 'abstract "N sourced ... records"',
  grab('CITATION.cff', /(\d+) sourced U\.S\. household-service cost records/), actual.records);
push('CITATION.cff', 'abstract "across N trades"',
  grab('CITATION.cff', /cost records across (\d+) trades/), actual.categories);
push('CITATION.cff', 'abstract "N records are whole-job low-high ranges"',
  grab('CITATION.cff', /(\d+) records are whole-job low-high ranges/), actual.kinds.whole_job_range);

// --- SCHEMA.md -------------------------------------------------------------
push('SCHEMA.md', 'intro "array of N objects"',
  grab('SCHEMA.md', /array\*{0,2} of (\d+) objects/), actual.records);
push('SCHEMA.md', 'category "N distinct values"',
  grab('SCHEMA.md', /(\d+) distinct values/), actual.categories);
push('SCHEMA.md', '"low/high are null on N records that carry a figure"',
  grab('SCHEMA.md', /`?low`?\/`?high`? are null on (\d+) records/), actual.figureNoLow);

// --- null counts in SCHEMA.md's field table --------------------------------
// Row shape: | `field` | type | nulls | meaning |
for (const [field, expected] of Object.entries(actual.nulls)) {
  const re = new RegExp('\\| `' + field + '` \\| [a-z]+ \\| (\\d+) \\|');
  push('SCHEMA.md', 'field table null count for `' + field + '`', grab('SCHEMA.md', re), expected);
}

// --- figureKind count tables (README.md and SCHEMA.md) ---------------------
// Row shape: | `kind` | count | description |
for (const doc of ['README.md', 'SCHEMA.md']) {
  const rows = new Map();
  for (const m of docs[doc].matchAll(/\| `([a-z_]+)` \| (\d+) \|/g)) rows.set(m[1], Number(m[2]));

  for (const [kind, count] of Object.entries(actual.kinds)) {
    if (!rows.has(kind)) {
      failures.push({
        doc,
        what: 'figureKind table is missing a row for `' + kind + '` (it is in the data)',
        found: null,
        expected: count,
      });
    } else {
      push(doc, 'figureKind table row `' + kind + '`', rows.get(kind), count);
    }
  }
  for (const kind of rows.keys()) {
    if (!(kind in actual.kinds)) {
      failures.push({
        doc,
        what: 'figureKind table has a row for `' + kind + '`, which is not in the data',
        found: rows.get(kind),
        expected: null,
      });
    }
  }
}

// --- every kind in the data is named somewhere in the README ---------------
// Adding a figure kind without describing it is how the two refused-kinds paragraph
// went missing in the first place.
for (const kind of Object.keys(actual.kinds)) {
  if (!docs['README.md'].includes('`' + kind + '`')) {
    failures.push({
      doc: 'README.md',
      what: 'figure kind `' + kind + '` is never named in the README',
      found: null,
      expected: 'named',
    });
  }
}

// ---------------------------------------------------------------- report

const summary = Object.entries(actual.kinds)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([k, v]) => k + '=' + v)
  .join(' ');

console.log('data/cost-index.json: ' + actual.records + ' records, ' +
  actual.categories + ' categories, ' + actual.sources + ' sources');
console.log('figure kinds: ' + summary);
console.log('source_date null: ' + actual.noSourceDate +
  ' | figure null: ' + actual.nulls.figure +
  ' | low/high null: ' + actual.nulls.low + '/' + actual.nulls.high +
  ' | currency null: ' + actual.nulls.currency);
console.log('');

if (failures.length) {
  console.error('FAIL — ' + failures.length + ' documented count(s) disagree with the data:\n');
  for (const f of failures) {
    console.error('  ' + f.doc + ': ' + f.what);
    console.error('      says ' + (f.found === null ? '(nothing found)' : f.found) +
      ', data says ' + (f.expected === null ? '(no such value)' : f.expected));
  }
  console.error('\nUpdate the prose to match data/cost-index.json — never the other way round.');
  process.exit(1);
}

console.log('PASS — every count asserted in README.md, CITATION.cff and SCHEMA.md matches the data.');

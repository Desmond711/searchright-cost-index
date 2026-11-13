# Search Right Home Service Cost Index

A machine-readable index of sourced U.S. household-service costs: **115 records across 22
trades**, each carrying the figure, the publisher it came from, that publisher's own date,
and the licence.

The point of this dataset is not the numbers on their own — it is that **every record says
what kind of figure it is**, so a number cannot be used for a claim it does not support.

```
data/cost-index.json   115 records, one JSON array
SCHEMA.md              every field, and what each figure kind means
LICENSE                CC BY 4.0
CITATION.cff           how to cite it
scripts/check-readme-counts.mjs   fails if the docs disagree with the data
package.json           npm run check runs it
```

Download directly — no login, no sign-up, no API key:

```bash
curl -O https://raw.githubusercontent.com/Desmond711/searchright-cost-index/main/data/cost-index.json
```

## Why figure kinds

The same trade can be published as a whole-job range, a worker's hourly wage, an annual
running cost, a single average, a per-unit rate, a range whose ends are different sizes or
distances, a spread across state averages, a spread across competing suppliers, or two
publishers' benchmarks on one spread. Those are not interchangeable, and a dataset that
flattens them into one "price" column invites exactly the error it should prevent — a wage
compared against a job price, or a spread of state averages read as a national range.

So each record declares its kind:

| figureKind | count | what it is |
|---|---:|---|
| `whole_job_range` | 12 | one publisher's low–high for the job as a whole |
| `annual_running_cost` | 48 | a yearly cost, not a job price |
| `hourly_wage` | 10 | a worker's wage, not a price for the work |
| `single_average` | 6 | one average, no range |
| `unit_price` | 2 | a per-unit rate, not a whole-job range |
| `scope_banded` | 4 | the range's ends are different jobs — different distances, sizes, or a state row against a national table |
| `state_average_spread` | 1 | low–high **across state averages**, not a quote range |
| `supplier_spread` | 1 | the spread across competing suppliers for one identical job |
| `combined_benchmarks` | 1 | two publishers' figures on one spread — not one range |
| `non_dollar` | 30 | the record carries no dollar figure at all |

Only `whole_job_range` supports the statement "this job typically runs between $A and $B".

Three kinds are published as figures and **deliberately refused** as verdicts. A
`scope_banded` range has ends that are different jobs — a short move against a cross-country
move, a state's row against the national table — so its low end is not a cheap quote for your
job, it is a different job. A `supplier_spread` measures the
spread across competing suppliers for one identical job, so it describes supplier variation,
not job variation. A `combined_benchmarks` figure sets two publishers' numbers on one spread,
and the two describe different specifications. All three are here because the underlying
figure is real and sourced; none of them can be used to say a quote is inside a range. A
record whose kind is not `whole_job_range` cannot produce a verdict, however large its
numbers.

## Shape of a record

```json
{
  "url": "https://www.searchright.io/guides/deck-building-cost",
  "title": "Deck building cost: footings and framing before the decking",
  "category": "decks",
  "query": "deck building cost",
  "figure": "$9,000–$20,000",
  "low": 9000,
  "high": 20000,
  "currency": "USD",
  "figureKind": "whole_job_range",
  "source_name": "Fixr build-deck cost page, updated 11 January 2023",
  "source_date": "2023-01-11",
  "updated": "2026-11-08",
  "license": "CC BY 4.0",
  "license_url": "https://creativecommons.org/licenses/by/4.0/",
  "attribution": "Search Right — https://www.searchright.io"
}
```

Full field list in [SCHEMA.md](SCHEMA.md).

## Provenance

59 distinct named sources, including BLS Occupational Employment and Wage Statistics
(May 2025), Fixr, and the Remodeling Cost vs. Value Report. Each record names its own source
and that source's date; the dataset does not re-date anything to the export date. Source
dates in this release range from 2022 to 2026.

## Limits — read these before using it

- **U.S. only.** No non-U.S. coverage.
- **115 records is not 115 comparable prices.** 30 of them carry no dollar figure, and only
  12 are whole-job ranges. Filter on `figureKind` before you aggregate.
- **Not a panel.** This is a snapshot of what publishers said on their own dates, not a time
  series. Do not compute inflation or trends from it.
- **Not a random sample.** Trades were included because a publisher printed a figure for
  them, which biases the set toward trades with commercial cost-guide coverage.
- **Third-party figures keep their own terms.** CC BY 4.0 covers this dataset's structure and
  the compilation. A figure attributed to Fixr, BLS or Cost vs. Value remains theirs; check
  the record's `source_name` before republishing a number in a commercial product.
- **6 records have no `source_date`.** The field is null there rather than guessed.

## Human-readable view

The same data, with each record's scope and sourcing note spelled out in prose, is at
<https://www.searchright.io/data>.

## Keeping these numbers true

Every count in this README, in `CITATION.cff` and in `SCHEMA.md` is a claim about
`data/cost-index.json`, so every one of them is checked against that file:

```bash
npm run check          # or: node scripts/check-readme-counts.mjs
```

It recomputes the record total, each `figureKind` count, the category and source counts, the
null counts and the source-date span from the data, and exits non-zero listing every
disagreement. Nothing in it is typed in twice: the expected values come from the file, not
from the prose. If a record is reclassified out of `whole_job_range`, this check fails until
the docs stop claiming it.

## Citation

```bibtex
@dataset{searchright_cost_index_2026,
  title  = {Search Right Home Service Cost Index},
  author = {{Search Right}},
  year   = {2026},
  note   = {115 sourced U.S. household-service cost records, CC BY 4.0},
  url    = {https://github.com/Desmond711/searchright-cost-index}
}
```

## Licence

[CC BY 4.0](LICENSE) — use it, including commercially, with attribution to
"Search Right — https://www.searchright.io".

# Search Right Home Service Cost Index

A machine-readable index of sourced U.S. household-service costs: **113 records across 22
trades**, each carrying the figure, the publisher it came from, that publisher's own date,
and the licence.

The point of this dataset is not the numbers on their own — it is that **every record says
what kind of figure it is**, so a number cannot be used for a claim it does not support.

```
data/cost-index.json   113 records, one JSON array
SCHEMA.md              every field, and what each figure kind means
LICENSE                CC BY 4.0
CITATION.cff           how to cite it
```

Download directly — no login, no sign-up, no API key:

```bash
curl -O https://raw.githubusercontent.com/<GITHUB-USER>/searchright-cost-index/main/data/cost-index.json
```

## Why figure kinds

The same trade can be published as a whole-job range, a worker's hourly wage, an annual
running cost, a single average, a per-unit rate, or a spread across state averages. Those are
not interchangeable, and a dataset that flattens them into one "price" column invites exactly
the error it should prevent — a wage compared against a job price, or a spread of state
averages read as a national range.

So each record declares its kind:

| figureKind | count | what it is |
|---|---:|---|
| `whole_job_range` | 12 | one publisher's low–high for the job as a whole |
| `annual_running_cost` | 48 | a yearly cost, not a job price |
| `hourly_wage` | 10 | a worker's wage, not a price for the work |
| `single_average` | 6 | one average, no range |
| `state_average_spread` | 2 | low–high **across state averages**, not a quote range |
| `combined_benchmarks` | 1 | two publishers' figures on one spread — not one range |
| `unit_price` | 1 | a per-unit rate, not a whole-job range |
| `non_dollar` | 33 | the record carries no dollar figure at all |

Only `whole_job_range` supports the statement "this job typically runs between $A and $B".

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

56 distinct named sources, including BLS Occupational Employment and Wage Statistics
(May 2025), Fixr, and the Remodeling Cost vs. Value Report. Each record names its own source
and that source's date; the dataset does not re-date anything to the export date. Source
dates in this release range from 2022 to 2026.

## Limits — read these before using it

- **U.S. only.** No non-U.S. coverage.
- **113 records is not 113 comparable prices.** 33 of them carry no dollar figure, and only
  12 are whole-job ranges. Filter on `figureKind` before you aggregate.
- **Not a panel.** This is a snapshot of what publishers said on their own dates, not a time
  series. Do not compute inflation or trends from it.
- **Not a random sample.** Trades were included because a publisher printed a figure for
  them, which biases the set toward trades with commercial cost-guide coverage.
- **Third-party figures keep their own terms.** CC BY 4.0 covers this dataset's structure and
  the compilation. A figure attributed to Fixr, BLS or Cost vs. Value remains theirs; check
  the record's `source_name` before republishing a number in a commercial product.
- **7 records have no `source_date`.** The field is null there rather than guessed.

## Human-readable view

The same data, with each record's scope and sourcing note spelled out in prose, is at
<https://www.searchright.io/data>.

## Citation

```bibtex
@dataset{searchright_cost_index_2026,
  title  = {Search Right Home Service Cost Index},
  author = {{Search Right}},
  year   = {2026},
  note   = {113 sourced U.S. household-service cost records, CC BY 4.0},
  url    = {https://github.com/<GITHUB-USER>/searchright-cost-index}
}
```

## Licence

[CC BY 4.0](LICENSE) — use it, including commercially, with attribution to
"Search Right — https://www.searchright.io".

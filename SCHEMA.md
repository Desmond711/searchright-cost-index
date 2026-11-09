# Schema — Search Right Home Service Cost Index

One file, `data/cost-index.json`, containing a JSON **array** of 114 objects. No wrapper
object, no pagination, no nesting.

## Fields

| field | type | nulls | meaning |
|---|---|---:|---|
| `url` | string | 0 | The page this record was compiled from. Absolute, `https://`. |
| `title` | string | 0 | That page's title. |
| `category` | string | 0 | Trade slug, e.g. `roofing`, `hvac`, `moving`. 22 distinct values. |
| `query` | string | 0 | The search phrasing the page targets, e.g. `deck building cost`. |
| `figure` | string | 26 | The figure **as the publisher printed it**, including currency symbol, en dash and unit — e.g. `"$9,000–$20,000"`, `"$26.64/hr"`. Null when the page carries no dollar figure. |
| `low` | number | 31 | Lower bound parsed to a number in USD, unformatted. Null when no numeric bound exists. |
| `high` | number | 31 | Upper bound, same rules. Null when no numeric bound exists. |
| `currency` | string | 28 | `"USD"`. Null where no money figure is present. |
| `figureKind` | string | 0 | **The most important field.** See below. |
| `source_name` | string | 0 | The publisher of the figure and, where the publisher stated one, its date — e.g. `"Fixr build-deck cost page, updated 11 January 2023"`. |
| `source_date` | string | 6 | The publisher's own date for the figure, not our export date. Mixed granularity by design: `"2023-01-11"`, `"2025"`, `"2026"`. Null where the publisher stated none — never guessed. |
| `updated` | string | 0 | `YYYY-MM-DD`. When we last re-checked the record. |
| `license` | string | 0 | `"CC BY 4.0"` on every record. |
| `license_url` | string | 0 | The licence deed URL. |
| `attribution` | string | 0 | The attribution string to reproduce. |

`low`/`high` are null on 5 records that carry a `figure` string but no numeric range — for
example a figure whose bounds are not both stated. Filter on `low != null` rather than on
`figure != null`.

## `figureKind` values

This field exists so a consumer cannot accidentally treat a wage as a job price. Each value
below states what the figure **is**, and what claim it may support.

| value | count | is | may support |
|---|---:|---|---|
| `whole_job_range` | 11 | One publisher's printed low–high for the job as a whole. | "This job typically runs between $A and $B." |
| `annual_running_cost` | 48 | A cost per year (energy, insurance, running costs) — not a one-off job price. | "This costs $X a year to run." |
| `hourly_wage` | 10 | A worker's wage, e.g. a BLS mean hourly rate. | "The labour in this job is paid around $X/hr." **Not** a price for the work. |
| `single_average` | 6 | One average with no range. | "The published average is $X." Not a range. |
| `unit_price` | 2 | A per-unit rate (per sq ft, per linear foot). | "Material or work runs $X per unit." Not a whole-job range. |
| `scope_banded` | 3 | A range whose two ends are the same job at **different distances or sizes** — a variable the reader never stated. | Nothing about a single job. Its low end is not a cheap quote; it is a different job. |
| `state_average_spread` | 1 | Low–high **across state averages** — the cheapest state to the most expensive. | "State averages range from $A to $B." **Never** "a quote of $X is inside the range." |
| `supplier_spread` | 1 | The spread across **competing suppliers for one identical job**. | Nothing about job variation — it measures how much suppliers differ on the same job. |
| `combined_benchmarks` | 1 | Two publishers' figures placed on one spread. | Nothing about a single job — the two figures describe different jobs. |
| `non_dollar` | 31 | The record carries no dollar figure. | Nothing numeric. The page exists; the figure does not. |

If you are aggregating, **filter to a single kind first**. Summing or averaging across kinds
produces a number that describes nothing.

## What is deliberately absent

- **No time series.** `updated` is when we re-checked, not a second observation of the price.
  There is one figure per record per release.
- **No geography field.** Coverage is national; a handful of records are state-specific and
  say so inside `source_name` and `figure`. There is no state column to group by.
- **No scope or caveat field.** The prose description of exactly what each range covers
  (house size, material, what is excluded) lives on the page at `url`. Read it before quoting
  a figure — the number alone does not tell you what job it describes.
- **No confidence score.** A number that is not sourced well enough to publish is not in the
  file at all.

## Regenerating

The file is generated from the guide corpus at build time, not hand-maintained. Field names
are stable; record count grows as trades are sourced.

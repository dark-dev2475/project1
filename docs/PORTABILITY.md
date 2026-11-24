# Using a different dataset

The NYC experiment is one domain adapter. `project_b.portable` is the generic validator; it never
assumes that a latitude belongs to New York or that a field named `Status` has a universal meaning.

1. Pick CSV, a JSON array, or JSONL/NDJSON. Records must be flat objects with named columns.
2. Copy a contract from `docs/contracts/` and declare every column's type. Valid types are `string`,
   `integer`, `number`, `boolean`, and `datetime`. Columns default to required and non-nullable.
   Numeric columns can declare inclusive `minimum`/`maximum` bounds for domain plausibility.
3. Declare only relevant roles: `primary_key`, `chronological_pair`, `coordinate_pair`,
   `categories`, `pair_mappings`, `text_columns`. Optional roles are disabled when absent.
4. Run `python lab.py check-data --input your.jsonl --contract your-contract.json`.
5. Add `--baseline known-baseline.jsonl` to measure null-rate change. A baseline is never learned from
   the same batch under evaluation. Fit it per customer, schema version, and meaningful partition.

CSV cells start as strings. The adapter explicitly converts declared numeric/boolean types and maps
empty cells to null; it reports those conversions. Invalid values stay intact and trigger type alerts.
JSON input is not coerced: a number changed to a string remains a detectable type change. Identifiers
declared as strings keep leading zeros. Duplicate headers, duplicate JSON keys, malformed row widths,
unknown contract keys and nonfinite numbers are rejected.

Global coordinates default to latitude [-90,90] and longitude [-180,180]. Geographic bounds are
optional. A latitude/longitude swap can be numerically valid; detecting it requires declared regional
bounds or domain knowledge. Legitimate repeated measurements are not duplicates unless they violate
an explicit primary key. Duplicate-key alerts identify the original physical record.

Date formats are explicit: `iso8601` or Python `strptime` formats. Mixed timezone-aware and naive
values generate an incomparable-date alert instead of silently choosing a timezone. Optional fields
can be absent; explicit nulls are checked against their nullability. Unknown dataset columns generate
alerts so schema additions require an intentional contract change.

Pair mappings express domain knowledge, for example country/currency or product/category. They are
not automatically inferred as truth from the current file. Text checks identify limited PII patterns;
they do not perform general name recognition or semantic reasoning. `semantic.status` therefore
remains `unsupported`. A clean result means **no declared check failed**, not universal data correctness.

The generic checker is an in-memory laptop implementation. It does not provide cross-batch duplicate
state, arbitrary nested objects, universal outlier detection, or a streaming ingestion system. For
large datasets, preserve the contract API and add chunked execution and durable key/window state.

# Project B: results and scale design

Generated 2026-11-24T19:08:34.123090+00:00. Reproduce with `python lab.py reproduce`.

## Dataset and experimental contract

1,800 real 2023 records: the first 150 by created date/key in each month, from the official NYC Open Data API. This is a biased coverage sample, not a census or a prevalence estimate. Snapshot checksum and exact queries are in `project_b/data/manifest.json`.

Fit on 900 alternating records; the other 900 are held out. Synthetic clean controls combine recurring real category/location pairs with independent timestamps and statuses. Three seeds and requested corruption rates 5%, 15%, 30% are used per type. Labels never enter detector inputs. Semantic control results are optimistic relative to diverse production text.

Schema/type/date-format/null-spike score per batch; other types score per physical row. Duplicate positives include all group members. Clean false alarms use clean units; precision includes unmodified rows in corrupted batches. Explanation coverage means a nonempty reason, not human-rated explanation quality. Batch types have only three positive and three clean batches; zero observed false alarms is weak evidence, not zero population risk.

## Per-problem comparison

| Check | Family | Unit | Recall | Precision | Clean false alarms | Rows/s | API $/M rows | Explained alerts |
|---|---|---|---|---|---|---|---|---|
| schema | rule | batch | 100.0% | 100.0% | 0/3 (0.0%) | 63,212 | 0.0000 | 100.0% |
| schema | statistical | batch | 100.0% | 100.0% | 0/3 (0.0%) | 101,188 | 0.0000 | 100.0% |
| schema | hybrid | batch | 100.0% | 100.0% | 0/3 (0.0%) | 38,768 | 0.0000 | 100.0% |
| schema | llm | batch | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| type | rule | batch | 100.0% | 100.0% | 0/3 (0.0%) | 69,580 | 0.0000 | 100.0% |
| type | statistical | batch | 100.0% | 100.0% | 0/3 (0.0%) | 111,462 | 0.0000 | 100.0% |
| type | hybrid | batch | 100.0% | 100.0% | 0/3 (0.0%) | 42,207 | 0.0000 | 100.0% |
| type | llm | batch | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| date_format | rule | batch | 100.0% | 100.0% | 0/3 (0.0%) | 68,232 | 0.0000 | 100.0% |
| date_format | statistical | batch | 100.0% | 100.0% | 0/3 (0.0%) | 106,701 | 0.0000 | 100.0% |
| date_format | hybrid | batch | 100.0% | 100.0% | 0/3 (0.0%) | 42,399 | 0.0000 | 100.0% |
| date_format | llm | batch | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| coordinates | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 67,865 | 0.0000 | 100.0% |
| coordinates | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 109,857 | 0.0000 | 100.0% |
| coordinates | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 41,862 | 0.0000 | 100.0% |
| coordinates | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| duplicates | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 68,715 | 0.0000 | 100.0% |
| duplicates | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 105,637 | 0.0000 | 100.0% |
| duplicates | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 41,107 | 0.0000 | 100.0% |
| duplicates | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| near_duplicates | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 65,908 | 0.0000 | 100.0% |
| near_duplicates | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 96,891 | 0.0000 | 100.0% |
| near_duplicates | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 40,352 | 0.0000 | 100.0% |
| near_duplicates | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| null_spike | rule | batch | 100.0% | 100.0% | 0/3 (0.0%) | 66,311 | 0.0000 | 100.0% |
| null_spike | statistical | batch | 100.0% | 100.0% | 0/3 (0.0%) | 112,620 | 0.0000 | 100.0% |
| null_spike | hybrid | batch | 100.0% | 100.0% | 0/3 (0.0%) | 43,682 | 0.0000 | 100.0% |
| null_spike | llm | batch | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| chronology | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 69,857 | 0.0000 | 100.0% |
| chronology | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 112,872 | 0.0000 | 100.0% |
| chronology | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 43,291 | 0.0000 | 100.0% |
| chronology | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| zip_borough | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 69,715 | 0.0000 | 100.0% |
| zip_borough | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 113,875 | 0.0000 | 100.0% |
| zip_borough | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 42,834 | 0.0000 | 100.0% |
| zip_borough | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| complaint_descriptor | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 56,210 | 0.0000 | 100.0% |
| complaint_descriptor | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 98,225 | 0.0000 | 100.0% |
| complaint_descriptor | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 42,510 | 0.0000 | 100.0% |
| complaint_descriptor | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| resolution_status | rule | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 69,459 | 0.0000 | 100.0% |
| resolution_status | statistical | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 113,051 | 0.0000 | 100.0% |
| resolution_status | hybrid | physical_row | 100.0% | 100.0% | 0/360 (0.0%) | 42,833 | 0.0000 | 100.0% |
| resolution_status | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |
| pii | rule | physical_row | 76.7% | 100.0% | 0/360 (0.0%) | 69,683 | 0.0000 | 100.0% |
| pii | statistical | physical_row | 100.0% | 61.2% | 45/360 (12.5%) | 105,493 | 0.0000 | 100.0% |
| pii | hybrid | physical_row | 100.0% | 61.2% | 45/360 (12.5%) | 41,312 | 0.0000 | 100.0% |
| pii | llm | physical_row | not measured | not measured | 0/0 (not measured) | not measured | not measured | not measured |

Rule/statistical/hybrid rows measure the full detector pass on that corruption scenario, not the isolated cost of one rule. Local CPU/hosting cost is excluded from $0 API figures. Hybrid table values measure candidate detection; pending semantic review is not confirmed detection. LLM cells remain unmeasured when no provider is available. Partial live coverage is reported in machine-readable observations.

## Issues observed in the raw data

| Potential issue | Count | Example source keys |
|---|---:|---|
| chronology | 1 | 59436693 |
| complaint_descriptor | 1 | 58055375 |
| near_duplicates | 120 | 56416825, 56414067, 56417105 |
| pii | 57 | 56417406, 56415422, 56419100 |
| resolution_status | 2 | 57460906, 58058243 |
| zip_borough | 1 | 58369001 |

Missing values by column: closed_date=18, descriptor=15, incident_address=58, incident_zip=18, latitude=15, longitude=15, resolution_description=9.

Nulls and negative elapsed times are observed facts. Duplicate, geographic-consensus, semantic and PII flags require adjudication; agency contact numbers are not necessarily private PII. Raw flags are not false-positive or precision labels.

Exact examples and original values are in `artifacts/data_quality_benchmark.json`. The real records are not used as clean negative labels, and suspicious contact details are not automatically private PII.

## End-to-end hybrid run

On 900 held-out real rows: 0 hard contract alerts, 148 semantic candidate pairs over 102 distinct rows, 11 rows selected for random audit, 0 reviewed pairs, 148 pending pairs. Release decision: **hold_for_review**. Wall time: 0.0410 seconds. These are observed alerts, not adjudicated accuracy.

Rules run for every row; empirical null-drift and candidate checks run per batch. Hard contract failures quarantine the batch. Ambiguous ZIP/category/text/near-duplicate findings enter a bounded review queue; random sampling checks unflagged rows. No provider or budget exhaustion leaves a hold, not a false all-clear. The public/synthetic Gemini adapter redacts email/phone patterns; generic customer datasets are never automatically sent to it.

## Portability

`check-data` accepts CSV, JSON arrays, and JSONL with a version-controlled column contract. Types, required/nullable columns, keys, date formats, chronology, global coordinate ranges, categories, allowed pairs and PII fields are configurable. Orders, support-ticket and sensor contracts are tested independently of NYC. No universal semantic correctness is claimed: add domain mappings/validators for each customer and fit drift baselines separately.

## Scale design (two-page budget; under 600 words)

At 50 million rows/day, average ingest is 578.7 rows/s across 120 customers (416,667 rows/customer/day if evenly distributed). A 4x peak assumption implies 2,315 rows/s. The measured in-process hybrid candidate detector processes 41,887 rows/s; naive linear CPU projection is 1,194 seconds/day. This is a lower-bound projection, not a distributed benchmark. It excludes parsing, network, storage, skew and semantic review.

Use a versioned contract per customer, a schema registry, and partitioned ingestion. Run cheap schema/type/chronology checks before aggregation; quarantine violations with row IDs, rule version and evidence. Baselines belong to a tenant and agency/partition, with minimum sample sizes and explicit seasonality. New schema versions run in shadow mode before adoption. Never fit a baseline on the batch being judged.

At scale, use vectorized/streaming checks and bounded windows. Exact duplicates need key state with a defined retention interval; near-duplicates need blocking and bounded candidate comparisons. This in-memory laptop implementation does not claim cross-batch deduplication. Partition by customer/key, preserve event time and late-arrival policy, and keep an idempotent alert key. Budget alert volume and measure reviewer precision on labeled real samples.

Semantic LLM review is an experiment until live quality measurements establish incremental value over rules. Apply per-tenant budgets and random audits; unavailable review holds the affected batch. Do not extrapolate free-tier capacity to production. Paid-equivalent costs must come from actual token usage, routed row counts and deployed model prices. Infrastructure and human review are separate costs.

Illustrative sensitivity, **not a measured cost**: assuming 700 input and 80 output tokens per reviewed row, Flash-Lite prices $0.10/$0.40 per million tokens imply $0.000102/review. Routing 0.1%, 1%, or 5% of 50 million rows costs $5.10, $51, or $255/day in model tokens alone. Context, retries, thinking tokens and batching change this. Required concurrency is ceil(review_rows_per_second × measured_call_latency / rows_per_call); latency is pending live observations. Contract checks keep running if the model is unavailable, while unresolved review retains a visible hold.

Sources: [NYC 311](https://data.cityofnewyork.us/d/erm2-nwe9), [dataset label changes](https://www.nyc.gov/opendata/news/all-news/311-Service-Requests-Updates), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

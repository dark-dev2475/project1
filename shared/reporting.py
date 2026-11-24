"""Render all submission tables from machine-readable observations."""
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import platform

ROOT = Path(__file__).resolve().parents[1]


def pct(value):
    return "not measured" if value is None else f"{value:.1%}"


def num(value, places=2):
    return "not measured" if value is None else f"{value:,.{places}f}"


def official_summary():
    from project_a.engine import calculate
    from project_a.models import TaxInput
    folder = ROOT / "evidence/official_calculator"
    cases = json.loads((folder / "fixtures.json").read_text(encoding="utf-8"))["cases"]
    known = json.loads((folder / "known_discrepancies.json").read_text(encoding="utf-8"))
    exact = sum(calculate(TaxInput.from_dict(c["project_input"]), c["regime"])["total_tax"] == c["official_output"]["BalTax"] for c in cases)
    return {"cases": len(cases), "exact": exact, "documented_discrepancies": len(known),
            "method": "Local execution of authentic, hash-pinned ITD JavaScript; not browser entries"}


def write_reports(a, b, pipeline, *, test_summary, portable=None):
    now = datetime.now(timezone.utc).isoformat()
    official = official_summary()
    r = a["hand_coded"]
    change = a["law_change_replay"]
    parser = a["parser"]
    live = a["llm_query_time"]
    compiled = a["llm_compiled"]
    a_text = f'''# Project A: results and shipping decision

Generated {now} by `python lab.py reproduce`. Source observations: `artifacts/tax_benchmark.json`.

## Experimental contract

{a['profiles']} fixed profiles, {a['regime_expectations']} old/new expectations, both financial years.
Expected values come from a separately coded algebraic oracle, not production output. Every profile
is repeated {r['repetitions_per_profile']} times without a result cache. Model calls are never substituted
with deterministic answers. Time is measured on this machine ({platform.python_version()}, {platform.system()}).
The annual input model accepts eligible salary-only claims; see `project_a/source_rules.md` for scope.

| Implementation | Rupee-exact evidence | Determinism | p50 / p95, ms | Model cost / 1,000 | Auditability |
|---|---|---|---|---|---|
| Hand-coded policy | {r['exact']}/{r['checked']} ({pct(r['accuracy'])}) | {r['deterministic_profiles']}/{a['profiles']} profiles identical over 10 calls | {num(r['latency_ms_p50'],4)} / {num(r['latency_ms_p95'],4)} | $0 API; compute excluded | {pct(r['clause_ledger_coverage_fraction'])} structural clause-ledger coverage |
| Gemini at query time | {live['status']} | {live.get('deterministic_profiles', 'not measured')} fully repeated profiles | {num(live.get('latency_ms_p50'))} / {num(live.get('latency_ms_p95'))} | {num(live.get('paid_equivalent_usd_per_1000'),6)} paid equivalent | Model citations are not an arithmetic proof |
| Gemini-compiled policy | {compiled['status']} | {compiled.get('deterministic_profiles', 'not measured')} | {num(compiled.get('latency_ms_p50'))} / {num(compiled.get('latency_ms_p95'))} | Zero query calls by design; compilation cost pending unless observed | Versioned JSON, schema validation, regression gate, explicit review |

The handwritten policy is **not** counted as LLM-compiled. Live compilation produces a separate artifact
with model/prompt/source hashes. Only a reviewed artifact can execute. Generated code is never evaluated.
No Gemini API key was present for the initial build. Current model evidence status: **{live['status']}**.
Live accuracy, if available, uses only completed calls, alongside requested-call coverage; see the JSON.

## Independent official checks

{official['cases']} saved executions of the Income Tax Department's official advanced calculator,
{official['exact']} exact matches, {official['documented_discrepancies']} documented upstream differences.
The official JavaScript and full request/response pairs are hash-pinned and replayable with Node.
This exceeds the requested 30 checks, but is **local execution of official code**, not manual browser entry.
The reference accepts salary after standard deduction, so these checks validate downstream taxation,
not independent HRA eligibility or deduction caps. Details: `evidence/official_calculator/README.md`.

The two differences concern old-regime surcharge marginal relief just above INR 5 crore. The engine
retains statutory relief instead of reproducing the apparent calculator defect. Raw differences remain
visible; `python tools/check_official_calculator.py --replay --strict` intentionally fails on them.

## Plain-language evaluation

{parser['correct']}/{parser['cases']} expected status decisions on 50 English/Hinglish descriptions,
including contradictions, missing periods, unknown deductions, seniors and out-of-scope income.
Ready cases: {parser['ready']}; clarification/out-of-scope cases: {parser['cases']-parser['ready']}.
Fields retain extraction evidence. Missing deductions are not silently set to zero. Gemini suggestions
require explicit confirmation; neither quoted evidence nor temperature zero guarantees correctness.
This curated corpus tests a conservative grammar, not unrestricted language comprehension.

## Task 5: law-change replay

| Approach | Measured change work | What broke / silent failures | Outcome |
|---|---|---|---|
| Hand-coded policy | Replace year pack + validate: {num(change['config_replace_and_validate_seconds'],6)} s; regression verification: {num(change['verification_seconds'],4)} s | Stale FY2024-25 new-regime pack caused {change['before_update']['wrong_answers_without_exception']}/{change['before_update']['checked']} wrong outputs without exceptions | Updated pack: {change['after_update']['exact']}/{change['after_update']['checked']} exact |
| Query-time Gemini | Live timing not yet measured | Source and fiscal year are in every prompt; stale prompt/model drift remains a risk | Both-year live protocol implemented, measurements pending credentials |
| Gemini compiler | Live compilation/review timing not yet measured | Edited source invalidates the approved artifact hash | Schema + all-fixture regression gate; human clause review required |

These are **migration replay timings**, not invented historical engineering time. This assignment cannot
claim a measured three-way law-change comparison until live Gemini runs complete.
Mutation checks deliberately disable new-regime marginal relief and change cess to 5%; failure counts:
{', '.join(m['mutation'] + ': ' + str(m['wrong_answers_without_exception']) for m in a['mutation_checks'])}.

## Final design (two-page budget; under 600 words)

For 100,000 users, ship a **hybrid input layer** followed by a **rule-only tax kernel**. Explicit fields and
recognized prose use deterministic extraction. Unrecognized prose may go to Gemini for candidate facts,
but missing facts and conflicts produce questions, and model proposals require confirmation. This follows
the parser's measured clarification behavior; broad LLM parsing quality remains unmeasured.

The **rule kernel** uses Decimal arithmetic, immutable validated inputs, explicit fiscal-year policy, and
clause-level ledger entries. {r['exact']}/{r['checked']} independent expectations and ten-repeat stability
support this choice. The independent official discrepancies demonstrate why an external calculator is a
reference rather than an unquestioned truth oracle. Eligibility restrictions and annual HRA assumptions
remain explicit at the input boundary. An out-of-scope income head must not be silently ignored.

The **LLM compiler is a development assistant**, not the authority that releases law changes. It emits
only constrained JSON; structural validation rejects malformed packs, and the regression suite compares
every old/new expectation. A reviewer signs the policy hash after checking statutory clauses. Changing
the source or policy invalidates approval. It has no measured advantage yet because live observations
are pending; do not claim savings in review effort before measuring them.

The **query-time LLM calculator stays an experimental baseline**. No deterministic correction is hidden
inside its measured answers. Its latency, token usage, repeatability and mistakes can therefore be
compared fairly once credentials are configured. Temperature zero is not a determinism guarantee.

At the next Budget, retain immutable prior-year packs, add an effective-year pack, create independent
boundary expectations before changing code, and rerun official comparisons. Canary the new policy on
shadow requests, monitor disagreements, then activate the approved hash. Roll back by policy version.
Store an input hash and policy hash in audit records; protect actual salary data and never put it in
application logs. Stateless workers can handle users independently; measured kernel latency excludes
HTTP, storage, identity, review, and peak-load behavior, so load-test the complete service before rollout.

Sources: [ITD salaried guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3),
[Finance Act 2025 highlights](https://incometaxindia.gov.in/news/highlights-to-finance-act-2025.pdf),
[official calculator](https://eportal.incometax.gov.in/iec/foservices/#/TaxCalc/calculator).
All clause-specific links are preserved in `project_a/source_rules.md`.
'''
    lines = ["# Project B: results and scale design", "", f"Generated {now}. Reproduce with `python lab.py reproduce`.", "",
             "## Dataset and experimental contract", "",
             f"{b['profile']['rows']:,} real 2023 records: the first 150 by created date/key in each month, from the official NYC Open Data API. This is a biased coverage sample, not a census or a prevalence estimate. Snapshot checksum and exact queries are in `project_b/data/manifest.json`.", "",
             f"Fit on {b['baseline']['training_rows']} alternating records; the other {b['baseline']['held_out_raw_rows']} are held out. Synthetic clean controls combine recurring real category/location pairs with independent timestamps and statuses. Three seeds and requested corruption rates 5%, 15%, 30% are used per type. Labels never enter detector inputs. Semantic control results are optimistic relative to diverse production text.", "",
             "Schema/type/date-format/null-spike score per batch; other types score per physical row. Duplicate positives include all group members. Clean false alarms use clean units; precision includes unmodified rows in corrupted batches. Explanation coverage means a nonempty reason, not human-rated explanation quality. Batch types have only three positive and three clean batches; zero observed false alarms is weak evidence, not zero population risk.", "",
             "## Per-problem comparison", "", "| Check | Family | Unit | Recall | Precision | Clean false alarms | Rows/s | API $/M rows | Explained alerts |", "|---|---|---|---|---|---|---|---|---|"]
    for kind in b['per_method']['rule']:
        for family in ("rule", "statistical", "hybrid", "llm"):
            m = b['per_method'][family][kind]
            lines.append(f"| {kind} | {family} | {m['unit']} | {pct(m['recall'])} | {pct(m['precision'])} | {m['clean_false_alarms']}/{m['clean_units']} ({pct(m['clean_false_alarm_rate'])}) | {num(m.get('rows_per_second'),0)} | {num(m.get('api_cost_usd_per_million_rows'),4)} | {pct(m['explanation_coverage'])} |")
    lines += ["", "Rule/statistical/hybrid rows measure the full detector pass on that corruption scenario, not the isolated cost of one rule. Local CPU/hosting cost is excluded from $0 API figures. Hybrid table values measure candidate detection; pending semantic review is not confirmed detection. LLM cells remain unmeasured when no provider is available. Partial live coverage is reported in machine-readable observations.", "", "## Issues observed in the raw data", "", "| Potential issue | Count | Example source keys |", "|---|---:|---|"]
    for kind, item in b['profile']['potential_issues'].items():
        lines.append(f"| {kind} | {item['count']} | {', '.join(str(ex.get('unique_key','batch')) for ex in item['examples'])} |")
    lines += ["", "Missing values by column: " + ", ".join(f"{k}={v}" for k,v in b['profile']['missing_by_column'].items() if v) + ".", "",
              b['profile']['interpretation'], "", "Exact examples and original values are in `artifacts/data_quality_benchmark.json`. The real records are not used as clean negative labels, and suspicious contact details are not automatically private PII.", "",
              "## End-to-end hybrid run", "",
              f"On {pipeline['rows']} held-out real rows: {len(pipeline['hard_alerts'])} hard contract alerts, {pipeline['candidate_pairs']} semantic candidate pairs over {pipeline['unique_candidate_rows']} distinct rows, {pipeline['sampled_rows']} rows selected for random audit, {pipeline['reviewed_pairs']} reviewed pairs, {len(pipeline['pending_review'])} pending pairs. Release decision: **{pipeline['release_decision']}**. Wall time: {num(pipeline['wall_seconds'],4)} seconds. These are observed alerts, not adjudicated accuracy.", "",
              "Rules run for every row; empirical null-drift and candidate checks run per batch. Hard contract failures quarantine the batch. Ambiguous ZIP/category/text/near-duplicate findings enter a bounded review queue; random sampling checks unflagged rows. No provider or budget exhaustion leaves a hold, not a false all-clear. The public/synthetic Gemini adapter redacts email/phone patterns; generic customer datasets are never automatically sent to it.", "",
              "## Portability", "",
              "`check-data` accepts CSV, JSON arrays, and JSONL with a version-controlled column contract. Types, required/nullable columns, keys, date formats, chronology, global coordinate ranges, categories, allowed pairs and PII fields are configurable. Orders, support-ticket and sensor contracts are tested independently of NYC. No universal semantic correctness is claimed: add domain mappings/validators for each customer and fit drift baselines separately.", "",
              "## Scale design (two-page budget; under 600 words)", ""]
    t = b['throughput']['hybrid']['rows_per_second']
    seconds = 50_000_000 / t if t else 0
    lines += [f"At 50 million rows/day, average ingest is {50_000_000/86400:,.1f} rows/s across 120 customers ({50_000_000/120:,.0f} rows/customer/day if evenly distributed). A 4x peak assumption implies {4*50_000_000/86400:,.0f} rows/s. The measured in-process hybrid candidate detector processes {num(t,0)} rows/s; naive linear CPU projection is {seconds:,.0f} seconds/day. This is a lower-bound projection, not a distributed benchmark. It excludes parsing, network, storage, skew and semantic review.", "",
              "Use a versioned contract per customer, a schema registry, and partitioned ingestion. Run cheap schema/type/chronology checks before aggregation; quarantine violations with row IDs, rule version and evidence. Baselines belong to a tenant and agency/partition, with minimum sample sizes and explicit seasonality. New schema versions run in shadow mode before adoption. Never fit a baseline on the batch being judged.", "",
              "At scale, use vectorized/streaming checks and bounded windows. Exact duplicates need key state with a defined retention interval; near-duplicates need blocking and bounded candidate comparisons. This in-memory laptop implementation does not claim cross-batch deduplication. Partition by customer/key, preserve event time and late-arrival policy, and keep an idempotent alert key. Budget alert volume and measure reviewer precision on labeled real samples.", "",
              "Semantic LLM review is an experiment until live quality measurements establish incremental value over rules. Apply per-tenant budgets and random audits; unavailable review holds the affected batch. Do not extrapolate free-tier capacity to production. Paid-equivalent costs must come from actual token usage, routed row counts and deployed model prices. Infrastructure and human review are separate costs.", "",
              "Illustrative sensitivity, **not a measured cost**: assuming 700 input and 80 output tokens per reviewed row, Flash-Lite prices $0.10/$0.40 per million tokens imply $0.000102/review. Routing 0.1%, 1%, or 5% of 50 million rows costs $5.10, $51, or $255/day in model tokens alone. Context, retries, thinking tokens and batching change this. Required concurrency is ceil(review_rows_per_second × measured_call_latency / rows_per_call); latency is pending live observations. Contract checks keep running if the model is unavailable, while unresolved review retains a visible hold.", "",
              "Sources: [NYC 311](https://data.cityofnewyork.us/d/erm2-nwe9), [dataset label changes](https://www.nyc.gov/opendata/news/all-news/311-Service-Requests-Updates), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).", ""]
    b_text = "\n".join(lines)
    matrix = ["# Decision matrix", "", "Choices are provisional wherever live LLM or adjudicated production evidence is missing.", "", "| Component | Choice | Measurement and rationale | Audit / maintenance trade-off |", "|---|---|---|---|"]
    matrix += [f"| Tax arithmetic | rule | {r['exact']}/{r['checked']} exact, {r['deterministic_profiles']} profiles stable over ten calls | Versioned clause ledger; requires statutory review |",
               f"| Input extraction | hybrid | {parser['correct']}/{parser['cases']} status decisions; ambiguity asks questions | LLM suggestions require confirmation; unrestricted prose unmeasured |",
               "| Policy compiler | LLM + rule gate | No live compilation observation yet; cannot establish superiority | JSON only, hash approval, regression tests; no eval |",
               "| Query-time tax LLM | LLM baseline, not selected | Live cost/quality/determinism pending | No hidden deterministic repair; citations alone are insufficient |"]
    for kind in b['per_method']['rule']:
        rule, stat = b['per_method']['rule'][kind], b['per_method']['statistical'][kind]
        choice = "hybrid (review candidate)" if kind in {"zip_borough","complaint_descriptor","resolution_status","pii","near_duplicates"} else "statistical + rule" if kind == "null_spike" else "rule"
        matrix.append(f"| {kind} | {choice} | Rule recall {pct(rule['recall'])}, statistical recall {pct(stat['recall'])}; clean FAR {pct(rule['clean_false_alarm_rate'])}/{pct(stat['clean_false_alarm_rate'])}; LLM pending | {rule['unit']} unit; empirical/semantic alerts require adjudication |")
    matrix += ["| Cross-dataset contract | rule + statistical | Independent orders/support/sensor tests; explicit baseline null drift | Domain semantics require declared mappings, never NYC defaults |", "", "Full numerators, denominators, timings and limits: `artifacts/data_quality_benchmark.json` and `artifacts/tax_benchmark.json`.", ""]
    artifacts = ROOT / "artifacts"
    artifacts.mkdir(exist_ok=True)
    a['official_reference'] = official
    summary = {"generated_at": now, "tax": a, "data_quality": b, "pipeline": pipeline,
               "tests": test_summary, "portability": portable or {}, "environment": {"python": platform.python_version(), "platform": platform.platform()}}
    for name, value in [("tax_benchmark.json",a), ("data_quality_benchmark.json",b), ("hybrid_pipeline.json",pipeline), ("summary.json",summary)]:
        (artifacts/name).write_text(json.dumps(value, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    for name, content in [("RESULTS_A.md", a_text), ("RESULTS_B.md", b_text), ("DECISION_MATRIX.md", "\n".join(matrix))]:
        (ROOT/name).write_text(content, encoding="utf-8")
    from shared.report_ui import render
    report_dir = ROOT / "reports"
    report_dir.mkdir(exist_ok=True)
    (report_dir/"index.html").write_text(render(summary), encoding="utf-8")
    return summary

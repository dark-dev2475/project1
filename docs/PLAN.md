# Implementation and acceptance plan

The assignment is an experiment, not a contest to use the most AI. Every result must distinguish
measured evidence, assumptions, and unexecuted work. Both engines remain explainable in an interview.

## Tools and boundaries

- Python 3.10+; standard-library runtime, pytest and Ruff for development.
- Decimal arithmetic and versioned JSON policy for tax. Generated policy is data, never executed Python.
- Gemini REST adapter with JSON output, timeouts, call budget, usage accounting, and explicit failures.
- NYC Open Data API with a checked-in, hashed 2023 snapshot and reproducible acquisition query.
- Local CLI and HTTP service; a generated HTML evidence report for quick inspection.
- No database, queue, orchestration framework, model training service, or paid infrastructure is needed.

## Parallel work and gates

1. **Tax engine:** establish independent expected fixtures first; implement deductions, both regimes,
   rebate, surcharge marginal relief, cess, rounding, and clause trace. Test all boundaries in both years.
2. **Data quality:** fetch/provenance/profile; implement 12 labeled corruptions and independent rule and
   statistical detectors; measure held-out clean and corrupted batches with explicit denominators.
3. **Official reference:** obtain and preserve at least 30 official calculator checks, or clearly mark
   the requirement blocked. Published tables and an internal oracle are not calculator verification.
4. **Integration:** conservative parser and 50 language examples, Gemini query/compiler/reviewer adapters,
   reproducible reports, service, and integration tests. Live calls require an environment API key.
5. **Review:** run tests, lint, benchmarks, law-change mutation checks, local service checks, and inspect
   the evidence report. Audit metrics for leakage, denominator errors, fake costs, and hidden defaults.

## Acceptance criteria

- One command runs checks and regenerates every reported metric from pinned local inputs.
- At least 200 expected old/new tax cases and 50 language descriptions, including uncertainty.
- No ambiguous prose silently becomes a tax liability; missing fields yield concrete questions.
- Every deterministic tax amount has a source clause and policy version.
- All 12 corruption kinds have labeled injection and three-family evaluation support.
- LLM failures and missing credentials remain visible; no fabricated scores or compiled provenance.
- Reports include scope/sample limitations, measured throughput, token-based cost formulas, change
   failures, architecture choices, scaling assumptions, AI mistakes caught, and remaining submission gates.
- Private GitHub sharing is a final delivery step once a destination and collaborators are supplied.

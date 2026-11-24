# Decision Lab — rules, statistics, and LLMs

A small Python implementation of the Fire AI assignment: salary tax under two Indian regimes,
a 12-problem NYC 311 quality experiment, and reusable validation for other tabular datasets.
The focus is evidence: exact amounts, explicit uncertainty, source provenance, real measurements,
and visible missing results. Runtime code uses the Python standard library.

## Run it

Requires **Python 3.10+** and **Node.js 18+** (only to replay the official calculator).

```powershell
python -m pip install -e ".[dev]"
python lab.py reproduce
python lab.py serve
```

Open **[Decision Lab](http://127.0.0.1:8765)**. The local viewer contains an interactive salary
calculator, detector comparison, source findings, and links to every report. It needs no Node build,
database, cloud account, or model key. The HTTP service binds to loopback; it is a development demo,
not a production internet server.

`reproduce` runs all tests, re-executes the hash-pinned official tax calculator, measures both projects,
and generates `RESULTS_A.md`, `RESULTS_B.md`, `DECISION_MATRIX.md`, `artifacts/*.json`, and
`reports/index.html`. Correctness counts reproduce exactly; timing measurements vary by machine.
The NYC snapshot and official calculator code are included, so ordinary reproduction is offline.
Expected upstream calculator differences remain documented and visible.

## Use the tools

```powershell
python lab.py tax --input examples/tax.json
python lab.py tax --text "Annual salary 15 lakh. FY 2025-26. Age 32. Indian tax resident. No deductions."
python lab.py check-data --input examples/orders.csv --contract docs/contracts/orders.json
python lab.py check-data --input examples/support.jsonl --contract docs/contracts/support.json
python lab.py check-data --input examples/sensors.json --contract docs/contracts/sensors.json
python -m ruff check .
```

`check-data` returns exit **2** when it finds alerts; the orders/support examples intentionally contain
bad records. The global sensor example should pass. Supply `--baseline path` for null-rate drift and
`--output result.json` to save the result. Configure a contract for each new dataset; see
[the portability guide](docs/PORTABILITY.md). No claim is made that a generic validator can prove
semantic correctness on arbitrary data.

The structured tax API accepts documented `TaxInput` defaults: age 30, resident, no optional claims.
The prose API does **not** silently assume those facts: it asks questions. Inputs are eligible annual
amounts, not raw expenditure or CTC. Read [scope and statutory sources](project_a/source_rules.md),
especially annual HRA assumptions, loan conditions, and excluded income heads.

## Real Gemini experiments

The configured model is **`gemini-2.5-flash-lite`**, overrideable with `GEMINI_MODEL`. The initial build
had no Gemini credentials. Pending cells are not model failures or synthetic results. The three
implementations are separate: hand-coded JSON policy, query-time Gemini arithmetic, and Gemini
compilation into a separately reviewed JSON policy interpreted by the deterministic kernel.

Copy `.env.example` to `.env` and fill in your free-tier key, or configure it in PowerShell.
The ignored `.env` is loaded as inert values; existing environment variables take precedence.
Never commit the key or paste it into a report.

```powershell
$env:GEMINI_API_KEY = "your-key"
$env:GEMINI_MODEL = "gemini-2.5-flash-lite"
$env:GEMINI_MIN_INTERVAL = "6"
python lab.py tax --input examples/tax.json --implementation llm
python lab.py compile-policy
python lab.py review-policy
```

Inspect the candidate, source clauses and regression output before approving it:

```powershell
python lab.py review-policy --approve --reviewer "Your name"
python lab.py tax --input examples/tax.json --implementation compiled
python lab.py reproduce --live --max-calls 40 --tax-cases 5
```

Each repeated tax observation is a distinct model call. Saved slots resume across quota interruptions;
there is no cache pretending that ten independent outputs were deterministic. `--tax-cases 488` selects
the whole initial corpus. Full repetition and every-row quality review can exceed free-tier quotas;
use repeated bounded runs and inspect coverage. The default shared call budget may leave Project B
without remaining calls; run `python tools/run_live_quality.py --max-calls 40` for a separate B budget.
The provider never automatically retries a failed request or silently switches to a paid model.
`python tools/run_live_change.py` measures stale-source versus updated-source query answers and
recompilation/regression timings for both policy packs, recording silent failures and explicit errors.
This is a live migration replay, not a claim about historical engineering time.
Rate limits/model availability depend on the configured account. Prices are paid equivalents based
on token observations; an unavailable price remains unknown.

Email/phone patterns are redacted before the public/synthetic NYC LLM experiment. Names may remain;
the free-tier adapter must not be used for confidential customer data. The generic dataset command
and HTTP quality endpoint run locally and make no model calls.

## Structure

```text
project_a/      validated inputs, policies, tax kernel, parser, LLM experiments, evaluation
project_b/      real snapshot, injector, detectors, hybrid routing, portable contracts
shared/         bounded Gemini client, experiment recorder, reporting, local HTTP adapter
tests/          independent tax oracle, persisted expectations, language and detector tests
evidence/       authentic official calculator, provenance, optional model artifacts
artifacts/      generated measurements, test results, source findings
docs/           plan, architecture, contracts, portability and interview guide
```

See [RESULTS_A](RESULTS_A.md), [RESULTS_B](RESULTS_B.md), [decision matrix](DECISION_MATRIX.md), and
[AI usage](AI_USAGE.md). The final design sections are kept within a two-page prose budget per project.

## HTTP interface

- `GET /api/health` and `GET /api/metrics`
- `POST /api/tax` — structured `TaxInput`; returns both regimes and the normalized input
- `POST /api/tax/describe` — `{ "text": "...", "confirmed": { ... } }`; questions or a calculation
- `POST /api/quality` — `{ "rows": [...], "contract": {...}, "baseline": [...] }`

JSON validation failures return 400; unknown routes 404; unsupported content types 415. Model use is
disabled in this demo service. CLI live experiments are explicit, bounded operations.

## Remaining submission gates

The local implementation is usable and tested. A complete research submission still requires actual
Gemini observations, a reviewed model-compiled policy, and a measured live law-change comparison.
The supplied NYC sample is deliberately small and biased; broaden it and label real semantic cases
before claiming production detection quality. The two official calculator disagreements need reviewer
attention. Create/share a private GitHub repo with the hiring team's account once those details are
known; this workspace has not been published or shared with anyone.

# Project A: results and shipping decision

Generated 2026-11-24T19:08:34.123090+00:00 by `python lab.py reproduce`. Source observations: `artifacts/tax_benchmark.json`.

## Experimental contract

488 fixed profiles, 976 old/new expectations, both financial years.
Expected values come from a separately coded algebraic oracle, not production output. Every profile
is repeated 10 times without a result cache. Model calls are never substituted
with deterministic answers. Time is measured on this machine (3.13.1, Windows).
The annual input model accepts eligible salary-only claims; see `project_a/source_rules.md` for scope.

| Implementation | Rupee-exact evidence | Determinism | p50 / p95, ms | Model cost / 1,000 | Auditability |
|---|---|---|---|---|---|
| Hand-coded policy | 976/976 (100.0%) | 488/488 profiles identical over 10 calls | 0.3680 / 0.6620 | $0 API; compute excluded | 100.0% structural clause-ledger coverage |
| Gemini at query time | partial | 0 fully repeated profiles | not measured / not measured | not measured paid equivalent | Model citations are not an arithmetic proof |
| Gemini-compiled policy | pending_compilation | not measured | not measured / not measured | Zero query calls by design; compilation cost pending unless observed | Versioned JSON, schema validation, regression gate, explicit review |

The handwritten policy is **not** counted as LLM-compiled. Live compilation produces a separate artifact
with model/prompt/source hashes. Only a reviewed artifact can execute. Generated code is never evaluated.
No Gemini API key was present for the initial build. Current model evidence status: **partial**.
Live accuracy, if available, uses only completed calls, alongside requested-call coverage; see the JSON.

## Independent official checks

140 saved executions of the Income Tax Department's official advanced calculator,
138 exact matches, 2 documented upstream differences.
The official JavaScript and full request/response pairs are hash-pinned and replayable with Node.
This exceeds the requested 30 checks, but is **local execution of official code**, not manual browser entry.
The reference accepts salary after standard deduction, so these checks validate downstream taxation,
not independent HRA eligibility or deduction caps. Details: `evidence/official_calculator/README.md`.

The two differences concern old-regime surcharge marginal relief just above INR 5 crore. The engine
retains statutory relief instead of reproducing the apparent calculator defect. Raw differences remain
visible; `python tools/check_official_calculator.py --replay --strict` intentionally fails on them.

## Plain-language evaluation

50/50 expected status decisions on 50 English/Hinglish descriptions,
including contradictions, missing periods, unknown deductions, seniors and out-of-scope income.
Ready cases: 25; clarification/out-of-scope cases: 25.
Fields retain extraction evidence. Missing deductions are not silently set to zero. Gemini suggestions
require explicit confirmation; neither quoted evidence nor temperature zero guarantees correctness.
This curated corpus tests a conservative grammar, not unrestricted language comprehension.

## Task 5: law-change replay

| Approach | Measured change work | What broke / silent failures | Outcome |
|---|---|---|---|
| Hand-coded policy | Replace year pack + validate: 0.000134 s; regression verification: 0.1230 s | Stale FY2024-25 new-regime pack caused 173/488 wrong outputs without exceptions | Updated pack: 488/488 exact |
| Query-time Gemini | Live timing not yet measured | Source and fiscal year are in every prompt; stale prompt/model drift remains a risk | Both-year live protocol implemented, measurements pending credentials |
| Gemini compiler | Live compilation/review timing not yet measured | Edited source invalidates the approved artifact hash | Schema + all-fixture regression gate; human clause review required |

These are **migration replay timings**, not invented historical engineering time. This assignment cannot
claim a measured three-way law-change comparison until live Gemini runs complete.
Mutation checks deliberately disable new-regime marginal relief and change cess to 5%; failure counts:
disable_new_regime_rebate_marginal_relief: 20, change_cess_from_four_to_five_percent: 696.

## Final design (two-page budget; under 600 words)

For 100,000 users, ship a **hybrid input layer** followed by a **rule-only tax kernel**. Explicit fields and
recognized prose use deterministic extraction. Unrecognized prose may go to Gemini for candidate facts,
but missing facts and conflicts produce questions, and model proposals require confirmation. This follows
the parser's measured clarification behavior; broad LLM parsing quality remains unmeasured.

The **rule kernel** uses Decimal arithmetic, immutable validated inputs, explicit fiscal-year policy, and
clause-level ledger entries. 976/976 independent expectations and ten-repeat stability
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

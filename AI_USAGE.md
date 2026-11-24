# AI usage and verification

Codex (GPT-6 coding agent) was used to read the brief, plan the architecture, write code, discover
official sources, and run tests. AI subagents worked in parallel on the tax kernel, NYC data-quality
experiment, and official reference validation, then the latter added portable dataset contracts.
These were AI tools, not other human contributors. The final integration and review were performed
by the main coding agent. The candidate still needs to read and understand every submitted line.

The application targets Google's Gemini 2.5 Flash-Lite free tier for three actual experimental paths:
query-time tax calculation, compilation of statute text into constrained JSON, and semantic review
of public/synthetic NYC records. No Gemini key was available during the initial implementation;
no live model accuracy, latency, cost or compiled provenance has been invented. Mock model responses
are confined to unit tests and are never counted as benchmark observations. A handwritten policy
is not labeled as an LLM-compiled one.

## Where the AI was wrong

The initial prose extractor interpreted the phrase **HRA salary 600000** as a second gross-salary
claim. The HRA example in the 50-description corpus exposed the false conflict. We changed salary
matching to exclude HRA/basic-salary labels and retained the regression case.

Source review found a more consequential mistake: the initial engine selected the enhanced 80D
limit based on the taxpayer's age without also checking residency. The section's definition requires
both for a senior citizen. We corrected the rule, added a separately hand-calculated nonresident
regression (INR 249,600 total), and made parent-senior prose require explicit residency. The independent
oracle had shared the mistaken assumption, illustrating why two implementations do not substitute
for checking the law. See `tests/test_tax_review.py` and the official section 80D reference in the rule pack.

The independent official calculator also disagrees at two old-regime cases just above INR 5 crore.
We preserved the official output and statutory derivation instead of changing results to make a green
comparison. This is an apparent upstream defect, separate from the two AI mistakes above.

## What was checked

- An algebraic test oracle and a slab-iteration production engine use different code paths. Their
  common AI-assisted interpretation remains a source of correlated error, so official evidence is separate.
- Real ITD JavaScript was downloaded from the official host, hashed and executed unchanged with
  explicit input mapping. This was not manual browser calculator verification.
- A source-hashed 2023 NYC snapshot was fetched from the named public dataset. Synthetic corruptions
  have ground truth stored separately from detector inputs. Raw semantic flags are unadjudicated.
- Generic orders, support and telemetry tests cover schema changes without depending on NYC names.
- Pytest, Ruff, local service checks and browser checks are recorded in generated/local artifacts.

## Candidate review before submission

Read the tax kernel, parser, injector and metric denominators. Reproduce the results. Complete real
Gemini experiments and clause review, examine the documented source limitations, and practice the
changes in `docs/DEFENCE.md`. Do not claim the unexecuted experiments as completed work.

# Explain and change the system

Practice these with the code open, not from memorized claims:

1. Explain why the new-regime rebate creates a cliff without marginal relief, and why cess is applied
   after relief. Change the rebate threshold in a copied policy and find the failing fixtures.
2. Explain 288A/288B rounding and the difference between a rupee-exact assertion and rounding liability
   to the statutory nearest ten. Walk through one boundary fixture and its ledger.
3. Show the official calculator request mapping, two preserved discrepancies, and why a reference
   calculator is not sufficient evidence for documentary deduction eligibility.
4. Add a new paraphrase to the prose corpus. Demonstrate what happens when a salary period, residency,
   deduction amount, or parent's qualifying senior status is missing. Do not hide defaults.
5. Change the order schema from `amount` to `invoice_total`, then run the same generic checks using
   the modified contract. Explain why NYC ZIP mappings do not transfer to orders.
6. Add a new corruption variant without changing the detector. Explain why easy synthetic corruptions
   and clean templates can exaggerate recall and understate false alarms.
7. Explain row versus batch scoring, duplicate group labels, source holdout versus clean controls,
   partial model coverage, and why model failure must not become a negative prediction.
8. Reduce the model budget to zero. Show that hard checks still run while semantic findings remain
   pending. Explain the cost/coverage trade-off and free-tier limits at production scale.
9. Explain which figures are measured, which are projections, and which are still missing. Never
   defend an unexecuted Gemini experiment as a result.

For a next iteration, prioritize live model evidence, broader data sampling, independently adjudicated
semantic labels, per-tenant alert budgets, and real end-to-end load testing before adding frameworks.

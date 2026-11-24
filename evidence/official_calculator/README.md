# Official calculator cross-checks

The suite contains **140 executions of the Income Tax Department's actual JavaScript calculator**, downloaded from its official static host. It covers AY 2025-26 and AY 2026-27, both regimes, slab/rebate thresholds, marginal relief, surcharge thresholds, senior citizens and nonresidents. Project A matches **138 cases exactly**; two upstream discrepancies are documented rather than hidden or copied into the engine.

This evidence is local execution of downloaded official calculator code. It is not a claim of 140 manual browser entries or screenshots. The JavaScript engine itself is unmodified. The small Node harness supplies ordinary input objects and the `$.each` callback helper expected by that engine, using a fresh execution context for every case.

Run from the repository root:

```powershell
python tools/check_official_calculator.py --replay
```

Python checks the pinned official artifact hashes, then Node executes every official fixture again. The checker compares the saved official result with Project A. Unknown discrepancies fail. `--strict` also fails on the two documented differences. Omit `--replay` to compare saved official outputs without Node.js.

## Provenance

The source is the [ITD e-Filing calculator](https://eportal.incometax.gov.in/iec/foservices/#/TaxCalc/calculator). `provenance.json` records retrieval time, URLs, sizes, SHA-256 digests and the discovery chain from the portal HTML through its application bundles and asset manifest. Large application bundles used only for discovery are not retained; their hashes and URLs are recorded. The retained `chunk-map.json` selects the hashed `itdcalc-current.js` asset. This is the exact file used for fixture execution. The readable fallback `itdcalc.js` is included as supplemental source evidence; it is not the executed fixture source.

## Input and output contract

Every fixture saves the explicit application request, the official input object, and the official output. Values use rupees, not lakhs or thousands. FY 2024-25 maps to AY 2025-26; FY 2025-26 maps to AY 2026-27. Resident is `R`, nonresident is `NR`; age groups are `NM`, `SR` and `SSR`.

The advanced official engine's `slinc` input means income under salaries **after** the standard deduction. Project A accepts gross salary **before** that deduction. Each fixture therefore maps gross salary to taxable salary by subtracting Rs 50,000 in the old regime or Rs 75,000 in the new regime. Other deductions and income categories are zero. This suite verifies the tax computation at the resulting income; it does not independently verify HRA or every deduction cap. Those are covered by the project's separate rule tests.

`GrossTax` is slab tax, `rebate87A` includes the ordinary rebate or its marginal relief, `TaxAftr87A` is tax after that adjustment, `Surcharge` is the remaining surcharge, and `ECess` is health and education cess. `TotalTax` is the official pre-final-rounding total. `BalTax` is the official nearest-ten rounded balance, before interest and fees; with no TDS or advance payments it is directly comparable to Project A's `total_tax`. Both values are retained. The checker also verifies the relationship between them. `NetTax` is deliberately not compared because it incorporates filing/payment interest outside the assignment scope.

The official code truncates some components using `parseInt`. The selected income points avoid component rounding ambiguity; income rounding edge cases are covered separately by statutory rule tests.

## Two documented upstream discrepancies

Both failures concern old-regime taxable income of Rs 50,001,000, one for each FY. The pinned official code returns `BalTax = 21,105,280`. Project A returns `19,257,290`, applying surcharge marginal relief at Rs 5 crore. The [ITD published marginal-relief guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3) includes that threshold for the old regime.

The independent calculation is: tax at Rs 50,000,000 is Rs 14,812,500; add the 25% surcharge applicable at the threshold to obtain Rs 18,515,625; add the income excess of Rs 1,000, then apply 4% cess to obtain Rs 19,257,290. The current calculator does not effectively apply that relief for this input. The raw official output remains in `fixtures.json`, and exact allowed differences are recorded in `known_discrepancies.json`. No production result is changed to match this apparent calculator defect.

The [official calculator FAQ](https://www.incometax.gov.in/iec/foportal/income-tax-calculator-faqs) itself explains that calculator outputs are estimates and statutory provisions determine final liability.

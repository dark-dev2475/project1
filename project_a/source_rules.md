# Salary tax rule pack

Reviewed 2026-11-24. This is an engineering transcription of official sources, not a new source of tax law. `tax_rules.json` was manually assembled and reviewed during this implementation; it is **not** represented as an LLM-compiled artifact. A live compilation must preserve its own model output and provenance.

## Scope and input meaning

Annual INR salary only; gross salary includes HRA received. `hra_salary` means eligible basic salary, qualifying DA and fixed turnover-based commission for the rental period. `metro` means Delhi, Mumbai, Kolkata or Chennai. Annual aggregation assumes the same applicable rental conditions; changing cities/rent or salary periods require separate period calculations, outside this compact input model. Inputs for deductions are **eligible amounts**, not raw expenditure: the caller must already establish payment mode, qualifying policies/investments, ownership, loan purpose and completion conditions. 80CCD(1B) is an additional eligible contribution, not an amount already included in 80C. `self_family_senior` means a qualifying insured family member is a senior citizen; the taxpayer's own age also selects that limit. The model does not prove documentary eligibility.

Self-occupied interest is restricted to qualifying purchase/construction loans eligible for the INR 200,000 cap. Repair loans, older loans with INR 30,000 caps and carry-forward losses are not modeled. Other income heads, employer NPS, professional tax, TDS/advance tax credits and tax-payment interest are unsupported. Unknown structured fields are rejected. This calculates annual liability, not balance remaining to pay.

## FY 2024-25 / AY 2025-26

New regime taxable-income bands and marginal rates: 0–300,000: 0%; 300,000–700,000: 5%; 700,000–1,000,000: 10%; 1,000,000–1,200,000: 15%; 1,200,000–1,500,000: 20%; above 1,500,000: 30%. Standard deduction is 75,000, limited to salary. Resident section 87A rebate applies when total income is at most 700,000, capped at 25,000 and actual tax. Just above 700,000, rebate marginal relief limits income tax before cess to the excess over 700,000 when that is lower than slab tax. HRA, listed personal Chapter VI-A deductions and self-occupied interest are unavailable in this regime.

The official [AY 2025-26 salaried guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3) supports these slab rates. Its rebate table describes actual salary-only tax at the threshold (20,000); the **statutory rebate cap is 25,000**, confirmed by the [Budget 2025 explanatory memorandum](https://indiabudget.gov.in/budget2025-26/doc/memo.pdf), section on rebate under 87A. In salary-only cases the difference cannot affect the answer because slab tax at 700,000 is 20,000. The [official salaried deduction guidance](https://wm.incometaxindia.gov.in/w/deductions/allowances-allowed-to-a-salaried-employee) describes the Finance (No. 2) Act 2024 increase in standard deduction to 75,000.

## FY 2025-26 / AY 2026-27

New regime taxable-income bands and marginal rates: 0–400,000: 0%; 400,000–800,000: 5%; 800,000–1,200,000: 10%; 1,200,000–1,600,000: 15%; 1,600,000–2,000,000: 20%; 2,000,000–2,400,000: 25%; above 2,400,000: 30%. Standard deduction remains 75,000. Resident rebate threshold becomes 1,200,000 and maximum rebate 60,000. Marginal relief applies above 1,200,000 by the same excess-income principle. Old-regime rates and all implemented deduction caps stay unchanged.

Sources: [ITD highlights of the Finance Act 2025](https://incometaxindia.gov.in/news/highlights-to-finance-act-2025.pdf) and [ITD Finance Act 2025 section 20](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-20-111). The latter records the 87A amendment. The [ITD Budget FAQ](https://www.incometaxindia.gov.in/documents/20117/15766092/FAQs-Budget-2026.pdf/ff3d0e10-88a0-b11f-3c27-b58375974227?download=true&t=1770036575267&version=1.0) gives a useful independently stated example: taxable income 1,210,000 produces slab tax 61,500, reduced by marginal relief to 10,000 before cess. Our dedicated test expects 10,400 including cess.

## Old regime, both years

Basic exemption is 250,000, or 300,000 for residents aged 60–79, or 500,000 for residents aged 80+. Nonresidents do not receive the enhanced age exemptions. Above the relevant exemption up to 500,000, rate is 5%; from 500,000 to 1,000,000 it is 20%; above 1,000,000 it is 30%. Resident rebate at income at most 500,000 is the lesser of actual tax and 12,500. There is no old-regime rebate marginal relief. Standard deduction is 50,000, limited to salary after HRA.

The [ITD tax rates publication](https://wmstatic-prd.incometaxindia.gov.in/documents/20117/42998/Tax-rates%E2%80%8B_2026-05-19_03-01-39_8e0e4f_en.pdf/021c2f6a-881c-f666-3449-ccf0bcc172b8?download=true&t=1780051712132&version=2.0) lists both assessment years and explicitly distinguishes resident seniors from nonresidents. The [old/new FAQ](https://www.incometax.gov.in/iec/foportal/help/new-tax-vs-old-tax-regime-faqs) explains old-regime rebate eligibility.

HRA exemption is max(0, min(actual HRA, rent minus 10% of HRA salary, 50% of HRA salary in the four metros / 40% elsewhere)). Source: [ITD section 10 commentary on Rule 2A](https://wm.incometaxindia.gov.in/w/section-10-24).

Eligible 80C amount is capped at 150,000; 80CCD(1B) at 50,000. 80D self/family and parents each have a separate 25,000 limit, increased to 50,000 where the relevant covered person is a qualifying senior. Eligible self-occupied interest is capped at 200,000. Chapter VI-A deductions cannot make total income negative. Sources: [ITD deductions table](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/deductions) and [AY 2025-26 deduction guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3).

## Surcharge, cess and rounding

Surcharge applies only when taxable income **exceeds** 5,000,000 (10%), 10,000,000 (15%) or 20,000,000 (25%). Old regime additionally applies 37% above 50,000,000; new regime remains capped at 25%. At each jump, tax plus surcharge is limited to tax plus applicable surcharge at the threshold, plus excess income. Cess is 4% after rebate and surcharge marginal relief. Source: [ITD AY 2026-27 salaried guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1).

Round taxable total income under [section 288A](https://www.incometaxindia.gov.in/hi/w/section-288a-58) and final tax liability under [section 288B](https://www.incometaxindia.gov.in/hi/w/section-288b-58): discard paise, then round to the nearest multiple of ten rupees, with last digit five rounding upward. There is no intermediate integer truncation of individual tax or cess components in this implementation.

## Evidence and limits

Section 80D's senior-citizen definition requires **Indian residence and age 60 or older**.
The taxpayer's own age selects the enhanced limit only when `resident=True`.
`self_family_senior` and `parents_senior` explicitly assert a qualifying **resident** senior in that group;
the taxpayer may be nonresident while an insured family member is resident.
Source: [ITD section 80D, Explanation](https://wmstatic-prd.incometaxindia.gov.in/hi/w/section-80d-59).

`tests/tax_oracle.py` is an independent, manually transcribed algebraic oracle: it sums positive-part slope changes, whereas production iterates slabs from a declarative config. Neither imports the other. `tests/fixtures/tax_cases.json` persists the expected values and labels them as independent engineering expectations, **not official calculator results**. Tests were written and executed before production modules existed; that first run failed on missing `project_a`, then passed after implementation. Independent code can still share interpretation mistakes, so official calculator evidence is tracked separately under `evidence/official_calculator/`.

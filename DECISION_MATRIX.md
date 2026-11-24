# Decision matrix

Choices are provisional wherever live LLM or adjudicated production evidence is missing.

| Component | Choice | Measurement and rationale | Audit / maintenance trade-off |
|---|---|---|---|
| Tax arithmetic | rule | 976/976 exact, 488 profiles stable over ten calls | Versioned clause ledger; requires statutory review |
| Input extraction | hybrid | 50/50 status decisions; ambiguity asks questions | LLM suggestions require confirmation; unrestricted prose unmeasured |
| Policy compiler | LLM + rule gate | No live compilation observation yet; cannot establish superiority | JSON only, hash approval, regression tests; no eval |
| Query-time tax LLM | LLM baseline, not selected | Live cost/quality/determinism pending | No hidden deterministic repair; citations alone are insufficient |
| schema | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | batch unit; empirical/semantic alerts require adjudication |
| type | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | batch unit; empirical/semantic alerts require adjudication |
| date_format | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | batch unit; empirical/semantic alerts require adjudication |
| coordinates | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| duplicates | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| near_duplicates | hybrid (review candidate) | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| null_spike | statistical + rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | batch unit; empirical/semantic alerts require adjudication |
| chronology | rule | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| zip_borough | hybrid (review candidate) | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| complaint_descriptor | hybrid (review candidate) | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| resolution_status | hybrid (review candidate) | Rule recall 100.0%, statistical recall 100.0%; clean FAR 0.0%/0.0%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| pii | hybrid (review candidate) | Rule recall 76.7%, statistical recall 100.0%; clean FAR 0.0%/12.5%; LLM pending | physical_row unit; empirical/semantic alerts require adjudication |
| Cross-dataset contract | rule + statistical | Independent orders/support/sensor tests; explicit baseline null drift | Domain semantics require declared mappings, never NYC defaults |

Full numerators, denominators, timings and limits: `artifacts/data_quality_benchmark.json` and `artifacts/tax_benchmark.json`.

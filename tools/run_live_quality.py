"""Run one or more real Gemini quality experiments with per-kind cost attribution."""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))

from project_b.evaluation import run_benchmark  # noqa: E402
from project_b.injector import KINDS  # noqa: E402
from project_b.llm import LLMReviewer  # noqa: E402
from shared.gemini import Gemini  # noqa: E402
from shared.quality_live import fingerprint  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kinds",nargs="+",choices=KINDS,default=list(KINDS))
    parser.add_argument("--max-calls",type=int,default=40)
    args = parser.parse_args()
    if not Gemini().configured:
        parser.error("Set GEMINI_API_KEY; no model measurements have been generated")
    folder = ROOT/"evidence/live"
    folder.mkdir(parents=True,exist_ok=True)
    remaining = args.max_calls
    for kind in args.kinds:
        if remaining <= 0:
            print("Budget exhausted; remaining kinds are unmeasured.")
            break
        client = Gemini(max_calls=remaining)
        result = run_benchmark(reviewer=LLMReviewer(client),kinds=(kind,))
        metric = result["per_method"]["llm"][kind]
        usage = client.usage()
        cost = usage["paid_equivalent_usd"]
        metric["api_cost_usd_per_million_rows"] = cost/metric["rows_processed"]*1_000_000 if cost is not None and metric["rows_processed"] else None
        metric["cost_basis"] = "Actual successful-call token usage at paid-equivalent rates; failed-call token usage unavailable. Free-tier actual charge assumed zero."
        record = {"fingerprint":fingerprint(),"kind":kind,"model":client.model,"metric":metric,"usage":usage,"errors":result["llm"]["errors"],"observations":[o.to_dict() for o in client.observations]}
        (folder/f"quality_{kind}.json").write_text(json.dumps(record,indent=2)+"\n",encoding="utf-8")
        remaining -= client.attempts
        print(f"{kind}: {metric['status']} ({metric['evaluated_units']}/{metric['expected_review_units']} reviewed units)")
    print("Run python lab.py reproduce to include these source-matched live observations in the reports.")


if __name__ == "__main__":
    main()

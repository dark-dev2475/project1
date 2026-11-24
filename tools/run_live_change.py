"""Measure the live law-change experiment without confusing it with development time."""
import argparse
import json
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))

from project_a.evaluation import FIXTURES  # noqa: E402
from project_a.llm import source_text, query_tax, compile_policy, check_compiled  # noqa: E402
from project_a.models import TaxInput  # noqa: E402
from shared.gemini import Gemini, ModelUnavailable  # noqa: E402


def stale_source():
    """Deliberately transplant the old new-regime law into the FY2025-26 section."""
    text = source_text()
    old_start = text.index("## FY 2024-25 / AY 2025-26")
    new_start = text.index("## FY 2025-26 / AY 2026-27")
    common_start = text.index("## Old regime, both years")
    old_section = text[old_start:new_start]
    stale_section = old_section.replace("## FY 2024-25 / AY 2025-26", "## FY 2025-26 / AY 2026-27")
    return text[:new_start] + stale_section + text[common_start:]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-calls",type=int,default=14)
    parser.add_argument("--cases",type=int,default=5)
    args = parser.parse_args()
    client = Gemini(max_calls=args.max_calls)
    if not client.configured:
        parser.error("Set GEMINI_API_KEY to measure live changes")
    if args.cases < 1:
        parser.error("--cases must be positive")
    cases = json.loads(FIXTURES.read_text(encoding="utf-8"))["cases"]
    eligible = [c for c in cases if c["input"]["fiscal_year"] == "2025-26" and c["expected"]["new"]["total_tax"] > 0]
    selected = [eligible[int(i*(len(eligible)-1)/max(1,args.cases-1))] for i in range(min(args.cases,len(eligible)))]
    folder = ROOT/"evidence/live/law_change"
    folder.mkdir(parents=True,exist_ok=True)
    result = {"measurement_kind":"Live source-update/recompile replay, not historical implementation effort",
              "query":[],"compiler":[],"errors":[]}
    for phase,text in (("stale",stale_source()),("updated",source_text())):
        started = time.perf_counter()
        for case in selected:
            try:
                response = query_tax(TaxInput.from_dict(case["input"]),client,rule_text_override=text)
                exact = {regime:response["result"][regime]["total_tax"]==case["expected"][regime]["total_tax"] for regime in ("old","new")}
                result["query"].append({"phase":phase,"case_id":case["id"],"exact":exact,
                                        "silent_failure":not all(exact.values()),**response})
            except ModelUnavailable as exc:
                result["errors"].append({"phase":phase,"implementation":"query","error":str(exc)})
                break
        result[f"{phase}_query_wall_seconds"] = time.perf_counter()-started
        try:
            started = time.perf_counter()
            artifact = compile_policy(client,folder/f"{phase}_candidate.json",rule_text_override=text)
            seconds = time.perf_counter()-started
            gate_start = time.perf_counter()
            gate = check_compiled(artifact,cases)
            result["compiler"].append({"phase":phase,"compilation_seconds":seconds,
                                       "verification_seconds":time.perf_counter()-gate_start,"gate":gate,
                                       "review":"pending source-clause review; candidate is not approved"})
        except (ModelUnavailable,ValueError) as exc:
            result["errors"].append({"phase":phase,"implementation":"compiler","error":str(exc)})
    result["usage"] = client.usage()
    result["status"] = "completed_model_observations_review_pending" if not result["errors"] else "partial"
    (folder/"results.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":result["status"],"path":str(folder/"results.json"),"usage":result["usage"]},indent=2))


if __name__ == "__main__":
    main()

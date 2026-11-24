"""One entry point for reproduction, experiments, the local service, and datasets."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def print_json(value):
    print(json.dumps(value, indent=2, ensure_ascii=sys.stdout.encoding.lower() != "utf-8", allow_nan=False))


def reproduce(args):
    from project_a.evaluation import run_benchmark as tax_benchmark
    from project_a.parser import parse_description
    from project_b.evaluation import run_benchmark as quality_benchmark
    from project_b.dataset import load_snapshot
    from project_b.detectors import Profile, normalize
    from project_b.pipeline import run_pipeline
    from shared.experiments import replay_live, benchmark_compiled, tax_live
    from shared.reporting import write_reports
    artifacts = ROOT / "artifacts"
    artifacts.mkdir(exist_ok=True)
    print("[1/5] Running tests", flush=True)
    result = subprocess.run([sys.executable, "-m", "pytest", "-q", "--tb=short", "--junitxml=artifacts/tests.xml"], cwd=ROOT, capture_output=True, text=True)
    (artifacts/"tests.log").write_text(result.stdout + result.stderr, encoding="utf-8")
    print(result.stdout.strip())
    if result.returncode:
        raise RuntimeError("Tests failed; reports were not overwritten")
    suites = ET.parse(artifacts/"tests.xml").getroot()
    count = sum(int(item.attrib.get("tests",0)) for item in suites.findall("testsuite"))
    test_summary = {"passed": count, "summary": f"{count} tests passed", "log": "artifacts/tests.log"}
    print("[2/5] Replaying pinned official calculator", flush=True)
    check = subprocess.run([sys.executable, "tools/check_official_calculator.py", "--replay"], cwd=ROOT, capture_output=True, text=True)
    (artifacts/"official_check.txt").write_text(check.stdout + check.stderr, encoding="utf-8")
    print("\n".join(check.stdout.splitlines()[:2]))
    if check.returncode:
        raise RuntimeError("Official reference replay failed; inspect artifacts/official_check.txt. Node.js is required.")
    print("[3/5] Measuring tax, repeatability and law-change replay", flush=True)
    a = tax_benchmark()
    descriptions = read_json(ROOT/"project_a/descriptions.json")
    parsed = [parse_description(item["text"]) for item in descriptions]
    a["parser"] = {"cases": len(parsed), "correct": sum(p["status"]==c["expected_status"] for p,c in zip(parsed,descriptions)), "ready": sum(p["status"]=="ready" for p in parsed)}
    a["llm_query_time"] = replay_live()
    a["llm_compiled"] = benchmark_compiled(ROOT/"evidence/compiled/policy.json")
    reviewer = None
    if args.live:
        from shared.gemini import Gemini
        from project_b.llm import LLMReviewer
        client = Gemini(max_calls=args.max_calls)
        if not client.configured:
            raise ValueError("Live run requires GEMINI_API_KEY; no calls or substitute results were made")
        a["llm_query_time"] = tax_live(client, case_limit=args.tax_cases)
        reviewer = LLMReviewer(client)
    print("[4/5] Measuring all data-quality families and hybrid routing", flush=True)
    b = quality_benchmark(reviewer=reviewer)
    if not reviewer:
        from shared.quality_live import replay_quality
        b = replay_quality(b)
    raw, _ = load_snapshot()
    rows = normalize(raw)
    pipeline = run_pipeline(rows[1::2], Profile.fit(rows[::2]), reviewer, sample_rate=.01, seed=9)
    if reviewer:
        b["llm"]["usage"] = reviewer.client.usage()
        # This is shared-run usage, not an invented per-detector allocation.
        b["llm"]["usage_scope"] = "All live calls in this invocation including Project A; per-family cost attribution needs separate runs."
    print("[5/5] Rendering submission reports and local evidence viewer", flush=True)
    from project_b.portable import run_validation
    portability = {}
    for name, filename, contract in (("orders","orders.csv","orders.json"),("support","support.jsonl","support.json"),("sensors","sensors.json","sensors.json")):
        validation = run_validation(ROOT/"examples"/filename,ROOT/"docs/contracts"/contract)
        (artifacts/f"{name}_validation.json").write_text(json.dumps(validation,indent=2)+"\n",encoding="utf-8")
        portability[name] = {"rows":validation["row_count"],"alerts":validation["alert_count"]}
    summary = write_reports(a,b,pipeline,test_summary=test_summary,portable={"supported_formats":["csv","json","jsonl","ndjson"],"tested_domains":["orders","support_tickets","global_telemetry"],"examples":portability})
    print(f"Done: {count} tests; {a['hand_coded']['exact']}/{a['hand_coded']['checked']} tax expectations; 12 corruption kinds.")
    print("Reports: RESULTS_A.md, RESULTS_B.md, DECISION_MATRIX.md, reports/index.html")
    print("Gemini:", summary["tax"]["llm_query_time"]["status"])
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    rep = commands.add_parser("reproduce", help="Run tests, official replay, benchmarks and reports")
    rep.add_argument("--live", action="store_true", help="Add bounded, genuine Gemini observations")
    rep.add_argument("--max-calls", type=int, default=40)
    rep.add_argument("--tax-cases", type=int, default=5, help="Use 488 for the full corpus; resumable across quotas")
    server = commands.add_parser("serve", help="Open the local HTTP service and evidence viewer")
    server.add_argument("--port", type=int, default=8765)
    tax = commands.add_parser("tax", help="Calculate from JSON or conservatively parse a description")
    group = tax.add_mutually_exclusive_group(required=True)
    group.add_argument("--input", type=Path)
    group.add_argument("--text")
    tax.add_argument("--implementation", choices=["rules","llm","compiled"], default="rules")
    tax.add_argument("--policy", type=Path, default=ROOT/"evidence/compiled/policy.json")
    dq = commands.add_parser("check-data", help="Validate a new dataset against its own contract")
    dq.add_argument("--input", required=True, type=Path)
    dq.add_argument("--contract", required=True, type=Path)
    dq.add_argument("--baseline", type=Path)
    dq.add_argument("--output", type=Path)
    compile_cmd = commands.add_parser("compile-policy", help="Ask Gemini to compile a reviewable JSON candidate")
    compile_cmd.add_argument("--output", type=Path, default=ROOT/"evidence/compiled/policy.json")
    review = commands.add_parser("review-policy", help="Run the regression gate; optionally record a completed clause review")
    review.add_argument("--policy", type=Path, default=ROOT/"evidence/compiled/policy.json")
    review.add_argument("--approve", action="store_true")
    review.add_argument("--reviewer", help="Required with --approve; identifies who completed the source review")
    args = parser.parse_args(argv)
    try:
        if args.command == "reproduce":
            return reproduce(args)
        if args.command == "serve":
            from shared.service import serve
            serve(args.port)
            return 0
        if args.command == "tax":
            from project_a.models import TaxInput
            from project_a.engine import compare
            if args.text is not None:
                from project_a.parser import parse_description
                parsed = parse_description(args.text)
                if parsed["status"] != "ready":
                    print_json(parsed)
                    return 2
                inp = TaxInput.from_dict(parsed["fields"])
            else:
                inp = TaxInput.from_dict(read_json(args.input))
            if args.implementation == "rules":
                print_json(compare(inp))
            elif args.implementation == "llm":
                from project_a.llm import query_tax
                from shared.gemini import Gemini
                print_json(query_tax(inp,Gemini()))
            else:
                from project_a.llm import compiled_tax
                print_json(compiled_tax(inp,args.policy))
            return 0
        if args.command == "check-data":
            from project_b.portable import run_validation
            result = run_validation(args.input,args.contract,args.baseline)
            if args.output:
                args.output.parent.mkdir(parents=True,exist_ok=True)
                args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
            else:
                print_json(result)
            return 2 if result["alert_count"] else 0
        if args.command == "compile-policy":
            from project_a.llm import compile_policy
            from shared.gemini import Gemini
            artifact = compile_policy(Gemini(),args.output)
            print_json({"path":str(args.output),"review":artifact["review"],"policy_sha256":artifact["policy_sha256"]})
            return 0
        if args.command == "review-policy":
            from project_a.llm import check_compiled
            from project_a.evaluation import FIXTURES
            artifact = read_json(args.policy)
            result = check_compiled(artifact,read_json(FIXTURES)["cases"])
            if args.approve:
                if not args.reviewer or not result["passed"]:
                    raise ValueError("Approval requires --reviewer and a fully passing regression gate")
                artifact["review"] = {"status":"approved","reviewer":args.reviewer,
                                      "reviewed_at":datetime.now(timezone.utc).isoformat(),"policy_sha256":artifact["policy_sha256"],"gate":result}
                args.policy.write_text(json.dumps(artifact,indent=2)+"\n",encoding="utf-8")
            print_json(result)
            return 0 if result["passed"] else 1
    except (ValueError, RuntimeError, OSError, KeyError) as exc:
        print(f"Error: {exc}",file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

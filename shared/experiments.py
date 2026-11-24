"""Live tax experiment and replayable observations, separated from local benchmarks."""
from __future__ import annotations

from collections import defaultdict
import hashlib
import json
from pathlib import Path
import statistics
import time

from project_a.evaluation import FIXTURES
from project_a.llm import query_tax, source_text, load_compiled, check_compiled
from project_a.engine import compare
from project_a.models import TaxInput
from shared.gemini import Gemini, ModelUnavailable

ROOT = Path(__file__).resolve().parents[1]
LIVE_PATH = ROOT / "evidence" / "live" / "tax_observations.json"


def tax_live(client: Gemini, *, case_limit=5, repetitions=10, path=LIVE_PATH):
    if not client.configured:
        raise ModelUnavailable("Set GEMINI_API_KEY before live evaluation")
    if case_limit < 1 or repetitions < 10:
        raise ValueError("case_limit must be positive and repetitions at least 10")
    cases = json.loads(FIXTURES.read_text(encoding="utf-8"))["cases"]
    if case_limit < len(cases):
        # Span the ordered fixture set, rather than select only easy zero-tax cases.
        indices = sorted({int(i * (len(cases)-1) / max(1, case_limit-1)) for i in range(case_limit)})
        cases = [cases[i] for i in indices]
    fingerprint = hashlib.sha256((source_text() + client.model + json.dumps(cases, sort_keys=True)).encode()).hexdigest()
    data = {"fingerprint": fingerprint, "model": client.model, "cases": [c["id"] for c in cases],
            "repetitions": repetitions, "observations": [], "errors": [],
            "cache_policy": "Each repetition is a distinct live call. Resume replays only that exact recorded experiment slot."}
    if path.exists():
        saved = json.loads(path.read_text(encoding="utf-8"))
        if saved.get("fingerprint") == fingerprint and saved.get("repetitions") == repetitions:
            data = saved
    done = {(r["case_id"], r["repeat"]) for r in data["observations"]}
    path.parent.mkdir(parents=True, exist_ok=True)
    # Round-robin repetitions provides broad coverage even on small free-tier budgets.
    stopped = False
    for repeat in range(repetitions):
        for case in cases:
            if (case["id"], repeat) in done:
                continue
            try:
                result = query_tax(TaxInput.from_dict(case["input"]), client)
            except ModelUnavailable as exc:
                data["errors"].append({"case_id": case["id"], "repeat": repeat, "error": str(exc)})
                stopped = True
                break
            data["observations"].append({"case_id": case["id"], "fiscal_year": case["input"]["fiscal_year"],
                                         "repeat": repeat, "expected": case["expected"], **result})
            path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        if stopped:
            break
    data["last_run_usage"] = client.usage()
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return summarize_live(data)


def summarize_live(data):
    observations = data["observations"]
    expected_calls = len(data["cases"]) * data["repetitions"]
    groups = defaultdict(list)
    years = defaultdict(lambda: {"checked": 0, "exact": 0})
    exact = 0
    for row in observations:
        groups[row["case_id"]].append((row["result"]["old"]["total_tax"], row["result"]["new"]["total_tax"]))
        for regime in ("old", "new"):
            match = row["result"][regime]["total_tax"] == row["expected"][regime]["total_tax"]
            exact += match
            years[row["fiscal_year"]]["checked"] += 1
            years[row["fiscal_year"]]["exact"] += match
    complete = [values for values in groups.values() if len(values) == data["repetitions"]]
    latencies = sorted(row["observation"]["latency_ms"] for row in observations)
    costs = [row["observation"]["paid_equivalent_usd"] for row in observations]
    return {"status": "completed" if len(observations) == expected_calls else "partial",
            "model": data["model"], "requested_calls": expected_calls, "completed_calls": len(observations),
            "coverage": len(observations)/expected_calls if expected_calls else 0,
            "regime_answers": len(observations)*2, "exact": exact,
            "accuracy_on_completed": exact/(2*len(observations)) if observations else None,
            "complete_repeatability_profiles": len(complete),
            "deterministic_profiles": sum(len(set(values)) == 1 for values in complete),
            "determinism_scope": "Old/new tax totals only; free-form model explanations may differ",
            "latency_ms_p50": statistics.median(latencies) if latencies else None,
            "latency_ms_p95": latencies[int((len(latencies)-1)*.95)] if latencies else None,
            "paid_equivalent_usd_per_1000": statistics.mean(costs)*1000 if costs and all(c is not None for c in costs) else None,
            "free_tier_model_charge_usd": 0 if observations else None,
            "cost_scope": "Paid-equivalent mean for completed valid responses; invalid/failed attempts are separate and may have unavailable token usage",
            "by_fiscal_year": dict(years), "errors": data["errors"],
            "auditability": "Model cites clauses; no verified arithmetic ledger. Citation presence is not legal correctness.",
            "change_measurement": "Both year packs evaluated against expected fixtures; live edit/recompile engineering time not measured."}


def replay_live(path=LIVE_PATH):
    if not path.exists():
        return {"status": "pending_provider", "reason": "No Gemini observations recorded; configure GEMINI_API_KEY"}
    data = json.loads(path.read_text(encoding="utf-8"))
    all_cases = json.loads(FIXTURES.read_text(encoding="utf-8"))["cases"]
    cases = [c for c in all_cases if c["id"] in data["cases"]]
    fingerprint = hashlib.sha256((source_text() + data["model"] + json.dumps(cases, sort_keys=True)).encode()).hexdigest()
    if data.get("fingerprint") != fingerprint:
        return {"status": "stale_evidence", "reason": "Source, model or fixtures changed; rerun the live experiment"}
    return summarize_live(data)


def benchmark_compiled(path):
    if not path.exists():
        return {"status": "pending_compilation", "reason": "No reviewed Gemini-compiled policy artifact exists"}
    try:
        artifact = load_compiled(path)
    except (ValueError, KeyError) as exc:
        return {"status": "pending_review", "reason": str(exc)}
    cases = json.loads(FIXTURES.read_text(encoding="utf-8"))["cases"]
    gate = check_compiled(artifact, cases)
    latencies, deterministic = [], 0
    for case in cases:
        inp = TaxInput.from_dict(case["input"])
        values = []
        for _ in range(10):
            start = time.perf_counter()
            result = compare(inp, config=artifact["policy"])
            latencies.append((time.perf_counter()-start)*1000)
            values.append(json.dumps(result, sort_keys=True))
        deterministic += len(set(values)) == 1
    return {"status": "completed", "gate": gate, "deterministic_profiles": deterministic,
            "profiles": len(cases), "repetitions": 10, "latency_ms_p50": statistics.median(latencies),
            "latency_ms_p95": sorted(latencies)[int((len(latencies)-1)*.95)],
            "query_model_cost_usd_per_1000": 0,
            "one_time_compilation_paid_equivalent_usd": artifact["observation"]["paid_equivalent_usd"],
            "policy_sha256": artifact["policy_sha256"], "review": artifact["review"]}

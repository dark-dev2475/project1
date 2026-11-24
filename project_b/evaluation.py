"""Reproduce source profiling and independent held-out corruption measurements."""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import asdict
import json
from pathlib import Path
import platform
from time import perf_counter

from .dataset import load_snapshot
from .detectors import (Profile, hybrid_detect, normalize,
                        review_candidates, rule_detect, statistical_detect)
from .injector import BATCH_KINDS, KINDS, clean_fixtures, inject


def _profile_raw(rows, profile):
    counts = {key: sum(row.get(key) in (None, "") for row in rows) for key in sorted(profile.columns)}
    flags = rule_detect(rows, profile)
    by_kind = defaultdict(list)
    for alert in flags:
        example = asdict(alert)
        if alert.row_id != "__batch__":
            row = rows[int(alert.row_id)]
            example["unique_key"] = row.get("unique_key")
            example["values"] = {k: row.get(k) for k in ("created_date", "closed_date", "incident_zip", "borough", "complaint_type", "descriptor", "status")}
        by_kind[alert.kind].append(example)
    return {"rows": len(rows), "missing_by_column": counts,
            "months": dict(sorted(Counter(str(r.get("created_date"))[:7] for r in rows).items())),
            "potential_issues": {k: {"count": len(v), "examples": v[:3]} for k, v in sorted(by_kind.items())},
            "interpretation": "Nulls and negative elapsed times are observed facts. Duplicate, geographic-consensus, semantic and PII flags require adjudication; agency contact numbers are not necessarily private PII. Raw flags are not false-positive or precision labels."}


def _fixture_scenarios(training, profile):
    counts = Counter()
    examples = {}
    for row in training:
        descriptor = str(row.get("descriptor") or "").strip().lower()
        if profile.descriptor_complaint.get(descriptor) != row.get("complaint_type"):
            continue
        if profile.zip_borough.get(str(row.get("incident_zip"))) != row.get("borough"):
            continue
        if not isinstance(row.get("latitude"), float) or not isinstance(row.get("longitude"), float):
            continue
        if not (40.4 < row["latitude"] < 41 and -74.3 < row["longitude"] < -73.6):
            continue
        key = (row["agency"], row["complaint_type"], row["descriptor"], row["incident_zip"], row["borough"])
        counts[key] += 1
        examples[key] = key + (row["latitude"], row["longitude"])
    selected = []
    complaints = set()
    for key, _ in counts.most_common():
        if key[1] not in complaints:
            selected.append(examples[key])
            complaints.add(key[1])
        if len(selected) == 8:
            break
    if len(selected) < 3:
        raise ValueError("Need at least three recurring real category/location scenarios for benchmark controls")
    return selected


def _score(predicted, truth, units):
    tp = len(predicted & truth)
    fp = len(predicted - truth)
    fn = len(truth - predicted)
    return {"true_positive": tp, "false_positive": fp, "false_negative": fn,
            "positive_units": len(truth), "negative_units": units - len(truth),
            "recall": tp / len(truth) if truth else None,
            "precision": tp / len(predicted) if predicted else None,
            "false_positive_rate": fp / (units - len(truth)) if units > len(truth) else None}


def _llm_inputs(rows, kind, profile):
    context = {"columns": sorted(profile.columns), "numeric_columns": ["latitude", "longitude"],
               "agency_descriptor_null_rates": profile.null_rates,
               "zip_borough_consensus": profile.zip_borough,
               "descriptor_complaint_consensus": profile.descriptor_complaint}
    if kind in BATCH_KINDS:
        return [{"kind": kind, "row_id": "__batch__", "row": {"rows": rows, "baseline": context},
                 "reason": "Independently decide whether this complete batch contains the named issue; no ground truth is provided."}]
    result = []
    for i, row in enumerate(rows):
        item = {"kind": kind, "row_id": str(i), "row": row,
                "reason": "Independently check this row for the named quality issue.", "baseline": context}
        if kind in {"duplicates", "near_duplicates"}:
            item["comparison_rows"] = [{"row_id": str(j), "row": other} for j, other in enumerate(rows) if i != j and other.get("incident_address") == row.get("incident_address")]
        result.append(item)
    return result


def run_benchmark(output_dir=None, reviewer=None, *, batch_size=120, seeds=(71, 93, 127), kinds=KINDS) -> dict:
    """Run all twelve families. reviewer(list[dict]) -> list[decision dict].

    A decision needs kind, row_id and boolean is_anomaly. Missing/error decisions
    remain unevaluated, never counted as negatives. A budget-limited reviewer may
    return a partial list; coverage is reported and no full-dataset LLM accuracy
    is claimed. Seed, rate and truth stay solely within this module/injector.
    """
    if not kinds or len(set(kinds)) != len(kinds) or any(kind not in KINDS for kind in kinds):
        raise ValueError("kinds must be a nonempty selection of unique supported corruption types")
    raw, manifest = load_snapshot()
    normalized = normalize(raw)
    # Alternate sorted records: disjoint provenance IDs, covering each month.
    training, held_out = normalized[::2], normalized[1::2]
    profile = Profile.fit(training)
    scenarios = _fixture_scenarios(training, profile)
    methods = {"rule": rule_detect, "statistical": statistical_detect, "hybrid": hybrid_detect}
    per_method = {method: {} for method in (*methods, "llm")}
    rates = (.05, .15, .30)
    total_seconds = Counter()
    total_rows = Counter()
    pending_candidates = 0
    llm_errors = []
    examples = []
    for kind in kinds:
        aggregates = {method: {"predicted": set(), "truth": set(), "units": 0, "clean_flags": 0, "clean_units": 0,
                               "alerts_with_explanation": 0, "alerts": 0, "reviewed_units": 0, "expected_review_units": 0,
                               "clean_reviewed_units": 0, "wall_seconds": 0., "rows_processed": 0} for method in (*methods, "llm")}
        injection_rates = []
        for case_index, seed in enumerate(seeds):
            clean = clean_fixtures(batch_size, seed=seed, scenarios=scenarios)
            corrupted = inject(clean, kind, rates[case_index % len(rates)], seed=seed, variant=case_index)
            injection_rates.append({"requested": corrupted.requested_rate, "modified_rows": len(corrupted.modified_indices),
                                    "actual_modified_rate": len(corrupted.modified_indices) / len(clean),
                                    "positive_units": len(corrupted.truth)})
            unit_count = 1 if kind in BATCH_KINDS else len(corrupted.rows)
            for method, detector in methods.items():
                started = perf_counter()
                alerts = detector(corrupted.rows, profile)
                clean_alerts = detector(clean, profile)
                elapsed = perf_counter()-started
                total_seconds[method] += elapsed
                total_rows[method] += len(clean) + len(corrupted.rows)
                relevant = [a for a in alerts if a.kind == kind]
                aggregate = aggregates[method]
                aggregate["wall_seconds"] += elapsed
                aggregate["rows_processed"] += len(clean) + len(corrupted.rows)
                aggregate["predicted"].update((case_index, a.row_id) for a in relevant)
                aggregate["truth"].update((case_index, row_id) for _, row_id in corrupted.truth)
                aggregate["units"] += unit_count
                aggregate["clean_units"] += unit_count
                aggregate["clean_flags"] += len({a.row_id for a in clean_alerts if a.kind == kind})
                aggregate["alerts_with_explanation"] += sum(bool(a.reason.strip()) for a in relevant)
                aggregate["alerts"] += len(relevant)
                if method == "hybrid":
                    candidates = review_candidates(corrupted.rows, alerts)
                    pending_candidates += len(candidates)
                    if candidates and len(examples) < 12:
                        examples.append(candidates[0])
            aggregate = aggregates["llm"]
            aggregate["expected_review_units"] += unit_count * 2
            if reviewer is not None:
                for is_clean, batch in ((False, corrupted.rows), (True, clean)):
                    candidates = _llm_inputs(batch, kind, profile)
                    started = perf_counter()
                    try:
                        decisions = reviewer(candidates)
                        if not isinstance(decisions, list):
                            raise ValueError("Reviewer must return a list of decision objects")
                    except Exception as exc:  # Remote provider failure is an explicit measurement gap.
                        llm_errors.append({"kind": kind, "case": case_index, "clean": is_clean, "error": f"{type(exc).__name__}: {exc}"})
                        decisions = []
                    elapsed = perf_counter()-started
                    total_seconds["llm"] += elapsed
                    aggregate["wall_seconds"] += elapsed
                    allowed = {x["row_id"] for x in candidates}
                    valid = {d["row_id"]: d for d in decisions if isinstance(d, dict) and d.get("kind") == kind and d.get("row_id") in allowed and isinstance(d.get("is_anomaly"), bool)}
                    if is_clean:
                        aggregate["clean_reviewed_units"] += len(valid)
                        aggregate["clean_units"] += len(valid)
                        aggregate["clean_flags"] += sum(d["is_anomaly"] for d in valid.values())
                    else:
                        aggregate["reviewed_units"] += len(valid)
                        aggregate["units"] += len(valid)
                        aggregate["truth"].update((case_index, row_id) for _, row_id in corrupted.truth if row_id in valid)
                        aggregate["predicted"].update((case_index, i) for i, d in valid.items() if d["is_anomaly"])
                        aggregate["alerts"] += sum(d["is_anomaly"] for d in valid.values())
                        aggregate["alerts_with_explanation"] += sum(d["is_anomaly"] and bool(d.get("reason")) for d in valid.values())
                    total_rows["llm"] += len(valid) if kind not in BATCH_KINDS else (len(batch) if valid else 0)
                    aggregate["rows_processed"] += len(valid) if kind not in BATCH_KINDS else (len(batch) if valid else 0)
        for method, aggregate in aggregates.items():
            scores = _score(aggregate["predicted"], aggregate["truth"], aggregate["units"])
            evaluated = aggregate["units"] + aggregate["clean_units"]
            status = "completed" if method != "llm" or evaluated == aggregate["expected_review_units"] else ("partial" if evaluated else "pending_provider")
            per_method[method][kind] = {**scores, "unit": "batch" if kind in BATCH_KINDS else "physical_row",
                                      "status": status, "clean_false_alarms": aggregate["clean_flags"],
                                      "clean_units": aggregate["clean_units"],
                                      "clean_false_alarm_rate": aggregate["clean_flags"] / aggregate["clean_units"] if aggregate["clean_units"] else None,
                                      "explanation_coverage": aggregate["alerts_with_explanation"] / aggregate["alerts"] if aggregate["alerts"] else None,
                                      "evaluated_units": evaluated,
                                      "expected_review_units": aggregate["expected_review_units"] if method == "llm" else evaluated,
                                      "wall_seconds": aggregate["wall_seconds"],
                                      "rows_processed": aggregate["rows_processed"],
                                      "rows_per_second": aggregate["rows_processed"] / aggregate["wall_seconds"] if aggregate["wall_seconds"] and aggregate["rows_processed"] else None,
                                      "api_cost_usd_per_million_rows": 0.0 if method != "llm" else None,
                                      "compute_cost_usd_per_million_rows": None,
                                      "injections": injection_rates}
    throughput = {method: {"rows_processed": total_rows[method], "wall_seconds": total_seconds[method],
                           "rows_per_second": total_rows[method] / total_seconds[method] if total_seconds[method] and total_rows[method] else None,
                           "api_cost_usd_per_million_rows": 0.0 if method != "llm" else None,
                           "compute_cost_usd_per_million_rows": None,
                           "cost_note": "No external API; local CPU cost excluded" if method != "llm" else "Pending actual provider usage and applicable price; no assumed free-tier capacity"}
                  for method in (*methods, "llm")}
    result = {"provenance": manifest, "environment": {"python": platform.python_version(), "platform": platform.platform()},
              "profile": _profile_raw(normalized, profile), "baseline": {"training_rows": len(training), "held_out_raw_rows": len(held_out),
              "split": "Alternating source records; all fitting uses even indices only", "fixture_scenarios": scenarios,
              "held_out_raw_alerts_unadjudicated": dict(Counter(a.kind for a in hybrid_detect(held_out, profile)))},
              "per_method": per_method, "throughput": throughput,
              "hybrid": {"status": "deterministic_stage_measured_semantic_review_pending" if reviewer is None else "deterministic_stage_measured_separate_llm_family_review",
                         "candidate_instances": pending_candidates, "candidate_examples": examples,
                         "candidate_fraction": pending_candidates / (len(kinds) * len(seeds) * batch_size),
                         "note": "Hybrid scores are first-stage candidate detection, not confirmed LLM outcomes. Semantic candidates require review; standalone LLM evaluation does not silently count as hybrid confirmation."},
              "llm": {"status": "pending_provider" if reviewer is None else "attempted", "errors": llm_errors,
                      "protocol": "Every kind reviewed on independent corrupted and clean batches; missing decisions are unevaluated; coverage accompanies scores"},
              "limitations": ["1,800-row biased source snapshot; not a population census or prevalence estimate",
                              "Synthetic clean-control performance does not establish real-world precision",
                              "Empirical ZIP and descriptor mappings are learned from the 900-row training split, not authoritative exhaustive dictionaries",
                              "Statistical family includes structural support and lexical baselines; it is not twelve independently trained ML models",
                              "Name detection and text semantics are intentionally incomplete; no simulated LLM measurements",
                              "Duplicate positives label all members of a group; schema/type/date/null drift score per batch",
                              "Throughput measures in-process batches on this machine; no network, ingestion, storage or distributed orchestration costs"]}
    if output_dir is not None:
        directory = Path(output_dir)
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "data_quality_benchmark.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    print(json.dumps(run_benchmark(), indent=2))

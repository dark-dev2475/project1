"""End-to-end routing: block clear contract violations, review uncertain semantics."""
from __future__ import annotations

from dataclasses import asdict
import random
from time import perf_counter

from .detectors import hybrid_detect

SEMANTIC = {"zip_borough", "complaint_descriptor", "resolution_status", "pii", "near_duplicates"}


def run_pipeline(rows, profile, reviewer=None, *, sample_rate=.01, seed=0):
    if not 0 <= sample_rate <= 1:
        raise ValueError("sample_rate must be in [0,1]")
    started = perf_counter()
    alerts = hybrid_detect(rows, profile)
    hard = [a for a in alerts if a.kind not in SEMANTIC]
    candidates = {(a.kind, a.row_id): {"kind": a.kind, "row_id": a.row_id,
                  "row": rows[int(a.row_id)], "reason": a.reason} for a in alerts if a.kind in SEMANTIC}
    rng = random.Random(seed)
    sampled_rows = [i for i in range(len(rows)) if rng.random() < sample_rate]
    for i in sampled_rows:
        for kind in sorted(SEMANTIC):
            candidates.setdefault((kind, str(i)), {"kind": kind, "row_id": str(i), "row": rows[i],
                                  "reason": "Random audit of an unflagged or flagged row; check independently"})
    for candidate in candidates.values():
        candidate["baseline"] = {"zip_borough_consensus": profile.zip_borough,
                                 "descriptor_complaint_consensus": profile.descriptor_complaint}
        if candidate["kind"] == "near_duplicates":
            candidate["comparison_rows"] = [{"row_id": str(i), "row": row} for i, row in enumerate(rows)
                if str(i) != candidate["row_id"] and row.get("incident_address") == candidate["row"].get("incident_address")]
    reviewed, errors = {}, []
    if reviewer and candidates:
        try:
            decisions = reviewer(list(candidates.values()))
            for item in decisions:
                key = (item.get("kind"), item.get("row_id"))
                if key in candidates and type(item.get("is_anomaly")) is bool:
                    reviewed[key] = item
        except Exception as exc:
            errors.append(f"{type(exc).__name__}: {exc}")
    pending = [row for key, row in candidates.items() if key not in reviewed]
    confirmed = [item for item in reviewed.values() if item["is_anomaly"]]
    dismissed = [item for item in reviewed.values() if not item["is_anomaly"]]
    return {"rows": len(rows), "hard_alerts": [asdict(a) for a in hard], "confirmed_review_alerts": confirmed,
            "dismissed_review_alerts": dismissed, "pending_review": pending,
            "candidate_pairs": len(candidates), "unique_candidate_rows": len({key[1] for key in candidates}),
            "sampled_rows": len(sampled_rows), "reviewed_pairs": len(reviewed), "errors": errors,
            "status": "review_pending" if pending else "completed", "wall_seconds": perf_counter()-started,
            "release_decision": "quarantine" if hard or confirmed else "hold_for_review" if pending else "pass",
            "note": "Pending semantic reviews are abstentions, not successful detections or clean rows."}

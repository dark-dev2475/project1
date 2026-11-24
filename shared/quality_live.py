"""Persist per-kind live experiments, preserving measured cost attribution."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fingerprint():
    digest = hashlib.sha256()
    for name in ("project_b/detectors.py", "project_b/injector.py", "project_b/evaluation.py",
                 "project_b/llm.py", "project_b/data/manifest.json", "shared/gemini.py"):
        digest.update((ROOT/name).read_bytes())
    return digest.hexdigest()


def replay_quality(result):
    path = ROOT/"evidence/live"
    files = list(path.glob("quality_*.json")) if path.exists() else []
    observations = []
    for file in files:
        record = json.loads(file.read_text(encoding="utf-8"))
        if record.get("fingerprint") != fingerprint():
            continue
        kind = record["kind"]
        if kind in result["per_method"]["llm"]:
            result["per_method"]["llm"][kind] = record["metric"]
            observations.append({"kind":kind,"model":record["model"],"usage":record["usage"],"path":str(file.relative_to(ROOT))})
    if observations:
        result["llm"]["status"] = "replayed_live_observations"
        result["llm"]["observations"] = observations
    return result

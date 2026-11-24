"""Bounded, temporary upload adapter; business validation stays in Project B."""
from pathlib import Path
from tempfile import TemporaryDirectory

from project_b.portable import read_rows, run_validation

MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 1000


def validate_upload(data: bytes, filename: str, contract: str, baseline: bytes | None = None,
                    baseline_name: str = "baseline.json") -> dict:
    """Never use a browser-supplied filename as a path or retain uploaded contents."""
    if len(data) > MAX_BYTES or (baseline is not None and len(baseline) > MAX_BYTES):
        raise ValueError("Each dataset must be at most 2 MB")
    if len(contract.encode("utf-8")) > 100_000:
        raise ValueError("Contract must be at most 100 KB")
    allowed = {".csv", ".json", ".jsonl", ".ndjson"}
    suffix = Path(filename).suffix.lower()
    baseline_suffix = Path(baseline_name).suffix.lower()
    if suffix not in allowed or (baseline is not None and baseline_suffix not in allowed):
        raise ValueError("Upload CSV, JSON, JSONL or NDJSON")
    with TemporaryDirectory(prefix="decision-lab-") as folder:
        root = Path(folder)
        current = root / ("current" + suffix)
        current.write_bytes(data)
        contract_path = root / "contract.json"
        contract_path.write_text(contract, encoding="utf-8")
        reference = None
        paths = [current]
        if baseline is not None:
            reference = root / ("baseline" + baseline_suffix)
            reference.write_bytes(baseline)
            paths.append(reference)
        for path in paths:
            if len(read_rows(path)) > MAX_ROWS:
                raise ValueError("Interactive uploads support at most 1,000 rows; use the CLI for larger batches")
        result = run_validation(current, contract_path, reference)
        result["input"] = {"format": suffix, "baseline_format": baseline_suffix if reference else None,
                           "row_index_convention": "Zero-based physical record index"}
        return result

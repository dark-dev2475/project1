"""Small, explicitly non-representative snapshot of NYC OpenData's 311 records."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time
from urllib.parse import urlencode
from urllib.request import urlopen

DATA_DIR = Path(__file__).parent / "data"
ENDPOINT = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
FIELDS = ("unique_key", "created_date", "closed_date", "agency", "complaint_type", "descriptor",
          "incident_zip", "borough", "latitude", "longitude", "status", "resolution_description",
          "incident_address")


def fetch_snapshot(per_month: int = 150, destination: Path = DATA_DIR) -> dict:
    """Fetch deterministic earliest records per month; retain source query and bytes hash.

    This is a coverage sample, not a random sample or a census. Source records can
    be edited after their creation; the fetched timestamp is therefore important.
    """
    if not 1 <= per_month <= 5000:
        raise ValueError("per_month must be in [1, 5000]")
    destination.mkdir(parents=True, exist_ok=True)

    def fetch_month(month: int):
        start = f"2023-{month:02d}-01T00:00:00"
        end = "2024-01-01T00:00:00" if month == 12 else f"2023-{month+1:02d}-01T00:00:00"
        query = {"$select": ",".join(FIELDS), "$where": f"created_date >= '{start}' AND created_date < '{end}'",
                 "$order": "created_date ASC, unique_key ASC", "$limit": str(per_month)}
        url = ENDPOINT + "?" + urlencode(query)
        for attempt in range(3):
            try:
                with urlopen(url, timeout=90) as response:
                    raw = response.read()
                rows = json.loads(raw)
                if not isinstance(rows, list) or any(not isinstance(r, dict) for r in rows):
                    raise ValueError("Unexpected API response")
                return rows, {"month": month, "url": url, "rows": len(rows), "response_sha256": hashlib.sha256(raw).hexdigest()}
            except (OSError, ValueError):
                if attempt == 2:
                    raise
                time.sleep(1 + attempt)

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(fetch_month, range(1, 13)))
    rows = [row for group, _ in results for row in group]
    content = (json.dumps(rows, ensure_ascii=False, indent=2) + "\n").encode()
    (destination / "nyc311_2023.json").write_bytes(content)
    manifest = {"source": "NYC Open Data: 311 Service Requests from 2010 to Present",
                "dataset_id": "erm2-nwe9", "source_url": "https://data.cityofnewyork.us/d/erm2-nwe9",
                "endpoint": ENDPOINT, "year": 2023, "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
                "sampling": "First N records by created_date, unique_key in each calendar month; nonrandom coverage snapshot, not full-year census",
                "per_month_requested": per_month, "row_count": len(rows),
                "snapshot_sha256": hashlib.sha256(content).hexdigest(), "queries": [m for _, m in results],
                "limitations": ["Early-month/time-of-day selection bias", "Current source values may have been revised since 2023",
                                "No population prevalence estimate is justified by this sample"]}
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def load_snapshot(directory: Path = DATA_DIR) -> tuple[list[dict], dict]:
    raw = (directory / "nyc311_2023.json").read_bytes()
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    if hashlib.sha256(raw).hexdigest() != manifest["snapshot_sha256"]:
        raise ValueError("Snapshot checksum mismatch; refresh or restore the source file")
    rows = json.loads(raw)
    if len(rows) != manifest["row_count"]:
        raise ValueError("Snapshot row count mismatch")
    return rows, manifest


if __name__ == "__main__":
    print(json.dumps(fetch_snapshot(), indent=2))

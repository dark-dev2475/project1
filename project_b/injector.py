"""Seeded corruptions with labels kept in a separate evaluation object.

Fixtures model the source schema after numeric parsing. They are synthetic clean
controls, not NYC records certified as clean by an automated detector.
"""
from __future__ import annotations

import copy
from dataclasses import dataclass
from datetime import datetime, timedelta
import math
import random

KINDS = ("schema", "type", "date_format", "coordinates", "duplicates", "near_duplicates",
         "null_spike", "chronology", "zip_borough", "complaint_descriptor", "resolution_status", "pii")
BATCH_KINDS = {"schema", "type", "date_format", "null_spike"}
# These are transparent fixture scenarios, not an exhaustive city taxonomy.
SCENARIOS = (
    ("NYPD", "Noise - Residential", "Loud Music/Party", "10025", "MANHATTAN", 40.798, -73.966),
    ("NYPD", "Noise - Street/Sidewalk", "Loud Talking", "11211", "BROOKLYN", 40.713, -73.953),
    ("DSNY", "Dirty Condition", "E3 Dirty Sidewalk", "10458", "BRONX", 40.863, -73.889),
    ("DOT", "Street Condition", "Pothole", "11373", "QUEENS", 40.738, -73.878),
    ("DEP", "Water System", "Hydrant Running (WC3)", "10301", "STATEN ISLAND", 40.630, -74.094),
    ("DPR", "Damaged Tree", "Branch or Limb Has Fallen Down", "11215", "BROOKLYN", 40.668, -73.985),
)


def clean_fixtures(count: int = 160, seed: int = 42, scenarios=None) -> list[dict]:
    rng = random.Random(seed)
    scenarios = scenarios or SCENARIOS
    rows = []
    for i in range(count):
        agency, complaint, descriptor, zipcode, borough, lat, lon = scenarios[i % len(scenarios)]
        created = datetime(2023, 1, 1) + timedelta(days=rng.randrange(365), seconds=i * 137 % 86400)
        closed = created + timedelta(hours=rng.randrange(1, 96))
        is_closed = i % 4 != 0
        rows.append({"unique_key": str(90000000 + seed * 10000 + i), "created_date": created.isoformat(),
                     "closed_date": closed.isoformat() if is_closed else None,
                     "agency": agency, "complaint_type": complaint, "descriptor": descriptor,
                     "incident_zip": zipcode, "borough": borough, "latitude": lat + rng.uniform(-.002, .002),
                     "longitude": lon + rng.uniform(-.002, .002), "status": "Closed" if is_closed else "Open",
                     "resolution_description": "The agency completed the inspection and closed the request." if is_closed else "The agency has received the request and is investigating.",
                     "incident_address": f"{10+i} EXAMPLE AVENUE"})
    return rows


@dataclass
class Injection:
    rows: list[dict]
    truth: set[tuple[str, str]]
    kind: str
    requested_rate: float
    modified_indices: list[int]


def inject(rows: list[dict], kind: str, rate: float = .1, seed: int = 42, variant: int = 0) -> Injection:
    if kind not in KINDS:
        raise ValueError(f"Unknown corruption kind: {kind}")
    if not 0 < rate <= 1 or len(rows) < 4:
        raise ValueError("rate must be in (0,1] and batch must have at least four rows")
    result = copy.deepcopy(rows)
    rng = random.Random(seed)
    count = max(1, math.ceil(len(rows) * rate))
    if kind in {"duplicates", "near_duplicates"}:
        # Retain at least one original to avoid circular overwrite semantics.
        count = min(count, len(rows)-1)
    indices = sorted(rng.sample(range(len(rows)), count))
    truth: set[tuple[str, str]] = set()
    if kind == "schema":
        # Schema changes affect the complete batch; row rate does not apply.
        indices = list(range(len(rows)))
        for row in result:
            value = row.pop("complaint_type")
            if variant % 2:
                row["service_category"] = value
    elif kind == "type":
        for i in indices:
            result[i]["latitude"] = str(result[i]["latitude"])
    elif kind == "date_format":
        # A suffix changes format, reflecting a producer deployment mid-batch.
        indices = list(range(len(rows) - count, len(rows)))
        fmt = "%m/%d/%Y %H:%M:%S" if variant % 2 == 0 else "%d-%b-%Y %H:%M:%S"
        for i in indices:
            result[i]["created_date"] = datetime.fromisoformat(result[i]["created_date"]).strftime(fmt)
    elif kind == "null_spike":
        agency = result[indices[0]]["agency"]
        eligible = [i for i, row in enumerate(result) if row["agency"] == agency]
        indices = rng.sample(eligible, min(count, len(eligible)))
        for i in indices:
            result[i]["descriptor"] = None
    else:
        for i in indices:
            row = result[i]
            if kind == "coordinates":
                row["latitude"], row["longitude"] = row["longitude"], row["latitude"]
            elif kind in {"duplicates", "near_duplicates"}:
                # Choose an unaffected original. Both members of a duplicate group are positives.
                sources = [j for j in range(len(rows)) if j not in indices]
                source = rng.choice(sources or [j for j in range(len(rows)) if j != i])
                row = result[i] = copy.deepcopy(rows[source])
                if kind == "near_duplicates":
                    row["unique_key"] = str(80000000 + seed * 1000 + i)
                    row["created_date"] = (datetime.fromisoformat(row["created_date"]) + timedelta(seconds=15 + variant * 9)).isoformat()
                    if variant % 2:
                        row["descriptor"] += " "
                truth.add((kind, str(source)))
            elif kind == "chronology":
                row["closed_date"] = (datetime.fromisoformat(row["created_date"]) - timedelta(hours=1 + variant)).isoformat()
            elif kind == "zip_borough":
                row["borough"] = rng.choice([b for b in ("BROOKLYN", "QUEENS", "BRONX", "MANHATTAN", "STATEN ISLAND") if b != row["borough"]])
            elif kind == "complaint_descriptor":
                choices = [r["descriptor"] for r in rows if r["complaint_type"] != row["complaint_type"] and r["descriptor"] != row["descriptor"]]
                if not choices:
                    raise ValueError("Complaint mismatch injection needs multiple complaint categories")
                row["descriptor"] = rng.choice(choices)
            elif kind == "resolution_status":
                row["resolution_description"] = ("Work has not begun. This complaint remains unresolved." if variant % 2 else "No action has been taken; investigation is pending.") if row["status"] == "Closed" else ("The case has been closed after the issue was fixed." if variant % 2 else "All work is complete and the request has been resolved.")
            elif kind == "pii":
                fragments = ("Please contact alex.morgan@example.net for details.", "Reach the caller at (646) 555-0148.",
                             "The complainant is Priya Kapoor.", "Jordan Lee witnessed the incident.")
                row["descriptor"] += " " + fragments[(i + variant) % len(fragments)]
            truth.add((kind, str(i)))
    if kind in BATCH_KINDS:
        truth = {(kind, "__batch__")}
    return Injection(result, truth, kind, rate, indices)

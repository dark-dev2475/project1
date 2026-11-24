"""Explainable contract checks and independently fitted distribution checks.

Empirical incompatibility is a candidate for review, not proof of a bad city record.
No detector has access to corruption labels, seeds, fixture IDs or injected text.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from difflib import SequenceMatcher
import math
import re
import statistics

from .dataset import FIELDS

NUMERIC = ("latitude", "longitude")
PHONE = re.compile(r"(?<!\d)(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4}(?!\d)")
EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NAME = re.compile(r"\b(?:my name is|complainant is|contact name[: ]+)\s+([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})\b", re.I)


def parse_date(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        # Numeric offsets are legal ISO dates; normalize for safe comparisons.
        if parsed.tzinfo:
            from datetime import timezone
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return None


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def normalize(rows):
    """Socrata serializes numeric columns as strings; parse at the source boundary.

    Missing fields become null. Invalid numeric strings are retained and flagged.
    """
    result = []
    for raw in rows:
        row = {k: raw.get(k) for k in FIELDS}
        for key in NUMERIC:
            if row[key] not in (None, ""):
                try:
                    row[key] = float(row[key])
                except (ValueError, TypeError):
                    pass
        result.append(row)
    return result


@dataclass(frozen=True)
class Alert:
    kind: str
    row_id: str
    detector: str
    reason: str
    score: float = 1.0


@dataclass
class Profile:
    columns: set = field(default_factory=set)
    types: dict = field(default_factory=dict)
    zip_borough: dict = field(default_factory=dict)
    descriptor_complaint: dict = field(default_factory=dict)
    null_rates: dict = field(default_factory=dict)
    numeric_stats: dict = field(default_factory=dict)
    text_lengths: tuple = (0., 1.)
    rows: int = 0

    @classmethod
    def fit(cls, rows):
        profile = cls(rows=len(rows))
        if not rows:
            raise ValueError("Baseline must contain rows")
        profile.columns = set().union(*(r.keys() for r in rows))
        profile.types = {k: Counter(type(r.get(k)).__name__ for r in rows if r.get(k) is not None) for k in profile.columns}
        zips = defaultdict(Counter)
        descriptors = defaultdict(Counter)
        agency_total, agency_null = Counter(), Counter()
        for row in rows:
            if row.get("incident_zip") and row.get("borough") not in (None, "Unspecified", "UNKNOWN"):
                zips[str(row["incident_zip"])][row["borough"]] += 1
            if row.get("descriptor") and row.get("complaint_type"):
                descriptors[row["descriptor"].strip().lower()][row["complaint_type"]] += 1
            agency = row.get("agency")
            agency_total[agency] += 1
            agency_null[agency] += row.get("descriptor") in (None, "")
        # Repeated consistent evidence only; unseen mappings abstain.
        profile.zip_borough = {k: c.most_common(1)[0][0] for k, c in zips.items() if sum(c.values()) >= 3 and c.most_common(1)[0][1] / sum(c.values()) >= .98}
        profile.descriptor_complaint = {k: c.most_common(1)[0][0] for k, c in descriptors.items() if sum(c.values()) >= 3 and c.most_common(1)[0][1] / sum(c.values()) >= .98}
        profile.null_rates = {k: agency_null[k] / n for k, n in agency_total.items()}
        for key in NUMERIC:
            values = [r[key] for r in rows if numeric(r.get(key))]
            if values:
                profile.numeric_stats[key] = (statistics.mean(values), max(statistics.pstdev(values), .005))
        lengths = [len(str(r.get("descriptor") or "")) for r in rows]
        profile.text_lengths = (statistics.mean(lengths), max(statistics.pstdev(lengths), 4.))
        return profile


def _groups(rows, keyfunc):
    groups = defaultdict(list)
    for i, row in enumerate(rows):
        groups[keyfunc(row)].append(i)
    return groups


def _duplicate_alerts(rows, detector):
    alerts = []
    keys = sorted(set().union(*(r.keys() for r in rows))) if rows else []
    for group in _groups(rows, lambda r: tuple(str(r.get(k)) for k in keys)).values():
        if len(group) > 1:
            for i in group:
                alerts.append(Alert("duplicates", str(i), detector, f"Identical full-row values at indices {group[:6]}"))
    return alerts


def rule_detect(rows, profile: Profile):
    alerts = []
    def add(kind, i, reason, score=1.):
        alerts.append(Alert(kind, str(i), "rule", reason, score))
    if not rows:
        return alerts
    missing = [(i, sorted(set(FIELDS) - r.keys())) for i, r in enumerate(rows) if set(FIELDS) - r.keys()]
    if missing:
        add("schema", "__batch__", f"Required source columns absent; first example {missing[0]}")
    invalid_types = [i for i, r in enumerate(rows) if any(r.get(k) is not None and not numeric(r[k]) for k in NUMERIC)]
    if invalid_types:
        add("type", "__batch__", f"Expected finite numeric coordinates after source parsing; {len(invalid_types)} rows violate")
    bad_dates = [i for i, r in enumerate(rows) if r.get("created_date") and not parse_date(r["created_date"])]
    if bad_dates:
        add("date_format", "__batch__", f"ISO 8601 created_date contract violated in {len(bad_dates)} rows; first index {bad_dates[0]}")
    agencies = defaultdict(list)
    for i, row in enumerate(rows):
        agencies[row.get("agency")].append(row)
        lat, lon = row.get("latitude"), row.get("longitude")
        if numeric(lat) and numeric(lon) and not (40.4 <= lat <= 41.0 and -74.3 <= lon <= -73.6):
            add("coordinates", i, "Coordinates outside documented NYC bounding box; possible swapped latitude/longitude")
        created, closed = parse_date(row.get("created_date")), parse_date(row.get("closed_date"))
        if created and closed and closed < created:
            add("chronology", i, "closed_date precedes created_date")
        expected = profile.zip_borough.get(str(row.get("incident_zip")))
        if expected and row.get("borough") not in (None, "Unspecified", "UNKNOWN", expected):
            add("zip_borough", i, f"ZIP/borough disagrees with baseline consensus ({expected}); needs geographic verification", .9)
        descriptor = str(row.get("descriptor") or "").strip().lower()
        expected_complaint = profile.descriptor_complaint.get(descriptor)
        if expected_complaint and row.get("complaint_type") not in (None, expected_complaint):
            add("complaint_descriptor", i, f"Descriptor associated with {expected_complaint} in baseline; pair is inconsistent", .85)
        resolution = str(row.get("resolution_description") or "").lower()
        status = str(row.get("status") or "").lower()
        pending = bool(re.search(r"\b(pending|unresolved|not begun|has not been resolved)\b", resolution))
        completed = bool(re.search(r"\b(completed|resolved|closed|complete)\b", resolution)) and not pending
        if (status == "closed" and pending) or (status in ("open", "in progress", "assigned") and completed):
            add("resolution_status", i, "Status and explicit resolution wording conflict; keyword heuristic needs review", .7)
        text = str(row.get("descriptor") or "") + " " + str(row.get("resolution_description") or "")
        entities = [name for name, pattern in (("email", EMAIL), ("phone", PHONE), ("named person", NAME)) if pattern.search(text)]
        if entities:
            add("pii", i, f"Potential personal/contact data: {', '.join(entities)}; public agency contacts may be benign", .8)
    for agency, group in agencies.items():
        rate = sum(r.get("descriptor") in (None, "") for r in group) / len(group)
        if len(group) >= 5 and rate > profile.null_rates.get(agency, 0.) + .15:
            add("null_spike", "__batch__", f"Agency {agency}: descriptor null rate {rate:.1%} exceeds baseline by >15 percentage points")
    alerts.extend(_duplicate_alerts(rows, "rule"))
    # Blocking is O(n); compare only requests at the same address and same category.
    groups = _groups(rows, lambda r: (r.get("incident_address"), r.get("complaint_type"), r.get("borough")))
    for group in groups.values():
        ordered = sorted((parse_date(rows[i].get("created_date")), i) for i in group if parse_date(rows[i].get("created_date")))
        for (left_date, left), (right_date, right) in zip(ordered, ordered[1:]):
            if 0 <= (right_date - left_date).total_seconds() <= 120 and rows[left].get("unique_key") != rows[right].get("unique_key") and str(rows[left].get("descriptor") or "").strip().lower() == str(rows[right].get("descriptor") or "").strip().lower():
                for i in (left, right):
                    add("near_duplicates", i, f"Same location/category/descriptor and timestamps within 120 seconds; pair {left},{right}", .8)
    return _deduplicate(alerts)


def statistical_detect(rows, profile: Profile):
    alerts = []
    def add(kind, i, reason, score=.8):
        alerts.append(Alert(kind, str(i), "statistical", reason, score))
    if not rows:
        return alerts
    present = set().union(*(r.keys() for r in rows))
    if present != profile.columns or any(set(r) != profile.columns for r in rows):
        add("schema", "__batch__", f"Observed schema differs from fitted {len(profile.columns)}-column baseline")
    novel_types = [(k, type(r[k]).__name__) for r in rows for k in NUMERIC if r.get(k) is not None and type(r[k]).__name__ not in profile.types.get(k, {})]
    if novel_types:
        add("type", "__batch__", f"Previously unobserved runtime types: {sorted(set(novel_types))}")
    date_shapes = Counter(re.sub(r"\d", "D", str(r.get("created_date") or "")) for r in rows)
    if any(not re.fullmatch(r"D{4}-D{2}-D{2}TD{2}:D{2}:D{2}(?:\.D+)?", shape) for shape in date_shapes):
        add("date_format", "__batch__", f"Date representation drift: {len(date_shapes)} observed shapes")
    agencies = defaultdict(list)
    for i, row in enumerate(rows):
        agencies[row.get("agency")].append(row)
        zscores = [abs(row[k]-mean)/sd for k, (mean, sd) in profile.numeric_stats.items() if numeric(row.get(k))]
        if zscores and max(zscores) > 6:
            add("coordinates", i, f"Coordinate exceeds 6 baseline standard deviations (max z={max(zscores):.1f})")
        created, closed = parse_date(row.get("created_date")), parse_date(row.get("closed_date"))
        if created and closed and (closed-created).total_seconds() < 0:
            # One-sided support check, statistical family with physical invariant support.
            add("chronology", i, "Negative service duration outside fitted clean-control support")
        expected = profile.zip_borough.get(str(row.get("incident_zip")))
        if expected and row.get("borough") not in (None, "UNKNOWN", "Unspecified", expected):
            add("zip_borough", i, f"Low conditional borough likelihood given ZIP; modal borough {expected}")
        descriptor = str(row.get("descriptor") or "").strip().lower()
        expected = profile.descriptor_complaint.get(descriptor)
        if expected and row.get("complaint_type") not in (None, expected):
            add("complaint_descriptor", i, "Low conditional complaint likelihood given descriptor")
        text = str(row.get("descriptor") or "")
        mean, sd = profile.text_lengths
        if len(text) > mean + 2.5 * sd:
            add("pii", i, f"Descriptor length anomaly (z={(len(text)-mean)/sd:.1f}); anomaly does not establish PII", .4)
        # Lightweight lexical model. There is no claim of general NLI capability.
        resolution = str(row.get("resolution_description") or "").lower()
        unresolved = sum(resolution.count(t) for t in ("pending", "unresolved", "investigating", "not begun"))
        resolved = sum(resolution.count(t) for t in ("completed", "closed", "resolved", "fixed")) - resolution.count("unresolved")
        if (row.get("status") == "Closed" and unresolved > resolved) or (row.get("status") == "Open" and resolved > unresolved):
            add("resolution_status", i, "Status disagrees with lexical completion score; weak text baseline", .6)
    for agency, group in agencies.items():
        n = len(group)
        p = profile.null_rates.get(agency, 0.)
        observed = sum(r.get("descriptor") in (None, "") for r in group) / n
        se = math.sqrt(max(p * (1-p), .01) / n)
        if n >= 5 and observed - p > max(.1, 3 * se):
            add("null_spike", "__batch__", f"Agency {agency}: null proportion {observed:.1%}, baseline {p:.1%}, >3 SE drift")
    alerts.extend(_duplicate_alerts(rows, "statistical"))
    groups = _groups(rows, lambda r: (r.get("incident_address"), r.get("borough")))
    for group in groups.values():
        ordered = sorted((parse_date(rows[i].get("created_date")), i) for i in group if parse_date(rows[i].get("created_date")))
        for (left_date, left), (right_date, right) in zip(ordered, ordered[1:]):
            if 0 <= (right_date-left_date).total_seconds() <= 180 and rows[left].get("unique_key") != rows[right].get("unique_key"):
                similarity = SequenceMatcher(None, str(rows[left].get("descriptor")), str(rows[right].get("descriptor"))).ratio()
                if similarity >= .9:
                    for i in (left, right):
                        add("near_duplicates", i, f"Text similarity {similarity:.2f} plus temporal/location proximity", similarity)
    return _deduplicate(alerts)


def _deduplicate(alerts):
    return list({(a.kind, a.row_id): a for a in alerts}.values())


def hybrid_detect(rows, profile: Profile):
    """Deterministic first stage; semantic candidates are explicitly reviewable."""
    rules = rule_detect(rows, profile)
    stats = statistical_detect(rows, profile)
    selected = rules + [a for a in stats if a.kind in {"null_spike", "pii", "near_duplicates"}]
    return _deduplicate(selected)


def review_candidates(rows, alerts):
    semantic = {"complaint_descriptor", "resolution_status", "pii", "near_duplicates"}
    return [{"kind": a.kind, "row_id": a.row_id, "row": rows[int(a.row_id)], "reason": a.reason}
            for a in alerts if a.kind in semantic and a.row_id != "__batch__"]

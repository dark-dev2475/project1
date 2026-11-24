"""Contract-driven validation for user-selected CSV, JSON and JSONL datasets.

Minimal contract: {"columns":{"order_id":{"type":"string","nullable":false}},
"primary_key":"order_id"}. Optional roles enable domain checks; names carry no
implicit meaning. CSV starts as strings and uses an explicit, reported conversion
stage. JSON types remain unchanged. Alerts describe contract violations, not a
claim that a dataset is correct. Semantic assessment requires a separate model.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import datetime
import json
import math
from pathlib import Path
import re
from typing import Any


TYPES = {"string", "integer", "number", "boolean", "datetime"}
KEYS = {"name", "columns", "primary_key", "datetime_formats", "chronological_pair",
        "coordinate_pair", "categories", "pair_mappings", "text_columns", "null_drift_threshold"}


def _strict_keys(value: dict, allowed: set[str], label: str) -> None:
    if not isinstance(value, dict) or set(value) - allowed:
        raise ValueError(f"{label} must be an object with only these keys: {sorted(allowed)}")


def _primitive(value: Any) -> bool:
    return isinstance(value, (str, bool, int, float)) and not (
        isinstance(value, float) and not math.isfinite(value))


def _same(left: Any, right: Any) -> bool:
    return type(left) is type(right) and left == right


@dataclass(frozen=True)
class DatasetContract:
    """Validated JSON configuration; construct through ``from_dict``."""

    config: dict

    @classmethod
    def from_dict(cls, data: dict) -> "DatasetContract":
        _strict_keys(data, KEYS, "Contract")
        if "name" in data and (not isinstance(data["name"], str) or not data["name"].strip()):
            raise ValueError("Contract name must be a nonempty string")
        columns = data.get("columns")
        if not isinstance(columns, dict) or not columns:
            raise ValueError("Contract requires a nonempty columns object")
        for name, spec in columns.items():
            if not isinstance(name, str) or not name.strip():
                raise ValueError("Column names must be nonempty strings")
            _strict_keys(spec, {"type", "nullable", "required", "minimum", "maximum"}, f"Column {name}")
            if not isinstance(spec.get("type"), str) or spec["type"] not in TYPES:
                raise ValueError(f"Unknown type for {name}; supported types: {sorted(TYPES)}")
            for flag in ("nullable", "required"):
                if flag in spec and type(spec[flag]) is not bool:
                    raise ValueError(f"{name}.{flag} must be boolean")
            for boundary in ("minimum", "maximum"):
                if boundary in spec and (spec["type"] not in {"integer", "number"} or
                        type(spec[boundary]) not in (int,float) or not math.isfinite(spec[boundary])):
                    raise ValueError(f"{name}.{boundary} requires a finite numeric bound on a numeric column")
            if "minimum" in spec and "maximum" in spec and spec["minimum"] > spec["maximum"]:
                raise ValueError(f"{name}: minimum must not exceed maximum")

        def references(names: Any, label: str, length: int | None = None) -> list:
            if not isinstance(names, list) or not names or any(not isinstance(n, str) or n not in columns for n in names):
                raise ValueError(f"{label} must name declared columns")
            if len(set(names)) != len(names) or (length is not None and len(names) != length):
                raise ValueError(f"{label} has repeated columns or incorrect length")
            return names

        primary = data.get("primary_key")
        if primary is not None:
            references([primary] if isinstance(primary, str) else primary, "primary_key")
        formats = data.get("datetime_formats", {})
        if not isinstance(formats, dict):
            raise ValueError("datetime_formats must be an object")
        for name, values in formats.items():
            references([name], "datetime_formats")
            if columns[name]["type"] != "datetime" or not isinstance(values, list) or not values or any(
                    not isinstance(v, str) or not v for v in values):
                raise ValueError("Datetime formats require datetime columns and nonempty format strings")
        if "chronological_pair" in data:
            names = references(data["chronological_pair"], "chronological_pair", 2)
            if any(columns[n]["type"] != "datetime" for n in names):
                raise ValueError("Chronological columns must have datetime type")
        if "coordinate_pair" in data:
            pair = data["coordinate_pair"]
            _strict_keys(pair, {"latitude", "longitude", "bounds"}, "coordinate_pair")
            names = references([pair.get("latitude"), pair.get("longitude")], "coordinate_pair", 2)
            if any(columns[n]["type"] not in {"number", "integer"} for n in names):
                raise ValueError("Coordinate columns must have numeric type")
            bounds = pair.get("bounds", {})
            _strict_keys(bounds, {"latitude", "longitude"}, "coordinate bounds")
            for role, limits in bounds.items():
                max_abs = 90 if role == "latitude" else 180
                if not isinstance(limits, list) or len(limits) != 2 or any(
                        type(v) not in (int, float) or not math.isfinite(v) for v in limits
                ) or not -max_abs <= limits[0] < limits[1] <= max_abs:
                    raise ValueError(f"Invalid {role} bounds")
        categories = data.get("categories", {})
        if not isinstance(categories, dict):
            raise ValueError("categories must be an object")
        for name, values in categories.items():
            references([name], "categories")
            if not isinstance(values, list) or not values or any(not _primitive(v) for v in values):
                raise ValueError("Category sets must contain non-null scalar values")
        mappings = data.get("pair_mappings", [])
        if not isinstance(mappings, list):
            raise ValueError("pair_mappings must be a list")
        for mapping in mappings:
            _strict_keys(mapping, {"source", "target", "pairs"}, "pair mapping")
            references([mapping.get("source"), mapping.get("target")], "pair mapping", 2)
            pairs = mapping.get("pairs")
            if not isinstance(pairs, list) or not pairs or any(
                    not isinstance(p, list) or len(p) != 2 or any(not _primitive(v) for v in p) for p in pairs):
                raise ValueError("Mappings need a nonempty list of allowed scalar pairs")
        if "text_columns" in data:
            if not isinstance(data["text_columns"], list):
                raise ValueError("text_columns must be a list")
            names = references(data["text_columns"], "text_columns") if data["text_columns"] else []
            if any(columns[n]["type"] != "string" for n in names):
                raise ValueError("PII text columns must have string type")
        drift = data.get("null_drift_threshold", 0.2)
        if type(drift) not in (int, float) or not math.isfinite(drift) or not 0 < drift <= 1:
            raise ValueError("null_drift_threshold must be greater than zero and at most one")
        return cls(json.loads(json.dumps(data, allow_nan=False)))

    @property
    def columns(self) -> dict:
        return self.config["columns"]


def _date(value: Any, formats: list[str]) -> datetime | None:
    if not isinstance(value, str):
        return None
    for fmt in formats:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")) if fmt == "iso8601" else datetime.strptime(value, fmt)
        except (ValueError, TypeError):
            continue
    return None


def _valid_type(value: Any, kind: str) -> bool:
    if kind in {"string", "datetime"}:
        return isinstance(value, str)
    if kind == "integer":
        return type(value) is int
    if kind == "boolean":
        return type(value) is bool
    return type(value) is int or (type(value) is float and math.isfinite(value))


def validate_rows(rows: list[dict], contract: DatasetContract, baseline: list[dict] | None = None) -> dict:
    """Validate rows; row_index is the zero-based physical record position.

    The null-drift denominator is records that contain the field. Missing fields
    are checked separately. An absent optional field never activates a rule.
    """
    if not isinstance(contract, DatasetContract):
        raise TypeError("contract must be a DatasetContract")
    if not isinstance(rows, list) or any(not isinstance(row, dict) or any(not isinstance(k, str) for k in row) for row in rows):
        raise ValueError("rows must be a list of JSON objects")
    if baseline is not None and (not isinstance(baseline, list) or any(
            not isinstance(r, dict) or any(not isinstance(k, str) for k in r) for r in baseline)):
        raise ValueError("baseline must be a list of JSON objects")
    cfg, alerts = contract.config, []
    primary = cfg.get("primary_key")
    primary = [primary] if isinstance(primary, str) else primary or []
    seen = {}

    def alert(code: str, index: int | None, columns: list[str], message: str, *, detector: str = "rule", **details) -> None:
        alerts.append({"code": code, "row_index": index, "columns": columns,
                       "detector": detector, "message": message, **details})

    for index, row in enumerate(rows):
        valid, dates = set(), {}
        for name, spec in contract.columns.items():
            if name not in row:
                if spec.get("required", True):
                    alert("missing_column", index, [name], "Required column is absent from this record")
                continue
            value = row[name]
            if value is None:
                if not spec.get("nullable", False):
                    alert("null_not_allowed", index, [name], "Contract does not allow null")
                continue
            if not _valid_type(value, spec["type"]):
                alert("type_mismatch", index, [name], f"Expected {spec['type']}; received {type(value).__name__}")
                continue
            if ("minimum" in spec and value < spec["minimum"]) or ("maximum" in spec and value > spec["maximum"]):
                alert("numeric_range", index, [name], "Numeric value is outside the declared inclusive limits")
            if spec["type"] == "datetime":
                parsed = _date(value, cfg.get("datetime_formats", {}).get(name, ["iso8601"]))
                if parsed is None:
                    alert("invalid_datetime", index, [name], "Value does not match any accepted datetime format")
                    continue
                dates[name] = parsed
            valid.add(name)
        for name in sorted(set(row) - set(contract.columns)):
            alert("undeclared_column", index, [name], "Column is not declared in the dataset contract")
        if primary:
            if any(name in row and row[name] is None for name in primary):
                alert("null_primary_key", index, primary, "Primary-key components cannot be null")
            elif all(name in valid for name in primary):
                key = tuple((type(row[name]).__name__, row[name]) for name in primary)
                if key in seen:
                    alert("duplicate_primary_key", index, primary, "Primary key repeats an earlier physical record",
                          first_row_index=seen[key])
                else:
                    seen[key] = index
        pair = cfg.get("chronological_pair")
        if pair and all(name in dates for name in pair):
            try:
                wrong_order = dates[pair[1]] < dates[pair[0]]
            except TypeError:
                alert("incomparable_datetimes", index, pair, "Cannot compare timezone-aware and timezone-naive values")
            else:
                if wrong_order:
                    alert("chronology", index, pair, "End time precedes start time")
        coordinates = cfg.get("coordinate_pair")
        if coordinates:
            for role, default in (("latitude", [-90, 90]), ("longitude", [-180, 180])):
                name = coordinates[role]
                limits = coordinates.get("bounds", {}).get(role, default)
                if name in valid and not limits[0] <= row[name] <= limits[1]:
                    alert("coordinate_bounds", index, [name], f"{role} is outside the declared bounds", bounds=limits)
        for name, allowed in cfg.get("categories", {}).items():
            if name in valid and not any(_same(row[name], value) for value in allowed):
                alert("category", index, [name], "Value is outside the contract's allowed category set")
        for mapping in cfg.get("pair_mappings", []):
            names = [mapping["source"], mapping["target"]]
            if all(name in valid for name in names) and not any(
                    _same(row[names[0]], pair[0]) and _same(row[names[1]], pair[1]) for pair in mapping["pairs"]):
                alert("pair_mapping", index, names, "Values are not an allowed pair in the contract")
        for name in cfg.get("text_columns", []):
            if name in valid and re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)|(?<!\d)(?:\+1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}(?!\d)|\b(?:my name is|contact name:)\s+[A-Z][a-z]+\s+[A-Z][a-z]+", row[name]):
                alert("possible_pii", index, [name], "Text contains a contact/name/US SSN-shaped pattern; human review required")

    drift_details = []
    if baseline:
        threshold = cfg.get("null_drift_threshold", 0.2)
        for name in contract.columns:
            current = [row[name] for row in rows if name in row]
            previous = [row[name] for row in baseline if name in row]
            if not current or not previous:
                continue
            current_rate = sum(v is None for v in current) / len(current)
            baseline_rate = sum(v is None for v in previous) / len(previous)
            delta = current_rate - baseline_rate
            detail = {"column": name, "baseline_rate": baseline_rate, "current_rate": current_rate,
                      "increase": delta, "threshold": threshold, "baseline_records": len(previous),
                      "current_records": len(current)}
            drift_details.append(detail)
            if delta >= threshold or math.isclose(delta, threshold, rel_tol=0, abs_tol=1e-12):
                alert("null_rate_drift", None, [name], "Null rate increased by at least the configured threshold",
                      detector="statistical", **detail)
    return {"contract": cfg.get("name", "Custom dataset"), "row_count": len(rows),
            "baseline_row_count": len(baseline) if baseline is not None else None,
            "alert_count": len(alerts), "alerts": alerts,
            "statistics": {"null_drift": drift_details,
                           "status": "evaluated" if drift_details else "not_run",
                           "reason": None if drift_details else "A nonempty explicit baseline and current dataset with shared declared fields are required"},
            "semantic": {"status": "unsupported", "reason": "Contract rules do not assess semantic correctness; no semantic model was run"},
            "scope": "Only declared checks were evaluated. No alerts does not establish dataset correctness."}


def _object_no_duplicates(pairs: list) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON object key: {key}")
        result[key] = value
    return result


def _json(text: str) -> Any:
    def invalid(token: str):
        raise ValueError(f"Non-finite JSON number: {token}")
    def finite_float(token: str) -> float:
        value = float(token)
        if not math.isfinite(value):
            raise ValueError("JSON number exceeds the supported finite numeric range")
        return value
    return json.loads(text, object_pairs_hook=_object_no_duplicates, parse_constant=invalid, parse_float=finite_float)


def read_rows(path: str | Path) -> list[dict]:
    """Read raw values. CSV values remain strings; empty cells remain empty strings."""
    file = Path(path)
    with file.open(encoding="utf-8-sig", newline="") as handle:
        if file.suffix.lower() == ".csv":
            reader = csv.DictReader(handle, strict=True)
            headers = reader.fieldnames
            if not headers or any(not name for name in headers) or len(set(headers)) != len(headers):
                raise ValueError("CSV needs nonempty, unique column names")
            rows = list(reader)
            if any(None in row or any(value is None for value in row.values()) for row in rows):
                raise ValueError("CSV record width does not match its header")
        elif file.suffix.lower() == ".json":
            rows = _json(handle.read())
        elif file.suffix.lower() in {".jsonl", ".ndjson"}:
            rows = [_json(line) for line in handle if line.strip()]
        else:
            raise ValueError("Supported dataset formats are .csv, .json, .jsonl and .ndjson")
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise ValueError("Dataset must contain an array or stream of row objects")
    return rows


def normalize_csv(rows: list[dict], contract: DatasetContract) -> tuple[list[dict], dict]:
    """Explicit CSV-only conversions; unsupported spellings are left unchanged.

    Empty cells become null. Only plain decimal numbers, true/false (lowercase),
    and canonical integer strings convert. String and datetime columns retain
    text, including leading zeros. The original caller-owned records are intact.
    """
    normalized, changes = [], []
    for index, row in enumerate(rows):
        output = dict(row)
        for name, spec in contract.columns.items():
            if name not in row:
                continue
            value, kind = row[name], spec["type"]
            if not isinstance(value, str):
                raise ValueError("CSV normalization requires raw string values")
            converted = value
            if value == "":
                converted = None
            elif kind == "integer" and re.fullmatch(r"-?(?:0|[1-9]\d*)", value):
                converted = int(value)
            elif kind == "number" and re.fullmatch(r"-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?", value):
                candidate = float(value)
                if math.isfinite(candidate):
                    converted = candidate
            elif kind == "boolean" and value in {"true", "false"}:
                converted = value == "true"
            output[name] = converted
            if type(converted) is not type(value):
                changes.append({"row_index": index, "column": name,
                                "from_type": "string", "to_type": type(converted).__name__})
        normalized.append(output)
    return normalized, {"applied": True, "source_types": "CSV cells were read as strings",
                        "policy": "Empty cells -> null; declared numeric/boolean types convert only accepted literal spellings; invalid values remain unchanged",
                        "conversion_count": len(changes), "conversions": changes}


def run_validation(path: str | Path, contract_path: str | Path, baseline_path: str | Path | None = None) -> dict:
    """Read an explicit contract and dataset, normalize CSV, then validate."""
    contract = DatasetContract.from_dict(_json(Path(contract_path).read_text(encoding="utf-8-sig")))

    def load(file: str | Path) -> tuple[list, dict]:
        rows = read_rows(file)
        return normalize_csv(rows, contract) if Path(file).suffix.lower() == ".csv" else (
            rows, {"applied": False, "reason": "JSON types are preserved without coercion"})

    rows, normalization = load(path)
    baseline, baseline_normalization = load(baseline_path) if baseline_path is not None else (None, None)
    result = validate_rows(rows, contract, baseline)
    result["normalization"] = {"current": normalization, "baseline": baseline_normalization}
    result["input"] = {"path": str(Path(path)), "baseline_path": str(baseline_path) if baseline_path is not None else None,
                       "row_index_convention": "Zero-based physical record index, never a primary-key value"}
    return result

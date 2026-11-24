"""Independent, deliberately non-NYC examples for configurable dataset contracts."""

import copy
import json

import pytest

from project_b.portable import DatasetContract, normalize_csv, read_rows, run_validation, validate_rows


@pytest.fixture
def orders():
    contract = {
        "name": "Shop orders", "columns": {
            "order": {"type": "string"}, "amount": {"type": "number"},
            "country": {"type": "string"}, "currency": {"type": "string"},
            "placed": {"type": "datetime"}, "shipped": {"type": "datetime", "nullable": True},
            "status": {"type": "string"}},
        "primary_key": "order", "chronological_pair": ["placed", "shipped"],
        "categories": {"status": ["paid", "shipped"]},
        "pair_mappings": [{"source": "country", "target": "currency", "pairs": [["IN", "INR"], ["JP", "JPY"]]}]}
    rows = [{"order": "001", "amount": 250.5, "country": "IN", "currency": "INR",
             "placed": "2025-01-01T08:00:00Z", "shipped": "2025-01-02T08:00:00Z", "status": "shipped"},
            {"order": "002", "amount": 199, "country": "JP", "currency": "JPY",
             "placed": "2025-01-02T08:00:00Z", "shipped": None, "status": "paid"}]
    return contract, rows


@pytest.fixture
def support():
    contract = {"name": "Support tickets", "columns": {
        "ticket": {"type": "integer"}, "opened": {"type": "datetime"},
        "resolved": {"type": "datetime", "nullable": True, "required": False},
        "message": {"type": "string"}, "urgent": {"type": "boolean"}},
        "primary_key": "ticket", "chronological_pair": ["opened", "resolved"],
        "datetime_formats": {"opened": ["%d/%m/%Y", "iso8601"], "resolved": ["%d/%m/%Y", "iso8601"]},
        "text_columns": ["message"]}
    rows = [{"ticket": 801, "opened": "13/01/2025", "resolved": "14/01/2025", "message": "Delivery is late", "urgent": False},
            {"ticket": 802, "opened": "14/01/2025", "message": "Parcel damaged", "urgent": True}]
    return contract, rows


@pytest.fixture
def telemetry():
    contract = {"name": "Global telemetry", "columns": {
        "device": {"type": "string"}, "reading": {"type": "number", "nullable": True},
        "north": {"type": "number", "required": False}, "east": {"type": "number", "required": False}},
        "coordinate_pair": {"latitude": "north", "longitude": "east"}, "null_drift_threshold": 0.2}
    rows = [{"device": "sydney-7", "reading": 21.5, "north": -33.8688, "east": 151.2093},
            {"device": "tokyo-1", "reading": 18.4, "north": 35.6762, "east": 139.6503}]
    return contract, rows


def codes(report):
    return {item["code"] for item in report["alerts"]}


def test_three_independent_domains_pass(orders, support, telemetry):
    for config, rows in (orders, support, telemetry):
        result = validate_rows(rows, DatasetContract.from_dict(config))
        assert result["alerts"] == []
        assert result["semantic"]["status"] == "unsupported"
        assert result["statistics"]["status"] == "not_run"
        json.dumps(result, allow_nan=False)


def test_orders_corruptions_are_explained_with_physical_indices(orders):
    config, rows = orders
    rows[1].update(order="001", amount="199", currency="USD", status="impossible", shipped="2024-12-31T00:00:00Z")
    result = validate_rows(rows, DatasetContract.from_dict(config))
    assert codes(result) == {"duplicate_primary_key", "type_mismatch", "pair_mapping", "category", "chronology"}
    assert all(alert["row_index"] == 1 for alert in result["alerts"])
    assert next(a for a in result["alerts"] if a["code"] == "duplicate_primary_key")["first_row_index"] == 0


def test_column_remapping_does_not_change_behavior(orders):
    config, rows = orders
    rows[1]["shipped"] = "2024-01-01T00:00:00Z"
    mapping = {name: f"external_{index}" for index, name in enumerate(config["columns"])}
    remapped = copy.deepcopy(config)
    remapped["columns"] = {mapping[key]: value for key, value in config["columns"].items()}
    remapped["primary_key"] = mapping[config["primary_key"]]
    remapped["chronological_pair"] = [mapping[n] for n in config["chronological_pair"]]
    remapped["categories"] = {mapping[k]: v for k, v in config["categories"].items()}
    for pair in remapped["pair_mappings"]:
        pair["source"], pair["target"] = mapping[pair["source"]], mapping[pair["target"]]
    changed_rows = [{mapping[k]: v for k, v in row.items()} for row in rows]
    original = validate_rows(rows, DatasetContract.from_dict(config))
    changed = validate_rows(changed_rows, DatasetContract.from_dict(remapped))
    assert codes(original) == codes(changed) == {"chronology"}


@pytest.mark.parametrize("change", [
    {"unknown": True}, {"columns": {}}, {"columns": {"x": {"type": "magic"}}},
    {"columns": {"x": {"type": ["string"]}}}, {"columns": {"x": {"type": "string", "nullable": "yes"}}},
    {"primary_key": "missing"}, {"chronological_pair": ["order", "placed"]},
    {"text_columns": ""}, {"null_drift_threshold": float("nan")},
    {"pair_mappings": [{"source": "country", "target": "currency", "pairs": []}]},
])
def test_unknown_or_invalid_contract_is_rejected(orders, change):
    config, _ = orders
    config.update(change)
    with pytest.raises(ValueError):
        DatasetContract.from_dict(config)


def test_optional_absent_roles_do_not_emit_false_alerts(support, telemetry):
    config, rows = support
    rows[0].pop("resolved")
    assert validate_rows(rows, DatasetContract.from_dict(config))["alerts"] == []
    config, rows = telemetry
    for row in rows:
        row.pop("north")
        row.pop("east")
    assert validate_rows(rows, DatasetContract.from_dict(config))["alerts"] == []


def test_missing_required_and_undeclared_columns_are_visible(orders):
    config, rows = orders
    rows[0].pop("amount")
    rows[1]["surprise"] = 1
    assert codes(validate_rows(rows, DatasetContract.from_dict(config))) == {"missing_column", "undeclared_column"}


def test_global_coordinates_and_custom_geofence(telemetry):
    config, rows = telemetry
    assert not validate_rows(rows, DatasetContract.from_dict(config))["alerts"]
    config["coordinate_pair"]["bounds"] = {"latitude": [-40, -30], "longitude": [140, 160]}
    report = validate_rows(rows, DatasetContract.from_dict(config))
    assert codes(report) == {"coordinate_bounds"}
    assert all(a["row_index"] == 1 for a in report["alerts"])
    config["coordinate_pair"]["bounds"]["latitude"] = [-100, -30]
    with pytest.raises(ValueError):
        DatasetContract.from_dict(config)


def test_repeated_sensor_readings_without_primary_key_are_legitimate(telemetry):
    config, rows = telemetry
    assert not validate_rows(rows * 3, DatasetContract.from_dict(config))["alerts"]


def test_explicit_baseline_null_drift_preserves_denominators(telemetry):
    config, baseline = telemetry
    rows = copy.deepcopy(baseline)
    rows[1]["reading"] = None
    report = validate_rows(rows, DatasetContract.from_dict(config), baseline)
    assert codes(report) == {"null_rate_drift"}
    alert = report["alerts"][0]
    assert alert["row_index"] is None
    assert alert["baseline_rate"] == 0 and alert["current_rate"] == 0.5
    assert alert["baseline_records"] == alert["current_records"] == 2
    assert not validate_rows(rows, DatasetContract.from_dict(config))["alerts"]


def test_dates_timezone_and_pii_patterns(support):
    config, rows = support
    rows[0]["resolved"] = "2025-01-15T00:00:00Z"
    rows[1].update(opened="31/02/2025", message="Email me: private@example.com")
    result = validate_rows(rows, DatasetContract.from_dict(config))
    assert codes(result) == {"incomparable_datetimes", "invalid_datetime", "possible_pii"}
    assert "private@example.com" not in json.dumps(result)


def test_boolean_is_not_integer_and_nonfinite_number_is_flagged(support, telemetry):
    config, rows = support
    rows[0]["ticket"] = True
    assert codes(validate_rows(rows, DatasetContract.from_dict(config))) == {"type_mismatch"}
    config, rows = telemetry
    rows[0]["reading"] = float("nan")
    result = validate_rows(rows, DatasetContract.from_dict(config))
    assert codes(result) == {"type_mismatch"}
    json.dumps(result, allow_nan=False)


def test_csv_conversion_is_separate_audited_and_never_applied_to_json(tmp_path):
    config = {"columns": {"id": {"type": "string"}, "n": {"type": "integer"}, "ok": {"type": "boolean"}}}
    contract = DatasetContract.from_dict(config)
    csv_file = tmp_path / "rows.csv"
    csv_file.write_text("id,n,ok\n001,12,true\n002,twelve,TRUE\n", encoding="utf-8")
    raw = read_rows(csv_file)
    assert raw[0] == {"id": "001", "n": "12", "ok": "true"}
    normalized, audit = normalize_csv(raw, contract)
    assert raw[0]["n"] == "12"
    assert normalized[0] == {"id": "001", "n": 12, "ok": True}
    assert normalized[1]["n"] == "twelve" and normalized[1]["ok"] == "TRUE"
    assert audit["conversion_count"] == 2
    assert len(validate_rows(normalized, contract)["alerts"]) == 2
    assert len(validate_rows(raw, contract)["alerts"]) == 4


def test_run_validation_csv_baseline_and_jsonl(tmp_path, telemetry):
    config, rows = telemetry
    contract_file = tmp_path / "contract.json"
    contract_file.write_text(json.dumps(config), encoding="utf-8")
    baseline = tmp_path / "baseline.json"
    baseline.write_text(json.dumps(rows), encoding="utf-8")
    current = tmp_path / "current.csv"
    current.write_text("device,reading,north,east\nsydney-7,,-33.8688,151.2093\ntokyo-1,18.4,35.6762,139.6503\n", encoding="utf-8")
    result = run_validation(current, contract_file, baseline)
    assert codes(result) == {"null_rate_drift"}
    assert result["normalization"]["current"]["applied"]
    assert not result["normalization"]["baseline"]["applied"]
    line_file = tmp_path / "readings.jsonl"
    line_file.write_text("\n".join(json.dumps(row) for row in rows), encoding="utf-8")
    assert read_rows(line_file) == rows


@pytest.mark.parametrize("filename,content", [
    ("bad.csv", "a,a\n1,2\n"), ("bad.csv", "a,b\n1\n"), ("bad.csv", "a\n1,2\n"),
    ("bad.json", '[{"a":1,"a":2}]'), ("bad.json", '[{"a":NaN}]'), ("bad.json", '[{"a":1e999}]'),
    ("bad.json", '{"a":1}'), ("bad.jsonl", '{"a":1}\n42\n'),
])
def test_readers_reject_ambiguous_records(tmp_path, filename, content):
    file = tmp_path / filename
    file.write_text(content, encoding="utf-8")
    with pytest.raises(ValueError):
        read_rows(file)


def test_composite_primary_key_and_nullable_key():
    contract = DatasetContract.from_dict({"columns": {"device": {"type": "string"},
        "sequence": {"type": "integer", "nullable": True}}, "primary_key": ["device", "sequence"]})
    rows = [{"device": "x", "sequence": 1}, {"device": "y", "sequence": 1},
            {"device": "x", "sequence": 1}, {"device": "x", "sequence": None}]
    report = validate_rows(rows, contract)
    assert codes(report) == {"duplicate_primary_key", "null_primary_key"}
    assert [a["row_index"] for a in report["alerts"]] == [2, 3]

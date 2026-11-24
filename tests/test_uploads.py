from pathlib import Path

import pytest

from shared.uploads import validate_upload

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = (ROOT / "docs/contracts/orders.json").read_text()


def test_uploaded_sample_and_clean_baseline():
    result = validate_upload((ROOT / "examples/orders.csv").read_bytes(), "../../orders.csv", CONTRACT,
                             (ROOT / "examples/orders.clean.csv").read_bytes(), "baseline.csv")
    assert result["row_count"] == 3
    assert result["alert_count"] >= 4
    assert "path" not in result["input"]
    assert result["normalization"]["current"]["applied"]


@pytest.mark.parametrize("data,name,contract,error", [
    (b"[]", "bad.exe", CONTRACT, "Upload CSV"),
    (b"x" * (2 * 1024 * 1024 + 1), "large.csv", CONTRACT, "2 MB"),
    (b"[" + b"{}," * 1000 + b"{}]", "large.json", CONTRACT, "1,000 rows"),
    (b"[]", "data.json", "x" * 100001, "100 KB"),
    (b"[{\"id\":1,\"id\":2}]", "data.json", CONTRACT, "Duplicate"),
], ids=["extension", "byte_limit", "row_limit", "contract_limit", "duplicate_keys"])
def test_invalid_uploads(data, name, contract, error):
    with pytest.raises(ValueError, match=error):
        validate_upload(data, name, contract)

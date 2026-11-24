import pytest
from project_b.portable import DatasetContract, validate_rows


def test_customer_declared_numeric_range_is_inclusive():
    contract = DatasetContract.from_dict({"columns":{"reading":{"type":"number","minimum":-40,"maximum":85}}})
    result = validate_rows([{"reading":-40},{"reading":85},{"reading":86}],contract)
    assert result["alert_count"] == 1
    assert result["alerts"][0]["code"] == "numeric_range"
    assert result["alerts"][0]["row_index"] == 2


@pytest.mark.parametrize("spec",[{"type":"string","minimum":0},{"type":"number","minimum":10,"maximum":5},{"type":"number","minimum":True}])
def test_invalid_range_contracts_fail(spec):
    with pytest.raises(ValueError):
        DatasetContract.from_dict({"columns":{"x":spec}})


def test_generic_phone_and_explicit_name_are_review_candidates():
    contract = DatasetContract.from_dict({"columns":{"note":{"type":"string"}},"text_columns":["note"]})
    result = validate_rows([{"note":"Call (646) 555-0148"},{"note":"my name is Alex Morgan"}],contract)
    assert result["alert_count"] == 2
    assert all(a["code"]=="possible_pii" for a in result["alerts"])

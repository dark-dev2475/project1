from project_a.parser import parse_description
import pytest


@pytest.mark.parametrize("residency",["Indian tax resident. Non-resident.","Non-resident. Indian tax resident."])
def test_contradictory_residency_never_depends_on_order(residency):
    result = parse_description("FY 2024-25. Age 30. Annual salary 12 lakh. No deductions. "+residency)
    assert result["status"] == "needs_clarification"
    assert "resident" in result["conflicts"]


def test_single_negative_residency_is_not_a_conflict():
    result = parse_description("FY 2024-25. Age 30. Annual salary 12 lakh. No deductions. Not an Indian tax resident.")
    assert result["status"] == "ready"
    assert result["fields"]["resident"] is False

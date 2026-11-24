"""Independent source-review regressions outside the generated boundary oracle."""
from project_a.engine import calculate
from project_a.models import TaxInput
from project_a.parser import parse_description


def test_nonresident_age_alone_does_not_qualify_for_senior_80d_limit():
    # 80D Explanation requires residence as well as age. 14.25L taxable:
    # 12,500 + 100,000 + 127,500 = 240,000, plus 9,600 cess.
    inp = TaxInput("2024-25",1500000,age=65,resident=False,medical_self_family=50000)
    result = calculate(inp,"old")
    assert result["deductions"]["80d_self_family"] == 25000
    assert result["total_tax"] == 249600


def test_nonresident_taxpayer_can_have_qualifying_resident_family():
    inp = TaxInput("2024-25",1500000,age=65,resident=False,medical_self_family=50000,self_family_senior=True)
    assert calculate(inp,"old")["deductions"]["80d_self_family"] == 50000


def test_parent_age_alone_is_insufficient_for_80d_senior_limit():
    result = parse_description("FY 2024-25. Age 30. Indian tax resident. Annual salary 12 lakh. All amounts annual. Parents insurance 50000. Parents senior. No other deductions.")
    assert result["status"] == "needs_clarification"
    assert any(q["field"] == "parents_senior" for q in result["questions"])


def test_result_identifies_the_exact_policy():
    assert len(calculate(TaxInput("2024-25",1500000),"old")["policy_sha256"]) == 64

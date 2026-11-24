import json
from pathlib import Path

import pytest

from project_a.parser import parse_description
from shared.gemini import Gemini

CASES = json.loads((Path(__file__).parents[1] / "project_a/descriptions.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["id"])
def test_description_corpus(case):
    result = parse_description(case["text"])
    assert result["status"] == case["expected_status"], result
    if "expected_annual_gross_salary" in case:
        assert result["fields"]["annual_gross_salary"] == case["expected_annual_gross_salary"]
    if result["status"] == "needs_clarification":
        assert result["questions"]


def test_missing_deductions_do_not_default_to_zero():
    result = parse_description("Annual salary 12 lakh. FY 2025-26. Age 30. Indian tax resident.")
    assert result["status"] == "needs_clarification"
    assert "deduction_80c" not in result["fields"]


def test_user_can_resolve_a_conflicting_salary():
    result = parse_description("Annual salary 12 lakh. Annual salary 15 lakh. FY 2024-25. Age 30. Indian tax resident. No deductions.", confirmed={"annual_gross_salary": 1500000})
    assert result["status"] == "ready"
    assert result["fields"]["annual_gross_salary"] == 1500000


def test_llm_cannot_make_missing_facts_authoritative():
    payload = {"proposals": [{"field": "age", "value": 30, "quote": "aged 30"},
                              {"field": "annual_gross_salary", "value": 100000000, "quote": "salary 12 lakh"}]}
    response = {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(payload)}]}}]}
    client = Gemini(api_key="test", min_interval=0, transport=lambda _: response)
    result = parse_description("salary 12 lakh", client=client)
    assert result["status"] == "needs_clarification"
    assert "annual_gross_salary" not in result["fields"]
    assert len(result["proposals"]) == 1


def test_unknown_confirmation_rejected():
    with pytest.raises(ValueError, match="Unknown confirmed"):
        parse_description("salary 12 lakh", confirmed={"tax": 0})

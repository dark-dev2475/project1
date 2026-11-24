import json

import pytest

from project_a.llm import compile_policy, compiled_tax, load_compiled, query_tax
from project_a.models import TaxInput
from project_a.rules import load_rules
from project_b.llm import LLMReviewer
from shared.gemini import Gemini, ModelUnavailable


def client_for(value):
    return Gemini(api_key="test", min_interval=0, transport=lambda _: {
        "candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(value)}]}}]})


def test_query_experiment_preserves_wrong_model_answer():
    wrong = {"old": {"total_tax": 123, "clauses": []}, "new": {"total_tax": 456, "clauses": []}}
    result = query_tax(TaxInput("2024-25", 1200000), client_for(wrong))
    assert result["result"] == wrong  # no deterministic fallback hides the error


def test_negative_model_tax_fails_validation():
    wrong = {"old": {"total_tax": -1, "clauses": []}, "new": {"total_tax": 0, "clauses": []}}
    with pytest.raises(ModelUnavailable, match="validation"):
        query_tax(TaxInput("2024-25", 1200000), client_for(wrong))


def test_compiled_policy_requires_review_and_detects_edits(tmp_path):
    path = tmp_path / "candidate.json"
    artifact = compile_policy(client_for(load_rules()), path)
    with pytest.raises(ValueError, match="approval|review"):
        load_compiled(path)
    artifact["review"] = {"status": "approved", "reviewer": "test fixture",
                          "policy_sha256": artifact["policy_sha256"]}
    path.write_text(json.dumps(artifact), encoding="utf-8")
    assert compiled_tax(TaxInput("2024-25", 1200000), path)["query_llm_calls"] == 0
    artifact["policy"]["cess_rate"] = "0.05"
    path.write_text(json.dumps(artifact), encoding="utf-8")
    with pytest.raises(ValueError, match="digest"):
        load_compiled(path)


def test_reviewer_rejects_missing_decisions():
    reviewer = LLMReviewer(client_for({"decisions": []}))
    with pytest.raises(ModelUnavailable, match="incomplete"):
        reviewer([{"kind": "pii", "row_id": "1", "row": {"descriptor": "test"}}])


def test_reviewer_strips_ground_truth_and_redacts_patterns():
    captured = []
    def transport(payload):
        captured.append(payload)
        return {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps({
            "decisions": [{"kind": "pii", "row_id": "1", "is_anomaly": True, "reason": "Email marker"}]})}]}}]}
    reviewer = LLMReviewer(Gemini(api_key="test", min_interval=0, transport=transport))
    result = reviewer([{"kind": "pii", "row_id": "1", "row": {"descriptor": "test@example.org"}, "ground_truth": True}])
    assert result[0]["is_anomaly"] is True
    sent = json.dumps(captured)
    assert "test@example.org" not in sent and "ground_truth" not in sent
    assert "EMAIL REDACTED" in sent

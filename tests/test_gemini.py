import pytest

from shared.gemini import Gemini, ModelUnavailable


def response(value='{"tax": 10}', finish="STOP"):
    return {"candidates": [{"finishReason": finish, "content": {"parts": [{"text": value}]}}],
            "usageMetadata": {"promptTokenCount": 100, "candidatesTokenCount": 20, "thoughtsTokenCount": 5}}


def test_client_counts_real_attempts_and_does_not_cache():
    payloads = []
    def transport(payload):
        payloads.append(payload)
        return response()
    client = Gemini(api_key="test-secret", model="gemini-2.5-flash-lite", max_calls=2, min_interval=0, transport=transport)
    first = client.generate("same", system="test")
    second = client.generate("same", system="test")
    assert len(payloads) == 2
    assert first.prompt_sha256 == second.prompt_sha256
    assert first.value == {"tax": 10}
    assert first.paid_equivalent_usd == pytest.approx(0.00002)
    with pytest.raises(ModelUnavailable, match="budget exhausted"):
        client.generate("third", system="test")
    assert client.attempts == 2
    assert "test-secret" not in str(client.usage())


@pytest.mark.parametrize("raw,finish", [("not-json", "STOP"), ('{"tax":10}', "MAX_TOKENS")])
def test_invalid_or_truncated_output_is_failure(raw, finish):
    client = Gemini(api_key="test", min_interval=0, transport=lambda _: response(raw, finish))
    with pytest.raises(ModelUnavailable):
        client.generate("test", system="test")
    assert client.usage()["failed_calls"] == 1
    assert not client.observations


def test_missing_key_makes_no_network_request(monkeypatch):
    monkeypatch.setattr("shared.gemini.load_local_env", lambda: None)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    client = Gemini(transport=lambda _: pytest.fail("Network must not be called"))
    with pytest.raises(ModelUnavailable, match="GEMINI_API_KEY"):
        client.generate("test", system="test")
    assert client.attempts == 0


def test_unknown_model_price_is_unknown(monkeypatch):
    monkeypatch.setattr("shared.gemini.load_local_env", lambda: None)
    monkeypatch.delenv("GEMINI_INPUT_USD_PER_MILLION", raising=False)
    monkeypatch.delenv("GEMINI_OUTPUT_USD_PER_MILLION", raising=False)
    client = Gemini(api_key="test", model="a-new-model", min_interval=0, transport=lambda _: response())
    assert client.generate("test", system="test").paid_equivalent_usd is None


def test_local_env_is_inert_and_does_not_override_existing_values(tmp_path,monkeypatch):
    from shared.gemini import load_local_env
    monkeypatch.setenv("GEMINI_MODEL","explicit-model")
    monkeypatch.delenv("GEMINI_API_KEY",raising=False)
    monkeypatch.delenv("UNRELATED_SECRET",raising=False)
    path = tmp_path/".env"
    path.write_text('GEMINI_MODEL=file-model\nGEMINI_API_KEY="test-value"\nUNRELATED_SECRET=ignored\n',encoding="utf-8")
    load_local_env(path)
    import os
    assert os.environ["GEMINI_MODEL"] == "explicit-model"
    assert os.environ["GEMINI_API_KEY"] == "test-value"
    assert "UNRELATED_SECRET" not in os.environ

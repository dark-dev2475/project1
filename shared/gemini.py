"""A bounded Gemini REST client. A missing model result is never a synthetic success."""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ModelUnavailable(RuntimeError):
    """Credentials, quota, network, or model output prevented an observation."""


def load_local_env(path: Path | None = None):
    """Read a local ignored config file as inert values; existing environment wins."""
    path = path or Path(__file__).resolve().parents[1] / ".env"
    allowed = {"GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_MODEL", "GEMINI_MAX_CALLS",
               "GEMINI_MIN_INTERVAL", "GEMINI_INPUT_USD_PER_MILLION", "GEMINI_OUTPUT_USD_PER_MILLION"}
    if path.is_file():
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            key, separator, value = line.strip().partition("=")
            if separator and key in allowed:
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if value:
                    os.environ.setdefault(key,value)


@dataclass(frozen=True)
class Observation:
    value: Any
    model: str
    prompt_sha256: str
    latency_ms: float
    input_tokens: int
    output_tokens: int
    thinking_tokens: int
    paid_equivalent_usd: float | None
    attempts: int

    def to_dict(self) -> dict:
        return asdict(self)


class Gemini:
    """No hidden retries/caches in repeatability experiments; budget counts HTTP attempts.

    Price is a configurable *paid equivalent*, not a free-tier charge. Default rates are
    known only for gemini-2.5-flash-lite, checked at ai.google.dev/gemini-api/docs/pricing.
    Model changes produce unknown costs unless explicit prices are supplied.
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        max_calls: int | None = None,
        min_interval: float | None = None,
        timeout: float = 60,
        transport: Callable[[dict], dict] | None = None,
    ):
        load_local_env()
        self._api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
        if not re.fullmatch(r"[a-zA-Z0-9._-]+", self.model):
            raise ValueError("Invalid Gemini model identifier")
        self.max_calls = max_calls if max_calls is not None else int(os.getenv("GEMINI_MAX_CALLS", "40"))
        self.min_interval = min_interval if min_interval is not None else float(os.getenv("GEMINI_MIN_INTERVAL", "6"))
        if self.max_calls < 0 or self.min_interval < 0 or timeout <= 0:
            raise ValueError("Invalid call budget, interval, or timeout")
        self.timeout = timeout
        self.attempts = 0
        self.observations: list[Observation] = []
        self.failures: list[dict] = []
        self._last_call = 0.0
        self._transport = transport or self._http

    @property
    def configured(self) -> bool:
        return bool(self._api_key)

    def _http(self, payload: dict) -> dict:
        request = Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "x-goog-api-key": self._api_key or ""},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.load(response)
        except HTTPError as exc:
            # Do not retain response bodies, request headers, or keys in exception logs.
            raise ModelUnavailable(f"Gemini HTTP {exc.code}; check model availability or quota") from None
        except (URLError, TimeoutError, OSError):
            raise ModelUnavailable("Gemini network request failed or timed out") from None

    def generate(self, prompt: str, *, system: str, schema: dict | None = None) -> Observation:
        if not self.configured:
            raise ModelUnavailable("Set GEMINI_API_KEY in the process environment to run live experiments")
        if self.attempts >= self.max_calls:
            raise ModelUnavailable(f"Gemini attempt budget exhausted ({self.max_calls})")
        config = {"temperature": 0, "responseMimeType": "application/json", "maxOutputTokens": 8192}
        if schema:
            config["responseJsonSchema"] = schema
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": config,
        }
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        delay = self.min_interval - (time.monotonic() - self._last_call)
        if delay > 0:
            time.sleep(delay)
        self.attempts += 1
        self._last_call = time.monotonic()
        started = time.perf_counter()
        try:
            response = self._transport(payload)
            if not isinstance(response, dict):
                raise ValueError("Invalid provider response")
            candidates = response.get("candidates", [])
            if not isinstance(candidates, list) or not candidates or not isinstance(candidates[0], dict) or candidates[0].get("finishReason") != "STOP":
                raise ModelUnavailable("Gemini returned no complete answer (blocked or truncated)")
            parts = candidates[0].get("content", {}).get("parts", [])
            if not isinstance(parts,list) or any(not isinstance(part,dict) for part in parts):
                raise ValueError("Invalid response parts")
            answer = "".join(part.get("text", "") for part in parts if not part.get("thought"))
            value = json.loads(answer)
            usage = response.get("usageMetadata", {})
            input_tokens = int(usage.get("promptTokenCount", 0))
            output_tokens = int(usage.get("candidatesTokenCount", 0))
            thinking_tokens = int(usage.get("thoughtsTokenCount", 0))
            default_in = "0.10" if self.model == "gemini-2.5-flash-lite" else None
            default_out = "0.40" if self.model == "gemini-2.5-flash-lite" else None
            price_in = os.getenv("GEMINI_INPUT_USD_PER_MILLION", default_in)
            price_out = os.getenv("GEMINI_OUTPUT_USD_PER_MILLION", default_out)
            cost = None if price_in is None or price_out is None else (
                input_tokens * float(price_in) + (output_tokens + thinking_tokens) * float(price_out)
            ) / 1_000_000
            result = Observation(value, self.model, digest, (time.perf_counter() - started) * 1000,
                                 input_tokens, output_tokens, thinking_tokens, cost, 1)
            self.observations.append(result)
            return result
        except (KeyError, TypeError, ValueError, ModelUnavailable) as exc:
            reason = str(exc) if isinstance(exc, ModelUnavailable) else "Gemini returned invalid JSON or usage metadata"
            self.failures.append({"prompt_sha256": digest, "reason": reason})
            raise ModelUnavailable(reason) from None

    def usage(self) -> dict:
        costs = [item.paid_equivalent_usd for item in self.observations]
        return {
            "model": self.model, "http_attempts": self.attempts, "successful_calls": len(self.observations),
            "failed_calls": len(self.failures),
            "input_tokens": sum(x.input_tokens for x in self.observations),
            "output_tokens": sum(x.output_tokens + x.thinking_tokens for x in self.observations),
            "paid_equivalent_usd": sum(costs) if all(x is not None for x in costs) else None,
            "free_tier_charge_usd": 0 if self.observations else None,
            "billing_note": "Assumes account is on free tier; failed-call token usage unavailable; paid equivalent excludes it.",
        }

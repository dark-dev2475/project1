"""Small loopback-only demo service. Domain code is independent of HTTP."""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

from project_a.engine import compare
from project_a.models import TaxInput
from project_a.parser import parse_description
from project_b.portable import DatasetContract, validate_rows

ROOT = Path(__file__).resolve().parents[1]


def dispatch(path, payload):
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object")
    if path == "/api/tax/describe":
        if set(payload) - {"text", "confirmed"}:
            raise ValueError("Allowed fields are text and confirmed")
        parsed = parse_description(payload.get("text"), confirmed=payload.get("confirmed"))
        result = {"parsed": parsed}
        if parsed["status"] == "ready":
            result["calculation"] = compare(TaxInput.from_dict(parsed["fields"]))
        return result
    if path == "/api/tax":
        inp = TaxInput.from_dict(payload)
        return {"input": inp.to_dict(), "result": compare(inp),
                "input_contract": "Structured API uses documented TaxInput defaults for omitted optional fields; prose route asks questions."}
    if path == "/api/quality":
        if set(payload) - {"rows", "contract", "baseline"}:
            raise ValueError("Allowed fields are rows, contract and baseline")
        rows = payload.get("rows")
        if not isinstance(rows, list) or len(rows) > 10_000:
            raise ValueError("rows must be an array of at most 10,000 row objects")
        return validate_rows(rows, DatasetContract.from_dict(payload.get("contract")), payload.get("baseline"))
    raise LookupError("Unknown API endpoint")


class Handler(BaseHTTPRequestHandler):
    server_version = "DecisionLab/0.1"

    def _send(self, status, content, mime="application/json; charset=utf-8"):
        body = json.dumps(content, ensure_ascii=False, allow_nan=False).encode() if isinstance(content, (dict,list)) else content
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/health":
            return self._send(200, {"status": "ok", "model_calls": "disabled in demo HTTP service"})
        if path == "/api/metrics":
            path = "/artifacts/summary.json"
        allowed = {"/": ("reports/index.html", "text/html; charset=utf-8"),
                   "/favicon.ico": None}
        if path in allowed:
            target = allowed[path]
            if target is None:
                return self._send(204, b"")
            filename, mime = target
        elif path in {"/RESULTS_A.md", "/RESULTS_B.md", "/DECISION_MATRIX.md", "/README.md",
                      "/evidence/official_calculator/README.md", "/docs/contracts/orders.json",
                      "/artifacts/summary.json", "/artifacts/tax_benchmark.json", "/artifacts/data_quality_benchmark.json"}:
            filename = path.lstrip("/")
            mime = "application/json; charset=utf-8" if filename.endswith(".json") else "text/plain; charset=utf-8"
        else:
            return self._send(404, {"error": "Not found"})
        target = ROOT / filename
        if not target.is_file():
            return self._send(404, {"error": "Artifact missing; run python lab.py reproduce"})
        self._send(200, target.read_bytes(), mime)

    def do_POST(self):
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            return self._send(403, {"error": "Cross-origin requests are not allowed"})
        if self.headers.get_content_type() != "application/json":
            return self._send(415, {"error": "Use Content-Type: application/json"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 1_000_000:
                return self._send(413, {"error": "Body must contain 1 to 1,000,000 bytes"})
            self.connection.settimeout(15)
            body = self.rfile.read(size)
            payload = json.loads(body)
            result = dispatch(urlsplit(self.path).path, payload)
        except LookupError as exc:
            return self._send(404, {"error": str(exc)})
        except (ValueError, TypeError, UnicodeError, TimeoutError) as exc:
            return self._send(400, {"error": str(exc)})
        self._send(200, result)

    def log_message(self, format, *args):
        # Request bodies (salary/PII) and credentials are never logged.
        return


def serve(port=8765):
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Decision Lab: http://127.0.0.1:{port} (Ctrl+C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

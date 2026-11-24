import json
from http.server import ThreadingHTTPServer
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

from shared.service import Handler, dispatch


@pytest.fixture
def server():
    httpd = ThreadingHTTPServer(("127.0.0.1",0),Handler)
    thread = threading.Thread(target=httpd.serve_forever,daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_port}"
    httpd.shutdown()
    httpd.server_close()
    thread.join()


def test_http_salary_description_produces_both_regimes(server):
    req = Request(server+"/api/tax/describe",data=json.dumps({"text":"Annual salary 15 lakh. FY 2025-26. Age 32. Indian tax resident. No deductions."}).encode(),headers={"Content-Type":"application/json"})
    with urlopen(req) as response:
        result = json.load(response)
    assert result["parsed"]["status"] == "ready"
    assert result["calculation"]["new"]["total_tax"] == 97500
    assert result["calculation"]["old"]["total_tax"] == 257400


def test_incomplete_description_cannot_calculate():
    result = dispatch("/api/tax/describe",{"text":"Meri salary 80000 hai"})
    assert "calculation" not in result
    assert result["parsed"]["questions"]


def test_http_rejects_invalid_input_and_file_traversal(server):
    req = Request(server+"/api/tax",data=b'{"fiscal_year":"2025-26","annual_gross_salary":-1}',headers={"Content-Type":"application/json"})
    with pytest.raises(HTTPError) as exc:
        urlopen(req)
    assert exc.value.code == 400
    with pytest.raises(HTTPError) as exc:
        urlopen(server+"/../.env")
    assert exc.value.code == 404


def test_portable_quality_api_uses_customer_contract():
    result = dispatch("/api/quality",{"rows":[{"invoice":"x","usd":3},{"invoice":"x","usd":"bad"}],
                       "contract":{"columns":{"invoice":{"type":"string"},"usd":{"type":"number"}},"primary_key":"invoice"}})
    assert result["alert_count"] >= 2
    assert result["semantic"]["status"] == "unsupported"


def test_demo_rejects_cross_origin_post(server):
    req = Request(server+"/api/tax",data=b'{}',headers={"Content-Type":"application/json","Origin":"https://example.com"})
    with pytest.raises(HTTPError) as exc:
        urlopen(req)
    assert exc.value.code == 403

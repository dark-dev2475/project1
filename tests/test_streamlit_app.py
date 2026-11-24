"""Exercise actual Streamlit reruns; model calls remain explicitly user triggered."""
from pathlib import Path

import pytest

pytest.importorskip("streamlit")
from streamlit.testing.v1 import AppTest  # noqa: E402

APP = str(Path(__file__).resolve().parents[1] / "streamlit_app.py")


def app_on(page):
    app = AppTest.from_file(APP).run(timeout=20)
    assert not app.exception
    app.sidebar.radio[0].set_value(page).run()
    assert not app.exception
    return app


def test_tax_form_and_invalid_json():
    app = app_on("Tax laboratory")
    app.button[0].click().run()
    assert not app.exception
    assert any(m.value == "₹97,500" for m in app.metric)
    assert "model_result" not in app.session_state
    app.radio[0].set_value("JSON").run()
    app.text_area[0].set_value('{"fiscal_year": "2025-26", "annual_gross_salary": -1}')
    app.button[0].click().run()
    assert not app.exception
    assert app.error
    assert not app.metric


def test_incomplete_prose_needs_clarification():
    app = app_on("Tax laboratory")
    app.radio[0].set_value("Description").run()
    app.text_area[0].set_value("Salary 15 lakh")
    app.button[0].click().run()
    assert not app.exception
    assert app.warning
    assert not app.metric


def test_dataset_examples_and_contract_errors():
    app = app_on("Data quality")
    app.button[0].click().run()
    assert not app.exception
    assert app.metric[1].value == "4"
    app.selectbox[0].set_value("Global sensors").run()
    app.button[0].click().run()
    assert not app.exception
    assert app.metric[1].value == "0"
    app.text_area[0].set_value("not json")
    app.button[0].click().run()
    assert app.error
    assert not app.metric


def test_reports_render():
    app = app_on("Evidence")
    for name in app.selectbox[0].options:
        app.selectbox[0].set_value(name).run()
        assert not app.exception
        assert app.markdown

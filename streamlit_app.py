"""Streamlit presentation adapter. No benchmarks or model calls run on page load."""
from __future__ import annotations

import json
from pathlib import Path
import re
import threading

import streamlit as st

from project_a.engine import compare
from project_a.llm import query_tax
from project_a.models import TaxInput
from project_a.parser import parse_description
from shared.gemini import Gemini, ModelUnavailable
from shared.uploads import validate_upload

ROOT = Path(__file__).resolve().parent
st.set_page_config(page_title="Decision Lab · Rules vs LLMs", page_icon="◈", layout="wide")


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


@st.cache_resource
def model_resource():
    # One process-wide budget, shared across visitors and protected against concurrent calls.
    options = {}
    try:
        for name, argument in (("GEMINI_API_KEY", "api_key"), ("GEMINI_MODEL", "model"),
                               ("GEMINI_MAX_CALLS", "max_calls")):
            if name in st.secrets:
                options[argument] = int(st.secrets[name]) if argument == "max_calls" else str(st.secrets[name])
    except FileNotFoundError:
        pass
    return Gemini(**options), threading.Lock()


def show_tax(result):
    left, right, saving = st.columns(3)
    left.metric("Old regime", f"₹{result['old']['total_tax']:,.0f}")
    right.metric("New regime", f"₹{result['new']['total_tax']:,.0f}")
    saving.metric("Difference", f"₹{result['savings']:,.0f}")
    st.success("Both regimes are equal." if result["recommended_regime"] == "tie" else
               f"{result['recommended_regime'].title()} regime has the lower calculated tax.")
    for regime in ("old", "new"):
        with st.expander(f"{regime.title()} regime · calculation ledger"):
            st.dataframe(result[regime]["ledger"], hide_index=True, width="stretch")


def overview(summary):
    st.caption("MEASURE FIRST. CHOOSE SECOND.")
    st.title("Where rules end, judgment begins.")
    st.write("An experiment in exact tax calculations, messy data, and the useful boundaries of language models.")
    tax = summary["tax"]
    a, b, c = st.columns(3)
    a.metric("Exact rule-based tax answers", f"{tax['hand_coded']['exact']} / {tax['hand_coded']['checked']}")
    b.metric("Profiles · repeated 10 times", tax["profiles"])
    c.metric("Data-quality problem types", 12)
    st.divider()
    left, right = st.columns(2)
    with left:
        st.subheader("01 / Tax laboratory")
        st.write("Compare both regimes for FY 2024–25 and 2025–26. Inspect deductions, marginal relief, cess, and every calculation clause.")
    with right:
        st.subheader("02 / Data quality")
        st.write("Explore a real NYC 311 snapshot, then validate your own data using explicit types, keys, dates and domain constraints.")
    live = tax["llm_query_time"]
    st.info(f"Recorded Gemini experiment: {live['status']} · {live.get('completed_calls', 0)} completed calls. "
            "Recorded benchmark results and interactive requests are separate.")
    st.caption(f"Evidence generated: {summary.get('generated_at', 'unknown')}. "
               "The 1,800-row NYC snapshot is nonrandom; synthetic detection metrics do not establish production accuracy.")


def tax_page():
    st.title("Tax laboratory")
    st.write("Annual salary-only inputs in INR. Eligible deductions only; see the source notes for HRA and loan conditions.")
    mode = st.radio("Input method", ["Form", "Description", "JSON"], horizontal=True)
    with st.form("tax_form"):
        if mode == "Form":
            left, right = st.columns(2)
            year = left.selectbox("Financial year", ["2025-26", "2024-25"])
            salary = right.number_input("Annual gross salary (INR)", min_value=0.0, value=1500000.0, step=10000.0)
            age = left.number_input("Age attained during the year", min_value=0, max_value=120, value=30)
            resident = right.checkbox("Indian tax resident", value=True)
            values = {"fiscal_year": year, "annual_gross_salary": salary, "age": age, "resident": resident}
            with st.expander("Deductions and HRA"):
                fields = [("hra_received", "Annual HRA received"), ("hra_salary", "Annual salary for HRA calculation"),
                          ("rent_paid", "Annual rent paid"), ("deduction_80c", "Eligible section 80C"),
                          ("deduction_80ccd1b", "Additional NPS · 80CCD(1B)"),
                          ("medical_self_family", "Eligible medical insurance · self / family"),
                          ("medical_parents", "Eligible medical insurance · parents"),
                          ("home_loan_interest", "Eligible self-occupied home loan interest")]
                cols = st.columns(2)
                for index, (key, label) in enumerate(fields):
                    values[key] = cols[index % 2].number_input(label, min_value=0.0, value=0.0, step=1000.0)
                values["metro"] = st.checkbox("HRA residence: Delhi, Mumbai, Kolkata or Chennai")
                values["self_family_senior"] = st.checkbox("Qualifying resident senior in self / family")
                values["parents_senior"] = st.checkbox("Qualifying resident senior parent")
        elif mode == "Description":
            description = st.text_area("Describe your salary and deductions", height=150,
                                       placeholder="FY 2025-26, age 30, Indian resident, annual gross salary 15 lakh, no deductions.")
        else:
            raw = st.text_area("Tax input JSON", (ROOT / "examples/tax.json").read_text(), height=260)
        submitted = st.form_submit_button("Compare regimes", type="primary")
    if submitted:
        st.session_state.pop("tax_result", None)
        st.session_state.pop("tax_input", None)
        st.session_state.pop("model_result", None)
        try:
            if mode == "Description":
                parsed = parse_description(description)
                if parsed["status"] != "ready":
                    st.warning("More information is needed before calculating." if parsed["status"] == "needs_clarification"
                               else "This description is outside the supported salary scope.")
                    st.json(parsed)
                    return
                values = parsed["fields"]
            elif mode == "JSON":
                values = json.loads(raw)
            inp = TaxInput.from_dict(values)
            st.session_state.tax_input = inp.to_dict()
            st.session_state.tax_result = compare(inp)
        except (ValueError, TypeError) as exc:
            st.error(str(exc))
    if "tax_result" in st.session_state:
        show_tax(st.session_state.tax_result)
        with st.expander("Compare a live Gemini answer"):
            client, lock = model_resource()
            st.caption(f"Model: {client.model}. This sends the calculated profile to Google's Gemini API. "
                       "Its answer is experimental and is compared against the deterministic calculation.")
            consent = st.checkbox("Send this profile to Gemini for comparison")
            if st.button("Ask Gemini", disabled=not (consent and client.configured)):
                try:
                    with st.spinner("Computing an independent model answer…"), lock:
                        st.session_state.model_result = query_tax(TaxInput.from_dict(st.session_state.tax_input), client)
                except ModelUnavailable as exc:
                    st.error(str(exc))
            if not client.configured:
                st.info("Add GEMINI_API_KEY to Streamlit secrets to enable live comparison.")
            if "model_result" in st.session_state:
                model = st.session_state.model_result
                rows = [{"Regime": regime.title(), "Rules (INR)": st.session_state.tax_result[regime]["total_tax"],
                         "Gemini (INR)": model["result"][regime]["total_tax"],
                         "Difference (INR)": model["result"][regime]["total_tax"] - st.session_state.tax_result[regime]["total_tax"]}
                        for regime in ("old", "new")]
                st.dataframe(rows, hide_index=True, width="stretch")
                st.json(model)


def dataset_page():
    st.title("Data quality, on your terms.")
    st.write("Choose a sample or upload a dataset. Edit its contract to describe valid data in your domain. "
             "Files are processed on the app server in temporary storage and are not sent to Gemini.")
    example = st.selectbox("Dataset", ["Orders", "Support tickets", "Global sensors", "Upload my data"])
    files = {"Orders": ("orders.csv", "orders.json"), "Support tickets": ("support.jsonl", "support.json"),
             "Global sensors": ("sensors.json", "sensors.json")}
    uploaded = None
    if example == "Upload my data":
        uploaded = st.file_uploader("Dataset · up to 2 MB and 1,000 rows", type=["csv", "json", "jsonl", "ndjson"])
    filename, contract_name = files.get(example, ("orders.csv", "orders.json"))
    contract = st.text_area("Validation contract (JSON)", (ROOT / "docs/contracts" / contract_name).read_text(),
                            height=300, key=f"contract_{example}")
    baseline = st.file_uploader("Optional baseline for null-rate drift", type=["csv", "json", "jsonl", "ndjson"])
    if st.button("Validate dataset", type="primary"):
        st.session_state.pop("dataset_result", None)
        if example == "Upload my data" and uploaded is None:
            st.error("Choose a dataset file first.")
            return
        try:
            data = uploaded.getvalue() if uploaded is not None else (ROOT / "examples" / filename).read_bytes()
            result = validate_upload(data, uploaded.name if uploaded is not None else filename, contract,
                                     baseline.getvalue() if baseline else None, baseline.name if baseline else "baseline.json")
            st.session_state.dataset_result = result
            st.session_state.dataset_result_name = example
        except (ValueError, TypeError, UnicodeError, OSError) as exc:
            st.error(f"Validation could not run: {exc}")
    if "dataset_result" in st.session_state:
        result = st.session_state.dataset_result
        st.caption(f"Last completed validation: {st.session_state.dataset_result_name}")
        a, b = st.columns(2)
        a.metric("Rows checked", result["row_count"])
        b.metric("Findings", result["alert_count"])
        if result["alerts"]:
            st.dataframe(result["alerts"], hide_index=True, width="stretch")
        else:
            st.success("No violations of the declared contract were found.")
        st.caption("A passing contract does not prove semantic correctness. Add domain mappings and review ambiguous text.")
        st.download_button("Download validation report", json.dumps(result, indent=2), "validation.json", "application/json")
        with st.expander("Full validation details"):
            st.json(result)


def evidence_page():
    st.title("Evidence you can inspect.")
    st.write("Fixed fixtures, official-source replay, controlled corruptions, and explicitly measured model coverage.")
    docs = {"Tax results": "RESULTS_A.md", "Data-quality results": "RESULTS_B.md", "Decision matrix": "DECISION_MATRIX.md",
            "Architecture": "docs/ARCHITECTURE.md", "Tax source notes": "project_a/source_rules.md",
            "Official calculator checks": "evidence/official_calculator/README.md"}
    selected = st.selectbox("Report", list(docs))
    path = ROOT / docs[selected]
    content = path.read_text(encoding="utf-8")
    st.download_button("Download report", content, path.name, "text/markdown")
    # Relative file links would resolve against the Streamlit host rather than the repo.
    def repo_link(match):
        label, target = match.groups()
        if re.match(r"https?://|#", target):
            return match.group(0)
        resolved = (path.parent / target).resolve()
        if not resolved.is_relative_to(ROOT):
            return label
        return f"[{label}](https://github.com/dark-dev2475/project1/blob/main/{resolved.relative_to(ROOT).as_posix()})"
    st.markdown(re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repo_link, content))


with st.sidebar:
    st.title("◈ Decision Lab")
    st.caption("RULES · STATISTICS · LANGUAGE MODELS")
    page = st.radio("Explore", ["Overview", "Tax laboratory", "Data quality", "Evidence"], label_visibility="collapsed")
    st.divider()
    st.caption("Two experiments. One question: which decisions deserve a model?")
    st.link_button("View source on GitHub", "https://github.com/dark-dev2475/project1")

if page == "Overview":
    overview(read_json("artifacts/summary.json"))
elif page == "Tax laboratory":
    tax_page()
elif page == "Data quality":
    dataset_page()
else:
    evidence_page()

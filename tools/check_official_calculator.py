"""Replay unmodified ITD JavaScript and compare saved outputs with Project A.

Requires Node.js only for --replay. All amounts are INR. This is local execution
of official downloaded code, not browser screenshots or manual calculator entries.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, ROUND_DOWN
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence" / "official_calculator"
sys.path.insert(0, str(ROOT))


def round_final(value: int | float) -> int:
    """Section 288B: discard paise, then nearest ten rupees."""
    return int((Decimal(str(value)).to_integral_value(rounding=ROUND_DOWN) + 5) // 10 * 10)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replay", action="store_true", help="Re-run the pinned official JS with Node.js")
    parser.add_argument("--strict", action="store_true", help="Fail on documented upstream discrepancies as well")
    args = parser.parse_args()
    provenance = json.loads((EVIDENCE / "provenance.json").read_text(encoding="utf-8"))
    for artifact in provenance["artifacts"]:
        if not artifact.get("retained", True):
            continue
        actual = hashlib.sha256((EVIDENCE / artifact["file"]).read_bytes()).hexdigest()
        if actual != artifact["sha256"]:
            raise ValueError(f"Official artifact hash mismatch: {artifact['file']}")
    fixtures = json.loads((EVIDENCE / "fixtures.json").read_text(encoding="utf-8"))
    cases = fixtures["cases"]
    if args.replay:
        completed = subprocess.run(
            ["node", str(EVIDENCE / "run_official.cjs")],
            input=json.dumps(cases), text=True, capture_output=True, check=True, timeout=60,
        )
        replay = json.loads(completed.stdout)
        for saved, actual in zip(cases, replay, strict=True):
            if saved["official_output"] != actual["official_output"]:
                raise AssertionError(f"Official replay changed for {saved['id']}")
        print(f"Official JavaScript replay: {len(cases)}/{len(cases)} exact output matches")

    from project_a.engine import calculate
    from project_a.models import TaxInput

    failures = []
    known = {item["id"]: item for item in json.loads((EVIDENCE / "known_discrepancies.json").read_text(encoding="utf-8"))}
    documented = []
    for case in cases:
        request = TaxInput.from_dict(case["project_input"])
        actual = calculate(request, case["regime"])
        expected = case["official_output"]["BalTax"]
        if expected != round_final(case["official_output"]["TotalTax"]):
            raise AssertionError(f"Unexpected official rounding for {case['id']}")
        if actual["total_tax"] != expected or actual["taxable_income"] != case["taxable_income"]:
            difference = {"id": case["id"], "official_total_raw": case["official_output"]["TotalTax"],
                          "official_BalTax": expected, "project_total": actual["total_tax"],
                          "project_taxable_income": actual["taxable_income"]}
            record = known.get(case["id"])
            if record and actual["total_tax"] == record["expected_project_total"] and expected == record["official_BalTax"] and actual["taxable_income"] == case["taxable_income"]:
                documented.append(difference)
            else:
                failures.append(difference)
    print(f"Project A vs official calculator: {len(cases) - len(failures) - len(documented)}/{len(cases)} exact matches; "
          f"{len(documented)} documented upstream discrepancies; {len(failures)} unexpected mismatches")
    if documented:
        print("Documented differences (see evidence/official_calculator/known_discrepancies.json):")
        print(json.dumps(documented, indent=2))
    if failures:
        print(json.dumps(failures, indent=2))
        return 1
    return int(args.strict and bool(documented))


if __name__ == "__main__":
    raise SystemExit(main())

"""Rebuild independently-derived fixtures: python -m tests.build_tax_fixtures."""
import json
from pathlib import Path

from tests.tax_oracle import cases, reference


def build():
    rows = [{'id': f'TAX-{i:04d}', 'input': case,
             'expected': {regime: reference(case, regime) for regime in ('old', 'new')}}
            for i, case in enumerate(cases(), 1)]
    payload = {'provenance': {'kind': 'independent_engineering_oracle',
               'official_calculator_validated': False, 'source': 'project_a/source_rules.md',
               'generator': 'tests/tax_oracle.py',
               'method': 'Manually transcribed positive-part slope formulas; no production code/config imports.'},
               'case_count': len(rows), 'regime_expectations': len(rows) * 2, 'cases': rows}
    path = Path(__file__).parent / 'fixtures' / 'tax_cases.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {len(rows)} independent cases ({len(rows) * 2} regime expectations) to {path}')


if __name__ == '__main__':
    build()

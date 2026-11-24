import copy
import unittest
from decimal import Decimal
import json
from pathlib import Path

from project_a.models import TaxInput
from project_a.engine import calculate, compare
from project_a.rules import load_rules, validate_rules


class TaxEngineTests(unittest.TestCase):
    def test_independent_boundary_corpus(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures' / 'tax_cases.json').read_text(encoding='utf-8'))
        corpus = fixture['cases']
        self.assertGreaterEqual(len(corpus), 200)
        for row in corpus:
            case = row['input']
            for regime in ('old', 'new'):
                with self.subTest(case=case, regime=regime):
                    actual = calculate(TaxInput.from_dict(case), regime)
                    for key, expected in row['expected'][regime].items():
                        self.assertEqual(actual[key], expected)

    def test_official_2025_marginal_relief_example(self):
        result = calculate(TaxInput('2025-26', 1285000), 'new')
        self.assertEqual(result['slab_tax'], 61500)
        self.assertEqual(result['rebate_marginal_relief'], 51500)
        self.assertEqual(result['total_tax'], 10400)

    def test_hra_and_deduction_caps(self):
        inp = TaxInput('2024-25', 1800000, hra_salary=600000, hra_received=300000,
                       rent_paid=300000, metro=False, deduction_80c=200000,
                       deduction_80ccd1b=90000, medical_self_family=60000,
                       medical_parents=80000, parents_senior=True, home_loan_interest=300000)
        result = calculate(inp, 'old')
        self.assertEqual(result['hra_exemption'], 240000)
        self.assertEqual(result['taxable_income'], 1035000)
        self.assertEqual(calculate(inp, 'new')['taxable_income'], 1725000)

    def test_rounding_discards_paise_before_ten_rupee_round(self):
        self.assertEqual(calculate(TaxInput('2025-26', '1275004.99'), 'new')['total_tax'], 0)
        self.assertEqual(calculate(TaxInput('2025-26', '1275005'), 'new')['total_tax'], 10)

    def test_no_rebate_or_senior_slabs_for_nonresident(self):
        result = calculate(TaxInput('2024-25', 550000, age=80, resident=False), 'old')
        self.assertEqual(result['total_tax'], 13000)

    def test_unknown_and_invalid_values_fail_closed(self):
        for data in ({'fiscal_year':'2025-26', 'annual_gross_salary': -1},
                     {'fiscal_year':'2025-26', 'annual_gross_salary': 'NaN'},
                     {'fiscal_year':'2025-26', 'annual_gross_salary': True},
                     {'fiscal_year':'2025-26', 'annual_gross_salary': 1, 'resident':'false'},
                     {'fiscal_year':'2025-26', 'annual_gross_salary': 1, 'capital_gains': 100},
                     {'fiscal_year':'2026-27', 'annual_gross_salary': 1},
                     {'fiscal_year':'2025-26', 'annual_gross_salary': 1, 'hra_received':2}):
            with self.subTest(data=data), self.assertRaises(ValueError):
                TaxInput.from_dict(data)

    def test_bad_regime_rejected(self):
        with self.assertRaises(ValueError):
            calculate(TaxInput('2025-26', 1), 'NEW')

    def test_config_validation(self):
        rules = load_rules()
        validate_rules(rules)
        broken = copy.deepcopy(rules)
        broken['years']['2025-26']['new']['slabs'][0]['rate'] = 'NaN'
        with self.assertRaises(ValueError):
            validate_rules(broken)
        broken = copy.deepcopy(rules)
        broken['years']['2025-26']['new']['slabs'][1]['up_to'] = 1
        with self.assertRaises(ValueError):
            validate_rules(broken)

    def test_compare_and_serialization(self):
        import json
        inp = TaxInput('2025-26', Decimal('1500000'))
        result = compare(inp)
        self.assertEqual(result['recommended_regime'], 'new')
        self.assertEqual(result['savings'], result['old']['total_tax'] - result['new']['total_tax'])
        json.dumps(result)
        self.assertTrue(result['new']['ledger'])

    def test_surcharge_relief_at_five_crore_old_regime(self):
        result = calculate(TaxInput('2025-26', 50051000), 'old')
        self.assertEqual(result['taxable_income'], 50001000)
        self.assertEqual(result['total_tax'], 19257290)
        self.assertGreater(result['surcharge_marginal_relief'], 0)

    def test_deductions_cannot_create_negative_income(self):
        result = calculate(TaxInput('2025-26', 10000, deduction_80c=150000,
                                   home_loan_interest=200000), 'old')
        self.assertEqual(result['taxable_income'], 0)
        self.assertEqual(result['deductions']['80c'], 0)
        self.assertEqual(result['standard_deduction'], 10000)

    def test_age_implies_senior_health_limit(self):
        result = calculate(TaxInput('2025-26', 1500000, age=60,
                                   self_family_senior=False, medical_self_family=50000), 'old')
        self.assertEqual(result['deductions']['80d_self_family'], 50000)

    def test_surcharge_relief_preserves_pre_cess_excess_income_bound(self):
        for year in ('2024-25', '2025-26'):
            for regime in ('old', 'new'):
                deduction = 50000 if regime == 'old' else 75000
                for edge in (5000000, 10000000, 20000000, 50000000):
                    base = calculate(TaxInput(year, edge + deduction), regime)
                    nearby = calculate(TaxInput(year, edge + deduction + 10), regime)
                    precess_base = base['slab_tax'] + base['surcharge'] - base['surcharge_marginal_relief']
                    precess_next = nearby['slab_tax'] + nearby['surcharge'] - nearby['surcharge_marginal_relief']
                    self.assertLessEqual(precess_next - precess_base, 10)


if __name__ == '__main__':
    unittest.main()

"""Deterministic Decimal arithmetic with a clause-by-clause audit ledger."""
from decimal import Decimal, ROUND_DOWN
import hashlib
import json

from .models import TaxInput
from .rules import load_rules, validate_rules

D = Decimal
ZERO = D(0)


def _money(value):
    return float(value.quantize(D('.01')))


def round_ten(value):
    """Sections 288A / 288B: discard paise, round last rupee digit half up."""
    rupees = value.to_integral_value(rounding=ROUND_DOWN)
    return ((rupees + 5) // 10) * 10


def _slab_tax(income, slabs):
    tax, lower, detail = ZERO, ZERO, []
    for slab in slabs:
        upper = D(str(slab['up_to'])) if slab['up_to'] is not None else income
        taxable = max(ZERO, min(income, upper) - lower)
        rate = D(str(slab['rate']))
        amount = taxable * rate
        tax += amount
        detail.append({'from': _money(lower), 'up_to': slab['up_to'],
                       'rate': float(rate), 'taxable': _money(taxable), 'tax': _money(amount)})
        lower = upper
    return tax, detail


def calculate(inp: TaxInput, regime: str, config=None):
    if not isinstance(inp, TaxInput):
        raise ValueError('calculate expects a validated TaxInput')
    if regime not in ('old', 'new'):
        raise ValueError('regime must be old or new')
    rules = load_rules() if config is None else validate_rules(config)
    rule = rules['years'][inp.fiscal_year][regime]
    caps = {name: D(str(value)) for name, value in rules['deductions'].items()}
    ledger = []

    def entry(clause, label, amount, explanation):
        ledger.append({'clause': clause, 'label': label, 'amount': _money(amount), 'explanation': explanation})

    gross = inp.annual_gross_salary
    hra = ZERO
    if regime == 'old':
        hra = max(ZERO, min(inp.hra_received,
                           inp.rent_paid - inp.hra_salary * caps['hra_rent_floor_rate'],
                           inp.hra_salary * caps['hra_metro_rate' if inp.metro else 'hra_other_rate']))
    entry('10(13A) / Rule 2A', 'HRA exemption', hra,
          'Least of HRA received, rent minus 10% of HRA salary, and 50% metro / 40% other HRA salary; old regime only.')
    salary_after_hra = max(ZERO, gross - hra)
    standard = min(salary_after_hra, D(str(rule['standard_deduction'])))
    entry('16(ia)', 'Standard deduction', standard, 'Capped at salary after HRA exemption.')
    interest = min(inp.home_loan_interest, caps['home_loan_interest']) if regime == 'old' else ZERO
    entry('24(b) / 71(3A)', 'Eligible self-occupied loan interest', interest,
          'Eligible acquisition/construction loan interest; maximum INR 200,000 under old regime; no carry-forward model.')
    gti = max(ZERO, salary_after_hra - standard - interest)
    deductions = {}
    claims = [('80C / 80CCE', '80c', inp.deduction_80c, caps['80c']),
              ('80CCD(1B)', '80ccd1b', inp.deduction_80ccd1b, caps['80ccd1b']),
              ('80D', '80d_self_family', inp.medical_self_family,
               caps['80d_senior' if inp.self_family_senior or (inp.resident and inp.age >= 60) else '80d_regular']),
              ('80D', '80d_parents', inp.medical_parents,
               caps['80d_senior' if inp.parents_senior else '80d_regular'])]
    remaining = gti
    for clause, key, claimed, cap in claims:
        allowed = min(claimed, cap, remaining) if regime == 'old' else ZERO
        remaining -= allowed
        deductions[key] = _money(allowed)
        entry(clause, key, allowed, f'Eligible annual claim capped at INR {cap}; total Chapter VI-A deductions cannot exceed gross total income.')
    unrounded_income = max(ZERO, remaining)
    taxable = round_ten(unrounded_income)
    entry('288A', 'Taxable income rounded to INR 10', taxable, 'Ignore paise; round to nearest INR 10, digit five rounds up.')
    slab_key = 'slabs'
    if regime == 'old' and inp.resident:
        if inp.age >= 80:
            slab_key = 'super_senior_slabs'
        elif inp.age >= 60:
            slab_key = 'senior_slabs'
    slabs = rule[slab_key]
    slab_tax, slab_detail = _slab_tax(taxable, slabs)
    entry('Finance Act schedule / 115BAC', 'Slab tax', slab_tax, 'Age-based old-regime exemption applies only to residents.')
    rebate, rebate_relief = ZERO, ZERO
    threshold = D(str(rule['rebate_threshold']))
    if inp.resident:
        if taxable <= threshold:
            rebate = min(slab_tax, D(str(rule['rebate_max'])))
        elif rule['rebate_marginal_relief']:
            rebate_relief = max(ZERO, slab_tax - (taxable - threshold))
    after_rebate = slab_tax - rebate - rebate_relief
    entry('87A', 'Resident rebate', rebate, 'Available to resident individuals subject to the configured income threshold.')
    entry('87A proviso', 'Rebate marginal relief', rebate_relief,
          'New-regime tax before cess is limited to excess income immediately above rebate threshold.')
    surcharge, surcharge_relief = ZERO, ZERO
    rate, previous_rate, edge = ZERO, ZERO, ZERO
    for band in rule['surcharge']:
        if taxable > D(str(band['above'])):
            previous_rate, rate, edge = rate, D(str(band['rate'])), D(str(band['above']))
    if rate:
        surcharge = after_rebate * rate
        threshold_tax, _ = _slab_tax(edge, slabs)
        relief_ceiling = threshold_tax * (1 + previous_rate) + taxable - edge
        surcharge_relief = max(ZERO, after_rebate + surcharge - relief_ceiling)
    entry('Finance Act surcharge', 'Surcharge before relief', surcharge, f'Applicable surcharge rate {rate * 100}%.')
    entry('Finance Act marginal relief', 'Surcharge marginal relief', surcharge_relief,
          'Tax plus surcharge cannot rise by more than income above the latest surcharge threshold; relief precedes cess.')
    before_cess = after_rebate + surcharge - surcharge_relief
    cess = before_cess * D(str(rules['cess_rate']))
    entry('Finance Act cess', 'Health and Education Cess', cess,
          f"{D(str(rules['cess_rate'])) * 100}% of tax plus surcharge after both marginal reliefs.")
    unrounded_tax = before_cess + cess
    total = round_ten(unrounded_tax)
    entry('288B', 'Total tax payable', total, 'Final liability rounded to nearest INR 10; no TDS/advance tax credits modelled.')
    return {'fiscal_year': inp.fiscal_year, 'regime': regime, 'gross_salary': _money(gross),
            'hra_exemption': _money(hra), 'standard_deduction': _money(standard),
            'home_loan_interest_deduction': _money(interest), 'deductions': deductions,
            'gross_total_income': _money(gti), 'taxable_income_before_rounding': _money(unrounded_income),
            'taxable_income': _money(taxable), 'slabs': slab_detail, 'slab_tax': _money(slab_tax),
            'rebate': _money(rebate), 'rebate_marginal_relief': _money(rebate_relief),
            'surcharge': _money(surcharge), 'surcharge_marginal_relief': _money(surcharge_relief),
            'cess': _money(cess), 'total_tax_before_rounding': _money(unrounded_tax),
            'total_tax': _money(total), 'effective_rate_percent': _money(total / gross * 100) if gross else 0,
            'ledger': ledger, 'rules_provenance': rules['provenance'],
            'policy_sha256': hashlib.sha256(json.dumps(rules, sort_keys=True).encode()).hexdigest()}


def compare(inp: TaxInput, config=None):
    old = calculate(inp, 'old', config)
    new = calculate(inp, 'new', config)
    winner = 'tie' if old['total_tax'] == new['total_tax'] else ('old' if old['total_tax'] < new['total_tax'] else 'new')
    return {'old': old, 'new': new, 'recommended_regime': winner,
            'savings': abs(old['total_tax'] - new['total_tax'])}

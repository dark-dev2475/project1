"""Independent algebraic test oracle; manually transcribed official rules.

Does not import production code/config. This is NOT an official calculator.
Uses slope changes rather than production's slab iteration.
"""
from decimal import Decimal as D, ROUND_DOWN


def rounded_ten(value):
    return int((D(value).to_integral_value(rounding=ROUND_DOWN) + 5) // 10 * 10)


def reference(case, regime):
    def val(key, default=0):
        return D(str(case.get(key, default)))
    salary = val('annual_gross_salary')
    income = max(D(0), salary - (75000 if regime == 'new' else 50000))
    if regime == 'old':
        hra = max(D(0), min(val('hra_received'), val('rent_paid') - val('hra_salary') / 10,
                           val('hra_salary') * D('.5' if case.get('metro') else '.4')))
        income = max(D(0), salary - hra - 50000)
        income -= min(val('home_loan_interest'), 200000)
        income -= min(val('deduction_80c'), 150000) + min(val('deduction_80ccd1b'), 50000)
        income -= min(val('medical_self_family'), 50000 if case.get('self_family_senior') or (case.get('resident', True) and case.get('age', 30) >= 60) else 25000)
        income -= min(val('medical_parents'), 50000 if case.get('parents_senior') else 25000)
    income = D(rounded_ten(max(D(0), income)))
    year = case['fiscal_year']
    resident = case.get('resident', True)
    if regime == 'old':
        age = case.get('age', 30) if resident else 30
        start = 500000 if age >= 80 else 300000 if age >= 60 else 250000
        slopes = [(start, '.05'), (500000, '.15'), (1000000, '.10')]
        if age >= 80:
            slopes = [(500000, '.20'), (1000000, '.10')]
        rebate_limit, rebate_cap = 500000, 12500
    elif year == '2024-25':
        slopes = [(300000, '.05'), (700000, '.05'), (1000000, '.05'),
                  (1200000, '.05'), (1500000, '.10')]
        rebate_limit, rebate_cap = 700000, 25000
    else:
        slopes = [(x, '.05') for x in (400000, 800000, 1200000, 1600000, 2000000, 2400000)]
        rebate_limit, rebate_cap = 1200000, 60000
    def slab(x):
        return sum((max(D(0), x - threshold) * D(rate) for threshold, rate in slopes), D(0))
    tax = slab(income)
    if resident:
        if income <= rebate_limit:
            tax = max(D(0), tax - rebate_cap)
        elif regime == 'new':
            tax = min(tax, income - rebate_limit)
    jumps = [(5000000, D('.10')), (10000000, D('.15')), (20000000, D('.25'))]
    if regime == 'old':
        jumps.append((50000000, D('.37')))
    applicable = [(edge, rate) for edge, rate in jumps if income > edge]
    if applicable:
        edge, rate = applicable[-1]
        previous = max((r for e, r in jumps if e < edge), default=D(0))
        tax = min(tax * (1 + rate), slab(D(edge)) * (1 + previous) + income - edge)
    return {'taxable_income': int(income), 'total_tax': rounded_ten(tax * D('1.04'))}


def cases():
    result = []
    boundaries = [0, 250000, 300000, 400000, 500000, 700000, 800000, 1000000,
                  1200000, 1264710, 1270590, 1500000, 1600000, 2000000, 2400000,
                  5000000, 10000000, 20000000, 50000000]
    for year in ('2024-25', '2025-26'):
        for deduction in (50000, 75000):
            for boundary in boundaries:
                for delta in (-10, -1, 0, 1, 10):
                    result.append({'fiscal_year': year, 'annual_gross_salary': max(0, boundary + deduction + delta)})
        for age in (30, 60, 80):
            for resident in (True, False):
                for gross in (300000, 550000, 775000, 1285000, 5050010, 10075010):
                    result.append({'fiscal_year': year, 'annual_gross_salary': gross, 'age': age, 'resident': resident})
        for metro in (True, False):
            for amount in (0, 24999, 25000, 25001, 49999, 50000, 50001, 150000, 200001):
                result.append({'fiscal_year': year, 'annual_gross_salary': 1500000,
                    'hra_salary': 600000, 'hra_received': 300000, 'rent_paid': 240000,
                    'metro': metro, 'deduction_80c': amount, 'deduction_80ccd1b': amount,
                    'medical_self_family': amount, 'medical_parents': amount,
                    'parents_senior': True, 'home_loan_interest': amount})
    return result

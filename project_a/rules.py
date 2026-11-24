"""Versioned declarative rules. A config is data; it can never execute code."""
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

RULES_PATH = Path(__file__).with_name('tax_rules.json')


def _number(value, label, maximum=1000000000000):
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise ValueError(f'{label}: expected numeric value')
    try:
        result = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(f'{label}: invalid number') from exc
    if not result.is_finite() or not 0 <= result <= maximum:
        raise ValueError(f'{label}: numeric value outside allowed range')
    return result


def _keys(obj, expected, label):
    if not isinstance(obj, dict) or set(obj) != set(expected):
        raise ValueError(f'{label}: expected exactly {sorted(expected)}')


def _slabs(rows, label):
    if not isinstance(rows, list) or not 2 <= len(rows) <= 20:
        raise ValueError(f'{label}: expected 2 to 20 ordered slabs')
    previous, previous_rate = Decimal(0), Decimal(0)
    for index, row in enumerate(rows):
        _keys(row, ('up_to', 'rate'), label)
        rate = _number(row['rate'], label, 1)
        if rate < previous_rate:
            raise ValueError(f'{label}: slab rates must not decrease')
        previous_rate = rate
        if index == len(rows) - 1:
            if row['up_to'] is not None:
                raise ValueError(f'{label}: last slab must have null upper bound')
        else:
            edge = _number(row['up_to'], label)
            if edge <= previous:
                raise ValueError(f'{label}: slab boundaries must increase')
            previous = edge


def validate_rules(config):
    _keys(config, ('schema_version', 'provenance', 'years', 'deductions', 'cess_rate'), 'config')
    if type(config['schema_version']) is not int or config['schema_version'] != 1:
        raise ValueError('Unsupported rule schema version')
    if not isinstance(config['provenance'], dict):
        raise ValueError('provenance must be an object')
    _keys(config['years'], ('2024-25', '2025-26'), 'years')
    for year, regimes in config['years'].items():
        _keys(regimes, ('old', 'new'), year)
        for regime, rule in regimes.items():
            names = ['standard_deduction', 'slabs', 'rebate_threshold', 'rebate_max',
                     'rebate_marginal_relief', 'surcharge']
            if regime == 'old':
                names += ['senior_slabs', 'super_senior_slabs']
            _keys(rule, names, f'{year}.{regime}')
            for name in ('standard_deduction', 'rebate_threshold', 'rebate_max'):
                _number(rule[name], name)
            if type(rule['rebate_marginal_relief']) is not bool:
                raise ValueError('rebate_marginal_relief must be boolean')
            for name in ('slabs', 'senior_slabs', 'super_senior_slabs'):
                if name in rule:
                    _slabs(rule[name], name)
            surcharges = rule['surcharge']
            if not isinstance(surcharges, list) or len(surcharges) > 10:
                raise ValueError('surcharge must be a list of at most 10 thresholds')
            edge, rate = Decimal(0), Decimal(0)
            for row in surcharges:
                _keys(row, ('above', 'rate'), 'surcharge')
                next_edge = _number(row['above'], 'surcharge.above')
                next_rate = _number(row['rate'], 'surcharge.rate', 1)
                if next_edge <= edge or next_rate <= rate:
                    raise ValueError('Surcharge thresholds and rates must strictly increase')
                edge, rate = next_edge, next_rate
    deductions = config['deductions']
    _keys(deductions, ('80c', '80ccd1b', '80d_regular', '80d_senior', 'home_loan_interest',
                       'hra_metro_rate', 'hra_other_rate', 'hra_rent_floor_rate'), 'deductions')
    for name, value in deductions.items():
        _number(value, name, 1 if name.endswith('_rate') else 1000000000000)
    _number(config['cess_rate'], 'cess_rate', 1)
    return config


def load_rules(path=None):
    return validate_rules(json.loads(Path(path or RULES_PATH).read_text(encoding='utf-8')))

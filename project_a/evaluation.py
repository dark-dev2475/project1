"""Reproducible local measurements; no invented LLM runs or historical timings."""
from copy import deepcopy
import json
from pathlib import Path
import statistics
import time

from .engine import calculate, compare
from .models import TaxInput
from .rules import load_rules, validate_rules

FIXTURES = Path(__file__).resolve().parents[1] / 'tests' / 'fixtures' / 'tax_cases.json'


def _percentile(values, fraction):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * fraction))]


def _score(rows, config):
    checked, exact, errors = 0, 0, []
    for row in rows:
        inp = TaxInput.from_dict(row['input'])
        for regime in ('old', 'new'):
            checked += 1
            expected = row['expected'][regime]['total_tax']
            actual = calculate(inp, regime, config)['total_tax']
            if actual == expected:
                exact += 1
            else:
                errors.append({'case_id': row['id'], 'regime': regime, 'expected': expected, 'actual': actual})
    return {'checked': checked, 'exact': exact, 'accuracy': exact / checked,
            'wrong_answers_without_exception': len(errors), 'failure_examples': errors[:10]}


def run_benchmark(repetitions=10):
    """Return JSON-safe evidence. Timings measure this invocation on this machine.

    The rule update experiment is a config migration replay, NOT historical time
    spent researching or implementing the Finance Act 2025 changes.
    """
    if type(repetitions) is not int or repetitions < 10:
        raise ValueError('At least ten repetitions are required')
    fixture = json.loads(FIXTURES.read_text(encoding='utf-8'))
    rows = fixture['cases']
    config = load_rules()
    latencies = []
    deterministic = 0
    audit_complete = 0
    began = time.perf_counter()
    for row in rows:
        inp = TaxInput.from_dict(row['input'])
        baseline = None
        all_same = True
        for _ in range(repetitions):
            started = time.perf_counter()
            result = compare(inp, config)
            latencies.append((time.perf_counter() - started) * 1000)
            encoded = json.dumps(result, sort_keys=True)
            if baseline is None:
                baseline = encoded
            elif encoded != baseline:
                all_same = False
        deterministic += int(all_same)
        for regime in ('old', 'new'):
            ledger = result[regime]['ledger']
            audit_complete += int(bool(ledger) and all(item['clause'] and item['explanation'] for item in ledger)
                                  and ledger[-1]['amount'] == result[regime]['total_tax'])
    elapsed = time.perf_counter() - began
    accuracy = _score(rows, config)

    changed_rows = [row for row in rows if row['input']['fiscal_year'] == '2025-26']
    stale = deepcopy(config)
    stale['years']['2025-26']['new'] = deepcopy(config['years']['2024-25']['new'])
    stale_score = _score(changed_rows, stale)
    migration_started = time.perf_counter()
    stale['years']['2025-26']['new'] = deepcopy(config['years']['2025-26']['new'])
    validate_rules(stale)
    migration_seconds = time.perf_counter() - migration_started
    verify_started = time.perf_counter()
    repaired_score = _score(changed_rows, stale)
    migration_verification_seconds = time.perf_counter() - verify_started

    mutation_results = []
    for name, mutate in (
        ('disable_new_regime_rebate_marginal_relief', lambda rule: rule['years']['2025-26']['new'].__setitem__('rebate_marginal_relief', False)),
        ('change_cess_from_four_to_five_percent', lambda rule: rule.__setitem__('cess_rate', '0.05')),
    ):
        mutant = deepcopy(config)
        mutate(mutant)
        score = _score(rows, mutant)
        mutation_results.append({'mutation': name, **score})

    return {
        'fixture_provenance': fixture['provenance'],
        'profiles': len(rows), 'regime_expectations': len(rows) * 2,
        'hand_coded': {
            **accuracy, 'repetitions_per_profile': repetitions,
            'deterministic_profiles': deterministic, 'deterministic_fraction': deterministic / len(rows),
            'request_definition': 'one validated profile compared under both regimes; config loaded once, validated on each calculation',
            'requests_measured': len(latencies), 'latency_ms_mean': statistics.mean(latencies),
            'latency_ms_p50': statistics.median(latencies), 'latency_ms_p95': _percentile(latencies, .95),
            'measured_loop_seconds': elapsed, 'model_calls': 0, 'model_cost_usd_per_1000_requests': 0,
            'cost_scope': 'Model/API cost only; hosting, engineering and legal review excluded.',
            'clause_ledger_covered_results': audit_complete,
            'clause_ledger_coverage_fraction': audit_complete / (len(rows) * 2),
            'audit_measurement': 'Every ledger entry has a clause and explanation and the final amount equals total tax; this is a structural auditability measure, not proof of statutory correctness.'},
        'law_change_replay': {
            'measurement_kind': 'measured config migration replay; not historical implementation time',
            'before_update': stale_score,
            'config_replace_and_validate_seconds': migration_seconds,
            'verification_seconds': migration_verification_seconds,
            'after_update': repaired_score,
            'changed_config_fields': ['new.slabs', 'new.rebate_threshold', 'new.rebate_max'],
            'what_broke': 'Reusing FY2024-25 new-regime rules for FY2025-26 returns plausible but incorrect taxes; fixture comparisons expose these silent errors.'},
        'mutation_checks': mutation_results,
        'llm_query_time': {'status': 'not_measured_here', 'reason': 'Requires a real Gemini response; use live runner.'},
        'llm_compiled': {'status': 'not_measured_here', 'reason': 'Reference config is manually reviewed, not evidence of model compilation. Compile with real Gemini and replay fixtures.'},
    }

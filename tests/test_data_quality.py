import copy
import unittest

from project_b.detectors import Profile, rule_detect, statistical_detect
from project_b.injector import KINDS, clean_fixtures, inject


class DataQualityTests(unittest.TestCase):
    def setUp(self):
        self.rows = clean_fixtures(80, seed=11)
        self.profile = Profile.fit(clean_fixtures(120, seed=5))

    def test_clean_contract(self):
        self.assertEqual([], rule_detect(self.rows, self.profile))
        self.assertEqual([], statistical_detect(self.rows, self.profile))

    def test_all_injections_have_truth_and_are_reproducible(self):
        original = copy.deepcopy(self.rows)
        for kind in KINDS:
            result = inject(self.rows, kind, .2, seed=17)
            self.assertEqual(result.rows, inject(self.rows, kind, .2, seed=17).rows)
            self.assertTrue(result.truth, kind)
            self.assertNotEqual(original, result.rows, kind)
            self.assertFalse(any("truth" in r or "corruption" in r for r in result.rows))
        self.assertEqual(original, self.rows)

    def test_rules_find_contract_breaks(self):
        for kind in ("schema", "type", "date_format", "coordinates", "duplicates", "null_spike", "chronology", "zip_borough"):
            result = inject(self.rows, kind, .2, seed=17)
            predictions = {(a.kind, a.row_id) for a in rule_detect(result.rows, self.profile)}
            self.assertTrue(result.truth <= predictions, (kind, result.truth - predictions))

    def test_bad_rates_rejected(self):
        for rate in (-.1, 0, 1.1):
            with self.assertRaises(ValueError):
                inject(self.rows, "coordinates", rate)

    def test_duplicate_ids_do_not_collapse_physical_rows(self):
        result = inject(self.rows, "duplicates", .2)
        self.assertGreater(len(result.truth), len({result.rows[int(i)]["unique_key"] for _, i in result.truth}))


if __name__ == "__main__":
    unittest.main()

from project_b.detectors import Profile
from project_b.injector import clean_fixtures, inject
from project_b.pipeline import run_pipeline


def test_semantic_candidates_are_abstentions_without_reviewer():
    clean = clean_fixtures(40)
    corrupted = inject(clean, "pii", .2)
    result = run_pipeline(corrupted.rows, Profile.fit(clean), sample_rate=0)
    assert result["pending_review"]
    assert result["confirmed_review_alerts"] == []
    assert result["release_decision"] == "hold_for_review"


def test_hard_failure_quarantines_without_waiting_for_llm():
    clean = clean_fixtures(40)
    corrupted = inject(clean, "chronology", .1)
    result = run_pipeline(corrupted.rows, Profile.fit(clean), sample_rate=0)
    assert result["release_decision"] == "quarantine"
    assert result["hard_alerts"]


def test_partial_review_keeps_unreviewed_candidates_pending():
    clean = clean_fixtures(40)
    corrupted = inject(clean, "pii", .4)
    def partial(candidates):
        return [{**candidates[0], "is_anomaly": False}]
    result = run_pipeline(corrupted.rows, Profile.fit(clean), reviewer=partial, sample_rate=0)
    assert result["reviewed_pairs"] == 1
    assert len(result["pending_review"]) == result["candidate_pairs"] - 1

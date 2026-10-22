from copy import deepcopy
from typing import Any

from foxhound_data.pipeline.normalization import normalize_feedback_payload


def test_wraps_a_raw_feedback_list() -> None:
    feedbacks = [
        {
            "id": "fb_test_001",
            "text": "Synthetic feedback.",
            "createdAt": "2026-10-22T10:00:00Z",
        }
    ]

    assert normalize_feedback_payload(feedbacks) == {"feedbacks": feedbacks}


def test_preserves_an_existing_envelope() -> None:
    payload = {
        "feedbacks": [
            {
                "id": "fb_test_002",
                "text": "Another synthetic feedback.",
                "createdAt": "2026-10-22T11:00:00Z",
            }
        ]
    }

    assert normalize_feedback_payload(payload) == payload


def test_normalizes_a_timezone_offset_to_utc() -> None:
    payload = [
        {
            "id": "fb_test_003",
            "text": "Timezone normalization.",
            "createdAt": "2026-10-22T14:30:00+02:00",
        }
    ]

    normalized = normalize_feedback_payload(payload)

    assert normalized["feedbacks"][0]["createdAt"] == "2026-10-22T12:30:00Z"


def test_leaves_invalid_or_timezone_free_dates_unchanged() -> None:
    feedbacks = [
        {"createdAt": "not-a-date"},
        {"createdAt": "2026-10-22T12:30:00"},
        {"createdAt": 42},
    ]

    normalized = normalize_feedback_payload(feedbacks)

    assert normalized["feedbacks"] == feedbacks


def test_removes_explicitly_excluded_input_fields() -> None:
    payload = {
        "feedbacks": [
            {
                "id": "fb_test_004",
                "companyId": "cmp_001",
                "source": "web",
                "mrr": 1000,
            }
        ]
    }

    assert normalize_feedback_payload(payload) == {"feedbacks": [{"id": "fb_test_004"}]}


def test_preserves_other_unknown_properties_for_later_validation() -> None:
    payload = {
        "feedbacks": [{"id": "fb_test_005", "unexpected": "synthetic"}],
        "unexpectedRootProperty": True,
    }

    assert normalize_feedback_payload(payload) == payload


def test_does_not_mutate_the_input() -> None:
    payload: dict[str, Any] = {
        "feedbacks": [
            {
                "id": "fb_test_006",
                "createdAt": "2026-10-22T14:30:00+02:00",
            }
        ]
    }
    original = deepcopy(payload)

    normalized = normalize_feedback_payload(payload)

    assert payload == original
    assert normalized is not payload

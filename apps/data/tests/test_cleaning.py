from copy import deepcopy
from typing import Any

from foxhound_data.pipeline.cleaning import clean_feedback_input


def test_trims_feedback_string_fields() -> None:
    payload = {
        "feedbacks": [
            {
                "id": "  fb_test_001  ",
                "text": "  Synthetic feedback.  ",
                "createdAt": "  2026-10-22T10:00:00Z  ",
                "userId": "  usr_test_001  ",
                "companyId": "  cmp_test_001  ",
                "plan": "  Pro  ",
            }
        ]
    }

    assert clean_feedback_input(payload) == {
        "feedbacks": [
            {
                "id": "fb_test_001",
                "text": "Synthetic feedback.",
                "createdAt": "2026-10-22T10:00:00Z",
                "userId": "usr_test_001",
                "companyId": "cmp_test_001",
                "plan": "Pro",
            }
        ]
    }


def test_preserves_non_string_values_and_unknown_fields() -> None:
    payload = {
        "feedbacks": [
            {
                "id": 42,
                "text": None,
                "active": True,
                "metadata": {"label": "  synthetic  "},
            }
        ]
    }

    assert clean_feedback_input(payload) == {
        "feedbacks": [
            {
                "id": 42,
                "text": None,
                "active": True,
                "metadata": {"label": "synthetic"},
            }
        ]
    }


def test_keeps_empty_strings_for_later_validation() -> None:
    payload = [{"id": "   ", "text": "\t\n"}]

    assert clean_feedback_input(payload) == [{"id": "", "text": ""}]


def test_does_not_mutate_the_input() -> None:
    payload: dict[str, Any] = {
        "feedbacks": [{"id": "  fb_test_002  ", "text": "  Keep source  "}]
    }
    original = deepcopy(payload)

    cleaned = clean_feedback_input(payload)

    assert payload == original
    assert cleaned is not payload

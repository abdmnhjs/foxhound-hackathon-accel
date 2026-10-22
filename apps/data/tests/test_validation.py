import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest

from foxhound_data.pipeline.validation import (
    PayloadValidationError,
    validate_feedback_payload,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPOSITORY_ROOT / "schema-feedback.json"


def valid_feedback() -> dict[str, Any]:
    return {
        "id": "fb_test_001",
        "text": "Synthetic valid feedback.",
        "createdAt": "2026-10-22T10:00:00Z",
        "userId": "usr_test_001",
        "plan": "Pro",
    }


def test_accepts_a_valid_payload() -> None:
    payload = {"feedbacks": [valid_feedback()]}

    assert validate_feedback_payload(payload, SCHEMA_PATH) == payload


def test_accepts_feedback_without_optional_fields() -> None:
    payload = {
        "feedbacks": [
            {
                "id": "fb_test_002",
                "text": "Only required fields.",
                "createdAt": "2026-10-22T11:00:00Z",
            }
        ]
    }

    assert validate_feedback_payload(payload, SCHEMA_PATH) == payload


@pytest.mark.parametrize("field", ["id", "text", "createdAt"])
def test_rejects_a_missing_required_field(field: str) -> None:
    feedback = valid_feedback()
    feedback.pop(field)

    with pytest.raises(PayloadValidationError, match="required property"):
        validate_feedback_payload({"feedbacks": [feedback]}, SCHEMA_PATH)


@pytest.mark.parametrize("field", ["id", "text", "userId", "plan"])
def test_rejects_an_empty_string(field: str) -> None:
    feedback = valid_feedback()
    feedback[field] = ""

    with pytest.raises(PayloadValidationError, match="non-empty"):
        validate_feedback_payload({"feedbacks": [feedback]}, SCHEMA_PATH)


def test_rejects_an_invalid_date() -> None:
    feedback = valid_feedback()
    feedback["createdAt"] = "22 October 2026"

    with pytest.raises(PayloadValidationError, match="date-time"):
        validate_feedback_payload({"feedbacks": [feedback]}, SCHEMA_PATH)


@pytest.mark.parametrize("field", ["source", "companyId", "mrr", "unexpected"])
def test_rejects_a_forbidden_feedback_property(field: str) -> None:
    feedback = valid_feedback()
    feedback[field] = "forbidden"

    with pytest.raises(PayloadValidationError, match="Additional properties"):
        validate_feedback_payload({"feedbacks": [feedback]}, SCHEMA_PATH)


def test_rejects_a_forbidden_root_property() -> None:
    payload = {"feedbacks": [valid_feedback()], "unexpected": True}

    with pytest.raises(PayloadValidationError, match="Additional properties"):
        validate_feedback_payload(payload, SCHEMA_PATH)


def test_rejects_an_empty_feedback_list() -> None:
    with pytest.raises(PayloadValidationError, match="non-empty"):
        validate_feedback_payload({"feedbacks": []}, SCHEMA_PATH)


def test_validates_the_shared_mock() -> None:
    mock_path = REPOSITORY_ROOT / "feedbacks.mock.json"
    payload = json.loads(mock_path.read_text(encoding="utf-8"))

    assert validate_feedback_payload(payload, SCHEMA_PATH) == payload


def test_does_not_mutate_the_payload() -> None:
    payload = {"feedbacks": [valid_feedback()]}
    original = deepcopy(payload)

    validated = validate_feedback_payload(payload, SCHEMA_PATH)

    assert payload == original
    assert validated is payload

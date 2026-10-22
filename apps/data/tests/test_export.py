import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from foxhound_data.pipeline.export import (
    export_feedback_payload,
    serialize_feedback_payload,
)


def valid_payload() -> dict[str, Any]:
    return {
        "feedbacks": [
            {
                "plan": "Pro",
                "createdAt": "2026-10-22T10:00:00Z",
                "text": "Retour synthétique avec un accent.",
                "userId": "usr_test_001",
                "id": "fb_test_001",
            }
        ]
    }


def test_serializes_with_contract_field_order() -> None:
    serialized = serialize_feedback_payload(valid_payload())

    assert serialized == (
        "{\n"
        '  "feedbacks": [\n'
        "    {\n"
        '      "id": "fb_test_001",\n'
        '      "text": "Retour synthétique avec un accent.",\n'
        '      "createdAt": "2026-10-22T10:00:00Z",\n'
        '      "userId": "usr_test_001",\n'
        '      "plan": "Pro"\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )


def test_equivalent_payloads_have_identical_output() -> None:
    first = valid_payload()
    second = {
        "feedbacks": [
            {
                "id": "fb_test_001",
                "text": "Retour synthétique avec un accent.",
                "createdAt": "2026-10-22T10:00:00Z",
                "userId": "usr_test_001",
                "plan": "Pro",
            }
        ]
    }

    assert serialize_feedback_payload(first) == serialize_feedback_payload(second)


def test_writes_utf8_json_and_creates_parent_directories(tmp_path: Path) -> None:
    output_path = tmp_path / "nested" / "feedbacks.json"

    export_feedback_payload(valid_payload(), output_path)

    assert json.loads(output_path.read_text(encoding="utf-8")) == valid_payload()


def test_preserves_unknown_fields_if_called_before_validation() -> None:
    payload = valid_payload()
    payload["feedbacks"][0]["source"] = "synthetic"

    serialized = serialize_feedback_payload(payload)

    assert json.loads(serialized)["feedbacks"][0]["source"] == "synthetic"


def test_does_not_mutate_the_payload() -> None:
    payload = valid_payload()
    original = deepcopy(payload)

    serialize_feedback_payload(payload)

    assert payload == original

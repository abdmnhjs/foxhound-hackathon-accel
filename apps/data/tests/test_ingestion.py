import json
from pathlib import Path

import pytest

from foxhound_data.pipeline.ingestion import IngestionError, ingest_json


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_ingests_a_valid_feedback_list(tmp_path: Path) -> None:
    input_path = tmp_path / "feedbacks.json"
    payload = [
        {
            "id": "fb_test_001",
            "text": "Synthetic feedback.",
            "createdAt": "2026-10-22T10:00:00Z",
        }
    ]
    write_json(input_path, payload)

    assert ingest_json(input_path) == payload


def test_ingests_a_valid_feedback_envelope(tmp_path: Path) -> None:
    input_path = tmp_path / "feedbacks.json"
    payload = {
        "feedbacks": [
            {
                "id": "fb_test_002",
                "text": "Another synthetic feedback.",
                "createdAt": "2026-10-22T11:00:00Z",
                "plan": "Pro",
            }
        ]
    }
    write_json(input_path, payload)

    assert ingest_json(input_path) == payload


def test_rejects_invalid_json(tmp_path: Path) -> None:
    input_path = tmp_path / "invalid.json"
    input_path.write_text('{"feedbacks": [}', encoding="utf-8")

    with pytest.raises(IngestionError, match="not valid JSON"):
        ingest_json(input_path)


def test_rejects_a_missing_file(tmp_path: Path) -> None:
    input_path = tmp_path / "missing.json"

    with pytest.raises(IngestionError, match="Unable to read input file"):
        ingest_json(input_path)


def test_preserves_raw_values(tmp_path: Path) -> None:
    input_path = tmp_path / "feedbacks.json"
    payload = [
        {
            "id": "  fb_test_003  ",
            "text": "  Text remains untouched.  ",
            "createdAt": "  2026-10-22T12:00:00Z  ",
            "unexpected": "  preserved at ingestion  ",
        }
    ]
    write_json(input_path, payload)

    assert ingest_json(input_path) == payload

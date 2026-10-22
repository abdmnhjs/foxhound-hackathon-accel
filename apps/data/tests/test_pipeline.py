import json
from pathlib import Path
from typing import Any

import pytest

from foxhound_data.pipeline.run import PipelineOptions, run_pipeline
from foxhound_data.pipeline.validation import PayloadValidationError

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPOSITORY_ROOT / "schema-feedback.json"


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_runs_the_complete_pipeline(tmp_path: Path) -> None:
    input_path = tmp_path / "raw-feedbacks.json"
    output_path = tmp_path / "output" / "feedbacks.json"
    write_json(
        input_path,
        [
            {
                "plan": "  Pro  ",
                "createdAt": "  2026-10-22T14:30:00+02:00  ",
                "text": "  Synthetic end-to-end feedback.  ",
                "userId": "  usr_test_001  ",
                "id": "  fb_test_001  ",
            }
        ],
    )

    result = run_pipeline(
        PipelineOptions(
            input_path=input_path,
            schema_path=SCHEMA_PATH,
            output_path=output_path,
        )
    )

    expected = {
        "feedbacks": [
            {
                "id": "fb_test_001",
                "text": "Synthetic end-to-end feedback.",
                "createdAt": "2026-10-22T12:30:00Z",
                "userId": "usr_test_001",
                "plan": "Pro",
            }
        ]
    }
    assert result == expected
    assert json.loads(output_path.read_text(encoding="utf-8")) == expected


def test_accepts_feedback_without_optional_fields(tmp_path: Path) -> None:
    input_path = tmp_path / "minimal.json"
    output_path = tmp_path / "minimal-output.json"
    write_json(
        input_path,
        [
            {
                "id": "fb_test_002",
                "text": "Required fields only.",
                "createdAt": "2026-10-22T13:00:00Z",
            }
        ],
    )

    run_pipeline(PipelineOptions(input_path, SCHEMA_PATH, output_path))

    assert output_path.is_file()


@pytest.mark.parametrize("forbidden_field", ["source", "companyId", "mrr"])
def test_rejects_forbidden_fields_without_exporting(
    forbidden_field: str, tmp_path: Path
) -> None:
    input_path = tmp_path / f"invalid-{forbidden_field}.json"
    output_path = tmp_path / f"output-{forbidden_field}.json"
    feedback = {
        "id": "fb_test_003",
        "text": "Synthetic invalid feedback.",
        "createdAt": "2026-10-22T14:00:00Z",
        forbidden_field: "forbidden",
    }
    write_json(input_path, [feedback])

    with pytest.raises(PayloadValidationError, match="Additional properties"):
        run_pipeline(PipelineOptions(input_path, SCHEMA_PATH, output_path))

    assert not output_path.exists()


def test_produces_reproducible_output(tmp_path: Path) -> None:
    first_input = tmp_path / "first.json"
    second_input = tmp_path / "second.json"
    first_output = tmp_path / "first-output.json"
    second_output = tmp_path / "second-output.json"
    write_json(
        first_input,
        [
            {
                "plan": "Free",
                "createdAt": "2026-10-22T15:00:00Z",
                "text": "Reproducible output.",
                "id": "fb_test_004",
            }
        ],
    )
    write_json(
        second_input,
        [
            {
                "id": "fb_test_004",
                "text": "Reproducible output.",
                "createdAt": "2026-10-22T15:00:00+00:00",
                "plan": "Free",
            }
        ],
    )

    run_pipeline(PipelineOptions(first_input, SCHEMA_PATH, first_output))
    run_pipeline(PipelineOptions(second_input, SCHEMA_PATH, second_output))

    assert first_output.read_bytes() == second_output.read_bytes()

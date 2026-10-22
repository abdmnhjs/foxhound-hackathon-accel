import json
from pathlib import Path

from foxhound_data.cli import main

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPOSITORY_ROOT / "schema-feedback.json"


def write_valid_input(path: Path) -> None:
    path.write_text(
        json.dumps(
            [
                {
                    "id": "fb_test_cli_001",
                    "text": "Synthetic CLI feedback.",
                    "createdAt": "2026-10-22T16:00:00Z",
                    "plan": "Free",
                }
            ]
        ),
        encoding="utf-8",
    )


def test_runs_with_an_explicit_schema(tmp_path: Path, capsys) -> None:
    input_path = tmp_path / "input.json"
    output_path = tmp_path / "output.json"
    write_valid_input(input_path)

    exit_code = main(
        [
            "--input",
            str(input_path),
            "--output",
            str(output_path),
            "--schema",
            str(SCHEMA_PATH),
        ]
    )

    captured = capsys.readouterr()
    assert exit_code == 0
    assert output_path.is_file()
    assert str(output_path) in captured.out
    assert captured.err == ""


def test_finds_the_repository_schema_automatically(tmp_path: Path, monkeypatch) -> None:
    input_path = tmp_path / "input.json"
    output_path = tmp_path / "output.json"
    write_valid_input(input_path)
    monkeypatch.chdir(REPOSITORY_ROOT / "apps" / "data")

    exit_code = main(["--input", str(input_path), "--output", str(output_path)])

    assert exit_code == 0
    assert output_path.is_file()


def test_returns_an_error_without_creating_output(tmp_path: Path, capsys) -> None:
    input_path = tmp_path / "invalid.json"
    output_path = tmp_path / "output.json"
    input_path.write_text('{"feedbacks": [}', encoding="utf-8")

    exit_code = main(
        [
            "--input",
            str(input_path),
            "--output",
            str(output_path),
            "--schema",
            str(SCHEMA_PATH),
        ]
    )

    captured = capsys.readouterr()
    assert exit_code == 1
    assert "not valid JSON" in captured.err
    assert not output_path.exists()

import json
from pathlib import Path
from typing import Any


class IngestionError(ValueError):
    """Raised when a JSON input cannot be ingested."""


def ingest_json(input_path: Path) -> Any:
    """Read and parse a UTF-8 JSON file without transforming its content."""
    try:
        raw_content = input_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise IngestionError(f"Input file is not valid UTF-8: {input_path}") from error
    except OSError as error:
        raise IngestionError(f"Unable to read input file: {input_path}") from error

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError as error:
        raise IngestionError(f"Input file is not valid JSON: {input_path}") from error

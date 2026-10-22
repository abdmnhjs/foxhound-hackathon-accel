import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError


class SchemaLoadingError(ValueError):
    """Raised when the feedback schema cannot be loaded."""


class PayloadValidationError(ValueError):
    """Raised when a payload violates the feedback schema."""


def _load_schema(schema_path: Path) -> dict[str, Any]:
    try:
        raw_schema = schema_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise SchemaLoadingError(
            f"Schema file is not valid UTF-8: {schema_path}"
        ) from error
    except OSError as error:
        raise SchemaLoadingError(
            f"Unable to read schema file: {schema_path}"
        ) from error

    try:
        schema = json.loads(raw_schema)
    except json.JSONDecodeError as error:
        raise SchemaLoadingError(
            f"Schema file is not valid JSON: {schema_path}"
        ) from error

    if not isinstance(schema, dict):
        raise SchemaLoadingError(f"Schema root must be an object: {schema_path}")

    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as error:
        raise SchemaLoadingError(f"Schema file is invalid: {schema_path}") from error

    return schema


def _error_sort_key(error: Any) -> tuple[str, ...]:
    return tuple(str(part) for part in error.absolute_path)


def _format_error(error: Any) -> str:
    path = "/" + "/".join(str(part) for part in error.absolute_path)
    return f"{path} {error.message}"


def validate_feedback_payload(payload: Any, schema_path: Path) -> dict[str, Any]:
    """Validate a payload against the repository feedback contract."""
    schema = _load_schema(schema_path)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(payload), key=_error_sort_key)

    if errors:
        details = "; ".join(_format_error(error) for error in errors)
        raise PayloadValidationError(f"Feedback payload validation failed: {details}")

    return payload

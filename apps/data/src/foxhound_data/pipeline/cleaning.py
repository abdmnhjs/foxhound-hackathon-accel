from typing import Any


def clean_feedback_input(value: Any) -> Any:
    """Trim strings recursively without mutating or filtering the input."""
    if isinstance(value, str):
        return value.strip()

    if isinstance(value, list):
        return [clean_feedback_input(item) for item in value]

    if isinstance(value, dict):
        return {key: clean_feedback_input(item) for key, item in value.items()}

    return value

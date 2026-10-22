from datetime import datetime, timezone
from typing import Any

EXCLUDED_INPUT_FIELDS = frozenset({"companyId", "source", "mrr"})


def _normalize_datetime(value: Any) -> Any:
    if not isinstance(value, str) or "T" not in value:
        return value

    parseable_value = value[:-1] + "+00:00" if value.endswith("Z") else value

    try:
        parsed_value = datetime.fromisoformat(parseable_value)
    except ValueError:
        return value

    if parsed_value.tzinfo is None:
        return value

    return parsed_value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_feedback(value: Any) -> Any:
    if not isinstance(value, dict):
        return value

    normalized = {
        field: item
        for field, item in value.items()
        if field not in EXCLUDED_INPUT_FIELDS
    }
    if "createdAt" in normalized:
        normalized["createdAt"] = _normalize_datetime(normalized["createdAt"])
    return normalized


def normalize_feedback_payload(value: Any) -> Any:
    """Normalize the payload envelope and timezone-aware feedback dates."""
    if isinstance(value, list):
        return {"feedbacks": [_normalize_feedback(item) for item in value]}

    if isinstance(value, dict) and isinstance(value.get("feedbacks"), list):
        normalized = dict(value)
        normalized["feedbacks"] = [
            _normalize_feedback(item) for item in value["feedbacks"]
        ]
        return normalized

    return value

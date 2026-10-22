import json
from pathlib import Path
from typing import Any

FEEDBACK_FIELD_ORDER = (
    "id",
    "text",
    "createdAt",
    "userId",
    "plan",
)


def _order_feedback_fields(feedback: dict[str, Any]) -> dict[str, Any]:
    ordered = {
        field: feedback[field] for field in FEEDBACK_FIELD_ORDER if field in feedback
    }
    unknown_fields = sorted(set(feedback) - set(FEEDBACK_FIELD_ORDER))
    ordered.update({field: feedback[field] for field in unknown_fields})
    return ordered


def serialize_feedback_payload(payload: dict[str, Any]) -> str:
    """Serialize feedbacks using a stable field order and UTF-8 characters."""
    feedbacks = payload.get("feedbacks")
    ordered_payload = dict(payload)

    if isinstance(feedbacks, list):
        ordered_payload = {
            "feedbacks": [
                _order_feedback_fields(feedback)
                if isinstance(feedback, dict)
                else feedback
                for feedback in feedbacks
            ],
            **{field: payload[field] for field in sorted(set(payload) - {"feedbacks"})},
        }

    return json.dumps(ordered_payload, indent=2, ensure_ascii=False) + "\n"


def export_feedback_payload(payload: dict[str, Any], output_path: Path) -> None:
    """Write a feedback payload to a UTF-8 JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(serialize_feedback_payload(payload), encoding="utf-8")

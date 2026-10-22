from dataclasses import dataclass
from pathlib import Path
from typing import Any

from foxhound_data.pipeline.cleaning import clean_feedback_input
from foxhound_data.pipeline.export import export_feedback_payload
from foxhound_data.pipeline.ingestion import ingest_json
from foxhound_data.pipeline.normalization import normalize_feedback_payload
from foxhound_data.pipeline.validation import validate_feedback_payload


@dataclass(frozen=True)
class PipelineOptions:
    input_path: Path
    schema_path: Path
    output_path: Path


def process_payload(payload: Any, schema_path: Path) -> dict[str, Any]:
    """Clean, normalize, and validate an in-memory feedback payload."""
    cleaned = clean_feedback_input(payload)
    normalized = normalize_feedback_payload(cleaned)
    return validate_feedback_payload(normalized, schema_path)


def run_pipeline(options: PipelineOptions) -> dict[str, Any]:
    """Run every Data pipeline stage in its required order."""
    ingested = ingest_json(options.input_path)
    validated = process_payload(ingested, options.schema_path)
    export_feedback_payload(validated, options.output_path)
    return validated

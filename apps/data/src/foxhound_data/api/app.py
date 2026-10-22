from pathlib import Path
from typing import Any, Optional

from fastapi import Body, FastAPI, HTTPException

from foxhound_data.config import find_repository_file
from foxhound_data.pipeline.run import process_payload
from foxhound_data.pipeline.validation import PayloadValidationError


def create_app(schema_path: Optional[Path] = None) -> FastAPI:
    application = FastAPI(
        title="Foxhound Data API",
        version="0.1.0",
        description="Clean, normalize, and validate Foxhound feedbacks.",
    )

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.post("/feedbacks/process", response_model=None)
    def process_feedbacks(
        payload: Any = Body(...),
    ) -> dict[str, Any]:
        resolved_schema_path = schema_path or find_repository_file(
            "schema-feedback.json"
        )

        try:
            return process_payload(payload, resolved_schema_path)
        except PayloadValidationError as error:
            raise HTTPException(
                status_code=422,
                detail={"message": str(error)},
            ) from error

    return application


app = create_app()

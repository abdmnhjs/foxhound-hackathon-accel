import logging

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pipeline import MAX_FEEDBACKS, analyze


logger = logging.getLogger(__name__)
app = FastAPI(title="SaaS Feedback Analyzer")


class Feedback(BaseModel):
    id: str
    text: str = Field(min_length=1)
    createdAt: str | None = None
    userId: str | None = None
    companyId: str | None = None


class AnalyzeRequest(BaseModel):
    feedbacks: list[Feedback] = Field(max_length=MAX_FEEDBACKS)


@app.post("/analyze")
def analyze_feedback(request: AnalyzeRequest) -> dict:
    feedbacks = [
        feedback.dict(exclude_none=True)
        for feedback in request.feedbacks
    ]

    try:
        return analyze(feedbacks)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        logger.exception("Feedback analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Feedback analysis failed.",
        ) from error


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

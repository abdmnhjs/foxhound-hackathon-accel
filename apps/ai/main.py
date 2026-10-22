import logging

import uvicorn
from fastapi import FastAPI, HTTPException
from openai import OpenAIError
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from pipeline import MAX_FEEDBACKS, analyze


logger = logging.getLogger(__name__)
app = FastAPI(title="SaaS Feedback Analyzer")


class Feedback(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    createdAt: AwareDatetime
    userId: str | None = Field(default=None, min_length=1)
    plan: str | None = Field(default=None, min_length=1)


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feedbacks: list[Feedback] = Field(min_length=1, max_length=MAX_FEEDBACKS)


class GroupResult(BaseModel):
    title: str
    summary: str
    score: int = Field(ge=0, le=100)
    priority: str
    contradiction: str | None
    feedbackIds: list[str]


class AnalyzeResponse(BaseModel):
    groups: list[GroupResult]


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse)
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_feedback(request: AnalyzeRequest) -> dict:
    feedbacks = [
        feedback.model_dump(mode="json", exclude_none=True)
        for feedback in request.feedbacks
    ]

    try:
        return analyze(feedbacks)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except OpenAIError as error:
        logger.exception("AI provider request failed")
        raise HTTPException(
            status_code=503,
            detail="AI provider request failed.",
        ) from error
    except Exception as error:
        logger.exception("Feedback analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Feedback analysis failed.",
        ) from error


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

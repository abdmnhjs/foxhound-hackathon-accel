from pathlib import Path

from fastapi.testclient import TestClient

from foxhound_data.api.app import create_app

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPOSITORY_ROOT / "schema-feedback.json"


def api_client() -> TestClient:
    return TestClient(create_app(schema_path=SCHEMA_PATH))


def test_health_endpoint() -> None:
    response = api_client().get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_processes_feedbacks_in_memory() -> None:
    response = api_client().post(
        "/feedbacks/process",
        json={
            "feedbacks": [
                {
                    "id": "  fb_api_001  ",
                    "text": "  Synthetic API feedback.  ",
                    "createdAt": "  2026-10-22T18:30:00+02:00  ",
                    "userId": "  usr_api_001  ",
                    "plan": "  Custom  ",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "feedbacks": [
            {
                "id": "fb_api_001",
                "text": "Synthetic API feedback.",
                "createdAt": "2026-10-22T16:30:00Z",
                "userId": "usr_api_001",
                "plan": "Custom",
            }
        ]
    }


def test_accepts_feedback_without_optional_fields() -> None:
    response = api_client().post(
        "/feedbacks/process",
        json={
            "feedbacks": [
                {
                    "id": "fb_api_002",
                    "text": "Required fields only.",
                    "createdAt": "2026-10-22T17:00:00Z",
                }
            ]
        },
    )

    assert response.status_code == 200


def test_removes_excluded_fields_without_losing_feedback() -> None:
    response = api_client().post(
        "/feedbacks/process",
        json={
            "feedbacks": [
                {
                    "id": "fb_api_003",
                    "text": "Feedback with excluded metadata.",
                    "createdAt": "2026-10-22T18:00:00Z",
                    "companyId": "cmp_forbidden",
                    "source": "web",
                    "mrr": 1000,
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "feedbacks": [
            {
                "id": "fb_api_003",
                "text": "Feedback with excluded metadata.",
                "createdAt": "2026-10-22T18:00:00Z",
            }
        ]
    }


def test_returns_422_for_an_unknown_property() -> None:
    response = api_client().post(
        "/feedbacks/process",
        json={
            "feedbacks": [
                {
                    "id": "fb_api_004",
                    "text": "Unknown field.",
                    "createdAt": "2026-10-22T19:00:00Z",
                    "unexpected": True,
                }
            ]
        },
    )

    assert response.status_code == 422
    assert "Additional properties" in response.json()["detail"]["message"]


def test_returns_422_for_invalid_json() -> None:
    response = api_client().post(
        "/feedbacks/process",
        content=b'{"feedbacks": [}',
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 422

# Foxhound API

NestJS is the public backend and the only service called by the web app. It
stores raw feedback in PostgreSQL and orchestrates the Python Data and AI
services.

## Local configuration

Copy the repository-level environment template and set valid local values:

```bash
cp .env.example .env
```

The integration variables are:

- `DATA_SERVICE_URL`, defaulting to `http://127.0.0.1:8001`
- `AI_SERVICE_URL`, defaulting to `http://127.0.0.1:8002`
- `PIPELINE_REQUEST_TIMEOUT_MS`, defaulting to `120000`

Start the backend from the repository root:

```bash
npm run start:dev -w api
```

## Feedback flow

`POST /api/feedback` stores the authenticated user's raw feedback first. The
backend then reads up to the 100 most recent feedback records, sends them to
Data for cleaning and validation, sends the normalized payload to AI, and
atomically replaces the analyzed results in PostgreSQL.

If a Python service is unavailable, the raw feedback remains stored and the
response reports `analysis.status` as `pending`. A founder can retry the same
stored data with `POST /api/feedback/analyze`.

Available routes:

- `POST /api/feedback`: store feedback and run analysis automatically
- `GET /api/feedback/results`: return analyzed results to the founder
- `POST /api/feedback/analyze`: retry the complete analysis as the founder
- `GET /api/feedback/services/health`: check both Python services as the founder

Both founder-only routes use the existing authenticated session. Downstream
responses are validated before any analysis result is written to the database.

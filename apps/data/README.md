# Foxhound Data

Python service responsible for transforming raw feedback into the JSON contract
defined by the repository-level `schema-feedback.json` file.

The pipeline runs ingestion, cleaning, normalization, validation, and export
as separate deterministic stages.

## Development

From `apps/data`:

```bash
uv sync
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

## Command line

From `apps/data`:

```bash
uv run foxhound-data \
  --input path/to/raw-feedbacks.json \
  --output path/to/normalized-feedbacks.json
```

The command finds the repository-level `schema-feedback.json` automatically.
Use `--schema path/to/schema.json` to provide another schema explicitly.

## HTTP API

Start the Data API from `apps/data`:

```bash
uv run uvicorn foxhound_data.api.app:app --host 0.0.0.0 --port 8000 --reload
```

Available endpoints:

- `GET /health`
- `POST /feedbacks/process`

The process endpoint accepts the JSON contract from `schema-feedback.json` and
returns the cleaned, normalized, and validated payload in memory.

Incoming `companyId`, `source`, and `mrr` fields are explicitly removed before
validation so that their presence does not discard an otherwise valid feedback.
Other unknown properties remain validation errors.

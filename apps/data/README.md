# Foxhound Data

Python service responsible for transforming raw feedback into the JSON contract
defined by the repository-level `schema-feedback.json` file.

The pipeline implementation has not started yet. Its planned stages are
ingestion, cleaning, normalization, validation, and export.

## Development

From `apps/data`:

```bash
uv sync
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

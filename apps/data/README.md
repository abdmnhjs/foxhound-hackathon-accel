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

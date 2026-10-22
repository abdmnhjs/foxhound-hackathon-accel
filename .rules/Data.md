# Foxhound Data Guidelines

## Scope and boundaries

- Work only on the Foxhound Data pipeline unless the user explicitly expands the scope.
- Do not modify `apps/web`, the AI Agent, backend code, or unrelated packages without an explicit request.
- The future Data pipeline must live as a dedicated application workspace under `apps/`.
- Do not silently choose Python, TypeScript, or another stack. Present the trade-offs and obtain an explicit decision before scaffolding the Data application.
- Preserve the monorepo's existing workspace, script, formatting, and tooling conventions where they apply.
- Do not refactor files unrelated to the requested Data task.

## Output contract

- `schema-feedback.json` is the source of truth for every output produced by the Data pipeline.
- `feedbacks.mock.json` must always remain valid against that schema.
- The current feedback fields are required `id`, `text`, and ISO 8601 `createdAt`, with optional `userId` and `companyId`.
- Never add `source`, `plan`, or `mrr` without an explicit decision from the user.
- Any contract change must update the schema, mock data, and associated tests together.
- Validate every exported payload against `schema-feedback.json`.

## Pipeline design

- Keep the pipeline stages separate: ingestion -> cleaning -> normalization -> validation -> export.
- Keep business logic, input/output adapters, configuration, and tests clearly separated.
- Prefer the simplest clean architecture that supports the current requirements.
- Avoid unnecessary dependencies and premature abstractions.
- Make transformations deterministic and reproducible.

## Data quality and security

- Use only synthetic, non-sensitive data in fixtures and tests.
- Never commit secrets, API keys, credentials, personal data, or other sensitive data.
- Add tests for valid payloads, missing required fields, invalid dates, empty strings, and forbidden properties.
- Reject unexpected output properties rather than silently passing them through.

## Working protocol

- Inspect the relevant existing files and conventions before making changes.
- Keep changes narrowly scoped and run the relevant validation, tests, formatting, and repository checks.
- Never commit, push, merge, or modify `main` without an explicit user request.
- Always report separately what was created, tested, committed, and pushed.

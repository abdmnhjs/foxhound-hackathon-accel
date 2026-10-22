# Foxhound

Foxhound turns a stream of raw SaaS customer feedback into a prioritized,
founder-ready view of the themes that deserve attention.

Users submit feedback through a focused web interface. Foxhound stores every
submission, cleans and validates the data, groups semantically related messages,
generates concise summaries, detects potential contradictions, and ranks each
theme with a transparent score. Founders consume the result through a sortable,
paginated dashboard instead of reviewing isolated messages one by one.

> Foxhound is a hackathon prototype. It demonstrates an end-to-end product and
> data/AI architecture; it is not presented as a production-ready feedback
> platform.

## What the product does

Foxhound provides two role-specific experiences:

- **User workspace:** authenticated users submit free-form product feedback.
- **Founder dashboard:** the founder reviews analyzed themes, scores,
  priorities, summaries, and detected contradictions, with client-side sorting
  and pagination.

Behind the interface, the platform:

1. Persists the raw feedback in PostgreSQL before starting analysis.
2. Loads the 100 most recent submissions.
3. Cleans, normalizes, and validates them against a shared JSON Schema.
4. Creates multilingual sentence embeddings and groups related feedback with
   KMeans.
5. Uses Groq to name and summarize each group and identify opposing opinions.
6. Calculates a deterministic priority score from volume, distinct users, and
   recency.
7. Validates group coverage and atomically replaces the stored analysis.

If a downstream service is unavailable, the original submission remains stored
and the analysis is reported as pending. A founder can retry the analysis later.

## Architecture

```mermaid
flowchart LR
    U[User] --> W[Web app<br/>React + TanStack]
    F[Founder] --> W
    W -->|HTTP + session cookie| API[NestJS API]
    API -->|Raw feedback and results| DB[(PostgreSQL)]
    API -->|Prepare payload| DATA[Data service<br/>FastAPI]
    DATA -->|Validated contract| AI[AI service<br/>FastAPI]
    AI -->|Analyzed groups| API
```

The browser communicates only with the NestJS API. The API owns authentication,
authorization, persistence, and orchestration; the Python services remain
focused on deterministic data preparation and AI analysis.

| Component   | Responsibility                                                           | Local address           |
| ----------- | ------------------------------------------------------------------------ | ----------------------- |
| `apps/web`  | Login, feedback form, and founder dashboard                              | `http://localhost:3001` |
| `apps/api`  | Public API, sessions, authorization, persistence, and orchestration      | `http://localhost:3000` |
| `apps/data` | Cleaning, normalization, JSON Schema validation, and optional CLI export | `http://127.0.0.1:8001` |
| `apps/ai`   | Embeddings, clustering, summaries, contradictions, and priority scoring  | `http://127.0.0.1:8002` |

The TypeScript applications and shared UI package are managed as npm workspaces
with Turborepo. The two Python applications are installed and run independently.

## Technology stack

- **Frontend:** React 19, TanStack Start and Router, Vite, Tailwind CSS, Axios
- **Backend:** NestJS 12, Better Auth, Prisma 7
- **Database:** PostgreSQL
- **Data service:** Python, FastAPI, JSON Schema
- **AI service:** Sentence Transformers, multilingual MiniLM embeddings,
  scikit-learn KMeans, Groq through its OpenAI-compatible API
- **Tooling:** npm workspaces, Turborepo, TypeScript, Vitest, pytest, Ruff,
  ESLint, and Oxlint

## Repository structure

```text
.
├── apps/
│   ├── web/                 # User and founder interfaces
│   ├── api/                 # NestJS API, auth, Prisma schema, and migrations
│   ├── data/                # Deterministic preparation service and CLI
│   └── ai/                  # Semantic grouping and LLM analysis service
├── packages/
│   └── ui/                  # Shared React components and global styles
├── schema-feedback.json     # Data-to-AI contract
├── .env.example             # API and service integration configuration
├── ENVIRONMENT.md           # Additional environment and auth notes
└── turbo.json               # Monorepo task configuration
```

## Getting started

### Prerequisites

- Node.js `22.12` or newer and npm `10`
- PostgreSQL
- Python `3.12`
- [`uv`](https://docs.astral.sh/uv/) for the Data service
- A Groq API key
- Network access on the first AI startup to download the embedding model

### 1. Install the JavaScript workspace

From the repository root:

```bash
npm install
```

### 2. Configure the API

Create the root environment file:

```bash
cp .env.example .env
```

The defaults expect a local PostgreSQL database named `foxhound`. Update
`DATABASE_URL` if your database name, credentials, host, or port differ. Replace
the example auth secret with a value of at least 32 characters:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

The root configuration supports:

| Variable                      | Purpose                                       | Local default                                            |
| ----------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`                | PostgreSQL connection string                  | `postgresql://postgres:postgres@127.0.0.1:5432/foxhound` |
| `BETTER_AUTH_SECRET`          | Session signing secret; minimum 32 characters | No safe default                                          |
| `BETTER_AUTH_URL`             | Public backend URL used by Better Auth        | `http://localhost:3000`                                  |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Comma-separated allowed frontend origins      | `http://localhost:3001`                                  |
| `DATA_SERVICE_URL`            | Data service base URL                         | `http://127.0.0.1:8001`                                  |
| `AI_SERVICE_URL`              | AI service base URL                           | `http://127.0.0.1:8002`                                  |
| `PIPELINE_REQUEST_TIMEOUT_MS` | Timeout for each downstream request           | `120000`                                                 |
| `PORT`                        | NestJS port                                   | `3000`                                                   |

### 3. Prepare PostgreSQL

Create an empty database that matches `DATABASE_URL`, then apply the committed
migrations and seed the demo environment:

```bash
npm run db:deploy -w api
npm run seed
```

The seed is idempotent. It creates the two demo accounts and a set of dashboard
results so the interface can be explored immediately. Rerunning it resets the
demo account passwords and removes their active sessions.

### 4. Install and configure the Data service

```bash
cd apps/data
uv sync
cd ../..
```

### 5. Install and configure the AI service

```bash
cd apps/ai
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
cd ../..
```

Set `GROQ_API_KEY` in `apps/ai/.env`. `GROQ_MODEL` is optional and defaults to
`openai/gpt-oss-20b`.

### 6. Run the platform

Start each process in a separate terminal from the repository root:

```bash
# Terminal 1 — Data service
cd apps/data
uv run uvicorn foxhound_data.api.app:app --host 127.0.0.1 --port 8001 --reload
```

```bash
# Terminal 2 — AI service
cd apps/ai
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8002 --reload
```

```bash
# Terminal 3 — NestJS API
npm run start:dev -w api
```

```bash
# Terminal 4 — Web application
npm run dev -w web
```

Open `http://localhost:3001`. The root `npm run dev` command can start the
JavaScript workspaces together, but the two Python services still need their own
processes.

### Demo accounts

| Role    | Username  | Password  | Destination  |
| ------- | --------- | --------- | ------------ |
| User    | `user`    | `user`    | `/feedback`  |
| Founder | `founder` | `founder` | `/dashboard` |

Public sign-up is disabled. These credentials are intended only for the local
demo.

## End-to-end analysis flow

### 1. Capture and persistence

`POST /api/feedback` requires an authenticated session. The API trims the input,
associates it with the authenticated user, and persists it before attempting any
analysis. This ordering prevents a temporary Data, AI, or provider failure from
discarding customer input.

### 2. Deterministic data preparation

The Data service recursively trims strings, converts timezone-aware timestamps
to UTC, and removes the explicitly excluded input fields `companyId`, `source`,
and `mrr`. It then validates the payload against `schema-feedback.json`.

The contract permits only:

- required: `id`, `text`, `createdAt`
- optional: `userId`, `plan`

Other unknown properties remain validation errors. The same pipeline is
available as a CLI for file-based processing; see `apps/data/README.md`.

### 3. Semantic grouping and enrichment

The AI service encodes feedback with
`paraphrase-multilingual-MiniLM-L12-v2`. Requests with up to eight records keep
one group per record; larger requests use approximately one KMeans cluster per
eight records, capped at 12 clusters. The model is loaded once when the service
starts.

For each cluster, Groq returns a short title, a one-sentence summary, and an
optional contradiction. Identifiers stay outside the LLM prompt; only feedback
text and the optional plan are sent to the provider.

### 4. Scoring and storage

Python calculates a score from 0 to 100 with these weights:

- **50% volume:** group size relative to the largest group
- **30% reach:** distinct users relative to the widest-reaching group
- **20% recency:** exponential decay with a 30-day half-life

Scores map to `green` (0–33), `yellow` (34–66), and `red` (67–100). Before
writing anything, NestJS verifies the response shape and confirms that every
prepared feedback ID appears exactly once. It then replaces the analyzed result
set inside a PostgreSQL transaction.

## API reference

### Public backend

| Method | Route                           | Access        | Purpose                             |
| ------ | ------------------------------- | ------------- | ----------------------------------- |
| `POST` | `/api/feedback`                 | Authenticated | Store feedback and attempt analysis |
| `GET`  | `/api/feedback/results`         | Founder       | Return analyzed groups              |
| `POST` | `/api/feedback/analyze`         | Founder       | Retry analysis for stored feedback  |
| `GET`  | `/api/feedback/services/health` | Founder       | Check both Python services          |
| `*`    | `/api/auth/*`                   | Varies        | Better Auth session endpoints       |

### Internal Python services

| Service | Method | Route                | Purpose                                       |
| ------- | ------ | -------------------- | --------------------------------------------- |
| Data    | `GET`  | `/health`            | Liveness response                             |
| Data    | `POST` | `/feedbacks/process` | Clean, normalize, and validate a payload      |
| AI      | `GET`  | `/health`            | Liveness response                             |
| AI      | `POST` | `/analyze`           | Group, summarize, and score prepared feedback |

FastAPI documentation is available at `http://127.0.0.1:8001/docs` and
`http://127.0.0.1:8002/docs` while the services are running.

## Quality checks

Run the TypeScript workspace checks from the repository root:

```bash
npm run lint
npm run typecheck
npm run build
npm run test -w api
```

Run the Data service checks from `apps/data`:

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

The API test suite covers authentication boundaries, raw feedback persistence,
pipeline orchestration, downstream response validation, complete group coverage,
and repeatable database seeding. The Data suite covers each pipeline stage, the
CLI, and the HTTP API.

## Current boundaries

- Analysis is synchronous and runs after each submission; there is no background
  queue or scheduled retry worker.
- Each run considers only the 100 most recent stored feedback records and
  replaces the previous analyzed result set.
- The demo authorization model recognizes fixed seeded user and founder email
  addresses; it is not a general multi-tenant role system.
- Semantic clustering is heuristic. KMeans assigns every record to a group but
  cannot guarantee that every member expresses the same intent.
- Contradiction detection works only when opposing feedback lands in the same
  cluster and the provider identifies it correctly.
- The AI service requires a configured Groq key and external model access. A
  provider failure leaves raw feedback safe but analysis pending.
- Internal Python endpoints do not implement service-to-service authentication
  and should not be exposed directly to the public internet.

## Further documentation

- [`ENVIRONMENT.md`](ENVIRONMENT.md) — environment loading, database commands,
  auth behavior, and local proxy details
- [`apps/api/README.md`](apps/api/README.md) — backend orchestration and routes
- [`apps/data/README.md`](apps/data/README.md) — Data API and CLI usage
- [`apps/ai/README.md`](apps/ai/README.md) — AI contract, model setup, and scoring

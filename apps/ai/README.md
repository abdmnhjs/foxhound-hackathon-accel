# AI Feedback Analysis Service

FastAPI service for grouping SaaS feedback into themes, summarizing each group, identifying possible contradictions, and ranking groups by priority. The NestJS backend calls this service; the data pipeline is responsible for preparing the feedback records.

## Requirements

- Python 3.12
- A Groq API key
- Network access on first startup to download the embedding model from Hugging Face

## Install

Run these commands from `apps/ai`:

```bash
python3.12 -m venv venv312
source venv312/bin/activate
python -m pip install "torch==2.2.2" "numpy<2" "transformers<4.50" "sentence-transformers<4" scikit-learn openai python-dotenv fastapi uvicorn
```

## Configure

Create a local `.env` file from the example and add the Groq API key:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

Do not commit `.env` or share the API key.

## Run locally

From `apps/ai`, start the service:

```bash
source venv312/bin/activate
python main.py
```

The API listens at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Test with the sample file

Leave the API running. In a second terminal, from `apps/ai`, send the existing sample JSON file:

```bash
source venv312/bin/activate
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  --data-binary @data/feedbacks.mock.json
```

The sample file is a complete request body with a top-level `feedbacks` array.

## API contract

### `POST /analyze`

The request body contains up to 100 feedback records. `id` and `text` are required; `createdAt`, `userId`, and `companyId` are optional.

```json
{
  "feedbacks": [
    {
      "id": "fb_001",
      "text": "The dashboard takes too long to load.",
      "createdAt": "2026-10-20T09:15:00Z",
      "userId": "usr_001",
      "companyId": "cmp_001"
    }
  ]
}
```

The response contains groups ordered by descending score:

```json
{
  "groups": [
    {
      "title": "Dashboard performance",
      "summary": "Users report that the dashboard loads slowly.",
      "score": 78,
      "priority": "red",
      "contradiction": null,
      "feedbackIds": ["fb_001"]
    }
  ]
}
```

Priority is derived from the score: `green` for 0–33, `yellow` for 34–66, and `red` for 67–100.

## Processing and scoring

The service loads `paraphrase-multilingual-MiniLM-L12-v2` once at startup and generates embeddings locally. KMeans uses `random_state=0` and `n_init=10`. For up to 8 feedback records, each record is kept in its own group. Larger requests use approximately one cluster per eight records, with a maximum of 12 clusters.

Groq is called once per cluster to generate its title, one-sentence summary, and optional contradiction. Python calculates the score using group volume, distinct user/company IDs, and feedback recency. The score weights and priority thresholds are defined in `pipeline.py`.

Clustering is heuristic: KMeans assigns every feedback to a group, but cannot guarantee that all members share the same theme. Contradiction detection also depends on opposing feedback appearing in the same group.

## Backend integration

NestJS should make a server-to-server `POST` request to `/analyze`, send the same JSON structure as the sample file, then store or return the response as needed. Use `http://127.0.0.1:8000` locally. In deployment, configure the AI service URL reachable from the NestJS runtime; `localhost` inside a container refers to that container itself.

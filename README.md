# Google Book Explorer

A full-stack book search application with an AI-powered query layer. Search by title, author, or ISBN — the LLM picks the right Google Books filter. The RAG pipeline ingests and embeds book descriptions for semantic search and grounded question-answering.

## Architecture

```
Browser
  ├── frontend  :3000   React 19 + esbuild      (UI, OAuth redirect)
  └── gateway   :3001   Express 5 + TypeScript  (auth, session, proxy)
                  └──   backend   :3002   FastAPI + Python    (OpenAI, pgvector, Redis)
                           ├── postgres  :5432   pgvector       (vector embeddings)
                           └── redis     :6379   Redis          (session + RAG cache)
```

| Service | Tech | Responsibility |
|---------|------|---------------|
| `frontend` | React 19, esbuild, pnpm | Book search UI, Google OAuth login |
| `gateway` | Express 5, TypeScript, pnpm | Auth (JWT cookies), session (Redis), API proxy |
| `backend` | FastAPI, Python 3.13, uv | OpenAI tool use, RAG pipeline, pgvector |

## How it works

**Book search via LLM tool use.** When a user searches, the query goes to the Python backend where GPT-4.1's [Responses API](https://platform.openai.com/docs/guides/responses) decides which Google Books filter to apply — `intitle:`, `inauthor:`, or `isbn:` — rather than passing the raw query and hoping for the right results. This tool-routing pattern produces more accurate results with no additional user effort.

**RAG pipeline with pgvector.** The ingest pipeline chunks book descriptions using tiktoken (300-token windows, 40-token overlap), embeds each chunk with `text-embedding-3-small`, and stores the 1536-dimensional vectors in PostgreSQL via the [pgvector](https://github.com/pgvector/pgvector) extension with an HNSW index for fast approximate nearest-neighbor search. pgvector was chosen over a dedicated vector database to keep the stack simple — Postgres is already present, and pgvector with HNSW handles the search volumes a book explorer needs without another service to operate.

**Session-scoped RAG caching.** The generate endpoint checks Redis for a cached context before embedding the query and hitting pgvector. The cache key is the session ID, so follow-up questions in the same session reuse the retrieved chunks without a round-trip to the database. This eliminates redundant embedding API calls and latency for conversational use.

## Quick start

**Prerequisites:** Docker, Docker Compose, API keys for [OpenAI](https://platform.openai.com/api-keys) and [Google Books](https://developers.google.com/books/docs/v1/using#APIKey), and a [Google OAuth app](https://console.cloud.google.com/apis/credentials).

```bash
git clone https://github.com/rawlinja/google-book-explorer.git
cd google-book-explorer
cp .env.example .env     # fill in your API keys
./scripts/start.sh
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | gateway | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | gateway | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | gateway | OAuth callback — `http://localhost:3001/auth/google/callback` |
| `JWT_SECRET` | gateway | JWT signing secret (min 32 chars) |
| `SESSION_SECRET` | gateway | Session encryption secret (min 32 chars) |
| `BACKEND_URL` | gateway | Internal URL of the Python backend |
| `OPENAI_API_KEY` | backend | OpenAI API key |
| `GOOGLE_BOOKS_API_KEY` | backend | Google Books API key |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `REDIS_URL` | backend | Redis connection string |
| `API_URL` | frontend | Gateway base URL (`http://localhost:3001`) |

## Project structure

```
google-book-explorer/
├── frontend/            # React 19 + esbuild (pnpm)
│   └── src/
│       ├── components/  # Books, Pagination, ErrorBoundary
│       ├── pages/       # Login, Authorize, AuthSignedIn
│       └── store/       # Zustand session state
├── gateway/             # Express 5 + TypeScript (pnpm)
│   └── src/
│       ├── middleware/  # auth (JWT), session (Redis), security
│       └── routes/      # auth (OAuth), me, health, proxy
├── backend/             # FastAPI + Python 3.13 (uv)
│   ├── app/
│   │   ├── routers/     # books (search), rag (ingest/search/generate)
│   │   └── services/    # book_search (tool use), rag_service (chunk/embed/generate)
│   ├── migrations/      # pgvector schema
│   └── tests/
├── docker-compose.yml
├── .env.example
└── scripts/
    ├── start.sh
    └── stop.sh
```

## License

MIT

# Google Book Explorer

A full-stack book search application with an AI-powered query layer. Search by title, author, or ISBN — GPT-4.1 picks the right Google Books filter via tool use.

## Architecture

```
Browser
  ├── frontend  :3000   React 19 + esbuild      (UI, OAuth redirect)
  └── api       :3001   Fastify 5 + TypeScript  (auth, book search)
                  └──   redis     :6379          (sessions)
```

| Service | Tech | Responsibility |
|---------|------|---------------|
| `frontend` | React 19, esbuild, pnpm | Book search UI, Google OAuth login, pagination |
| `api` | Fastify 5, TypeScript, pnpm | Google OAuth PKCE, session auth, OpenAI tool use, Google Books |

## How it works

**Book search via LLM tool use.** When a user searches, the query goes to GPT-4.1's [Responses API](https://platform.openai.com/docs/guides/responses) which decides which Google Books filter to apply — `intitle:`, `inauthor:`, or `isbn:` — rather than passing the raw query and hoping for the right results. This tool-routing pattern produces more accurate results with no additional user effort.

**Session-only auth.** After Google OAuth, the API stores tokens in Redis and marks the session as authenticated. There is no JWT — every request already hits Redis to load the session, so a JWT would add no benefit. One auth mechanism is simpler than two.

**Pagination.** The Google Books API supports `startIndex` for offset-based pagination. The API accepts a `page` query param, computes `startIndex = (page - 1) * 10`, and returns `totalItems` from Google so the frontend can render page controls.

## Quick start

**Prerequisites:** Docker, Docker Compose, API keys for [OpenAI](https://platform.openai.com/api-keys) and [Google Books](https://developers.google.com/books/docs/v1/using#APIKey), and a [Google OAuth app](https://console.cloud.google.com/apis/credentials).

```bash
git clone https://github.com/rawlinja/google-book-explorer.git
cd google-book-explorer
cp .env.example .env          # fill in your API keys
./scripts/build-containers.sh # build Docker images
./scripts/start.sh            # start all services
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback — `http://localhost:3001/auth/google/callback` |
| `SESSION_SECRET` | Session encryption secret (min 32 chars) |
| `REDIS_URL` | Redis connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key |
| `API_URL` | Frontend dev-server proxy target (`http://localhost:3001`) |

## Project structure

```
google-book-explorer/
├── frontend/            # React 19 + esbuild (pnpm)
│   └── src/
│       ├── components/  # Books, Pagination, ErrorBoundary, Nav
│       ├── pages/       # Authorize, AuthSignedIn
│       ├── store/       # Zustand session + books state
│       └── lib/         # api helpers (getMe, login, logout)
├── api/                 # Fastify 5 + TypeScript (pnpm)
│   └── src/
│       ├── plugins/     # Redis client
│       ├── hooks/       # requireAuth
│       ├── routes/      # auth, me, health, books
│       └── services/    # bookSearch (OpenAI), googleBooks
├── docker-compose.yml
├── .env.example
└── scripts/
    ├── install.sh            # pnpm install (frontend + api)
    ├── build-containers.sh   # docker compose build
    ├── start.sh              # docker compose up -d
    ├── stop.sh               # docker compose down
    └── logs.sh               # docker compose logs -f [service]
```

## License

MIT

# Google Book Explorer

A full-stack book search application with an AI-powered query layer and Google Books library integration. Search by title, author, or ISBN — GPT-4.1 picks the right Google Books filter via tool use. Add books to your Google library collections directly from the search results.

## Architecture

```
Browser
  ├── frontend  :3000   React 19 + esbuild      (UI, OAuth redirect)
  └── api       :3001   Fastify 5 + TypeScript  (auth, book search, shelf management)
                  └──   redis     :6379          (sessions + tokens)
```

| Service | Tech | Responsibility |
|---------|------|---------------|
| `frontend` | React 19, esbuild, Zustand, TanStack Query, pnpm | Book search UI, Google OAuth login, pagination, collection management |
| `api` | Fastify 5, TypeScript, pnpm | Google OAuth PKCE, session auth, OpenAI tool use, Google Books search + shelf API |

## How it works

**Book search via LLM tool use.** When a user searches, the query goes to GPT-4.1's [Responses API](https://platform.openai.com/docs/guides/responses) which decides which Google Books filter to apply — `intitle:`, `inauthor:`, or `isbn:` — rather than passing the raw query and hoping for the right results. This tool-routing pattern produces more accurate results with no additional user effort.

**Session-only auth.** The auth lifecycle has three stages:

1. **Login** — the API generates a PKCE verifier and state, stores them in the session, and redirects the browser to Google. On callback, it exchanges the code for Google tokens, stores them in Redis under `tokens:{sessionId}`, and marks the session authenticated.
2. **Requests** — every API call checks `session.authenticated`. Calls to Google Books use the stored access token, refreshing it automatically if it returns a 401.
3. **Logout** — the token entry is deleted from Redis, the session is destroyed (also removed from Redis), and the session cookie is cleared. Nothing is left server-side.

**Book collections.** Books can be added to or moved between your Google library collections (Favorites, To Read, Reading Now, Have Read). Collection state is tracked in `sessionStorage` via a Zustand store — no extra server trip is needed to show which collection a book belongs to. Moving a book calls `removeVolume` on the old shelf then `addVolume` on the new one.

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
| `CORS_ORIGIN` | Allowed frontend origin — `http://localhost:3000` |
| `SESSION_SECRET` | Session encryption secret (min 32 chars) |
| `REDIS_URL` | Redis connection string — `redis://redis:6379` |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key |
| `GATEWAY_URL` | Frontend dev-server proxy target — `http://api:3001` in Docker |

## Project structure

```
google-book-explorer/
├── frontend/            # React 19 + esbuild (pnpm)
│   └── src/
│       ├── components/  # Books (search + BookCard), Pagination, Nav
│       ├── pages/       # Authorize, AuthSignedIn
│       ├── store/       # Zustand: session, books (sessionStorage), collections (sessionStorage)
│       └── lib/         # api helpers (getMe, login, logout, fetchShelves, addToShelf, removeFromShelf)
├── api/                 # Fastify 5 + TypeScript (pnpm)
│   └── src/
│       ├── plugins/     # Redis client
│       ├── hooks/       # requireAuth
│       ├── routes/      # auth, me, health, books, bookshelves
│       └── services/    # bookSearch (OpenAI + Google Books), bookshelf (Google shelf API)
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

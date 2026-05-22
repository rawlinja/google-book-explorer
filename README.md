# Google Book Explorer

A full-stack book search application with Google Books integration and an AI-powered search layer. Search by title, author, or ISBN — GPT-4.1 figures out which filter to use so you don't have to. Add books directly to your Google library collections from the results.

## Architecture

```
Browser
  └── nginx     :3000   static files + reverse proxy
        └── api  :3001  Fastify 5 + TypeScript
                    └── redis  :6379
```

nginx is the single entry point. It serves the pre-built React frontend and proxies API, auth, and health requests to Fastify. Redis stores sessions and Google tokens.

## How it works

**Smart search.** User queries go through GPT-4.1, which picks the right Google Books search filter — by title, author, or ISBN — before hitting the API. This produces much better results than sending raw queries directly.

**Auth.** Login goes through Google OAuth with PKCE. The session and Google tokens are stored server-side in Redis, so nothing sensitive ever reaches the browser. Logout wipes both.

**Collections.** Books can be added to or moved between your Google library collections (Favorites, To Read, Reading Now, Have Read). The app tracks which collection each book belongs to locally so it doesn't need to re-fetch from Google on every interaction.

**Pagination.** Results are paginated; the frontend renders page controls based on the total count returned by the Google Books API.

## Quick start

**Prerequisites:** Docker, Docker Compose, API keys for [OpenAI](https://platform.openai.com/api-keys) and [Google Books](https://developers.google.com/books/docs/v1/using#APIKey), and a [Google OAuth app](https://console.cloud.google.com/apis/credentials).

```bash
git clone https://github.com/rawlinja/google-book-explorer.git
cd google-book-explorer
cp .env.example .env   # fill in your keys
./scripts/prod.sh      # build and start everything
```

Open [http://localhost:3000](http://localhost:3000).

**For development** (live reload on file changes):

```bash
./scripts/install.sh   # install dependencies
./scripts/dev.sh       # start stack + watch for frontend changes (Ctrl+C stops everything)
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback — `http://localhost:3000/auth/google/callback` |
| `CORS_ORIGIN` | Allowed frontend origin — `http://localhost:3000` |
| `SESSION_SECRET` | Session encryption secret (32+ chars) |
| `REDIS_URL` | Redis connection string — `redis://redis:6379` |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key |

## Project structure

```
google-book-explorer/
├── frontend/          # React 19 + esbuild
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── lib/
├── api/               # Fastify 5 + TypeScript
│   └── src/
│       ├── plugins/
│       ├── hooks/
│       ├── routes/
│       └── services/
├── nginx/             # nginx configs + Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── scripts/
    ├── install.sh
    ├── dev.sh
    ├── prod.sh
    ├── stop.sh
    └── logs.sh
```

## License

MIT

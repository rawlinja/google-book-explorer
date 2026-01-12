# Google Book Explorer

A full-stack application for exploring Google Books with AI-powered search using RAG (Retrieval-Augmented Generation).

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, TanStack Query, Zustand |
| Backend | Express 5, TypeScript, PostgreSQL + pgvector, Redis |
| AI | OpenAI API, semantic chunking, vector embeddings |

## Prerequisites

- Node.js 18+
- Yarn
- PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) extension
- Redis

## Setup

### Backend

```bash
cd backend
yarn install
cp .env.example .env  # Configure environment variables
yarn dev
```

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env  # Configure environment variables
yarn dev
```

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_LOGIN_URL` | Backend login endpoint |
| `VITE_LOGOUT_URL` | Backend logout endpoint |
| `VITE_ME_URL` | Backend user info endpoint |

## Scripts

### Backend
- `yarn dev` — Start dev server with hot reload
- `yarn build` — Compile TypeScript
- `yarn start` — Run production server
- `yarn test` — Run tests

### Frontend
- `yarn dev` — Start Vite dev server
- `yarn build` — Build for production
- `yarn preview` — Preview production build
- `yarn lint` — Run ESLint

## License

MIT

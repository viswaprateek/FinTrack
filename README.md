# FinTrack

A personal finance app for envelope budgeting — plan monthly budgets, track spending, manage recurring bills, and forecast cashflow.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Auth** | Clerk |
| **State** | TanStack Query, Redux Toolkit |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | MySQL |

## Architecture

```
Browser (React)  →  Clerk auth  →  FastAPI API  →  MySQL
                      ↓
              TanStack Query / Axios
```

- **Frontend** (`client/`) — SPA with public pages (landing, sign-in) and protected app pages (dashboard, budgets, transactions).
- **Backend** (`server/`) — REST API under `/api`, JWT verification via Clerk JWKS, SQLAlchemy ORM.
- **Database** — MySQL locally via Docker, or a hosted instance (e.g. Railway) in production.

## Project Structure

```
personal_finance/
├── client/
│   └── src/
│       ├── api/           # Axios client + endpoint modules
│       ├── app/           # Router, Redux store
│       ├── components/    # Reusable UI + feature widgets
│       ├── layouts/       # Public and authenticated shells
│       ├── pages/         # Route screens (public/ + app/)
│       └── types/         # Shared TypeScript types
├── server/
│   └── app/
│       ├── api/v1/        # FastAPI routers
│       ├── models/        # SQLAlchemy models
│       ├── schemas/       # Pydantic request/response types
│       └── core/          # Config, database session
├── docker-compose.yml     # Local MySQL
└── Makefile               # Common dev commands
```

## Prerequisites

- **Node.js** + **pnpm**
- **Python 3.11+**
- **Docker** (for local MySQL) — or a remote MySQL connection string

## Quick Start

### 1. Database (local)

```bash
make dev-db
```

Starts MySQL 8.4 on port `3306` with:

| Setting | Value |
|---|---|
| Database | `fintrack` |
| User | `fintrack_user` |
| Password | `fintrack_pass` |

Connection string for `server/.env`:

```
DATABASE_URL=mysql://fintrack_user:fintrack_pass@localhost:3306/fintrack
```

### 2. Install dependencies

```bash
make install
```

### 3. Backend

```bash
cd server
cp .env.example .env   # set DATABASE_URL and Clerk JWKS URL
```

For local Docker MySQL, use the connection string above. For production, use your hosted URL (e.g. Railway gives `mysql://...` — the app rewrites it to `mysql+pymysql://...` automatically).

```bash
make dev-api
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

On startup the API verifies the DB connection and creates tables if they don't exist (development convenience — use proper migrations before production).

### 4. Frontend

```bash
cd client
cp .env.example .env   # add VITE_CLERK_PUBLISHABLE_KEY
make dev-web
```

- App: http://localhost:5173

Required env vars are documented in `client/.env.example`.

## Development Workflow

```bash
# Terminal 1 — database (once)
make dev-db

# Terminal 2 — API
make dev-api

# Terminal 3 — frontend
make dev-web
```

## Makefile Commands

| Command | Description |
|---|---|
| `make install` | Create Python venv, install server + client deps |
| `make dev-db` | Start local MySQL via Docker |
| `make dev-api` | Run FastAPI with hot reload on port 8000 |
| `make dev-web` | Run Vite dev server on port 5173 |
| `make db-down` | Stop Docker containers |
| `make db-logs` | Tail MySQL container logs |

## Common Commands

| Task | Command |
|---|---|
| Backend dev | `make dev-api` |
| Frontend dev | `make dev-web` |
| Frontend build | `cd client && pnpm build` |
| Frontend lint | `cd client && pnpm lint` |
| Local database | `make dev-db` |

# FinTrack

Envelope budgeting app — allocate income to categories, log transactions, and stay on top of recurring bills.

## Features

- **Dashboard** — month-at-a-glance income, spending, and envelope health
- **Budgets & categories** — monthly envelopes with planned vs actual tracking
- **Transactions** — income, expenses, and transfers
- **Recurring bills** — automated repeating payments
- **Goals** — savings targets with progress tracking
- **Shared expenses** — split bills with friends and track who owes what
- **Cards** — mock credit cards for practice spending
- **Assistant** — in-app finance helper (powered by Gemini, server-side)
- **Onboarding** — guided first-budget setup for new users

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Redux Toolkit |
| Auth | Clerk |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | MySQL 8.4 |

```
Browser (React)  →  Clerk  →  FastAPI /api  →  MySQL
```

## Prerequisites

- Node.js + **pnpm**
- Python **3.11+**
- Docker (local MySQL) — or a remote MySQL URL
- [Clerk](https://clerk.com) app (publishable key + JWKS URL)

## Setup

### 1. Install dependencies

```bash
make install
```

Creates `server/.venv` and installs Python + Node packages.

### 2. Configure environment

**Backend** — copy and fill in Clerk + database values:

```bash
cp server/.env.example server/.env
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | See step 3 for local Docker URL |
| `CLERK_JWKS_URL` | Yes | Clerk Dashboard → API Keys → JWKS URL |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (`sk_test_…`) |
| `CLERK_ISSUER` | No | Expected JWT issuer |
| `GEMINI_API_KEY` | No | Enables the in-app assistant |
| `APP_BASE_URL` | No | Defaults to `http://localhost:5173` |

**Frontend** — copy and add your Clerk publishable key:

```bash
cp client/.env.example client/.env
```

| Variable | Required | Notes |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (`pk_test_…`) |
| `VITE_API_BASE_URL` | No | Defaults to `http://127.0.0.1:8000` |

### 3. Start the database

```bash
make dev-db
```

Local MySQL runs on port `3306`:

| | |
|---|---|
| Database | `fintrack` |
| User | `fintrack_user` |
| Password | `fintrack_pass` |

Use this in `server/.env`:

```
DATABASE_URL=mysql://fintrack_user:fintrack_pass@localhost:3306/fintrack
```

The API rewrites `mysql://` to `mysql+pymysql://` automatically. Tables are created on first startup (dev convenience).

### 4. Start the API

```bash
make dev-api
```

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs

### 5. Start the frontend

```bash
make dev-web
```

- App: http://localhost:5173

Sign up, complete onboarding, and you're in.

## Daily development

Three terminals:

```bash
make dev-db    # once — or leave running
make dev-api   # terminal 1
make dev-web   # terminal 2
```

## Commands

| Command | Description |
|---|---|
| `make install` | Install server + client dependencies |
| `make dev-db` | Start local MySQL (Docker) |
| `make dev-api` | FastAPI with hot reload on :8000 |
| `make dev-web` | Vite dev server on :5173 |
| `make db-down` | Stop Docker containers |
| `make db-logs` | Tail MySQL logs |
| `cd client && pnpm build` | Production frontend build |
| `cd client && pnpm lint` | ESLint |

## Project structure

```
personal_finance/
├── client/src/
│   ├── api/           # Axios client + endpoint modules
│   ├── app/           # Router, Redux store
│   ├── components/    # UI + feature components
│   ├── layouts/       # Public and app shells
│   ├── pages/         # Route screens
│   └── types/         # Shared TypeScript types
├── server/app/
│   ├── api/v1/routers/  # HTTP routes
│   ├── services/        # Business logic
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic types
│   └── core/            # Config, DB, auth, exceptions
├── docker-compose.yml
└── Makefile
```

# FinTrack

A personal finance app for envelope budgeting — plan monthly budgets, track spending, manage recurring bills, and forecast cashflow.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Auth** | Clerk |
| **State** | TanStack Query, Redux Toolkit |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, Alembic |
| **Database** | MySQL (Railway) |

## Project Structure

```
personal_finance/
├── client/          # React + TypeScript frontend
└── server/          # FastAPI + Python backend
```

## Prerequisites

- **Node.js** + **pnpm**
- **Python 3.11+**
- A [Railway](https://railway.app) MySQL database (connection string in `server/.env`)

## Setup

### 1. Backend

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # add Railway DB URL and Clerk secret
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

### 2. Frontend

```bash
cd client
pnpm install
pnpm dev
```

- App: http://localhost:5173
- Proxies API calls to `http://localhost:8000`

## Development Workflow

```bash
# Terminal 1 — backend
cd server && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd client && pnpm dev
```

## Common Commands

| Task | Command |
|---|---|
| Run migrations | `cd server && alembic upgrade head` |
| Backend dev | `uvicorn app.main:app --reload --port 8000` |
| Frontend dev | `cd client && pnpm dev` |
| Frontend build | `cd client && pnpm build` |

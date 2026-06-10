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

## Database schema

The ER diagram below matches the SQLAlchemy models in `server/app/models/`.  
`users` is the root entity (linked to Clerk via `clerk_user_id`). Everything else hangs off a user or one of their budgets.

```mermaid
erDiagram
    users ||--o{ budgets : owns
    users ||--o{ categories : owns
    users ||--o{ goals : owns
    users ||--o{ credit_cards : owns
    users ||--o{ recurring_rules : owns
    users ||--o{ audit_logs : writes
    users ||--o{ expense_shares : creates
    users ||--o{ expense_share_participants : "linked as friend"

    budgets ||--o{ transactions : contains
    budgets ||--o{ income_sources : plans
    budgets ||--o{ fund_transfers : records
    budgets ||--o{ budget_category_plans : envelopes

    categories ||--o{ budget_category_plans : "planned in"
    categories ||--o{ transactions : "optional tag"
    categories ||--o{ transaction_splits : "split line"
    categories ||--o{ recurring_rules : "optional tag"
    categories ||--o{ fund_transfers : "from envelope"
    categories ||--o{ fund_transfers : "to envelope"

    transactions ||--o{ transaction_splits : splits
    transactions ||--o| expense_shares : "friend split"

    expense_shares ||--o{ expense_share_participants : includes

    goals ||--o{ goal_contributions : funded_by

    credit_cards ||--o{ card_transactions : charges

    users {
        int id PK
        string clerk_user_id UK
        string email
        string default_currency
    }

    budgets {
        int id PK
        int user_id FK
        string name
        date period_start
        date period_end
    }

    categories {
        int id PK
        int user_id FK
        string name
        enum type
    }

    budget_category_plans {
        int id PK
        int budget_id FK
        int category_id FK
        decimal planned_amount
        enum rollover_type
    }

    transactions {
        int id PK
        int budget_id FK
        int category_id FK
        decimal amount
        enum type
    }

    transaction_splits {
        int id PK
        int transaction_id FK
        int category_id FK
        decimal amount
    }

    expense_shares {
        int id PK
        int transaction_id FK
        int created_by_user_id FK
    }

    expense_share_participants {
        int id PK
        int expense_share_id FK
        int linked_user_id FK
        string email
        decimal amount_owed
        enum status
    }

    income_sources {
        int id PK
        int budget_id FK
        string name
        decimal amount
    }

    fund_transfers {
        int id PK
        int budget_id FK
        int from_category_id FK
        int to_category_id FK
        decimal amount
    }

    goals {
        int id PK
        int user_id FK
        string name
        decimal target_amount
    }

    goal_contributions {
        int id PK
        int goal_id FK
        decimal amount
    }

    credit_cards {
        int id PK
        int user_id FK
        string label
        decimal credit_limit
    }

    card_transactions {
        int id PK
        int card_id FK
        string description
        decimal amount
    }

    recurring_rules {
        int id PK
        int user_id FK
        int category_id FK
        enum frequency
        date next_due
    }

    audit_logs {
        int id PK
        int user_id FK
        string entity_type
        int entity_id
    }
```

### Relationship notes

| Pattern | Tables | Meaning |
|---|---|---|
| User-owned | `budgets`, `categories`, `goals`, `credit_cards`, `recurring_rules` | `user_id` → `users.id` (CASCADE delete) |
| Budget period | `transactions`, `income_sources`, `fund_transfers` | Scoped to one monthly budget |
| Envelope planning | `budget_category_plans` | Many-to-many join: one category can appear in many budgets |
| Category splits | `transaction_splits` | One transaction split across multiple categories |
| Friend splits | `expense_shares` → `expense_share_participants` | One expense transaction, many friends who owe |
| Mock cards | `card_transactions` | Separate from budget `transactions`; `category` is a plain string, not a FK |

> Full column definitions live in `server/app/models/`. Tables are auto-created on API startup in dev; use Alembic for production migrations.

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

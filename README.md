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

## Calculation notes

Logic lives in `server/app/services/` (mainly `category_service.py`, `budget_service.py`, `expense_amount.py`, `recurring_service.py`).

**Envelopes**

```
planned (shown in UI) = planned_amount + starting_balance + manual_adjustment
remaining             = planned − spent
```

- **Move funds** updates `manual_adjustment` between categories in the same budget.
- **Spent** = sum of expenses in that category. Friend splits only count the payer’s share: `amount − Σ friends_owed`. Split lines are scaled to that share.

**Budget**

```
plannedTotal = Σ planned_amount (expense envelopes only)
spentTotal   = Σ payer share of expenses
remaining    = plannedTotal − spentTotal
```

**Rollover** — each envelope has `reset` | `rollover` | `capped` (+ optional cap). Types are saved and copied to new budgets; auto carry to `starting_balance` is not implemented yet.

**Recurring** — rules are templates. **Post** creates a transaction and bumps `next_due` by one step (`weekly` +7d, `monthly` +1mo, etc.). Dashboard shows bills due in the next 7 days.

**Other** — Goals: `current / target`. Shared expenses: friends must be on FinTrack. Cards: mock ledger, separate from envelopes.

---

## In-app AI (Gemini)

> This section documents **AI inside the product**, not tools used to write the code.

**What it does** — floating assistant widget: parse bank SMS / receipts / natural language into transactions, or answer questions about your real budget data (“how much left in Groceries?”).

**Enable** — set `GEMINI_API_KEY` in `server/.env` (optional `GEMINI_MODEL`, default `gemini-2.5-flash`). Without it, chat returns `503`.

**Implementation**

```
Browser → POST /api/assistant/chat (Clerk JWT)
       → gemini.py: Gemini agent + tool loop (max 5 rounds)
       → assistant_tools.py: read budgets, categories, transactions from DB
       → JSON: { kind: transaction | answer | clarification }
       → User confirms → normal POST /api/transactions (source: assistant)
```

| Tool | Reads |
|---|---|
| `get_user_profile` | Currency, profile |
| `list_budgets` / `get_budget_for_date` | Budget periods |
| `list_categories` | Envelope planned & spent |
| `search_transactions` | Recent txns |

The model must call tools before quoting numbers. Nothing is saved until the user confirms.

**Try it** — paste a UPI SMS, upload a receipt, or ask a spending question. Test in Swagger: `POST /api/assistant/chat` with Bearer token.

---

## Design tradeoffs

| Choice | Tradeoff |
|---|---|
| Clerk auth | Fast setup; short-lived JWTs for manual API testing adds latency |
| Gemini server-side | Key stays secret; extra latency |
| Manual recurring post | User control; no auto cron |
| Friend splits in-app only | Simple; both users need accounts |
| Rollover types stored | UI ready; month-to-month carry not automated yet |

---

## Hosted demo

**App:** https://fin-track-client-nine.vercel.app — sign up with Clerk.

---

## Notes on AI tool usage and external resources

This project was developed with AI-assisted tools as part of the **implementation workflow** — not as a substitute for product thinking or domain design.

**AI tools used (development)**

- **Cursor** — AI-assisted editing, code completion, boilerplate, and refactoring suggestions while building the app.

**Human-led design** — Requirements, schema, API design, architecture, and business logic (budgeting, splits, recurring) were done without generative AI. Ideas and UX came from self-directed brainstorming, informal user interviews, and a literature survey of budgeting apps and envelope-method practices.

All AI-generated suggestions were reviewed, adapted, tested locally, and committed through a normal git history. The **in-app Gemini assistant** is a deliberate product feature (documented above) — separate from the Cursor tooling used to build the codebase.

---

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

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys:

| File | Required |
|---|---|
| `server/.env` | `DATABASE_URL`, `CLERK_JWKS_URL`, `CLERK_SECRET_KEY` |
| `client/.env` | `VITE_CLERK_PUBLISHABLE_KEY` |

Optional: `GEMINI_API_KEY` (assistant), `CLERK_ISSUER`, `VITE_API_BASE_URL`. Defaults work for local dev — see `.env.example` files.

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

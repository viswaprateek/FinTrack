# FinTrack — Backend

FastAPI application for the FinTrack personal finance API.

## Layered structure

```
app/
├── api/                 # HTTP layer (routers + auth dependencies)
│   ├── deps.py          # FastAPI dependencies (e.g. get_current_user)
│   └── v1/routers/      # Route handlers — thin controllers only
├── services/            # Business logic and orchestration
├── models/              # SQLAlchemy database models
├── schemas/             # Pydantic request/response types
└── core/                # Config, database, shared utils, exceptions
```

### Request flow

```
HTTP request
  → router (api/v1/routers/)     parse input, call service, return schema
  → service (services/)          business rules, DB queries, validation
  → model (models/)              database tables
```

Routers are the **controllers** in this project. In FastAPI that role lives under `api/`, not a separate `controllers/` folder.

### Where to put new code

| Concern | Location |
|---|---|
| New endpoint URL / HTTP status | `api/v1/routers/` |
| Business rules, calculations, DB work | `services/` |
| Request/response JSON shape | `schemas/` |
| Database table definition | `models/` |
| App config, DB session, shared helpers | `core/` |

## Run locally

See the [root README](../README.md). Quick start:

```bash
make dev-api
```

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, check_database_connection, engine
from app.core.exceptions import AppError

# Ensure every model is registered on Base's metadata before create_all runs.
import app.models  # noqa: F401


def _apply_schema_patches() -> None:
    """Lightweight dev migrations until Alembic is in place."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "default_currency" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN default_currency VARCHAR(3) "
                    "NOT NULL DEFAULT 'USD'"
                )
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Development convenience — use Alembic migrations in production instead.
    Base.metadata.create_all(bind=engine)
    _apply_schema_patches()
    check_database_connection()
    print("Database tables verified and connection OK")
    yield


app = FastAPI(
    title="FinTrack API",
    description="Personal finance tracking API with Clerk authentication",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/")
def root():
    return {"message": "FinTrack API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# To run: uvicorn app.main:app --reload
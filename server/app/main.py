from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, check_database_connection, engine

# Ensure every model is registered on Base's metadata before create_all runs.
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Development convenience — use Alembic migrations in production instead.
    Base.metadata.create_all(bind=engine)
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


@app.get("/")
def root():
    return {"message": "FinTrack API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# To run: uvicorn app.main:app --reload
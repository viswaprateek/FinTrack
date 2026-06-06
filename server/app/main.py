from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import check_database_connection

app = FastAPI(title="FinTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/db-health")
def db_health_check():
    check_database_connection()
    return {"database": "connected"}
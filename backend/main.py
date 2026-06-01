import sys
import os
from pathlib import Path

# Add the project root to sys.path
root_path = str(Path(__file__).parent.parent)
if root_path not in sys.path:
    sys.path.append(root_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from backend.routers import recruiter, applicant
from backend.database import engine, Base

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Path: {request.url.path} | Time: {process_time:.4f}s")
    return response

app.include_router(recruiter.router)
app.include_router(applicant.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        # Note: pgvector indexes (HNSW, IVFFLAT) have max 2000 dimension limit
        # Using 3072-dim vectors, so we skip indexes and rely on sequential scan
        # This works fine for MVP. In production, reduce embedding dimension to 1536

@app.get("/")
async def root():
    return {"message": "AI Resume Analyzer API is running"}

import os
import time
import logging
from sqlalchemy.ext.asyncio import (
    AsyncSession, create_async_engine, async_sessionmaker
)
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base
from contextlib import asynccontextmanager
from app.config import _build_db_url

# Use asyncpg for PostgreSQL
SYNC_DB_URL = _build_db_url()
if SYNC_DB_URL.startswith("postgresql+"):
    ASYNC_DB_URL = SYNC_DB_URL.replace("postgresql+psycopg2", "postgresql+asyncpg")
else:
    ASYNC_DB_URL = SYNC_DB_URL

# Engine is created once
engine = create_async_engine(
    ASYNC_DB_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

Base = declarative_base()

@asynccontextmanager
async def get_db():
    """Dependency for FastAPI routes: yields a new session per request."""
    async with SessionLocal() as session:
        start = time.time()
        try:
            yield session
        finally:
            elapsed = (time.time() - start) * 1000
            if elapsed > 500:
                logging.warning(f"Slow DB session: {elapsed:.1f}ms")

async def check_db_connection():
    """Fail app startup if DB is unreachable."""
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
    except OperationalError as e:
        raise RuntimeError(f"Database connection failed: {e}")

async def shutdown():
    await engine.dispose()

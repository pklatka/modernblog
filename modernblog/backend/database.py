"""Database configuration for ModernBlog."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


def get_database_url() -> str:
    """Get the database URL from environment or config."""
    data_dir = os.environ.get("MODERNBLOG_DATA_DIR", "")
    if data_dir:
        db_path = Path(data_dir) / "blog.db"
    else:
        # Use config's data_dir, fallback to ~/.modernblog/data
        from .config import get_data_dir

        data_path = get_data_dir()
        data_path.mkdir(parents=True, exist_ok=True)
        db_path = data_path / "blog.db"

    return f"sqlite:///{db_path}"


# Create engine lazily
_engine = None
_SessionLocal = None


def get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            get_database_url(), connect_args={"check_same_thread": False}
        )
    return _engine


def get_session_local():
    """Get or create the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=get_engine()
        )
    return _SessionLocal


Base = declarative_base()


def get_db():
    """Dependency for getting database sessions."""
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Initialize the database tables."""
    Base.metadata.create_all(bind=get_engine())

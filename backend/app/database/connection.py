"""
Database connection module — AWS RDS PostgreSQL.

Sử dụng SQLAlchemy 2.0 engine với:
- NullPool / QueuePool phù hợp cho môi trường serverless / long-running server.
- pool_pre_ping để tự động reconnect khi RDS restart hoặc timeout.
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator

from config import settings

# ---------------------------------------------------------------------------
# Engine — kết nối database (PostgreSQL / SQLite cho dev)
# ---------------------------------------------------------------------------
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {
    "echo": settings.DEBUG,
}

if _is_sqlite:
    # SQLite không hỗ trợ pool phức tạp hay connect_args của psycopg2
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "connect_args": {"connect_timeout": 10},
    })

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Tránh lazy-load lỗi sau khi commit
)


# ---------------------------------------------------------------------------
# Dependency — dùng trong FastAPI Depends()
# ---------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency trả về một DB session.
    Session được đóng tự động sau mỗi request dù có exception hay không.

    Usage:
        @router.get("/")
        def list_campaigns(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Utility — kiểm tra kết nối database (dùng khi startup)
# ---------------------------------------------------------------------------
def check_db_connection() -> bool:
    """Ping database để verify kết nối AWS RDS thành công."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[DB] Connection failed: {e}")
        return False

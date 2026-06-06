"""
Alembic environment configuration.

Tích hợp với pydantic settings để đọc DATABASE_URL từ .env,
hỗ trợ cả online (kết nối trực tiếp) và offline mode.
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Thêm backend/ vào sys.path để import config và models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from app.database.models import Base  # Import tất cả models để Alembic detect

# Alembic Config object
config = context.config

# Ghi đè sqlalchemy.url bằng DATABASE_URL từ pydantic settings
config.set_main_option("sqlalchemy.url", settings.DIRECT_URL or settings.DATABASE_URL)

# Setup logging từ alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData của tất cả models — Alembic dùng để so sánh schema
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Chạy migrations trong 'offline' mode.
    Chỉ sinh SQL script, không cần kết nối thực tế.
    Dùng để review trước khi apply lên AWS RDS production.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,          # Detect thay đổi kiểu dữ liệu
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Chạy migrations trong 'online' mode.
    Kết nối thực tế tới AWS RDS PostgreSQL và apply thay đổi.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # NullPool phù hợp cho migration scripts
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

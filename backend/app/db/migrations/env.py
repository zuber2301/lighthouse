from __future__ import with_statement

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import create_async_engine

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
try:
    if config.config_file_name:
        fileConfig(config.config_file_name)
except Exception:
    # skip logging configuration if the ini is missing sections expected by fileConfig
    pass

# add your model's MetaData object here
# for 'autogenerate' support
import sys
sys.path.insert(0, os.path.abspath(os.path.join(config.config_file_name or '.', '../../')))

from app.db.base import Base  # noqa: E402
# Do NOT import application models here. Importing `app.models` will
# initialize SQLAlchemy `Enum` objects from the model definitions which
# can cause DDL (CREATE TYPE) to be executed during the migration run.
# We avoid importing models to keep migrations deterministic and rely
# on the explicit migration scripts in `versions/` instead.
target_metadata = None

# If alembic.ini does not provide a SQLAlchemy URL, fall back to the
# environment-provided `DATABASE_URL` (set by docker-compose). This makes
# running `alembic` inside the container work without editing alembic.ini.
if not config.get_main_option("sqlalchemy.url"):
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        config.set_main_option("sqlalchemy.url", env_url)


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    url = config.get_main_option("sqlalchemy.url")

    # If the URL is an async driver (e.g., postgresql+asyncpg), create an
    # async engine and run migrations in an async context. Otherwise fall
    # back to a regular sync engine.
    if url and url.startswith("postgresql+asyncpg"):
        async_engine = create_async_engine(url)

        async def run_async_migrations():
            async with async_engine.connect() as connection:
                await connection.run_sync(
                    lambda conn: context.configure(connection=conn, target_metadata=target_metadata)
                )
                async with async_engine.begin() as conn:
                    await conn.run_sync(lambda conn: context.run_migrations())

        import asyncio

        asyncio.run(run_async_migrations())
    else:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

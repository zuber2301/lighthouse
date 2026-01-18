#!/usr/bin/env python3
"""Run Alembic migrations programmatically using project settings.

Usage:
  python run_migrations.py upgrade [revision]
  python run_migrations.py downgrade [revision]

Defaults:
  upgrade -> head
  downgrade -> -1
"""
import os
import sys
from alembic.config import Config
from alembic import command
import sqlalchemy
from urllib.parse import urlparse


BASE_DIR = os.path.dirname(__file__)
ALEMBIC_INI = os.path.join(BASE_DIR, "alembic.ini")


def get_config():
    cfg = Config(ALEMBIC_INI)
    # Prefer explicit environment variable; fallback to a local sqlite file
    db_url = os.environ.get("DATABASE_URL") or "sqlite:///./test.db"
    cfg.set_main_option("sqlalchemy.url", db_url)
    # Ensure alembic knows where the migration scripts live (absolute path)
    cfg.set_main_option("script_location", os.path.join(BASE_DIR, "migrations"))
    # Attempt to stamp the alembic_version table if it's missing or empty.
    # This helps when the DB schema was created outside alembic (dev/test scenarios).
    try:
        parsed = urlparse(db_url)
        # Only attempt automatic stamping for sqlite for now (safe heuristic)
        if parsed.scheme.startswith('sqlite'):
            engine = sqlalchemy.create_engine(db_url)
            with engine.connect() as conn:
                # Check if alembic_version table exists
                res = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';")
                if res.fetchone() is None:
                    # create alembic_version table and try to infer current revision
                    conn.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL);")
                    # Infer a safe base revision by examining known tables
                    tbls = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
                    # Heuristic mapping
                    if 'transactions' in tbls:
                        inferred = '0004'
                    elif 'budget_pools' in tbls:
                        inferred = '0002'
                    else:
                        inferred = '0001'
                    conn.execute("INSERT INTO alembic_version(version_num) VALUES(:v)", {'v': inferred})
    except Exception:
        # Fallback: do not block migrations if automatic stamping fails
        pass
    return cfg


def upgrade(revision: str = "head"):
    cfg = get_config()
    command.upgrade(cfg, revision)


def downgrade(revision: str = "-1"):
    cfg = get_config()
    command.downgrade(cfg, revision)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    rev = sys.argv[2] if len(sys.argv) > 2 else ("head" if cmd == "upgrade" else "-1")
    if cmd == "upgrade":
        upgrade(rev)
    elif cmd == "downgrade":
        downgrade(rev)
    else:
        print("Unknown command. Use 'upgrade' or 'downgrade'.")
        sys.exit(2)

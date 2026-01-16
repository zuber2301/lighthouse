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


BASE_DIR = os.path.dirname(__file__)
ALEMBIC_INI = os.path.join(BASE_DIR, "alembic.ini")


def get_config():
    cfg = Config(ALEMBIC_INI)
    # Prefer explicit environment variable; fallback to a local sqlite file
    db_url = os.environ.get("DATABASE_URL") or "sqlite:///./test.db"
    cfg.set_main_option("sqlalchemy.url", db_url)
    # Ensure alembic knows where the migration scripts live (absolute path)
    cfg.set_main_option("script_location", os.path.join(BASE_DIR, "migrations"))
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

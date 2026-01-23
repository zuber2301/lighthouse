import os
from alembic.config import Config
from alembic import command

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ALEMBIC_INI = os.path.join(BASE_DIR, "alembic.ini")

def stamp_db(revision):
    cfg = Config(ALEMBIC_INI)
    db_url = os.environ.get("DATABASE_URL")
    if db_url and db_url.startswith("postgresql+asyncpg"):
        db_url = db_url.replace("postgresql+asyncpg", "postgresql")
    
    cfg.set_main_option("sqlalchemy.url", db_url)
    cfg.set_main_option("script_location", os.path.join(BASE_DIR, "migrations"))
    
    print(f"Stamping database with revision {revision}...")
    command.stamp(cfg, revision)
    print("Done.")

if __name__ == "__main__":
    import sys
    rev = sys.argv[1] if len(sys.argv) > 1 else "0008"
    stamp_db(rev)

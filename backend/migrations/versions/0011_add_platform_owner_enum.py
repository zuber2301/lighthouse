"""Add PLATFORM_OWNER value to userrole enum (Postgres only)

Revision ID: 0011
Revises: 0010
Create Date: 2026-01-21 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0011'
down_revision = '0010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Only run on PostgreSQL where enum types exist
    if conn.dialect.name == 'postgresql':
        try:
            # add value if not present; simple ALTER TYPE is safe when value missing
            op.execute("ALTER TYPE userrole ADD VALUE 'PLATFORM_OWNER';")
        except Exception:
            # If value already exists or DB doesn't allow, ignore
            pass


def downgrade() -> None:
    # Removing a value from an enum is non-trivial in Postgres and may require
    # recreating the type. Keep downgrade as a no-op to avoid accidental data loss.
    return

"""Seed AWS and GCP providers

Revision ID: 0006
Revises: 0005
Create Date: 2026-01-18 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("INSERT OR IGNORE INTO global_providers (id, name, enabled, min_plan, margin_paise, created_at, updated_at) VALUES (:id, :name, :enabled, :min_plan, :margin_paise, datetime('now'), datetime('now'))"),
        [
            {'id': 'prov-aws', 'name': 'AWS', 'enabled': True, 'min_plan': None, 'margin_paise': 2500},
            {'id': 'prov-gcp', 'name': 'GCP', 'enabled': True, 'min_plan': None, 'margin_paise': 2200},
        ]
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM global_providers WHERE id IN (:a, :b)"), {'a': 'prov-aws', 'b': 'prov-gcp'})

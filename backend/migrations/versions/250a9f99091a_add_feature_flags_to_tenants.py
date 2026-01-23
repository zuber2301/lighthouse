"""add_feature_flags_to_tenants

Revision ID: 250a9f99091a
Revises: 0014
Create Date: 2026-01-23 17:33:48.596779

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '250a9f99091a'
down_revision = '0014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = []
    if 'tenants' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('tenants')]
    if 'feature_flags' not in cols:
        op.add_column('tenants', sa.Column('feature_flags', sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'tenants' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('tenants')]
        if 'feature_flags' in cols:
            op.drop_column('tenants', 'feature_flags')

"""add tenant_budgets table

Revision ID: 0014
Revises: 0013_add_area_of_focus_media_url
Create Date: 2026-01-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0014'
down_revision = '0013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'tenant_budgets' not in inspector.get_table_names():
        op.create_table(
            'tenant_budgets',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('tenant_id', sa.String(36), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('total_loaded_paise', sa.BigInteger(), nullable=False, server_default='0'),
            sa.Column('total_consumed_paise', sa.BigInteger(), nullable=False, server_default='0'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'tenant_budgets' in inspector.get_table_names():
        op.drop_table('tenant_budgets')

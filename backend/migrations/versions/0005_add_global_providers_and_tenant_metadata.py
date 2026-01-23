"""Add global_providers table and tenant metadata and redemption monetary fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-01-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create global_providers table
    op.create_table('global_providers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('min_plan', sa.String(50), nullable=True),
        sa.Column('margin_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Add tenant metadata columns
    op.add_column('tenants', sa.Column('industry', sa.String(100), nullable=True))
    op.add_column('tenants', sa.Column('credit_limit', sa.BigInteger(), nullable=True, server_default='0'))
    op.add_column('tenants', sa.Column('last_billing_date', sa.Date(), nullable=True))

    # Add redemption monetary fields
    op.add_column('redemptions', sa.Column('gross_value_paise', sa.BigInteger(), nullable=True))
    op.add_column('redemptions', sa.Column('margin_paise', sa.BigInteger(), nullable=True))
    op.add_column('redemptions', sa.Column('vendor_cost_paise', sa.BigInteger(), nullable=True))
    op.add_column('redemptions', sa.Column('provider_name', sa.String(100), nullable=True))

    # Seed some common providers
    conn = op.get_bind()
    conn.execute(
        sa.text("INSERT INTO global_providers (id, name, enabled, min_plan, margin_paise, created_at, updated_at) VALUES (:id, :name, :enabled, :min_plan, :margin_paise, datetime('now'), datetime('now'))"),
        [
            {'id': 'prov-amazon', 'name': 'Amazon', 'enabled': True, 'min_plan': None, 'margin_paise': 2000},
            {'id': 'prov-swiggy', 'name': 'Swiggy', 'enabled': True, 'min_plan': 'pro', 'margin_paise': 500},
            {'id': 'prov-starbucks', 'name': 'Starbucks', 'enabled': True, 'min_plan': None, 'margin_paise': 1000},
        ]
    )


def downgrade() -> None:
    # Remove seeded providers
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM global_providers WHERE id IN (:a, :b, :c)"), {'a': 'prov-amazon', 'b': 'prov-swiggy', 'c': 'prov-starbucks'})

    # Drop added columns
    op.drop_column('redemptions', 'provider_name')
    op.drop_column('redemptions', 'vendor_cost_paise')
    op.drop_column('redemptions', 'margin_paise')
    op.drop_column('redemptions', 'gross_value_paise')

    op.drop_column('tenants', 'last_billing_date')
    op.drop_column('tenants', 'credit_limit')
    op.drop_column('tenants', 'industry')

    # Drop global_providers table
    op.drop_table('global_providers')

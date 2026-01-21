"""Add budget_load_logs table and convert tenants.master_budget_balance to DECIMAL(15,2)

Revision ID: 0010
Revises: 0009
Create Date: 2026-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '0010'
down_revision = '0009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Add a temporary decimal column and migrate integer paise -> decimal currency (divide by 100)
    conn = op.get_bind()
    try:
        op.add_column('tenants', sa.Column('master_budget_balance_new', sa.Numeric(15, 2), nullable=False, server_default='0.00'))
        # Attempt a SQL update that works for both Postgres and SQLite
        conn.execute(sa.text('UPDATE tenants SET master_budget_balance_new = (master_budget_balance / 100.0)'))
    except Exception:
        # Column may already exist from a previous partial run; ignore
        pass

    # Drop old integer column and rename the new one to master_budget_balance
    try:
        op.drop_column('tenants', 'master_budget_balance')
    except Exception:
        # If the column does not exist, ignore
        pass
    op.alter_column('tenants', 'master_budget_balance_new', new_column_name='master_budget_balance', existing_type=sa.Numeric(15,2))

    # 2) Create budget_load_logs table for auditing budget loads
    op.create_table(
        'budget_load_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('platform_owner_id', sa.String(36), nullable=True),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('amount', sa.Numeric(15,2), nullable=False),
        sa.Column('transaction_type', sa.String(50), nullable=False, server_default='DEPOSIT'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
        sa.ForeignKeyConstraint(['platform_owner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop budget_load_logs table
    op.drop_table('budget_load_logs')

    # Convert master_budget_balance back to integer paise by multiplying by 100
    op.add_column('tenants', sa.Column('master_budget_balance_old', sa.BigInteger(), nullable=False, server_default='0'))
    conn = op.get_bind()
    # Multiply decimal by 100 and round to nearest integer
    conn.execute(sa.text('UPDATE tenants SET master_budget_balance_old = CAST(ROUND(master_budget_balance * 100) AS INTEGER)'))

    # Drop decimal column and rename old back
    try:
        op.drop_column('tenants', 'master_budget_balance')
    except Exception:
        pass
    op.alter_column('tenants', 'master_budget_balance_old', new_column_name='master_budget_balance', existing_type=sa.BigInteger())
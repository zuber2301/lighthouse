"""Add Lighthouse points system schema: transactions, budget fields

Revision ID: 0004
Revises: 0003
Create Date: 2026-01-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # points_balance and lead_budget_balance already exist in users
    # master_budget_balance already exists in tenants

    # Create transactions table
    op.create_table('transactions',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('tenant_id', sa.String(36), nullable=True),
    sa.Column('sender_id', sa.String(36), nullable=True),
    sa.Column('receiver_id', sa.String(36), nullable=True),
    sa.Column('amount', sa.BigInteger(), nullable=False),
    sa.Column('type', sa.String(20), nullable=False),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
    sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop transactions table
    op.drop_table('transactions')

    # Remove added columns from users
    op.drop_column('users', 'lead_budget_balance')
    op.drop_column('users', 'points_balance')

    # Remove master_budget_balance from tenants
    op.drop_column('tenants', 'master_budget_balance')
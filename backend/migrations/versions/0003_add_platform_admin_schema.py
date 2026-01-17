"""Add platform admin schema: subscriptions, global rewards, audit logs

Revision ID: 0003
Revises: 0002
Create Date: 2026-01-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update tenants table
    op.add_column('tenants', sa.Column('subdomain', sa.String(length=100), nullable=False))
    op.add_column('tenants', sa.Column('logo_url', sa.String(), nullable=True))
    op.alter_column('tenants', 'status', existing_type=sa.String(length=32), type_=sa.String(length=20), existing_nullable=False)
    op.create_unique_constraint(None, 'tenants', ['subdomain'])
    op.drop_column('tenants', 'branding_config')
    op.drop_column('tenants', 'feature_flags')

    # Create subscription_plans table
    op.create_table('subscription_plans',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('monthly_price_in_paise', sa.BigInteger(), nullable=True),
    sa.Column('features', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    # Create tenant_subscriptions table
    op.create_table('tenant_subscriptions',
    sa.Column('tenant_id', sa.String(36), nullable=False),
    sa.Column('plan_id', sa.Integer(), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('expiry_date', sa.Date(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('tenant_id', 'plan_id')
    )

    # Create global_rewards table
    op.create_table('global_rewards',
    sa.Column('id', sa.String(36), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('provider', sa.String(length=100), nullable=True),
    sa.Column('points_cost', sa.Integer(), nullable=False),
    sa.Column('is_enabled', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    # Create platform_audit_logs table
    op.create_table('platform_audit_logs',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('admin_id', sa.String(36), nullable=True),
    sa.Column('action', sa.String(length=100), nullable=False),
    sa.Column('target_tenant_id', sa.String(36), nullable=True),
    sa.Column('details', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('platform_audit_logs')
    op.drop_table('global_rewards')
    op.drop_table('tenant_subscriptions')
    op.drop_table('subscription_plans')
    op.add_column('tenants', sa.Column('feature_flags', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column('tenants', sa.Column('branding_config', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'tenants', type_='unique')
    op.alter_column('tenants', 'status', existing_type=sa.String(length=20), type_=sa.String(length=32), existing_nullable=False)
    op.drop_column('tenants', 'logo_url')
    op.drop_column('tenants', 'subdomain')
"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-01-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # create enum types if they do not already exist
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
            CREATE TYPE userrole AS ENUM ('SUPER_ADMIN','TENANT_ADMIN','MANAGER','EMPLOYEE');
        END IF;
    END
    $$;
    """)

    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recognitionstatus') THEN
            CREATE TYPE recognitionstatus AS ENUM ('PENDING','APPROVED','REJECTED');
        END IF;
    END
    $$;
    """)

    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemptionstatus') THEN
            CREATE TYPE redemptionstatus AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');
        END IF;
    END
    $$;
    """)

    # Use Enum objects without triggering type creation during table
    # creation because the SQL types were created above via DO blocks.
    userrole = sa.Enum('SUPER_ADMIN','TENANT_ADMIN','MANAGER','EMPLOYEE', name='userrole', create_type=False)
    recognitionstatus = sa.Enum('PENDING','APPROVED','REJECTED', name='recognitionstatus', create_type=False)
    redemptionstatus = sa.Enum('PENDING','PROCESSING','COMPLETED','FAILED', name='redemptionstatus', create_type=False)

    # tenants
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('branding_config', postgresql.JSONB(), nullable=True),
        sa.Column('feature_flags', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='ACTIVE'),
        sa.Column('suspended', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('suspended_reason', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )

    # users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('external_id', sa.String(length=255), nullable=True),
        sa.Column('sso_provider', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('idx_users_tenant_email', 'users', ['tenant_id', 'email'], unique=True)

    # rewards
    op.create_table(
        'rewards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('cost_points', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=100), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )

    # recognitions
    op.create_table(
        'recognitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('nominator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('nominee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('value_tag', sa.String(length=100), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('idx_recognition_nominee', 'recognitions', ['tenant_id', 'nominee_id'])

    # points_ledger
    op.create_table(
        'points_ledger',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('delta', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('idx_ledger_user', 'points_ledger', ['tenant_id', 'user_id'])

    # redemptions
    op.create_table(
        'redemptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reward_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('rewards.id'), nullable=False),
        sa.Column('points_used', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )

    # budgets
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period', sa.String(length=20), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False),
        sa.Column('used_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )

    # platform settings
    op.create_table(
        'platform_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('policies', postgresql.JSONB(), nullable=True),
    )


def downgrade():
    op.drop_table('platform_settings')
    op.drop_table('budgets')
    op.drop_table('redemptions')
    op.drop_table('points_ledger')
    op.drop_table('recognitions')
    op.drop_table('rewards')
    op.drop_index('idx_users_tenant_email', table_name='users')
    op.drop_table('users')
    op.drop_table('tenants')

    # drop enum types
    sa.Enum(name='redemptionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='recognitionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)
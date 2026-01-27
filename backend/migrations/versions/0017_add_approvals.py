"""Add approval_requests table for Phase 4 Governance Loop

Revision ID: 0017_add_approvals
Revises: 0016_add_gifting_support
Create Date: 2024-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0017_add_approvals'
down_revision = '0016_add_gifting_support'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create approval_status ENUM
    approval_status = sa.Enum('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', name='approval_status')
    approval_status.create(op.get_bind())

    # Create approval_requests table
    op.create_table(
        'approval_requests',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('event_option_id', sa.String(36), nullable=False),
        sa.Column('lead_id', sa.String(36), nullable=False),
        sa.Column('impact_hours_per_week', sa.Numeric(5, 2), nullable=False),
        sa.Column('impact_duration_weeks', sa.Integer(), nullable=False),
        sa.Column('total_impact_hours', sa.Numeric(8, 2), nullable=False),
        sa.Column('estimated_cost', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('status', approval_status, nullable=False, server_default='PENDING'),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_by', sa.String(36), nullable=True),
        sa.Column('declined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('declined_by', sa.String(36), nullable=True),
        sa.Column('decline_reason', sa.Text(), nullable=True),
        sa.Column('qr_token', sa.String(255), nullable=True, unique=True),
        sa.Column('qr_code_url', sa.String(500), nullable=True),
        sa.Column('qr_activated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('budget_committed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('committed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notification_sent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('request_notes', sa.Text(), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['event_option_id'], ['event_options.id'], ),
        sa.ForeignKeyConstraint(['lead_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['declined_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indices for common queries
    op.create_index(op.f('ix_approval_requests_tenant_id'), 'approval_requests', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_event_id'), 'approval_requests', ['event_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_user_id'), 'approval_requests', ['user_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_lead_id'), 'approval_requests', ['lead_id'], unique=False)
    op.create_index(op.f('ix_approval_requests_status'), 'approval_requests', ['status'], unique=False)
    op.create_index(op.f('ix_approval_requests_qr_token'), 'approval_requests', ['qr_token'], unique=False)
    
    # Index for efficient "pending requests for lead" queries
    op.create_index('ix_approval_requests_lead_pending', 'approval_requests', 
                   [sa.text('lead_id'), sa.text("status = 'PENDING'")], unique=False)


def downgrade() -> None:
    # Drop indices
    op.drop_index('ix_approval_requests_lead_pending', table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_qr_token'), table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_status'), table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_lead_id'), table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_user_id'), table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_event_id'), table_name='approval_requests')
    op.drop_index(op.f('ix_approval_requests_tenant_id'), table_name='approval_requests')
    
    # Drop table
    op.drop_table('approval_requests')
    
    # Drop ENUM
    approval_status = sa.Enum('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', name='approval_status')
    approval_status.drop(op.get_bind())

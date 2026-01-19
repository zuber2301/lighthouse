"""Add badges and milestones and extend recognitions

Revision ID: 0008
Revises: 0007
Create Date: 2026-01-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    # Create badges table if it doesn't exist
    if 'badges' not in inspector.get_table_names():
        op.create_table(
            'badges',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('tenant_id', sa.String(36), nullable=True),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('icon_url', sa.Text(), nullable=True),
            sa.Column('points_value', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('category', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(now())"), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        )

    # Create milestones table if it doesn't exist
    if 'milestones' not in inspector.get_table_names():
        op.create_table(
            'milestones',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('tenant_id', sa.String(36), nullable=True),
            sa.Column('user_id', sa.String(36), nullable=False),
            sa.Column('type', sa.String(50), nullable=False),
            sa.Column('occurrence_date', sa.Date(), nullable=True),
            sa.Column('points_processed', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(now())"), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        )

    # Alter recognitions table to add badge_id, is_public, points_awarded
    bind = op.get_bind()
    dialect = bind.engine.dialect.name
    inspector = sa.inspect(bind)
    # If the recognitions table doesn't exist in a fresh DB, create it with the full schema
    if 'recognitions' not in inspector.get_table_names():
        op.create_table(
            'recognitions',
            sa.Column('id', sa.String(36), nullable=False),
            sa.Column('tenant_id', sa.String(36), nullable=False),
            sa.Column('nominator_id', sa.String(36), nullable=False),
            sa.Column('nominee_id', sa.String(36), nullable=False),
            sa.Column('badge_id', sa.String(36), nullable=True),
            sa.Column('value_tag', sa.String(100), nullable=True),
            sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('message', sa.Text(), nullable=True),
            sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('status', sa.String(50), nullable=False, server_default='PENDING'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
            sa.ForeignKeyConstraint(['nominator_id'], ['users.id']),
            sa.ForeignKeyConstraint(['nominee_id'], ['users.id']),
            sa.ForeignKeyConstraint(['badge_id'], ['badges.id']),
        )
    else:
        if dialect == 'sqlite':
            # Use batch_alter_table for SQLite to avoid unsupported ALTER operations
            with op.batch_alter_table('recognitions', recreate='always') as batch_op:
                batch_op.add_column(sa.Column('badge_id', sa.String(36), nullable=True))
                batch_op.add_column(sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'))
                batch_op.add_column(sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'))
                batch_op.create_foreign_key('fk_recognitions_badge', 'badges', ['badge_id'], ['id'])
        else:
            op.add_column('recognitions', sa.Column('badge_id', sa.String(36), nullable=True))
            op.add_column('recognitions', sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'))
            op.add_column('recognitions', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'))
            op.create_foreign_key('fk_recognitions_badge', 'recognitions', 'badges', ['badge_id'], ['id'])


def downgrade() -> None:
    # Remove added columns from recognitions
    bind = op.get_bind()
    dialect = bind.engine.dialect.name
    if dialect == 'sqlite':
        with op.batch_alter_table('recognitions', recreate='always') as batch_op:
            # batch_alter_table will recreate table without these columns
            batch_op.drop_constraint('fk_recognitions_badge', type_='foreignkey')
            batch_op.drop_column('is_public')
            batch_op.drop_column('points_awarded')
            batch_op.drop_column('badge_id')
    else:
        op.drop_constraint('fk_recognitions_badge', 'recognitions', type_='foreignkey')
        op.drop_column('recognitions', 'is_public')
        op.drop_column('recognitions', 'points_awarded')
        op.drop_column('recognitions', 'badge_id')

    # Drop milestones and badges
    op.drop_table('milestones')
    op.drop_table('badges')

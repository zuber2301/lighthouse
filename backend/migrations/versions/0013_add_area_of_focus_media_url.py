"""Add area_of_focus and media_url columns to recognitions

Revision ID: 0013
Revises: 0012
Create Date: 2026-01-23 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0013'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
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
            sa.Column('ecard_url', sa.String(255), nullable=True),
            sa.Column('area_of_focus', sa.String(100), nullable=True),
            sa.Column('media_url', sa.String(255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("(datetime('now'))"), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    else:
        cols = [c['name'] for c in inspector.get_columns('recognitions')]
        if 'area_of_focus' not in cols:
            dialect = bind.engine.dialect.name
            if dialect == 'sqlite':
                with op.batch_alter_table('recognitions', recreate='always') as batch_op:
                    batch_op.add_column(sa.Column('area_of_focus', sa.String(100), nullable=True))
            else:
                op.add_column('recognitions', sa.Column('area_of_focus', sa.String(100), nullable=True))
        if 'media_url' not in cols:
            dialect = bind.engine.dialect.name
            if dialect == 'sqlite':
                with op.batch_alter_table('recognitions', recreate='always') as batch_op:
                    batch_op.add_column(sa.Column('media_url', sa.String(255), nullable=True))
            else:
                op.add_column('recognitions', sa.Column('media_url', sa.String(255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'recognitions' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('recognitions')]
        if 'area_of_focus' in cols:
            dialect = bind.engine.dialect.name
            if dialect == 'sqlite':
                with op.batch_alter_table('recognitions', recreate='always') as batch_op:
                    batch_op.drop_column('area_of_focus')
            else:
                op.drop_column('recognitions', 'area_of_focus')
        if 'media_url' in cols:
            dialect = bind.engine.dialect.name
            if dialect == 'sqlite':
                with op.batch_alter_table('recognitions', recreate='always') as batch_op:
                    batch_op.drop_column('media_url')
            else:
                op.drop_column('recognitions', 'media_url')

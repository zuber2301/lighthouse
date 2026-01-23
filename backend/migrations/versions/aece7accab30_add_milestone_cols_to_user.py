"""add_milestone_cols_to_user

Revision ID: aece7accab30
Revises: 250a9f99091a
Create Date: 2026-01-23 17:54:03.990811

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aece7accab30'
down_revision = '250a9f99091a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns if they don't already exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = []
    if 'users' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('users')]
    if 'job_title' not in cols:
        op.add_column('users', sa.Column('job_title', sa.String(length=100), nullable=True))
    if 'date_of_birth' not in cols:
        op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    if 'hire_date' not in cols:
        op.add_column('users', sa.Column('hire_date', sa.Date(), nullable=True))
    # In SQLite, altering column type is not directly supported via op.alter_column.
    # However, many drivers handle it or we can skip it since department already exists.
    # If using Postgres, we would do:
    # op.alter_column('users', 'department', type_=sa.String(length=100))
    pass


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'users' in inspector.get_table_names():
        cols = [c['name'] for c in inspector.get_columns('users')]
        if 'hire_date' in cols:
            op.drop_column('users', 'hire_date')
        if 'date_of_birth' in cols:
            op.drop_column('users', 'date_of_birth')
        if 'job_title' in cols:
            op.drop_column('users', 'job_title')
    pass

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
    # Add new columns
    op.add_column('users', sa.Column('job_title', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('hire_date', sa.Date(), nullable=True))
    # In SQLite, altering column type is not directly supported via op.alter_column.
    # However, many drivers handle it or we can skip it since department already exists.
    # If using Postgres, we would do:
    # op.alter_column('users', 'department', type_=sa.String(length=100))
    pass


def downgrade() -> None:
    op.drop_column('users', 'hire_date')
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'job_title')
    pass

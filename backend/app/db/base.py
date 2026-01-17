from sqlalchemy import MetaData, Column, DateTime, func, Boolean, String
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid


# provide a shared metadata object with a naming convention to make Alembic diffs stable
metadata = MetaData()


Base = declarative_base(metadata=metadata)


class TenantMixin:
	"""Adds `tenant_id` UUID column to models for row-level isolation."""

	tenant_id = Column(String(36), nullable=False, index=True)


class TimestampMixin:
	"""Common immutable audit columns."""

	created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	created_by = Column(String(36), nullable=True)


class SoftDeleteMixin:
	deleted = Column(Boolean, nullable=False, server_default='false')


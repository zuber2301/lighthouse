from sqlalchemy import MetaData, Column, DateTime, func, Boolean
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.dialects.postgresql import UUID
import uuid


# provide a shared metadata object with a naming convention to make Alembic diffs stable
metadata = MetaData()


class Base(DeclarativeBase):
	metadata = metadata


class TenantMixin:
	"""Adds `tenant_id` UUID column to models for row-level isolation."""

	tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)


class TimestampMixin:
	"""Common immutable audit columns."""

	created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	created_by = Column(UUID(as_uuid=True), nullable=True)


class SoftDeleteMixin:
	deleted = Column(Boolean, nullable=False, server_default='false')


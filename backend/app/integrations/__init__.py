"""Integrations package for HRIS and SSO providers.

Each provider module exposes a lightweight async client with at least:
- `async def fetch_users()` -> iterable of external user dicts
- `def map_to_local(external_user)` -> canonical dict for upsert

Design note: keep provider-specific code isolated here. The `jobs/user_sync.py`
module calls these clients and performs upsert logic.
"""

from . import okta, azure_ad, workday

__all__ = ["okta", "azure_ad", "workday"]

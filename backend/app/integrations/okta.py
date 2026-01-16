"""Okta integration placeholder.

This module contains a small async client skeleton and mapping helper. Replace
HTTP call placeholders with a real Okta SDK or `aiohttp` requests.
"""
from typing import Any, AsyncIterator, Dict, List


class OktaClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token

    async def fetch_users(self) -> AsyncIterator[Dict[str, Any]]:
        """Yield user objects from Okta.

        Real implementation should call Okta's API and yield normalized user dicts.
        """
        # Placeholder: yield nothing
        if False:
            yield {}


def map_to_local(external_user: Dict[str, Any]) -> Dict[str, Any]:
    """Map an Okta user payload to local user shape used by user-sync.

    Expected return keys: external_id, email, manager_external_id, first_name, last_name
    """
    return {
        "external_id": external_user.get("id") or external_user.get("sub"),
        "email": external_user.get("email") or external_user.get("profile", {}).get("email"),
        "manager_external_id": external_user.get("manager", {}).get("id") if external_user.get("manager") else None,
        "first_name": external_user.get("profile", {}).get("firstName"),
        "last_name": external_user.get("profile", {}).get("lastName"),
    }

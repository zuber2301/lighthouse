"""Azure AD integration placeholder.

Provide a minimal client skeleton to fetch users from Azure AD and map them
into a canonical shape for the sync job.
"""
from typing import Any, AsyncIterator, Dict


class AzureADClient:
    def __init__(self, tenant_id: str, client_id: str, client_secret: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret

    async def fetch_users(self) -> AsyncIterator[Dict[str, Any]]:
        """Yield user objects from Azure AD. Replace with MS Graph calls."""
        if False:
            yield {}


def map_to_local(external_user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "external_id": external_user.get("id"),
        "email": external_user.get("mail") or external_user.get("userPrincipalName"),
        "manager_external_id": external_user.get("manager", {}).get("id") if external_user.get("manager") else None,
        "first_name": external_user.get("givenName"),
        "last_name": external_user.get("surname"),
    }

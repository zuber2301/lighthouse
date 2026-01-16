"""Workday / HRIS integration placeholder.

Workday often provides employee records (HRIS). The sync job should map HRIS
records to tenants/users in Lighthouse. Workday may be used to populate
org-hierarchy, cost-centers and long-term HR attributes.
"""
from typing import Any, AsyncIterator, Dict


class WorkdayClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key

    async def fetch_employees(self) -> AsyncIterator[Dict[str, Any]]:
        """Yield employee records from Workday."""
        if False:
            yield {}


def map_to_local(employee: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "external_id": employee.get("employeeId"),
        "email": employee.get("email"),
        "manager_external_id": employee.get("managerEmployeeId"),
        "first_name": employee.get("firstName"),
        "last_name": employee.get("lastName"),
    }

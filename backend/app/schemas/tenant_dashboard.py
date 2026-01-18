from pydantic import BaseModel
from typing import List


class TenantInfo(BaseModel):
    id: str
    name: str
    subdomain: str


class LeadBalance(BaseModel):
    id: str
    name: str
    amount_paise: int


class RedemptionSummary(BaseModel):
    count: int
    points_spent: int


class TimeSeries(BaseModel):
    labels: List[str]
    recognitions: List[int]


class TopEmployee(BaseModel):
    id: str
    name: str
    points: int


class LeadBudget(BaseModel):
    master_balance_paise: int
    leads: List[LeadBalance]


class TenantDashboardResponse(BaseModel):
    tenant: TenantInfo
    active_users: int
    recognitions_30d: int
    points_distributed_30d: int
    redemptions_30d: RedemptionSummary
    lead_budget: LeadBudget
    top_employees: List[TopEmployee]
    time_series: TimeSeries

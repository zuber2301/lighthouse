"""
Pydantic schemas for Phase 6: Post-Event Analytics
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class BudgetBreakdown(BaseModel):
    """Budget breakdown by option"""
    option_id: str
    option_name: str
    allocated: int
    spent: float
    remaining: int


class BudgetMetrics(BaseModel):
    """Budget reconciliation metrics"""
    total_budget: float
    budget_committed: float
    budget_remaining: float
    budget_utilization: float
    breakdown_by_option: List[BudgetBreakdown] = []


class UserParticipation(BaseModel):
    """Individual user participation"""
    user_id: str
    user_name: str
    option: str
    attended: bool


class DepartmentParticipation(BaseModel):
    """Participation metrics by department"""
    department: str
    registered: int
    attended: int
    attendance_rate: float
    users: List[UserParticipation] = []


class OptionParticipation(BaseModel):
    """Participation metrics by option/track"""
    option_name: str
    registered: int
    attended: int
    attendance_rate: float


class ParticipationMetrics(BaseModel):
    """Overall participation metrics"""
    total_approved: int
    total_collected: int
    overall_attendance_rate: float
    by_department: List[DepartmentParticipation] = []
    by_option: List[OptionParticipation] = []


class TopPerformer(BaseModel):
    """Top performer for Annual Day"""
    rank: int
    user_id: str
    user_name: str
    department: Optional[str] = None
    option: str
    collected_at: Optional[datetime] = None
    collected_by: str


class DistributionLogEntry(BaseModel):
    """Distribution log entry for gifting event"""
    user_id: str
    user_name: str
    department: Optional[str] = None
    gift_option: str
    collected_at: Optional[datetime] = None
    collected_by: str


class PerformanceMetrics(BaseModel):
    """Performance metrics for event"""
    event_type: Optional[str] = None
    collected_count: int
    not_collected_count: int
    top_performers: Optional[List[TopPerformer]] = None
    distribution_log: Optional[List[DistributionLogEntry]] = None


class TimelineEntry(BaseModel):
    """Timeline entry for collection"""
    hour: str
    collections: int
    cumulative: int


class TimelineData(BaseModel):
    """Timeline data throughout event"""
    event_id: str
    timeline: List[TimelineEntry] = []


class EventSummary(BaseModel):
    """Complete event summary"""
    event_id: str
    event_name: str
    event_date: datetime
    event_type: Optional[str] = None
    total_approved: int
    total_collected: int
    participation_rate: float
    budget: BudgetMetrics
    participation: ParticipationMetrics
    performance: PerformanceMetrics


class ExportRequest(BaseModel):
    """Request to export analytics"""
    format: str  # "csv" or "pdf"
    type: str  # "participation", "distribution", "budget", "summary"


class ExportResponse(BaseModel):
    """Export response"""
    filename: str
    format: str
    size: int
    generated_at: datetime


class RoiMetrics(BaseModel):
    """ROI metrics for event"""
    total_budget: float
    actual_spend: float
    savings: float
    savings_percentage: float
    participation_rate: float
    cost_per_participant: float
    event_type: str

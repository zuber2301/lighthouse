"""
Analytics Service for Phase 6: Post-Event Analytics and Reporting
Calculates participation, budget reconciliation, and performance metrics
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from decimal import Decimal

from app.models.events import Event, EventOption
from app.models.approvals import ApprovalRequest, ApprovalStatus
from app.models.users import User, UserRole
from app.db.utils import generate_id
from app.core.logging import logger


class AnalyticsService:
    """Service for calculating post-event analytics and metrics"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_event_summary(
        self,
        event_id: str,
        tenant_id: str,
    ) -> Dict:
        """
        Get complete event summary with all key metrics.
        
        Returns:
            {
                "event_id": str,
                "event_name": str,
                "event_date": datetime,
                "event_type": str,
                "total_approved": int,
                "total_collected": int,
                "participation_rate": float,
                "budget": {...},
                "participation": {...},
                "performance": {...},
            }
        """
        try:
            # Get event
            event_query = select(Event).where(
                Event.id == event_id,
                Event.tenant_id == tenant_id,
            )
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            if not event:
                return {"error": "Event not found"}

            # Get all metrics
            budget = await self._get_budget_metrics(event)
            participation = await self._get_participation_metrics(event)
            performance = await self._get_performance_metrics(event)

            # Calculate overall participation rate
            total_approved = participation.get("total_approved", 0)
            total_collected = participation.get("total_collected", 0)
            overall_rate = (
                (total_collected / total_approved * 100) if total_approved > 0 else 0
            )

            return {
                "event_id": event.id,
                "event_name": event.name,
                "event_date": event.event_date,
                "event_type": event.event_type.value if event.event_type else None,
                "total_approved": total_approved,
                "total_collected": total_collected,
                "participation_rate": round(overall_rate, 1),
                "budget": budget,
                "participation": participation,
                "performance": performance,
            }

        except Exception as e:
            logger.error(f"Error getting event summary: {str(e)}")
            return {"error": str(e)}

    async def _get_budget_metrics(self, event: Event) -> Dict:
        """
        Calculate budget reconciliation.
        
        Returns:
            {
                "total_budget": Decimal,
                "budget_committed": Decimal,
                "budget_remaining": Decimal,
                "budget_utilization": float,
                "breakdown_by_option": [
                    {
                        "option_name": str,
                        "option_id": str,
                        "allocated": Decimal,
                        "spent": Decimal,
                        "remaining": Decimal,
                    }
                ]
            }
        """
        try:
            total_budget = event.event_budget_amount or Decimal(0)
            budget_committed = event.budget_committed or Decimal(0)
            budget_remaining = total_budget - budget_committed

            utilization = (
                (float(budget_committed) / float(total_budget) * 100)
                if total_budget > 0
                else 0
            )

            # Breakdown by option
            options_query = select(EventOption).where(
                EventOption.event_id == event.id
            )
            result = await self.db.execute(options_query)
            options = result.scalars().all()

            breakdown = []
            for option in options:
                cost_per = option.cost_per_unit or Decimal(0)
                committed = option.committed_count or 0
                spent = Decimal(committed) * cost_per

                breakdown.append(
                    {
                        "option_id": option.id,
                        "option_name": option.option_name,
                        "allocated": option.total_available or 0,
                        "spent": float(spent),
                        "remaining": max(0, (option.total_available or 0) - committed),
                    }
                )

            return {
                "total_budget": float(total_budget),
                "budget_committed": float(budget_committed),
                "budget_remaining": float(budget_remaining),
                "budget_utilization": round(utilization, 1),
                "breakdown_by_option": breakdown,
            }

        except Exception as e:
            logger.error(f"Error calculating budget metrics: {str(e)}")
            return {}

    async def _get_participation_metrics(self, event: Event) -> Dict:
        """
        Calculate participation by department/team.
        
        Returns:
            {
                "total_approved": int,
                "total_collected": int,
                "by_department": [
                    {
                        "department": str,
                        "registered": int,
                        "attended": int,
                        "attendance_rate": float,
                        "users": [...]
                    }
                ],
                "by_option": [
                    {
                        "option_name": str,
                        "registered": int,
                        "attended": int,
                        "rate": float,
                    }
                ]
            }
        """
        try:
            # Get all approvals for event
            approvals_query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event.id,
                ApprovalRequest.status == ApprovalStatus.APPROVED,
            )
            result = await self.db.execute(approvals_query)
            approvals = result.scalars().all()

            # Count by department
            dept_map = {}
            for approval in approvals:
                user = approval.user
                dept = user.department or "Unassigned"

                if dept not in dept_map:
                    dept_map[dept] = {
                        "registered": 0,
                        "attended": 0,
                        "users": [],
                    }

                dept_map[dept]["registered"] += 1
                if approval.is_collected:
                    dept_map[dept]["attended"] += 1

                dept_map[dept]["users"].append(
                    {
                        "user_id": user.id,
                        "user_name": user.full_name or user.email,
                        "option": approval.option.option_name,
                        "attended": approval.is_collected,
                    }
                )

            # Format by department
            by_dept = []
            total_registered = 0
            total_attended = 0

            for dept, data in sorted(dept_map.items()):
                registered = data["registered"]
                attended = data["attended"]
                total_registered += registered
                total_attended += attended

                rate = (attended / registered * 100) if registered > 0 else 0

                by_dept.append(
                    {
                        "department": dept,
                        "registered": registered,
                        "attended": attended,
                        "attendance_rate": round(rate, 1),
                        "users": data["users"],
                    }
                )

            # Count by option
            by_option = {}
            for approval in approvals:
                opt_name = approval.option.option_name
                if opt_name not in by_option:
                    by_option[opt_name] = {"registered": 0, "attended": 0}

                by_option[opt_name]["registered"] += 1
                if approval.is_collected:
                    by_option[opt_name]["attended"] += 1

            by_opt_list = []
            for opt_name, counts in by_option.items():
                rate = (
                    (counts["attended"] / counts["registered"] * 100)
                    if counts["registered"] > 0
                    else 0
                )
                by_opt_list.append(
                    {
                        "option_name": opt_name,
                        "registered": counts["registered"],
                        "attended": counts["attended"],
                        "attendance_rate": round(rate, 1),
                    }
                )

            return {
                "total_approved": total_registered,
                "total_collected": total_attended,
                "overall_attendance_rate": (
                    round(total_attended / total_registered * 100, 1)
                    if total_registered > 0
                    else 0
                ),
                "by_department": by_dept,
                "by_option": by_opt_list,
            }

        except Exception as e:
            logger.error(f"Error calculating participation metrics: {str(e)}")
            return {}

    async def _get_performance_metrics(self, event: Event) -> Dict:
        """
        Calculate performance metrics.
        
        For Annual Day: List winners/top performers
        For Gifting: Distribution logs
        
        Returns:
            {
                "event_type": str,
                "collected_count": int,
                "not_collected_count": int,
                "top_performers": [...] or "distribution_log": [...]
            }
        """
        try:
            # Get collected vs not collected
            approvals_query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event.id,
                ApprovalRequest.status == ApprovalStatus.APPROVED,
            )
            result = await self.db.execute(approvals_query)
            approvals = result.scalars().all()

            collected = [a for a in approvals if a.is_collected]
            not_collected = [a for a in approvals if not a.is_collected]

            perf_data = {
                "event_type": event.event_type.value if event.event_type else None,
                "collected_count": len(collected),
                "not_collected_count": len(not_collected),
            }

            # Add type-specific data
            if event.event_type.value == "ANNUAL_DAY":
                # Top performers (first to collect)
                collected_sorted = sorted(
                    collected, key=lambda x: x.collected_at or datetime.utcnow()
                )
                perf_data["top_performers"] = [
                    {
                        "rank": i + 1,
                        "user_id": a.user.id,
                        "user_name": a.user.full_name or a.user.email,
                        "department": a.user.department,
                        "option": a.option.option_name,
                        "collected_at": a.collected_at,
                        "collected_by": (
                            f"{a.collected_by_user.full_name or a.collected_by_user.email}"
                            if a.collected_by_user
                            else "Unknown"
                        ),
                    }
                    for i, a in enumerate(collected_sorted[:10])  # Top 10
                ]
            else:
                # Distribution log
                perf_data["distribution_log"] = [
                    {
                        "user_id": a.user.id,
                        "user_name": a.user.full_name or a.user.email,
                        "department": a.user.department,
                        "gift_option": a.option.option_name,
                        "collected_at": a.collected_at,
                        "collected_by": (
                            f"{a.collected_by_user.full_name or a.collected_by_user.email}"
                            if a.collected_by_user
                            else "Unknown"
                        ),
                    }
                    for a in collected
                ]

            return perf_data

        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}")
            return {}

    async def get_timeline_data(
        self,
        event_id: str,
        tenant_id: str,
    ) -> Dict:
        """
        Get timeline of collections throughout the event.
        
        Returns:
            {
                "event_id": str,
                "timeline": [
                    {
                        "hour": str,
                        "collections": int,
                        "cumulative": int,
                    }
                ]
            }
        """
        try:
            # Get all collected approvals
            approvals_query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event_id,
                ApprovalRequest.is_collected == 1,
            )
            result = await self.db.execute(approvals_query)
            approvals = result.scalars().all()

            # Group by hour
            hourly_map = {}
            for approval in approvals:
                if approval.collected_at:
                    hour = approval.collected_at.strftime("%H:00")
                    if hour not in hourly_map:
                        hourly_map[hour] = 0
                    hourly_map[hour] += 1

            # Create timeline
            timeline = []
            cumulative = 0
            for hour in sorted(hourly_map.keys()):
                cumulative += hourly_map[hour]
                timeline.append(
                    {
                        "hour": hour,
                        "collections": hourly_map[hour],
                        "cumulative": cumulative,
                    }
                )

            return {
                "event_id": event_id,
                "timeline": timeline,
            }

        except Exception as e:
            logger.error(f"Error getting timeline data: {str(e)}")
            return {"event_id": event_id, "timeline": []}

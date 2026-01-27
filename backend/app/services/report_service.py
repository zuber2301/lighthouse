"""
Report Service for Phase 6: Export analytics as CSV/PDF
Generates distribution logs, participation reports, budget reconciliation
"""

from typing import Dict, List, BinaryIO
from io import StringIO, BytesIO
import csv
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.events import Event
from app.models.approvals import ApprovalRequest, ApprovalStatus
from app.core.logging import logger


class ReportService:
    """Service for generating analytics reports in various formats"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_participation_csv(
        self,
        event_id: str,
    ) -> str:
        """
        Generate CSV report of participation by department.
        
        Returns:
            CSV string with columns:
            Department, Registered, Attended, Attendance Rate, Notes
        """
        try:
            # Get event
            event_query = select(Event).where(Event.id == event_id)
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            # Get all approvals
            approvals_query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event_id,
                ApprovalRequest.status == ApprovalStatus.APPROVED,
            )
            result = await self.db.execute(approvals_query)
            approvals = result.scalars().all()

            # Group by department
            dept_map = {}
            for approval in approvals:
                dept = approval.user.department or "Unassigned"
                if dept not in dept_map:
                    dept_map[dept] = {
                        "registered": 0,
                        "attended": 0,
                    }
                dept_map[dept]["registered"] += 1
                if approval.is_collected:
                    dept_map[dept]["attended"] += 1

            # Generate CSV
            output = StringIO()
            writer = csv.writer(output)

            # Header
            writer.writerow([
                "Department",
                "Registered",
                "Attended",
                "Attendance Rate (%)",
                "Status",
                "Notes",
            ])

            # Data
            for dept in sorted(dept_map.keys()):
                registered = dept_map[dept]["registered"]
                attended = dept_map[dept]["attended"]
                rate = (attended / registered * 100) if registered > 0 else 0

                status = "✓ Complete" if rate >= 80 else "⚠ Needs Follow-up"
                notes = ""
                if rate < 50:
                    notes = "Low attendance - Consider follow-up"
                elif rate >= 90:
                    notes = "Excellent participation"

                writer.writerow([
                    dept,
                    registered,
                    attended,
                    f"{rate:.1f}",
                    status,
                    notes,
                ])

            # Summary
            total_registered = sum(d["registered"] for d in dept_map.values())
            total_attended = sum(d["attended"] for d in dept_map.values())
            overall_rate = (
                (total_attended / total_registered * 100)
                if total_registered > 0
                else 0
            )

            writer.writerow([])
            writer.writerow(["SUMMARY"])
            writer.writerow(["Total Registered", total_registered])
            writer.writerow(["Total Attended", total_attended])
            writer.writerow(["Overall Attendance Rate (%)", f"{overall_rate:.1f}"])

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error generating participation CSV: {str(e)}")
            return ""

    async def generate_distribution_csv(
        self,
        event_id: str,
    ) -> str:
        """
        Generate CSV distribution log.
        
        Returns:
            CSV string with columns:
            User Name, Department, Gift Option, Collected At, Collected By, Status
        """
        try:
            # Get all approvals
            approvals_query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event_id,
                ApprovalRequest.status == ApprovalStatus.APPROVED,
            )
            result = await self.db.execute(approvals_query)
            approvals = result.scalars().all()

            # Generate CSV
            output = StringIO()
            writer = csv.writer(output)

            # Header
            writer.writerow([
                "User Name",
                "Email",
                "Department",
                "Gift/Track Option",
                "Status",
                "Collected At",
                "Collected By",
                "Approval Timestamp",
            ])

            # Data - sort by collected_at (descending for most recent first)
            sorted_approvals = sorted(
                approvals,
                key=lambda x: x.collected_at or datetime.min,
                reverse=True,
            )

            for approval in sorted_approvals:
                status = "Collected" if approval.is_collected else "Not Collected"
                collected_at = (
                    approval.collected_at.strftime("%Y-%m-%d %H:%M:%S")
                    if approval.collected_at
                    else "N/A"
                )
                collected_by = (
                    f"{approval.collected_by_user.full_name or approval.collected_by_user.email}"
                    if approval.collected_by_user
                    else "N/A"
                )
                approved_at = (
                    approval.approved_at.strftime("%Y-%m-%d %H:%M:%S")
                    if approval.approved_at
                    else "N/A"
                )

                writer.writerow([
                    approval.user.full_name or "Unknown",
                    approval.user.email,
                    approval.user.department or "Unassigned",
                    approval.option.option_name,
                    status,
                    collected_at,
                    collected_by,
                    approved_at,
                ])

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error generating distribution CSV: {str(e)}")
            return ""

    async def generate_budget_csv(
        self,
        event_id: str,
    ) -> str:
        """
        Generate CSV budget reconciliation report.
        
        Returns:
            CSV string with budget breakdown
        """
        try:
            # Get event
            event_query = select(Event).where(Event.id == event_id)
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            if not event:
                return ""

            # Get options
            from app.models.events import EventOption
            options_query = select(EventOption).where(
                EventOption.event_id == event_id
            )
            result = await self.db.execute(options_query)
            options = result.scalars().all()

            # Generate CSV
            output = StringIO()
            writer = csv.writer(output)

            # Header
            writer.writerow([
                "Budget Category",
                "Total Available",
                "Committed/Spent",
                "Remaining",
                "Utilization (%)",
            ])

            total_available = 0
            total_spent = 0

            # Detail by option
            for option in options:
                cost_per = option.cost_per_unit or 0
                committed = option.committed_count or 0
                spent = committed * cost_per
                available = option.total_available or 0

                total_available += available * cost_per
                total_spent += spent

                utilization = (
                    (spent / (available * cost_per) * 100)
                    if (available * cost_per) > 0
                    else 0
                )

                writer.writerow([
                    option.option_name,
                    f"₹{available * cost_per:,.2f}",
                    f"₹{spent:,.2f}",
                    f"₹{(available - committed) * cost_per:,.2f}",
                    f"{utilization:.1f}",
                ])

            # Summary
            writer.writerow([])
            writer.writerow(["BUDGET SUMMARY"])
            writer.writerow(["Total Budget", f"₹{event.event_budget_amount:,.2f}"])
            writer.writerow(["Total Committed", f"₹{event.budget_committed:,.2f}"])
            writer.writerow([
                "Remaining Budget",
                f"₹{(event.event_budget_amount - event.budget_committed):,.2f}",
            ])
            writer.writerow([
                "Budget Utilization (%)",
                f"{(float(event.budget_committed) / float(event.event_budget_amount) * 100):.1f}",
            ])

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error generating budget CSV: {str(e)}")
            return ""

    async def generate_summary_csv(
        self,
        event_id: str,
        summary_data: Dict,
    ) -> str:
        """
        Generate CSV summary report with all key metrics.
        
        Returns:
            CSV string with executive summary
        """
        try:
            # Get event
            event_query = select(Event).where(Event.id == event_id)
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            if not event:
                return ""

            output = StringIO()
            writer = csv.writer(output)

            # Event info
            writer.writerow(["EVENT SUMMARY REPORT"])
            writer.writerow([])
            writer.writerow(["Event Name", event.name])
            writer.writerow(["Event Date", event.event_date.strftime("%Y-%m-%d")])
            writer.writerow(["Event Type", event.event_type.value if event.event_type else "N/A"])
            writer.writerow(["Report Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
            writer.writerow([])

            # Participation
            participation = summary_data.get("participation", {})
            writer.writerow(["PARTICIPATION METRICS"])
            writer.writerow(["Total Approved", participation.get("total_approved", 0)])
            writer.writerow(["Total Attended", participation.get("total_collected", 0)])
            writer.writerow([
                "Overall Attendance Rate (%)",
                f"{participation.get('overall_attendance_rate', 0):.1f}",
            ])
            writer.writerow([])

            # Budget
            budget = summary_data.get("budget", {})
            writer.writerow(["BUDGET RECONCILIATION"])
            writer.writerow(["Total Budget", f"₹{budget.get('total_budget', 0):,.2f}"])
            writer.writerow(["Budget Committed", f"₹{budget.get('budget_committed', 0):,.2f}"])
            writer.writerow(["Budget Remaining", f"₹{budget.get('budget_remaining', 0):,.2f}"])
            writer.writerow([
                "Budget Utilization (%)",
                f"{budget.get('budget_utilization', 0):.1f}",
            ])
            writer.writerow([])

            # Department breakdown
            writer.writerow(["DEPARTMENT BREAKDOWN"])
            writer.writerow(["Department", "Registered", "Attended", "Rate (%)"])
            for dept in participation.get("by_department", []):
                writer.writerow([
                    dept["department"],
                    dept["registered"],
                    dept["attended"],
                    f"{dept['attendance_rate']:.1f}",
                ])

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error generating summary CSV: {str(e)}")
            return ""

    def csv_to_bytes(self, csv_string: str) -> bytes:
        """Convert CSV string to bytes"""
        return csv_string.encode("utf-8")

    async def generate_pdf_report(
        self,
        event_id: str,
        summary_data: Dict,
    ) -> bytes:
        """
        Generate PDF report.
        Note: Requires reportlab library.
        For now, returns a simple text-based report.
        """
        try:
            # For simplicity, generate a text-based report
            # In production, use reportlab for proper PDF generation
            lines = []
            lines.append("=" * 80)
            lines.append("EVENT ANALYTICS REPORT")
            lines.append("=" * 80)
            lines.append("")

            # Event info
            event_query = select(Event).where(Event.id == event_id)
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            if event:
                lines.append(f"Event: {event.name}")
                lines.append(f"Date: {event.event_date.strftime('%Y-%m-%d')}")
                lines.append(f"Type: {event.event_type.value if event.event_type else 'N/A'}")
                lines.append("")

            # Participation
            participation = summary_data.get("participation", {})
            lines.append("PARTICIPATION METRICS")
            lines.append("-" * 40)
            lines.append(
                f"Total Registered: {participation.get('total_approved', 0)}"
            )
            lines.append(f"Total Attended: {participation.get('total_collected', 0)}")
            lines.append(
                f"Attendance Rate: {participation.get('overall_attendance_rate', 0):.1f}%"
            )
            lines.append("")

            # Budget
            budget = summary_data.get("budget", {})
            lines.append("BUDGET RECONCILIATION")
            lines.append("-" * 40)
            lines.append(f"Total Budget: ₹{budget.get('total_budget', 0):,.2f}")
            lines.append(f"Budget Committed: ₹{budget.get('budget_committed', 0):,.2f}")
            lines.append(f"Budget Remaining: ₹{budget.get('budget_remaining', 0):,.2f}")
            lines.append(f"Utilization: {budget.get('budget_utilization', 0):.1f}%")
            lines.append("")

            # Department breakdown
            lines.append("DEPARTMENT BREAKDOWN")
            lines.append("-" * 40)
            for dept in participation.get("by_department", []):
                lines.append(
                    f"{dept['department']}: {dept['registered']} registered, "
                    f"{dept['attended']} attended ({dept['attendance_rate']:.1f}%)"
                )

            lines.append("")
            lines.append("=" * 80)
            lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append("=" * 80)

            text = "\n".join(lines)
            return text.encode("utf-8")

        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return f"Error: {str(e)}".encode("utf-8")

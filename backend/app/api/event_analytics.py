"""
API endpoints for Phase 6: Post-Event Analytics and Reporting
Routes: /analytics/event/*
Separate from existing analytics routes - focused on post-event metrics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserRole
from app.services.analytics_service import AnalyticsService
from app.services.report_service import ReportService
from app.schemas.analytics import (
    EventSummary,
    TimelineData,
    ExportRequest,
    RoiMetrics,
)

router = APIRouter(prefix="/analytics/event", tags=["post-event analytics"])


@router.get(
    "/{event_id}/summary",
    response_model=EventSummary,
    summary="Get event analytics summary",
    description="Get complete post-event analytics with participation, budget, and performance metrics",
)
async def get_event_summary(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get complete event summary with all key analytics.
    
    Includes:
    - Participation metrics (registration vs attendance by department)
    - Budget reconciliation (total, committed, remaining, utilization)
    - Performance metrics (collected count, top performers/distribution log)
    
    Example Response:
    ```json
    {
        "event_id": "evt-001",
        "event_name": "Summer Celebration",
        "event_date": "2026-01-27",
        "event_type": "GIFTING",
        "total_approved": 100,
        "total_collected": 94,
        "participation_rate": 94.0,
        "budget": {
            "total_budget": 500000.0,
            "budget_committed": 420000.0,
            "budget_remaining": 80000.0,
            "budget_utilization": 84.0
        },
        "participation": {
            "total_approved": 100,
            "total_collected": 94,
            "overall_attendance_rate": 94.0,
            "by_department": [
                {
                    "department": "Engineering",
                    "registered": 50,
                    "attended": 47,
                    "attendance_rate": 94.0
                },
                {
                    "department": "Sales",
                    "registered": 30,
                    "attended": 18,
                    "attendance_rate": 60.0
                }
            ]
        },
        "performance": {
            "collected_count": 94,
            "not_collected_count": 6
        }
    }
    ```
    """
    # Tenant admin or lead required
    if current_user.role not in [
        UserRole.TENANT_ADMIN,
        UserRole.TENANT_LEAD,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admin/lead can view analytics",
        )

    service = AnalyticsService(db)
    result = await service.get_event_summary(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"],
        )

    return EventSummary(**result)


@router.get(
    "/{event_id}/timeline",
    response_model=TimelineData,
    summary="Get collection timeline",
    description="Get hourly breakdown of collections throughout the event",
)
async def get_event_timeline(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get timeline of collections by hour throughout the event"""
    if current_user.role not in [
        UserRole.TENANT_ADMIN,
        UserRole.TENANT_LEAD,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admin/lead can view analytics",
        )

    service = AnalyticsService(db)
    result = await service.get_timeline_data(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    return TimelineData(**result)


@router.get(
    "/{event_id}/roi",
    response_model=RoiMetrics,
    summary="Get ROI metrics",
    description="Get Return on Investment metrics for the event",
)
async def get_roi_metrics(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get ROI metrics: total budget, actual spend, savings, cost per participant.
    
    Example Response:
    ```json
    {
        "total_budget": 500000.0,
        "actual_spend": 420000.0,
        "savings": 80000.0,
        "savings_percentage": 16.0,
        "participation_rate": 94.0,
        "cost_per_participant": 4468.09,
        "event_type": "GIFTING"
    }
    ```
    """
    if current_user.role not in [
        UserRole.TENANT_ADMIN,
        UserRole.TENANT_LEAD,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admin/lead can view analytics",
        )

    service = AnalyticsService(db)
    summary = await service.get_event_summary(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    if "error" in summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=summary["error"],
        )

    budget = summary["budget"]
    participation = summary["participation"]

    total_collected = participation["total_collected"]
    cost_per = (
        (budget["budget_committed"] / total_collected)
        if total_collected > 0
        else 0
    )

    return RoiMetrics(
        total_budget=budget["total_budget"],
        actual_spend=budget["budget_committed"],
        savings=budget["budget_remaining"],
        savings_percentage=(
            (budget["budget_remaining"] / budget["total_budget"] * 100)
            if budget["total_budget"] > 0
            else 0
        ),
        participation_rate=participation["overall_attendance_rate"],
        cost_per_participant=cost_per,
        event_type=summary["event_type"],
    )


@router.post(
    "/{event_id}/export",
    summary="Export analytics report",
    description="Export analytics as CSV",
)
async def export_analytics(
    event_id: str,
    export_req: ExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export event analytics as CSV.
    
    Export types:
    - participation: Department attendance breakdown
    - distribution: Full distribution log with timestamps
    - budget: Budget reconciliation details by option
    - summary: Executive summary with all metrics
    
    Request:
    ```json
    {
        "format": "csv",
        "type": "summary"
    }
    ```
    
    Returns: CSV file download
    """
    if current_user.role not in [
        UserRole.TENANT_ADMIN,
        UserRole.TENANT_LEAD,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admin/lead can export analytics",
        )

    analytics_service = AnalyticsService(db)
    report_service = ReportService(db)

    # Get summary for reference
    summary = await analytics_service.get_event_summary(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    if "error" in summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=summary["error"],
        )

    # Generate report based on type
    if export_req.type == "participation":
        content = await report_service.generate_participation_csv(event_id)
        filename = f"participation_{event_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    elif export_req.type == "distribution":
        content = await report_service.generate_distribution_csv(event_id)
        filename = f"distribution_{event_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    elif export_req.type == "budget":
        content = await report_service.generate_budget_csv(event_id)
        filename = f"budget_{event_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    else:  # summary
        content = await report_service.generate_summary_csv(event_id, summary)
        filename = f"summary_{event_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    data = report_service.csv_to_bytes(content)

    return StreamingResponse(
        iter([data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/{event_id}/insights",
    summary="Get key insights",
    description="Get key takeaways and insights from event analytics",
)
async def get_key_insights(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get key insights and recommendations from event data.
    
    Returns:
    - Department participation analysis
    - Budget savings achieved
    - Most popular tracks/options
    - Collection timing insights
    
    Example Response:
    ```json
    {
        "event_id": "evt-001",
        "insights": [
            "Engineering: 94% participation (47/50) - Excellent!",
            "Sales: 60% participation (18/30) - Needs follow-up",
            "Budget saved: ₹80,000 (16% savings)",
            "Most popular: Standup Comedy (25 registrations)",
            "Peak collection: 14:00 (32 gifts/hour)"
        ],
        "recommendations": [
            "Schedule follow-up with Sales team",
            "Expand Standup Comedy next time",
            "Optimize staffing for 2pm-3pm window"
        ],
        "summary": {
            "total_approved": 100,
            "total_collected": 94,
            "participation_rate": 94.0,
            "budget_spent": 420000.0,
            "budget_saved": 80000.0
        }
    }
    ```
    """
    if current_user.role not in [
        UserRole.TENANT_ADMIN,
        UserRole.TENANT_LEAD,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admin/lead can view insights",
        )

    service = AnalyticsService(db)
    summary = await service.get_event_summary(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    if "error" in summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=summary["error"],
        )

    insights = []
    recommendations = []

    # Participation insights
    participation = summary["participation"]
    for dept in participation["by_department"]:
        if dept["attendance_rate"] >= 90:
            insights.append(
                f"{dept['department']}: {dept['attendance_rate']:.0f}% participation "
                f"({dept['attended']}/{dept['registered']}) - Excellent!"
            )
        elif dept["attendance_rate"] >= 70:
            insights.append(
                f"{dept['department']}: {dept['attendance_rate']:.0f}% participation "
                f"({dept['attended']}/{dept['registered']}) - Good"
            )
        else:
            insights.append(
                f"{dept['department']}: {dept['attendance_rate']:.0f}% participation "
                f"({dept['attended']}/{dept['registered']}) - Needs attention"
            )
            recommendations.append(
                f"Schedule follow-up with {dept['department']}"
            )

    # Budget insights
    budget = summary["budget"]
    if budget["budget_remaining"] > 0:
        insights.append(
            f"Budget saved: ₹{budget['budget_remaining']:,.0f} ({100 - budget['budget_utilization']:.1f}% savings)"
        )

    # Option insights
    if participation["by_option"]:
        most_popular = max(
            participation["by_option"],
            key=lambda x: x["registered"],
        )
        insights.append(
            f"Most popular: {most_popular['option_name']} ({most_popular['registered']} registered)"
        )
        if most_popular["attendance_rate"] >= 90:
            recommendations.append(
                f"Expand {most_popular['option_name']} - high interest and attendance"
            )

    # Timeline insights
    timeline = await service.get_timeline_data(event_id, current_user.tenant_id)
    if timeline.get("timeline"):
        peak_hour = max(
            timeline["timeline"],
            key=lambda x: x["collections"],
        )
        insights.append(
            f"Peak time: {peak_hour['hour']} ({peak_hour['collections']} gifts collected)"
        )
        recommendations.append(
            f"Allocate more scanners during {peak_hour['hour']} window next time"
        )

    return {
        "event_id": event_id,
        "insights": insights,
        "recommendations": recommendations,
        "summary": {
            "total_approved": participation["total_approved"],
            "total_collected": participation["total_collected"],
            "participation_rate": participation["overall_attendance_rate"],
            "budget_spent": budget["budget_committed"],
            "budget_saved": budget["budget_remaining"],
        },
    }

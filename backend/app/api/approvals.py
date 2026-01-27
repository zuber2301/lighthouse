"""
API endpoints for approval requests (Phase 4: Governance Loop)
Routes: /approvals/*
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from typing import List

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserRole
from app.models.approvals import ApprovalStatus
from app.services.approval_service import ApprovalService
from app.services.notification_service import NotificationService
from app.schemas.approvals import (
    ApprovalRequestCreate,
    ApprovalRequestResponse,
    ApprovalRequestListItem,
    ApprovalDecision,
    ApprovalDeclineResponse,
    QRCodeActivationResponse,
    ApprovalInboxResponse,
)

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post(
    "/create",
    response_model=ApprovalRequestResponse,
    summary="Create approval request",
    description="User requests to join an event/track. Triggers lead notification.",
)
async def create_approval_request(
    event_id: str,
    request_data: ApprovalRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create an approval request for joining an event/track.
    
    - Calculates work-hour impact (hours/week × weeks)
    - Estimates budget impact
    - Routes to tenant lead for approval
    
    Example:
    ```json
    {
        "event_option_id": "opt-123",
        "impact_hours_per_week": 3.5,
        "impact_duration_weeks": 8,
        "notes": "Interested in the singing track"
    }
    ```
    """
    try:
        approval_request = await ApprovalService.create_approval_request(
            db=db,
            request_data=request_data,
            event_id=event_id,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
        )
        await db.commit()
        await db.refresh(approval_request)

        return ApprovalRequestResponse.from_orm(approval_request)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating approval request: {str(e)}",
        )


@router.get(
    "/pending",
    response_model=ApprovalInboxResponse,
    summary="Get pending requests for lead",
    description="Tenant lead views the Requests tab with all pending approvals",
)
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all pending approval requests for the current lead.
    This is the main "Requests" tab UI for David.
    
    Shows:
    - User wanting to join
    - Event/track details
    - Time impact (e.g., "3h rehearsal/week")
    - Created timestamp
    """
    try:
        requests = await ApprovalService.get_pending_requests_for_lead(
            db=db,
            lead_id=current_user.id,
            tenant_id=current_user.tenant_id,
        )

        # Calculate total impact hours
        total_impact_hours = Decimal("0")
        for req in requests:
            total_impact_hours += req.total_impact_hours

        # Convert to list items
        list_items = []
        for req in requests:
            item = ApprovalRequestListItem(
                id=req.id,
                event_id=req.event_id,
                user_id=req.user_id,
                event_option_id=req.event_option_id,
                user_name=req.user.display_name if req.user else None,
                user_email=req.user.email if req.user else None,
                event_name=req.event.name if req.event else None,
                option_name=req.option.option_name if req.option else None,
                impact_hours_per_week=req.impact_hours_per_week,
                impact_duration_weeks=req.impact_duration_weeks,
                total_impact_hours=req.total_impact_hours,
                status=req.status.value,
                created_at=req.created_at,
            )
            list_items.append(item)

        return ApprovalInboxResponse(
            pending_count=len(requests),
            total_pending_impact_hours=total_impact_hours,
            requests=list_items,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending requests: {str(e)}",
        )


@router.get(
    "/{request_id}",
    response_model=ApprovalRequestResponse,
    summary="Get request details",
)
async def get_request_details(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed view of a specific approval request"""
    try:
        approval_request = await ApprovalService.get_request_details(
            db=db, request_id=request_id
        )

        if not approval_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found",
            )

        # Authorization: lead or admin can view
        if (
            current_user.id != approval_request.lead_id
            and current_user.role != UserRole.ADMIN
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this request",
            )

        return ApprovalRequestResponse.from_orm(approval_request)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post(
    "/{request_id}/approve",
    response_model=ApprovalRequestResponse,
    summary="Approve request",
    description="Lead approves request: QR code generated, budget committed",
)
async def approve_request(
    request_id: str,
    decision: ApprovalDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve an approval request.
    
    On approval:
    1. Generate QR code for user
    2. Commit budget from event
    3. Create EventRegistration with APPROVED status
    4. Send confirmation to user
    
    The QR code is used at pickup to verify registration.
    """
    try:
        approval_request = await ApprovalService.get_request_details(
            db=db, request_id=request_id
        )

        if not approval_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found",
            )

        # Authorization
        if (
            current_user.id != approval_request.lead_id
            and current_user.role != UserRole.ADMIN
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to approve this request",
            )

        # Approve
        approval_request = await ApprovalService.approve_request(
            db=db,
            request_id=request_id,
            approver_id=current_user.id,
            approval_notes=decision.notes,
        )

        # Send notification
        await NotificationService.notify_approval(
            db=db,
            approval_request=approval_request,
        )

        await db.commit()
        await db.refresh(approval_request)

        return ApprovalRequestResponse.from_orm(approval_request)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post(
    "/{request_id}/decline",
    response_model=ApprovalDeclineResponse,
    summary="Decline request",
    description="Lead declines request. Suggests alternatives to user.",
)
async def decline_request(
    request_id: str,
    decision: ApprovalDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Decline an approval request.
    
    On decline:
    1. Mark as DECLINED
    2. Find alternative event options
    3. Send notification to user with alternatives
    
    Example decline reason: "High workload for your team this period"
    """
    try:
        approval_request = await ApprovalService.get_request_details(
            db=db, request_id=request_id
        )

        if not approval_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found",
            )

        # Authorization
        if (
            current_user.id != approval_request.lead_id
            and current_user.role != UserRole.ADMIN
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to decline this request",
            )

        # Decline
        approval_request = await ApprovalService.decline_request(
            db=db,
            request_id=request_id,
            decliner_id=current_user.id,
            decline_reason=decision.notes,
        )

        # Get alternatives
        alternatives = await ApprovalService.get_alternative_options(
            db=db,
            event_id=approval_request.event_id,
            max_impact_hours=approval_request.total_impact_hours,
        )

        # Send notification with alternatives
        await NotificationService.notify_decline(
            db=db,
            approval_request=approval_request,
            alternatives=alternatives,
        )

        await db.commit()
        await db.refresh(approval_request)

        alt_list = [
            {
                "id": alt.id,
                "name": alt.option_name,
                "description": alt.description,
                "available_slots": alt.available_slots,
            }
            for alt in alternatives
        ]

        return ApprovalDeclineResponse(
            request_id=approval_request.id,
            status=approval_request.status.value,
            decline_reason=approval_request.decline_reason,
            alternatives=alt_list,
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post(
    "/qr/{qr_token}/activate",
    response_model=QRCodeActivationResponse,
    summary="Activate QR code",
    description="Scan QR code at pickup location to verify registration",
)
async def activate_qr_code(
    qr_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Activate/scan a QR code at the pickup location.
    
    This verifies the user's registration and records pickup.
    Used at events to:
    - Verify approved registrations
    - Track attendance
    - Distribute gifts/items
    """
    try:
        approval_request = await ApprovalService.activate_qr_code(
            db=db, qr_token=qr_token
        )

        await db.commit()
        await db.refresh(approval_request)

        return QRCodeActivationResponse(
            request_id=approval_request.id,
            user_id=approval_request.user_id,
            event_id=approval_request.event_id,
            status="ACTIVATED",
            activated_at=approval_request.qr_activated_at,
            message=f"Registration verified for {approval_request.user.display_name}",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

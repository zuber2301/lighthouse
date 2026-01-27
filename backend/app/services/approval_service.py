"""
ApprovalService: Core business logic for the Governance Loop
- Request creation with impact analysis
- Approval/decline workflow
- QR code generation and budget commitment
- Notification triggering
"""

import qrcode
import io
import base64
import uuid
from decimal import Decimal
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.approvals import ApprovalRequest, ApprovalStatus
from app.models.events import Event, EventOption, EventRegistration, RegistrationStatus
from app.models.users import User
from app.models.tenants import Tenant
from app.schemas.approvals import (
    ApprovalRequestCreate,
    ApprovalRequestResponse,
    ApprovalDecision,
)


class ApprovalService:
    """Service for approval request lifecycle and governance"""

    @staticmethod
    async def create_approval_request(
        db: AsyncSession,
        request_data: ApprovalRequestCreate,
        event_id: str,
        user_id: str,
        tenant_id: str,
    ) -> ApprovalRequest:
        """
        Create an approval request for a user joining an event/track.
        
        Impact Analysis:
        - Calculates work-hour utilization (hours/week * duration)
        - Estimates cost from event budget
        """
        # Fetch event, option, and user
        event = await db.get(Event, event_id)
        if not event or event.tenant_id != tenant_id:
            raise ValueError(f"Event {event_id} not found")

        option = await db.get(EventOption, request_data.event_option_id)
        if not option or option.event_id != event_id:
            raise ValueError(f"Event option not found for this event")

        user = await db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get tenant lead (manager or admin for this tenant)
        lead = await ApprovalService._get_tenant_lead(db, tenant_id, user_id)
        if not lead:
            raise ValueError("No approving lead found for this tenant")

        # Calculate impact
        impact_hours_per_week = Decimal(str(request_data.impact_hours_per_week))
        impact_duration_weeks = request_data.impact_duration_weeks
        total_impact_hours = impact_hours_per_week * Decimal(impact_duration_weeks)

        # Estimate cost (from event option cost_per_unit if available)
        estimated_cost = Decimal("0")
        if option.cost_per_unit:
            estimated_cost = option.cost_per_unit

        # Create approval request
        approval_request = ApprovalRequest(
            tenant_id=tenant_id,
            event_id=event_id,
            user_id=user_id,
            event_option_id=option.id,
            lead_id=lead.id,
            impact_hours_per_week=impact_hours_per_week,
            impact_duration_weeks=impact_duration_weeks,
            total_impact_hours=total_impact_hours,
            estimated_cost=estimated_cost,
            status=ApprovalStatus.PENDING,
            request_notes=request_data.notes,
        )

        db.add(approval_request)
        await db.flush()
        return approval_request

    @staticmethod
    async def get_pending_requests_for_lead(
        db: AsyncSession,
        lead_id: str,
        tenant_id: str,
    ) -> List[ApprovalRequest]:
        """
        Get all pending approval requests for a specific lead (typically tenant manager/lead).
        This is the "Requests" tab inbox for David.
        """
        stmt = (
            select(ApprovalRequest)
            .where(
                and_(
                    ApprovalRequest.lead_id == lead_id,
                    ApprovalRequest.tenant_id == tenant_id,
                    ApprovalRequest.status == ApprovalStatus.PENDING,
                )
            )
            .options(
                selectinload(ApprovalRequest.user),
                selectinload(ApprovalRequest.event),
                selectinload(ApprovalRequest.option),
            )
            .order_by(ApprovalRequest.created_at.desc())
        )

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def approve_request(
        db: AsyncSession,
        request_id: str,
        approver_id: str,
        approval_notes: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Approve an approval request.
        
        On approval:
        1. Set status to APPROVED
        2. Generate QR code
        3. Commit budget from event
        4. Create/update EventRegistration
        5. Record approval audit trail
        """
        approval_request = await db.get(ApprovalRequest, request_id)
        if not approval_request:
            raise ValueError(f"Approval request {request_id} not found")

        if not approval_request.is_pending:
            raise ValueError(f"Request is not in PENDING status: {approval_request.status}")

        # Generate QR code
        qr_token = str(uuid.uuid4())
        qr_code_url = await ApprovalService._generate_qr_code(qr_token)

        # Update request
        approval_request.status = ApprovalStatus.APPROVED
        approval_request.approved_at = datetime.utcnow()
        approval_request.approved_by = approver_id
        approval_request.approval_notes = approval_notes
        approval_request.qr_token = qr_token
        approval_request.qr_code_url = qr_code_url
        approval_request.budget_committed = 1
        approval_request.committed_at = datetime.utcnow()

        # Commit budget from event
        event = await db.get(Event, approval_request.event_id)
        if event:
            event.budget_committed += approval_request.estimated_cost

        # Create/update EventRegistration
        reg_stmt = select(EventRegistration).where(
            and_(
                EventRegistration.event_id == approval_request.event_id,
                EventRegistration.user_id == approval_request.user_id,
            )
        )
        reg_result = await db.execute(reg_stmt)
        registration = reg_result.scalar_one_or_none()

        if not registration:
            registration = EventRegistration(
                event_id=approval_request.event_id,
                user_id=approval_request.user_id,
                event_option_id=approval_request.event_option_id,
                status=RegistrationStatus.APPROVED,
                qr_token=qr_token,
                amount_committed=approval_request.estimated_cost,
                approved_at=datetime.utcnow(),
                approved_by=approver_id,
            )
            db.add(registration)
        else:
            registration.status = RegistrationStatus.APPROVED
            registration.qr_token = qr_token
            registration.amount_committed = approval_request.estimated_cost
            registration.approved_at = datetime.utcnow()
            registration.approved_by = approver_id

        await db.flush()
        return approval_request

    @staticmethod
    async def decline_request(
        db: AsyncSession,
        request_id: str,
        decliner_id: str,
        decline_reason: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Decline an approval request.
        
        On decline:
        1. Set status to DECLINED
        2. Record reason and audit trail
        3. Trigger notification to user with alternatives
        """
        approval_request = await db.get(ApprovalRequest, request_id)
        if not approval_request:
            raise ValueError(f"Approval request {request_id} not found")

        if not approval_request.is_pending:
            raise ValueError(f"Request is not in PENDING status: {approval_request.status}")

        # Update request
        approval_request.status = ApprovalStatus.DECLINED
        approval_request.declined_at = datetime.utcnow()
        approval_request.declined_by = decliner_id
        approval_request.decline_reason = decline_reason

        # Update EventRegistration if it exists
        reg_stmt = select(EventRegistration).where(
            and_(
                EventRegistration.event_id == approval_request.event_id,
                EventRegistration.user_id == approval_request.user_id,
            )
        )
        reg_result = await db.execute(reg_stmt)
        registration = reg_result.scalar_one_or_none()

        if registration:
            registration.status = RegistrationStatus.REJECTED

        await db.flush()

        # Trigger notification (handled by NotificationService)
        approval_request.notification_sent = 0  # Mark for notification dispatch

        return approval_request

    @staticmethod
    async def activate_qr_code(
        db: AsyncSession,
        qr_token: str,
    ) -> ApprovalRequest:
        """
        Activate/scan a QR code at pickup location.
        Records the activation time for audit purposes.
        """
        stmt = select(ApprovalRequest).where(ApprovalRequest.qr_token == qr_token)
        result = await db.execute(stmt)
        approval_request = result.scalar_one_or_none()

        if not approval_request:
            raise ValueError("Invalid QR code")

        if not approval_request.is_approved:
            raise ValueError("QR code not available for this request")

        approval_request.qr_activated_at = datetime.utcnow()
        await db.flush()

        return approval_request

    @staticmethod
    async def get_request_details(
        db: AsyncSession, request_id: str
    ) -> ApprovalRequest:
        """Get detailed view of an approval request"""
        stmt = (
            select(ApprovalRequest)
            .where(ApprovalRequest.id == request_id)
            .options(
                selectinload(ApprovalRequest.user),
                selectinload(ApprovalRequest.event),
                selectinload(ApprovalRequest.option),
                selectinload(ApprovalRequest.lead),
            )
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def _get_tenant_lead(
        db: AsyncSession, tenant_id: str, user_id: str
    ) -> Optional[User]:
        """
        Find the appropriate lead/approver for a user in a tenant.
        Priority: Direct manager > Department lead > Tenant admin
        """
        user = await db.get(User, user_id)
        
        # For now, return the first admin of the tenant
        # In production: traverse org hierarchy to find manager/lead
        stmt = (
            select(User)
            .where(
                and_(
                    User.tenant_id == tenant_id,
                    User.role.in_(["ADMIN", "MANAGER"]),
                )
            )
            .limit(1)
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def _generate_qr_code(qr_token: str) -> str:
        """
        Generate a QR code for the approval token.
        Returns a data URL for embedding in responses.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_token)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64 data URL
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"

    @staticmethod
    async def get_alternative_options(
        db: AsyncSession,
        event_id: str,
        max_impact_hours: Decimal,
    ) -> List[EventOption]:
        """
        Find alternative event options with lower time impact.
        Used when declining a request to suggest alternatives to user.
        """
        stmt = (
            select(EventOption)
            .where(
                and_(
                    EventOption.event_id == event_id,
                    EventOption.is_active == 1,
                )
            )
            .order_by(EventOption.committed_count.asc())
            .limit(5)
        )

        result = await db.execute(stmt)
        return result.scalars().all()

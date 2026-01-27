"""
Scanner Service for Phase 5: Day-of-Event Logistics
Handles QR code verification and gift distribution at events
"""

from typing import Optional, Dict, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal

from app.models.approvals import ApprovalRequest, ApprovalStatus
from app.models.events import Event, EventOption
from app.models.users import User
from app.db.utils import generate_id
from app.core.logging import logger


class ScannerService:
    """Service for event-day QR scanning and distribution logistics"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_and_collect_qr(
        self,
        qr_token: str,
        event_id: str,
        admin_user: User,
    ) -> Dict:
        """
        Verify QR code and mark as collected.
        
        Process:
        1. Find approval request by QR token
        2. Verify is_approved == True
        3. Check if already collected (fraud prevention)
        4. Mark as collected with timestamp
        5. Update event inventory
        
        Returns:
            {
                "status": "SUCCESS" | "ALREADY_COLLECTED" | "NOT_APPROVED" | "NOT_FOUND",
                "request_id": str,
                "user_name": str,
                "event_name": str,
                "option_name": str,
                "collected_at": datetime,
                "message": str,
                "remaining_stock": int,
            }
        """
        try:
            # Find approval request by QR token
            query = select(ApprovalRequest).where(
                ApprovalRequest.qr_token == qr_token,
                ApprovalRequest.tenant_id == admin_user.tenant_id,
            )
            result = await self.db.execute(query)
            approval = result.scalars().first()

            if not approval:
                return {
                    "status": "NOT_FOUND",
                    "message": "QR code not found",
                    "request_id": None,
                    "user_name": None,
                    "event_name": None,
                    "option_name": None,
                    "collected_at": None,
                    "remaining_stock": 0,
                }

            # Verify approval status
            if approval.status != ApprovalStatus.APPROVED:
                return {
                    "status": "NOT_APPROVED",
                    "message": f"Request is {approval.status.value}, not approved",
                    "request_id": approval.id,
                    "user_name": f"{approval.user.first_name} {approval.user.last_name}",
                    "event_name": approval.event.event_name,
                    "option_name": approval.option.option_name,
                    "collected_at": None,
                    "remaining_stock": 0,
                }

            # Check if already collected (fraud prevention)
            if approval.is_collected:
                return {
                    "status": "ALREADY_COLLECTED",
                    "message": f"⚠️ ALREADY COLLECTED! Scanned by {approval.collected_by_user.first_name if approval.collected_by_user else 'unknown'} at {approval.collected_at.strftime('%H:%M:%S')}",
                    "request_id": approval.id,
                    "user_name": f"{approval.user.first_name} {approval.user.last_name}",
                    "event_name": approval.event.event_name,
                    "option_name": approval.option.option_name,
                    "collected_at": approval.collected_at,
                    "remaining_stock": await self._get_remaining_stock(event_id, approval.event_option_id),
                }

            # Mark as collected
            approval.is_collected = 1
            approval.collected_at = datetime.utcnow()
            approval.collected_by = admin_user.id

            # Update event option committed count (decrement available)
            event_option = approval.option
            event_option.committed_count = (event_option.committed_count or 0) + 1

            # Save
            self.db.add(approval)
            self.db.add(event_option)
            await self.db.commit()
            await self.db.refresh(approval)

            remaining = await self._get_remaining_stock(event_id, approval.event_option_id)

            logger.info(
                f"QR verified and collected: {approval.id}",
                extra={
                    "user_id": approval.user_id,
                    "event_id": event_id,
                    "scanned_by": admin_user.id,
                },
            )

            return {
                "status": "SUCCESS",
                "message": f"✅ Gift collected for {approval.user.first_name}!",
                "request_id": approval.id,
                "user_name": f"{approval.user.first_name} {approval.user.last_name}",
                "event_name": approval.event.event_name,
                "option_name": approval.option.option_name,
                "collected_at": approval.collected_at,
                "remaining_stock": remaining,
            }

        except Exception as e:
            logger.error(f"Error verifying QR code: {str(e)}")
            return {
                "status": "ERROR",
                "message": f"Error: {str(e)}",
                "request_id": None,
                "user_name": None,
                "event_name": None,
                "option_name": None,
                "collected_at": None,
                "remaining_stock": 0,
            }

    async def get_event_inventory(
        self,
        event_id: str,
        tenant_id: str,
    ) -> Dict:
        """
        Get real-time inventory for event.
        
        Returns inventory by track/option with:
        - Total available
        - Collected count
        - Remaining count
        - Collection percentage
        
        Returns:
            {
                "event_id": str,
                "event_name": str,
                "total_available": int,
                "total_collected": int,
                "total_remaining": int,
                "collection_percentage": float,
                "options": [
                    {
                        "option_id": str,
                        "option_name": str,
                        "total_available": int,
                        "collected": int,
                        "remaining": int,
                        "percentage": float,
                    }
                ]
            }
        """
        try:
            # Get event
            query = select(Event).where(
                Event.id == event_id,
                Event.tenant_id == tenant_id,
            )
            result = await self.db.execute(query)
            event = result.scalars().first()

            if not event:
                return {
                    "event_id": event_id,
                    "event_name": "Event not found",
                    "total_available": 0,
                    "total_collected": 0,
                    "total_remaining": 0,
                    "collection_percentage": 0.0,
                    "options": [],
                }

            # Get all options for event
            options_query = select(EventOption).where(
                EventOption.event_id == event_id,
            )
            result = await self.db.execute(options_query)
            options = result.scalars().all()

            inventory_options = []
            total_available = 0
            total_collected = 0

            for option in options:
                # Count collected approvals for this option
                collected_query = select(func.count(ApprovalRequest.id)).where(
                    ApprovalRequest.event_option_id == option.id,
                    ApprovalRequest.is_collected == 1,
                    ApprovalRequest.status == ApprovalStatus.APPROVED,
                )
                result = await self.db.execute(collected_query)
                collected_count = result.scalar() or 0

                available = option.total_available or 0
                remaining = available - collected_count

                total_available += available
                total_collected += collected_count

                percentage = (
                    (collected_count / available * 100) if available > 0 else 0
                )

                inventory_options.append(
                    {
                        "option_id": option.id,
                        "option_name": option.option_name,
                        "total_available": available,
                        "collected": collected_count,
                        "remaining": remaining,
                        "percentage": round(percentage, 1),
                    }
                )

            total_remaining = total_available - total_collected
            overall_percentage = (
                (total_collected / total_available * 100)
                if total_available > 0
                else 0
            )

            return {
                "event_id": event_id,
                "event_name": event.event_name,
                "total_available": total_available,
                "total_collected": total_collected,
                "total_remaining": total_remaining,
                "collection_percentage": round(overall_percentage, 1),
                "options": inventory_options,
            }

        except Exception as e:
            logger.error(f"Error getting event inventory: {str(e)}")
            return {
                "event_id": event_id,
                "event_name": "Error",
                "total_available": 0,
                "total_collected": 0,
                "total_remaining": 0,
                "collection_percentage": 0.0,
                "options": [],
            }

    async def get_collection_status(
        self,
        event_id: str,
        tenant_id: str,
    ) -> Dict:
        """
        Get detailed collection status for event.
        Shows who collected what and when.
        
        Returns:
            {
                "event_id": str,
                "event_name": str,
                "collections": [
                    {
                        "request_id": str,
                        "user_name": str,
                        "option_name": str,
                        "collected_at": datetime,
                        "collected_by": str,
                    }
                ]
            }
        """
        try:
            # Get all collected approvals for event
            query = select(ApprovalRequest).where(
                ApprovalRequest.event_id == event_id,
                ApprovalRequest.tenant_id == tenant_id,
                ApprovalRequest.is_collected == 1,
            )
            result = await self.db.execute(query)
            collected_approvals = result.scalars().all()

            collections = []
            for approval in collected_approvals:
                collections.append(
                    {
                        "request_id": approval.id,
                        "user_name": f"{approval.user.first_name} {approval.user.last_name}",
                        "option_name": approval.option.option_name,
                        "collected_at": approval.collected_at,
                        "collected_by": (
                            f"{approval.collected_by_user.first_name} {approval.collected_by_user.last_name}"
                            if approval.collected_by_user
                            else "Unknown"
                        ),
                    }
                )

            # Sort by collected_at descending
            collections.sort(
                key=lambda x: x["collected_at"], reverse=True
            )

            # Get event info
            event_query = select(Event).where(Event.id == event_id)
            result = await self.db.execute(event_query)
            event = result.scalars().first()

            return {
                "event_id": event_id,
                "event_name": event.event_name if event else "Event not found",
                "collections": collections,
            }

        except Exception as e:
            logger.error(f"Error getting collection status: {str(e)}")
            return {
                "event_id": event_id,
                "event_name": "Error",
                "collections": [],
            }

    async def _get_remaining_stock(
        self,
        event_id: str,
        option_id: str,
    ) -> int:
        """Get remaining stock for an option"""
        try:
            query = select(EventOption).where(EventOption.id == option_id)
            result = await self.db.execute(query)
            option = result.scalars().first()

            if not option:
                return 0

            # Count collected
            collected_query = select(func.count(ApprovalRequest.id)).where(
                ApprovalRequest.event_option_id == option_id,
                ApprovalRequest.is_collected == 1,
            )
            result = await self.db.execute(collected_query)
            collected = result.scalar() or 0

            remaining = (option.total_available or 0) - collected
            return max(0, remaining)

        except Exception:
            return 0

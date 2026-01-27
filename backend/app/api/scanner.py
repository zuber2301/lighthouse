"""
API endpoints for Phase 5: Day-of-Event Logistics (Scanner)
Routes: /scanner/*
Mobile-optimized endpoints for event-day QR scanning and gift distribution
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
import json

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserRole
from app.services.scanner_service import ScannerService
from app.schemas.scanner import (
    QRVerifyRequest,
    QRVerifyResponse,
    InventoryResponse,
    CollectionStatusResponse,
    ScannerDashboard,
)

router = APIRouter(prefix="/scanner", tags=["scanner"])


@router.post(
    "/verify",
    response_model=QRVerifyResponse,
    summary="Verify and collect QR code",
    description="Scan QR code at event. Marks as collected and updates inventory.",
)
async def verify_qr_code(
    request: QRVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify QR code and mark gift as collected.
    
    Process:
    1. Find approval request by QR token
    2. Verify status is APPROVED
    3. Check if already collected (fraud prevention)
    4. Mark as collected with timestamp
    5. Update event inventory
    
    Returns:
    - SUCCESS: Gift collected, shows remaining stock
    - ALREADY_COLLECTED: RED ALERT, shows when/who collected
    - NOT_APPROVED: Request not in approved state
    - NOT_FOUND: QR code not found
    - ERROR: Server error
    
    Example:
    ```json
    {
        "qr_token": "abc123xyz",
        "event_id": "evt-001"
    }
    ```
    
    Response:
    ```json
    {
        "status": "SUCCESS",
        "message": "✅ Gift collected for John!",
        "request_id": "req-123",
        "user_name": "John Doe",
        "event_name": "Summer Celebration",
        "option_name": "Standup Comedy",
        "collected_at": "2026-01-27T18:30:45",
        "remaining_stock": 47
    }
    ```
    """
    # Admin or higher required
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can collect gifts at event",
        )

    service = ScannerService(db)
    result = await service.verify_and_collect_qr(
        qr_token=request.qr_token,
        event_id=request.event_id,
        admin_user=current_user,
    )

    return QRVerifyResponse(**result)


@router.get(
    "/event/{event_id}/inventory",
    response_model=InventoryResponse,
    summary="Get real-time event inventory",
    description="Get current inventory status with collected and remaining counts by track/option",
)
async def get_event_inventory(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get real-time inventory for event.
    
    Shows:
    - Total available gifts
    - Total collected gifts
    - Total remaining gifts
    - Collection percentage (0-100%)
    - Breakdown by track/option
    
    Example Response:
    ```json
    {
        "event_id": "evt-001",
        "event_name": "Summer Celebration",
        "total_available": 100,
        "total_collected": 42,
        "total_remaining": 58,
        "collection_percentage": 42.0,
        "options": [
            {
                "option_id": "opt-001",
                "option_name": "Standup Comedy",
                "total_available": 30,
                "collected": 25,
                "remaining": 5,
                "percentage": 83.3
            },
            {
                "option_id": "opt-002",
                "option_name": "Volleyball",
                "total_available": 50,
                "collected": 10,
                "remaining": 40,
                "percentage": 20.0
            },
            {
                "option_id": "opt-003",
                "option_name": "Trivia Night",
                "total_available": 20,
                "collected": 7,
                "remaining": 13,
                "percentage": 35.0
            }
        ]
    }
    ```
    """
    # Admin or higher required
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view event inventory",
        )

    service = ScannerService(db)
    result = await service.get_event_inventory(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    return InventoryResponse(**result)


@router.get(
    "/event/{event_id}/collections",
    response_model=CollectionStatusResponse,
    summary="Get collection history",
    description="Get list of all collected gifts with timestamps and who collected them",
)
async def get_collection_status(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed collection history for event.
    
    Shows:
    - Who collected what
    - When it was collected
    - Who scanned it (admin)
    - Sorted by most recent first
    
    Example Response:
    ```json
    {
        "event_id": "evt-001",
        "event_name": "Summer Celebration",
        "collections": [
            {
                "request_id": "req-042",
                "user_name": "Sarah Chen",
                "option_name": "Volleyball",
                "collected_at": "2026-01-27T18:45:30",
                "collected_by": "Alex Johnson"
            },
            {
                "request_id": "req-041",
                "user_name": "Mike Torres",
                "option_name": "Standup Comedy",
                "collected_at": "2026-01-27T18:44:15",
                "collected_by": "Alex Johnson"
            }
        ]
    }
    ```
    """
    # Admin or higher required
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view collection status",
        )

    service = ScannerService(db)
    result = await service.get_collection_status(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    return CollectionStatusResponse(**result)


@router.get(
    "/event/{event_id}/dashboard",
    response_model=ScannerDashboard,
    summary="Get complete scanner dashboard",
    description="Get all data needed for scanner UI: inventory + recent collections",
)
async def get_scanner_dashboard(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get complete dashboard view for scanner interface.
    
    Combines:
    - Real-time inventory
    - Recent collections (last 10)
    - Total collection count
    - Event active status
    
    Example Response:
    ```json
    {
        "event_id": "evt-001",
        "event_name": "Summer Celebration",
        "total_collections": 42,
        "active": true,
        "inventory": {
            "event_id": "evt-001",
            "event_name": "Summer Celebration",
            "total_available": 100,
            "total_collected": 42,
            "total_remaining": 58,
            "collection_percentage": 42.0,
            "options": [...]
        },
        "recent_collections": [
            {
                "request_id": "req-042",
                "user_name": "Sarah Chen",
                "option_name": "Volleyball",
                "collected_at": "2026-01-27T18:45:30",
                "collected_by": "Alex Johnson"
            }
        ]
    }
    ```
    """
    # Admin or higher required
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can access scanner dashboard",
        )

    service = ScannerService(db)

    # Get inventory
    inventory_result = await service.get_event_inventory(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    # Get collection status
    collections_result = await service.get_collection_status(
        event_id=event_id,
        tenant_id=current_user.tenant_id,
    )

    # Take last 10 collections
    recent_collections = collections_result.get("collections", [])[:10]

    return ScannerDashboard(
        event_id=event_id,
        event_name=inventory_result.get("event_name", "Event"),
        inventory=InventoryResponse(**inventory_result),
        recent_collections=recent_collections,
        total_collections=len(collections_result.get("collections", [])),
        active=True,
    )


# WebSocket for real-time inventory updates (optional enhancement)
@router.websocket("/ws/event/{event_id}/live")
async def websocket_live_inventory(
    websocket: WebSocket,
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket for real-time inventory updates.
    
    Usage:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/scanner/ws/event/evt-001/live');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Inventory updated:', data);
    };
    ```
    
    Sends inventory updates whenever a QR code is scanned.
    """
    await websocket.accept()
    try:
        while True:
            # In a real implementation, this would listen to a message queue
            # For now, keep connection open
            data = await websocket.receive_text()
            if data == "refresh":
                service = ScannerService(db)
                inventory = await service.get_event_inventory(
                    event_id=event_id,
                    tenant_id=None,  # Would get from auth
                )
                await websocket.send_json(inventory)
    except WebSocketDisconnect:
        pass

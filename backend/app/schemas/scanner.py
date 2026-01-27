"""
Pydantic schemas for Phase 5: Day-of-Event Logistics (Scanner)
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class QRVerifyRequest(BaseModel):
    """Request to verify and collect a QR code"""
    qr_token: str
    event_id: str


class QRVerifyResponse(BaseModel):
    """Response from QR verification"""
    status: str  # SUCCESS, ALREADY_COLLECTED, NOT_APPROVED, NOT_FOUND, ERROR
    message: str
    request_id: Optional[str] = None
    user_name: Optional[str] = None
    event_name: Optional[str] = None
    option_name: Optional[str] = None
    collected_at: Optional[datetime] = None
    remaining_stock: int = 0


class InventoryOption(BaseModel):
    """Inventory details for a single option/track"""
    option_id: str
    option_name: str
    total_available: int
    collected: int
    remaining: int
    percentage: float


class InventoryResponse(BaseModel):
    """Real-time event inventory"""
    event_id: str
    event_name: str
    total_available: int
    total_collected: int
    total_remaining: int
    collection_percentage: float
    options: List[InventoryOption] = []


class CollectionDetail(BaseModel):
    """Details of a single collection"""
    request_id: str
    user_name: str
    option_name: str
    collected_at: datetime
    collected_by: str


class CollectionStatusResponse(BaseModel):
    """Collection status for event"""
    event_id: str
    event_name: str
    collections: List[CollectionDetail] = []


class ScannerDashboard(BaseModel):
    """Complete dashboard view for scanner interface"""
    event_id: str
    event_name: str
    inventory: InventoryResponse
    recent_collections: List[CollectionDetail] = []
    total_collections: int = 0
    active: bool = True

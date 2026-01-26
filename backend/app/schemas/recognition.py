from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from enum import Enum


class AwardCategory(str, Enum):
    GOLD = "GOLD"
    SILVER = "SILVER"
    BRONZE = "BRONZE"
    ECARD = "ECARD"


class RecognitionCreate(BaseModel):
    nominee_id: UUID
    points: int = 0
    award_category: Optional[AwardCategory] = AwardCategory.ECARD
    badge_id: Optional[UUID] = None
    value_tag: Optional[str] = None
    message: str
    # Optional HTML payload for e-card (backend will persist to uploads and return a URL)
    ecard_html: Optional[str] = None
    # Design selection (Classic, Modern, Fun)
    ecard_design: Optional[str] = "Classic"
    # If client already uploaded an image/PDF, provide the returned upload URL
    ecard_url: Optional[str] = None
    # Optional area of focus to align recognition with org goals
    area_of_focus: Optional[str] = None
    # If client attached a media URL specific for the e-card
    media_url: Optional[str] = None
    is_public: Optional[bool] = True


class RecognitionOut(BaseModel):
    id: UUID
    nominee_id: UUID
    nominee_name: Optional[str] = None
    nominee_avatar: Optional[str] = None
    nominee_department: Optional[str] = None
    nominator_id: UUID
    nominator_name: Optional[str] = None
    nominator_avatar: Optional[str] = None
    points: int
    status: str
    award_category: Optional[AwardCategory] = None
    high_five_count: int = 0
    ecard_design: Optional[str] = None
    badge_id: Optional[UUID] = None
    badge_name: Optional[str] = None
    value_tag: Optional[str] = None
    message: Optional[str] = None
    ecard_url: Optional[str] = None
    area_of_focus: Optional[str] = None
    media_url: Optional[str] = None
    is_public: Optional[bool] = True
    created_at: Optional[str] = None

    class Config:
        orm_mode = True

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class RecognitionCreate(BaseModel):
    nominee_id: UUID
    points: int
    badge_id: Optional[UUID] = None
    value_tag: Optional[str] = None
    message: Optional[str] = None
    # Optional HTML payload for e-card (backend will persist to uploads and return a URL)
    ecard_html: Optional[str] = None
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
    points: int
    status: str
    badge_id: Optional[UUID] = None
    value_tag: Optional[str] = None
    message: Optional[str] = None
    ecard_url: Optional[str] = None
    area_of_focus: Optional[str] = None
    media_url: Optional[str] = None
    is_public: Optional[bool] = True
    created_at: Optional[str] = None

    class Config:
        orm_mode = True

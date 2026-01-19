from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class RecognitionCreate(BaseModel):
    nominee_id: UUID
    points: int
    badge_id: Optional[UUID] = None
    value_tag: Optional[str] = None
    message: Optional[str] = None
    is_public: Optional[bool] = True


class RecognitionOut(BaseModel):
    id: UUID
    nominee_id: UUID
    points: int
    status: str
    badge_id: Optional[UUID] = None
    message: Optional[str] = None
    is_public: Optional[bool] = True
    created_at: Optional[str] = None

    class Config:
        orm_mode = True

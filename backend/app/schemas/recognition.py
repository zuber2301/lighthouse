from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class RecognitionCreate(BaseModel):
    nominee_id: UUID
    points: int
    value_tag: Optional[str] = None
    message: Optional[str] = None


class RecognitionOut(BaseModel):
    id: UUID
    nominee_id: UUID
    points: int
    status: str

    class Config:
        from_attributes = True

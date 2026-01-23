from pydantic import BaseModel
from typing import Optional, Union
from uuid import UUID
class BadgeCreate(BaseModel):
    name: str
    icon_url: Optional[str] = None
    points_value: int = 0
    category: Optional[str] = None


class BadgeOut(BaseModel):
    id: UUID
    tenant_id: Optional[Union[UUID, str]]
    name: str
    icon_url: Optional[str]
    points_value: int
    category: Optional[str]
    class Config:
        orm_mode = True


class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    icon_url: Optional[str] = None
    points_value: Optional[int] = None
    category: Optional[str] = None

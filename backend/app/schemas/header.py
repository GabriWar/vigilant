"""Header schemas"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HeaderBase(BaseModel):
    """Base header schema"""
    name: str
    value: str
    description: Optional[str] = None
    is_active: bool = True


class HeaderCreate(HeaderBase):
    """Schema for creating a header"""
    pass


class HeaderUpdate(BaseModel):
    """Schema for updating a header"""
    name: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Header(HeaderBase):
    """Schema for header response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

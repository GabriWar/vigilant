"""Pydantic schemas for Request"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RequestBase(BaseModel):
    """Base request schema"""
    name: str = Field(..., min_length=1, max_length=255)
    request_data: str = Field(..., min_length=1)
    save_cookies: bool = Field(default=False)
    watch_interval: Optional[int] = Field(None, gt=0)
    is_active: bool = Field(default=True)


class RequestCreate(RequestBase):
    """Schema for creating a request"""
    pass


class RequestUpdate(BaseModel):
    """Schema for updating a request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    request_data: Optional[str] = Field(None, min_length=1)
    save_cookies: Optional[bool] = None
    watch_interval: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None


class RequestInDB(RequestBase):
    """Schema for request in database"""
    id: int
    created_at: datetime
    updated_at: datetime
    last_executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RequestResponse(RequestInDB):
    """Schema for request API response"""
    pass

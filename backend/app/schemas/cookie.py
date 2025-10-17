"""Pydantic schemas for Cookie"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CookieBase(BaseModel):
    """Base cookie schema"""
    name: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)
    domain: Optional[str] = Field(None, max_length=255)
    path: Optional[str] = Field(None, max_length=255)
    expires: Optional[datetime] = None


class CookieCreate(CookieBase):
    """Schema for creating a cookie"""
    request_id: int


class CookieUpdate(BaseModel):
    """Schema for updating a cookie"""
    value: Optional[str] = Field(None, min_length=1)
    domain: Optional[str] = Field(None, max_length=255)
    path: Optional[str] = Field(None, max_length=255)
    expires: Optional[datetime] = None


class CookieInDB(CookieBase):
    """Schema for cookie in database"""
    id: int
    request_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CookieResponse(CookieInDB):
    """Schema for cookie API response"""
    pass

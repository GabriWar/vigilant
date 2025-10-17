"""Pydantic schemas for Setting"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SettingBase(BaseModel):
    """Base setting schema"""
    key: str = Field(..., min_length=1, max_length=255)
    value: Optional[str] = None
    description: Optional[str] = None


class SettingCreate(SettingBase):
    """Schema for creating a setting"""
    pass


class SettingUpdate(BaseModel):
    """Schema for updating a setting"""
    value: Optional[str] = None
    description: Optional[str] = None


class SettingInDB(SettingBase):
    """Schema for setting in database"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingResponse(SettingInDB):
    """Schema for setting API response"""
    pass

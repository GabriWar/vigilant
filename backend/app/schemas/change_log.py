"""Pydantic schemas for ChangeLog"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChangeLogBase(BaseModel):
    """Base change log schema"""
    change_type: str = Field(..., pattern="^(new|modified|error)$")
    new_hash: str = Field(..., min_length=64, max_length=64)
    new_size: int = Field(..., gt=0)
    old_hash: Optional[str] = Field(None, min_length=64, max_length=64)
    old_size: Optional[int] = None


class ChangeLogCreate(ChangeLogBase):
    """Schema for creating a change log"""
    monitor_id: Optional[int] = None
    request_id: Optional[int] = None
    old_content: Optional[bytes] = None
    new_content: bytes
    diff: Optional[bytes] = None
    archive_path: Optional[str] = None


class ChangeLogInDB(ChangeLogBase):
    """Schema for change log in database"""
    id: int
    monitor_id: Optional[int] = None
    request_id: Optional[int] = None
    archive_path: Optional[str] = None
    detected_at: datetime

    class Config:
        from_attributes = True


class ChangeLogResponse(ChangeLogInDB):
    """Schema for change log API response (without content)"""
    pass


class ChangeLogWithContent(ChangeLogInDB):
    """Schema for change log with full content"""
    old_content: Optional[bytes] = None
    new_content: bytes
    diff: Optional[bytes] = None


class ChangeLogWithDiff(ChangeLogInDB):
    """Schema for change log with diff only"""
    diff: Optional[str] = None  # Decoded diff as string

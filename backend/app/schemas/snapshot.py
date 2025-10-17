"""Pydantic schemas for Snapshot"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SnapshotBase(BaseModel):
    """Base snapshot schema"""
    content_hash: str = Field(..., min_length=64, max_length=64)
    content_size: int = Field(..., gt=0)
    content_type: Optional[str] = Field(None, max_length=100)


class SnapshotCreate(SnapshotBase):
    """Schema for creating a snapshot"""
    monitor_id: Optional[int] = None
    request_id: Optional[int] = None
    content: bytes


class SnapshotInDB(SnapshotBase):
    """Schema for snapshot in database"""
    id: int
    monitor_id: Optional[int] = None
    request_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SnapshotResponse(SnapshotInDB):
    """Schema for snapshot API response (without content)"""
    pass


class SnapshotWithContent(SnapshotInDB):
    """Schema for snapshot with content"""
    content: bytes

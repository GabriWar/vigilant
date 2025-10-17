"""Pydantic schemas for Monitor"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime


class MonitorBase(BaseModel):
    """Base monitor schema"""
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    monitor_type: str = Field(default="webpage", pattern="^(webpage|api)$")
    watch_interval: int = Field(default=60, gt=0)
    is_active: bool = Field(default=True)
    request_id: Optional[int] = None


class MonitorCreate(MonitorBase):
    """Schema for creating a monitor"""
    pass


class MonitorUpdate(BaseModel):
    """Schema for updating a monitor"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, min_length=1)
    monitor_type: Optional[str] = Field(None, pattern="^(webpage|api)$")
    watch_interval: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    request_id: Optional[int] = None


class MonitorInDB(MonitorBase):
    """Schema for monitor in database"""
    id: int
    created_at: datetime
    updated_at: datetime
    last_checked_at: Optional[datetime] = None
    last_changed_at: Optional[datetime] = None
    status: str = "pending"
    error_message: Optional[str] = None
    check_count: int = 0
    change_count: int = 0

    class Config:
        from_attributes = True


class MonitorResponse(MonitorInDB):
    """Schema for monitor API response"""
    pass


class MonitorWithStats(MonitorInDB):
    """Monitor with additional statistics"""
    recent_changes: int = 0
    uptime_percentage: float = 0.0

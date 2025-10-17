"""Pydantic schemas for Watcher"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WatcherBase(BaseModel):
    """Base watcher schema"""
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    method: str = Field(default="GET", pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    headers: Optional[dict] = Field(default_factory=dict)
    body: Optional[str] = None
    
    # Content and execution settings
    content_type: str = Field(default="auto", pattern="^(auto|text|json|html|xml|image|pdf)$")
    execution_mode: str = Field(default="scheduled", pattern="^(scheduled|manual|both)$")
    watch_interval: Optional[int] = Field(default=None, gt=0)  # Required for scheduled mode
    is_active: bool = Field(default=True)
    
    # Cookie settings
    save_cookies: bool = Field(default=False)
    use_cookies: bool = Field(default=False)
    cookie_watcher_id: Optional[int] = None
    
    # Change detection
    comparison_mode: str = Field(default="hash", pattern="^(hash|content_aware|disabled)$")


class WatcherCreate(WatcherBase):
    """Schema for creating a watcher"""
    pass


class WatcherUpdate(BaseModel):
    """Schema for updating a watcher"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, min_length=1)
    method: Optional[str] = Field(None, pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    headers: Optional[dict] = None
    body: Optional[str] = None
    
    # Content and execution settings
    content_type: Optional[str] = Field(None, pattern="^(auto|text|json|html|xml|image|pdf)$")
    execution_mode: Optional[str] = Field(None, pattern="^(scheduled|manual|both)$")
    watch_interval: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    
    # Cookie settings
    save_cookies: Optional[bool] = None
    use_cookies: Optional[bool] = None
    cookie_watcher_id: Optional[int] = None
    
    # Change detection
    comparison_mode: Optional[str] = Field(None, pattern="^(hash|content_aware|disabled)$")


class WatcherInDB(WatcherBase):
    """Schema for watcher in database"""
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


class WatcherResponse(WatcherInDB):
    """Schema for watcher API response"""
    pass


class WatcherListResponse(BaseModel):
    """Simplified watcher schema for listing"""
    id: int
    name: str
    url: str
    execution_mode: str
    is_active: bool
    status: str
    check_count: int
    change_count: int
    last_checked_at: Optional[datetime] = None
    last_changed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WatcherWithStats(WatcherInDB):
    """Watcher with additional statistics"""
    recent_changes: int = 0
    success_rate: float = 0.0


class WatcherStatistics(BaseModel):
    """Statistics for watchers"""
    total_watchers: int
    active_watchers: int
    inactive_watchers: int
    total_checks: int
    total_changes: int
    by_execution_mode: dict
    by_status: dict
    by_content_type: dict


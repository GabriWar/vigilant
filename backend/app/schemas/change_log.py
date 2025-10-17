"""Pydantic schemas for ChangeLog"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChangeLogBase(BaseModel):
    """Base change log schema"""
    change_type: str = Field(..., pattern="^(new|modified|error|unchanged)$")
    new_hash: str = Field(..., min_length=64, max_length=64)
    new_size: int = Field(..., gt=0)
    old_hash: Optional[str] = Field(None, min_length=64, max_length=64)
    old_size: Optional[int] = None


class ChangeLogCreate(ChangeLogBase):
    """Schema for creating a change log"""
    watcher_id: int
    old_content: Optional[bytes] = None
    new_content: bytes
    diff: Optional[bytes] = None
    archive_path: Optional[str] = None


class ChangeLogInDB(ChangeLogBase):
    """Schema for change log in database"""
    id: int
    watcher_id: int
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


# New schemas for advanced functionality

class ChangeLogListResponse(ChangeLogInDB):
    """Schema for change log list response (optimized for listing)"""
    watcher_name: str
    watcher_url: str


class ChangeLogFilters(BaseModel):
    """Schema for change log filters"""
    watcher_id: Optional[int] = None
    change_type: Optional[str] = Field(None, pattern="^(new|modified|error|unchanged)$")
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    min_size: Optional[int] = Field(None, ge=0)
    max_size: Optional[int] = Field(None, ge=0)
    search: Optional[str] = None
    order_by: str = Field("detected_at", pattern="^(detected_at|new_size|change_type)$")
    order_direction: str = Field("desc", pattern="^(asc|desc)$")


class FrequencyDataPoint(BaseModel):
    """Single data point for frequency charts"""
    date: str  # YYYY-MM-DD format
    count: int
    new_count: int
    modified_count: int
    error_count: int


class TopWatcher(BaseModel):
    """Top watcher by change count"""
    id: int
    name: str
    url: str
    execution_mode: str
    change_count: int
    last_change: Optional[datetime] = None


class ChangeLogStatistics(BaseModel):
    """Comprehensive change log statistics"""
    # Totals
    total_changes: int
    new_changes: int
    modified_changes: int
    error_changes: int
    
    # Size statistics
    avg_change_size: float
    min_change_size: int
    max_change_size: int
    total_size_change: int
    
    # Frequency data for charts
    frequency_data: List[FrequencyDataPoint]
    
    # Top watchers
    top_watchers: List[TopWatcher]
    
    # Time range
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class ChangeLogComparisonItem(BaseModel):
    """Single change log in comparison"""
    id: int
    detected_at: datetime
    change_type: str
    old_size: Optional[int]
    new_size: int
    diff: Optional[str]
    watcher_name: str
    watcher_url: str


class ChangeLogComparison(BaseModel):
    """Schema for comparing multiple change logs"""
    change_logs: List[ChangeLogComparisonItem]
    comparison_metadata: Dict[str, Any] = Field(default_factory=dict)

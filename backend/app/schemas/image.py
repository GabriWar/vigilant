"""Pydantic schemas for Image"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ImageBase(BaseModel):
    """Base image schema"""
    filename: str = Field(..., min_length=1, max_length=500)
    original_url: str = Field(..., min_length=1)
    file_size: Optional[int] = None
    mime_type: Optional[str] = Field(None, max_length=100)
    width: Optional[int] = None
    height: Optional[int] = None
    image_metadata: Optional[Dict[str, Any]] = None
    source_date: Optional[str] = Field(None, max_length=100)


class ImageCreate(ImageBase):
    """Schema for creating an image"""
    monitor_id: int
    file_path: str = Field(..., min_length=1, max_length=1000)


class ImageUpdate(BaseModel):
    """Schema for updating an image"""
    image_metadata: Optional[Dict[str, Any]] = None


class ImageInDB(ImageBase):
    """Schema for image in database"""
    id: int
    monitor_id: int
    file_path: str
    downloaded_at: datetime

    class Config:
        from_attributes = True


class ImageResponse(ImageInDB):
    """Schema for image API response"""
    pass

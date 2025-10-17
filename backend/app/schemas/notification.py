"""Pydantic schemas for Notifications"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationSubscriptionCreate(BaseModel):
    """Schema for creating a notification subscription"""
    endpoint: str = Field(..., min_length=1)
    keys: Dict[str, str]  # Contains p256dh and auth


class NotificationSubscriptionInDB(BaseModel):
    """Schema for notification subscription in database"""
    id: int
    endpoint: str
    p256dh_key: str
    auth_key: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationSubscriptionResponse(NotificationSubscriptionInDB):
    """Schema for notification subscription API response"""
    pass


class NotificationPayload(BaseModel):
    """Schema for notification payload"""
    title: str = Field(..., min_length=1, max_length=100)
    body: str = Field(..., min_length=1, max_length=500)
    icon: Optional[str] = None
    badge: Optional[str] = None
    tag: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class VapidPublicKeyResponse(BaseModel):
    """Response containing the VAPID public key"""
    public_key: str

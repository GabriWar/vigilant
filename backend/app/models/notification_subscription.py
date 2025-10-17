"""NotificationSubscription model - stores web push notification subscriptions"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class NotificationSubscription(Base):
    """Web push notification subscription model"""

    __tablename__ = "notification_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Subscription details from browser
    endpoint = Column(String(500), nullable=False, unique=True)
    p256dh_key = Column(String(200), nullable=False)  # Public key
    auth_key = Column(String(100), nullable=False)    # Auth secret
    
    # User/device info
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<NotificationSubscription(id={self.id}, endpoint='{self.endpoint[:50]}...')>"

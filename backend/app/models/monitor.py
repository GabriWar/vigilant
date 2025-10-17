"""Monitor model - represents a webpage/API to monitor"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Monitor(Base):
    """Monitor model for tracking webpages and APIs"""

    __tablename__ = "monitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    monitor_type = Column(String(50), nullable=False, default="webpage")  # 'webpage' or 'api'
    
    # Watch settings
    watch_interval = Column(Integer, nullable=False, default=60)  # seconds
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Authentication
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    
    # Direct monitor configuration (stored as JSON in existing fields)
    method = Column(String(10), default="GET")  # HTTP method
    headers = Column(JSON, nullable=True)  # Headers as JSON
    body = Column(Text, nullable=True)  # Request body
    save_cookies = Column(Boolean, default=False, nullable=False)
    use_cookies = Column(Boolean, default=False, nullable=False)  # Use cookies in request
    cookie_request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)  # Request ID to get cookies from
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Current status
    status = Column(String(50), default="pending")  # pending, running, error, stopped
    error_message = Column(Text, nullable=True)
    check_count = Column(Integer, default=0)
    change_count = Column(Integer, default=0)
    
    # Relationships
    request = relationship("Request", foreign_keys=[request_id], back_populates="monitors")
    cookie_request = relationship("Request", foreign_keys=[cookie_request_id], back_populates="monitors_using_cookies")
    snapshots = relationship("Snapshot", back_populates="monitor", cascade="all, delete-orphan")
    change_logs = relationship("ChangeLog", back_populates="monitor", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="monitor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Monitor(id={self.id}, name='{self.name}', url='{self.url[:50]}...')>"

"""Watcher model - unified model for monitoring webpages, APIs, and requests"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Watcher(Base):
    """Unified watcher model for all monitoring and request tracking"""

    __tablename__ = "watchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(Text, nullable=False)
    
    # HTTP configuration
    method = Column(String(10), nullable=False, server_default="GET")
    headers = Column(JSON, nullable=True)
    body = Column(Text, nullable=True)
    
    # Content and execution settings
    content_type = Column(String(50), nullable=False, server_default="auto")  # auto, text, json, html, xml, image, pdf
    execution_mode = Column(String(50), nullable=False, server_default="scheduled")  # scheduled, manual, both
    watch_interval = Column(Integer, nullable=True)  # seconds, for scheduled execution
    is_active = Column(Boolean, nullable=False, server_default="1")
    
    # Cookie settings
    save_cookies = Column(Boolean, nullable=False, server_default="0")
    use_cookies = Column(Boolean, nullable=False, server_default="0")
    cookie_watcher_id = Column(Integer, ForeignKey("watchers.id"), nullable=True)
    
    # Change detection
    comparison_mode = Column(String(50), nullable=False, server_default="hash")  # hash, content_aware, disabled
    
    # Status and tracking
    status = Column(String(50), nullable=True, server_default="pending")  # pending, running, success, error
    error_message = Column(Text, nullable=True)
    check_count = Column(Integer, nullable=False, server_default="0")
    change_count = Column(Integer, nullable=False, server_default="0")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    cookie_watcher = relationship("Watcher", remote_side=[id], foreign_keys=[cookie_watcher_id])
    cookies = relationship("Cookie", back_populates="watcher", cascade="all, delete-orphan")
    snapshots = relationship("Snapshot", back_populates="watcher", cascade="all, delete-orphan")
    change_logs = relationship("ChangeLog", back_populates="watcher", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="watcher", cascade="all, delete-orphan")
    variables = relationship("Variable", back_populates="watcher")

    def __repr__(self):
        return f"<Watcher(id={self.id}, name='{self.name}', url='{self.url[:50]}...', mode='{self.execution_mode}')>"


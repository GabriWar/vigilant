"""Request model - represents HTTP requests"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Request(Base):
    """HTTP request model"""

    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    
    # Request details
    request_data = Column(Text, nullable=False)  # Stores the fetch() request
    save_cookies = Column(Boolean, default=False, nullable=False)
    use_cookies = Column(Boolean, default=False, nullable=False)  # Use cookies in request
    cookie_request_id = Column(Integer, nullable=True)  # Request ID to get cookies from
    
    # Watch settings (for standalone request monitoring)
    watch_interval = Column(Integer, nullable=True)  # seconds, NULL if not monitored standalone
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    monitors = relationship("Monitor", foreign_keys="Monitor.request_id", back_populates="request")
    monitors_using_cookies = relationship("Monitor", foreign_keys="Monitor.cookie_request_id", back_populates="cookie_request")
    cookies = relationship("Cookie", back_populates="request", cascade="all, delete-orphan")
    snapshots = relationship("Snapshot", back_populates="request", cascade="all, delete-orphan")
    change_logs = relationship("ChangeLog", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Request(id={self.id}, name='{self.name}')>"

"""Snapshot model - stores current state of monitored resources"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Snapshot(Base):
    """Snapshot model for storing current content state"""

    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to either a monitor or request
    monitor_id = Column(Integer, ForeignKey("monitors.id"), nullable=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    
    # Content
    content = Column(LargeBinary, nullable=False)  # Store as binary for efficiency
    content_hash = Column(String(64), nullable=False, index=True)  # SHA256 hash
    content_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=True)  # e.g., 'text/html', 'application/json'
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    monitor = relationship("Monitor", back_populates="snapshots")
    request = relationship("Request", back_populates="snapshots")

    def __repr__(self):
        return f"<Snapshot(id={self.id}, hash='{self.content_hash[:16]}...', size={self.content_size})>"

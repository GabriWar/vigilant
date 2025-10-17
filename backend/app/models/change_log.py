"""ChangeLog model - stores detected changes"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ChangeLog(Base):
    """Change log model for tracking content changes"""

    __tablename__ = "change_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to watcher
    watcher_id = Column(Integer, ForeignKey("watchers.id"), nullable=False)
    
    # Change details
    change_type = Column(String(50), nullable=False)  # 'new', 'modified', 'error'
    
    # Content snapshots
    old_content = Column(LargeBinary, nullable=True)  # Previous content
    new_content = Column(LargeBinary, nullable=False)  # New content
    old_hash = Column(String(64), nullable=True)
    new_hash = Column(String(64), nullable=False)
    
    # Diff
    diff = Column(LargeBinary, nullable=True)  # Unified diff
    
    # Size tracking
    old_size = Column(Integer, nullable=True)
    new_size = Column(Integer, nullable=False)
    
    # Archive path
    archive_path = Column(String(500), nullable=True)
    
    # Metadata
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    watcher = relationship("Watcher", back_populates="change_logs")

    def __repr__(self):
        return f"<ChangeLog(id={self.id}, type='{self.change_type}', detected_at='{self.detected_at}')>"

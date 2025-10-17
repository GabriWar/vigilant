"""Image model - stores downloaded images metadata"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Image(Base):
    """Image model for tracking downloaded images"""

    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    monitor_id = Column(Integer, ForeignKey("monitors.id"), nullable=False)
    
    # Image details
    filename = Column(String(500), nullable=False)
    original_url = Column(Text, nullable=False)
    file_path = Column(String(1000), nullable=False)  # Path to stored image
    
    # Image metadata
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Additional metadata (from API response)
    image_metadata = Column(JSON, nullable=True)  # Store date, location, etc. from API
    
    # Timestamps
    downloaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    source_date = Column(String(100), nullable=True)  # Original date from API
    
    # Relationships
    monitor = relationship("Monitor", back_populates="images")

    def __repr__(self):
        return f"<Image(id={self.id}, filename='{self.filename}', monitor_id={self.monitor_id})>"

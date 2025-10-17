"""Header model - stores custom HTTP headers"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Header(Base):
    """Custom HTTP header storage model"""

    __tablename__ = "headers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Header data
    name = Column(String(255), nullable=False, index=True)  # Header name (e.g., "User-Agent")
    value = Column(Text, nullable=False)  # Header value
    description = Column(Text, nullable=True)  # Optional description
    
    # Metadata
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Header(id={self.id}, name='{self.name}', value='{self.value[:50]}...')>"

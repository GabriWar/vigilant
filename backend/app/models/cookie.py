"""Cookie model - stores authentication cookies"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Cookie(Base):
    """Cookie storage model"""

    __tablename__ = "cookies"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    
    # Cookie data
    name = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    domain = Column(String(255), nullable=True)
    path = Column(String(255), nullable=True)
    expires = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    request = relationship("Request", back_populates="cookies")

    def __repr__(self):
        return f"<Cookie(id={self.id}, name='{self.name}', request_id={self.request_id})>"

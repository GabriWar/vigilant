"""Variable model - stores extracted variables from requests"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class VariableSource(str, enum.Enum):
    """Source type for variable extraction"""
    RESPONSE_BODY = "response_body"  # Extract from response body (JSON path or regex)
    RESPONSE_HEADER = "response_header"  # Extract from response header
    COOKIE = "cookie"  # Extract from cookie
    STATIC = "static"  # Static value
    RANDOM = "random"  # Generate random value


class VariableExtractMethod(str, enum.Enum):
    """Method for extracting variable value"""
    JSON_PATH = "json_path"  # Use JSON path (e.g., "data.token")
    REGEX = "regex"  # Use regex pattern
    COOKIE_VALUE = "cookie_value"  # Extract cookie value by name
    HEADER_VALUE = "header_value"  # Extract header value by name
    FULL_BODY = "full_body"  # Use entire response body
    RANDOM_STRING = "random_string"  # Generate random string
    RANDOM_NUMBER = "random_number"  # Generate random number
    RANDOM_UUID = "random_uuid"  # Generate UUID


class Variable(Base):
    """Variable storage model"""

    __tablename__ = "variables"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)

    # Variable definition
    name = Column(String(255), nullable=False)  # Variable name (used as [[name]])
    description = Column(Text, nullable=True)

    # Extraction configuration
    source = Column(SQLEnum(VariableSource), nullable=False, default=VariableSource.RESPONSE_BODY)
    extract_method = Column(SQLEnum(VariableExtractMethod), nullable=False, default=VariableExtractMethod.JSON_PATH)
    extract_pattern = Column(Text, nullable=True)  # JSON path, regex pattern, cookie name, etc.

    # For random generation
    random_length = Column(Integer, nullable=True, default=16)  # Length for random string/number
    random_format = Column(String(255), nullable=True)  # Format pattern (e.g., "###-###" for numbers)

    # Static value
    static_value = Column(Text, nullable=True)

    # Cached value (last extracted value)
    current_value = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_extracted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="variables")
    request = relationship("Request", foreign_keys=[request_id])

    def __repr__(self):
        return f"<Variable(id={self.id}, name='{self.name}', source='{self.source}')>"

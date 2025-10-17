"""Pydantic schemas for Variable"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.variable import VariableSource, VariableExtractMethod


class VariableBase(BaseModel):
    """Base variable schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Variable name (used as [[name]])")
    description: Optional[str] = None
    source: VariableSource = VariableSource.RESPONSE_BODY
    extract_method: VariableExtractMethod = VariableExtractMethod.JSON_PATH
    extract_pattern: Optional[str] = Field(None, description="JSON path, regex pattern, or identifier")
    random_length: Optional[int] = Field(16, ge=1, le=256)
    random_format: Optional[str] = None
    static_value: Optional[str] = None


class VariableCreate(VariableBase):
    """Schema for creating a variable"""
    workflow_id: int
    request_id: Optional[int] = None


class VariableUpdate(BaseModel):
    """Schema for updating a variable"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    source: Optional[VariableSource] = None
    extract_method: Optional[VariableExtractMethod] = None
    extract_pattern: Optional[str] = None
    random_length: Optional[int] = Field(None, ge=1, le=256)
    random_format: Optional[str] = None
    static_value: Optional[str] = None
    request_id: Optional[int] = None


class VariableResponse(VariableBase):
    """Schema for variable API response"""
    id: int
    workflow_id: int
    request_id: Optional[int]
    current_value: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_extracted_at: Optional[datetime]

    class Config:
        from_attributes = True

"""Pydantic schemas for Workflow"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class WorkflowStepSchema(BaseModel):
    """Schema for a workflow step"""
    order: int = Field(..., ge=1, description="Step order (1-based)")
    request_id: int = Field(..., description="Request to execute")
    continue_on_error: bool = Field(False, description="Continue workflow even if this step fails")
    extract_variables: List[str] = Field(default_factory=list, description="Variable names to extract after this step")


class WorkflowBase(BaseModel):
    """Base workflow schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = True
    schedule_enabled: bool = False
    schedule_interval: Optional[int] = Field(None, ge=60, description="Schedule interval in seconds (min 60)")


class WorkflowCreate(WorkflowBase):
    """Schema for creating a workflow"""
    steps: List[WorkflowStepSchema] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    """Schema for updating a workflow"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    steps: Optional[List[WorkflowStepSchema]] = None
    schedule_enabled: Optional[bool] = None
    schedule_interval: Optional[int] = Field(None, ge=60)


class WorkflowResponse(WorkflowBase):
    """Schema for workflow API response"""
    id: int
    steps: List[Dict[str, Any]]
    last_executed_at: Optional[datetime]
    last_execution_status: Optional[str]
    last_execution_error: Optional[str]
    execution_count: int
    success_count: int
    failure_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowWithVariables(WorkflowResponse):
    """Workflow with variables included"""
    variables: List[Dict[str, Any]] = []


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow"""
    workflow_id: int
    override_variables: Optional[Dict[str, str]] = Field(
        None,
        description="Override variable values for this execution"
    )


class WorkflowExecutionStepResult(BaseModel):
    """Result of a single workflow step"""
    order: int
    request_id: int
    status: str  # success, failed, skipped
    response_status: Optional[int]
    variables_extracted: Dict[str, str]
    error: Optional[str]
    duration_ms: float


class WorkflowExecutionResponse(BaseModel):
    """Response for workflow execution"""
    id: int
    workflow_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    steps_completed: int
    steps_total: int
    step_results: List[Dict[str, Any]]
    variables_extracted: Dict[str, str]
    error_message: Optional[str]
    error_step: Optional[int]

    class Config:
        from_attributes = True

"""Workflow execution model - tracks workflow execution history"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class WorkflowExecution(Base):
    """Workflow execution history model"""

    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)

    # Execution info
    status = Column(String(50), nullable=False)  # running, success, failed, partial
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    # Step results
    steps_completed = Column(Integer, nullable=False, default=0)
    steps_total = Column(Integer, nullable=False)
    step_results = Column(JSON, nullable=False, default=list)
    # Step result format: [
    #   {
    #     "order": 1,
    #     "request_id": 123,
    #     "status": "success",
    #     "response_status": 200,
    #     "variables_extracted": {"token": "abc123"},
    #     "error": null,
    #     "duration_ms": 150
    #   }
    # ]

    # Variables extracted during execution
    variables_extracted = Column(JSON, nullable=False, default=dict)

    # Error details
    error_message = Column(Text, nullable=True)
    error_step = Column(Integer, nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")

    def __repr__(self):
        return f"<WorkflowExecution(id={self.id}, workflow_id={self.workflow_id}, status='{self.status}')>"

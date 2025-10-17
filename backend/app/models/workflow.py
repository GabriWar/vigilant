"""Workflow model - chains requests with variables"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Workflow(Base):
    """Workflow model for chaining requests"""

    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Workflow configuration
    steps = Column(JSON, nullable=False, default=list)  # List of workflow steps
    # Step format: [
    #   {
    #     "order": 1,
    #     "request_id": 123,
    #     "continue_on_error": false,
    #     "extract_variables": ["var1", "var2"]
    #   }
    # ]

    # Schedule
    schedule_enabled = Column(Boolean, nullable=False, default=False)
    schedule_interval = Column(Integer, nullable=True)  # Interval in seconds

    # Execution tracking
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    last_execution_status = Column(String(50), nullable=True)  # success, failed, partial
    last_execution_error = Column(Text, nullable=True)
    execution_count = Column(Integer, nullable=False, default=0)
    success_count = Column(Integer, nullable=False, default=0)
    failure_count = Column(Integer, nullable=False, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    variables = relationship("Variable", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workflow(id={self.id}, name='{self.name}', steps={len(self.steps)})>"

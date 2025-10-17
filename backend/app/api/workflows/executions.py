"""Get workflow executions endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.workflow_execution import WorkflowExecution
from app.schemas.workflow import WorkflowExecutionResponse

router = APIRouter()


@router.get("/{workflow_id}/executions", response_model=List[WorkflowExecutionResponse])
async def get_workflow_executions(
    workflow_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Get execution history for a workflow

    Args:
        workflow_id: Workflow ID
        skip: Number of records to skip
        limit: Maximum number of records
        db: Database session

    Returns:
        List of workflow executions
    """
    query = (
        select(WorkflowExecution)
        .where(WorkflowExecution.workflow_id == workflow_id)
        .offset(skip)
        .limit(limit)
        .order_by(WorkflowExecution.started_at.desc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())

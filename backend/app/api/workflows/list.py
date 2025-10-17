"""List workflows endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowResponse

router = APIRouter()


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all workflows

    Args:
        skip: Number of records to skip
        limit: Maximum number of records
        is_active: Filter by active status
        db: Database session

    Returns:
        List of workflows
    """
    query = select(Workflow)

    if is_active is not None:
        query = query.where(Workflow.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(Workflow.created_at.desc())
    result = await db.execute(query)

    return list(result.scalars().all())

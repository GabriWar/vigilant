"""Get workflow endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowWithVariables
from app.schemas.variable import VariableResponse

router = APIRouter()


@router.get("/{workflow_id}", response_model=WorkflowWithVariables)
async def get_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get workflow by ID with variables

    Args:
        workflow_id: Workflow ID
        db: Database session

    Returns:
        Workflow with variables
    """
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .options(selectinload(Workflow.variables))
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found"
        )

    # Convert to response format
    response_data = WorkflowWithVariables.model_validate(workflow).model_dump()
    response_data['variables'] = [
        VariableResponse.model_validate(var).model_dump()
        for var in workflow.variables
    ]

    return response_data

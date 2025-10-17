"""Update workflow endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowUpdate, WorkflowResponse

router = APIRouter()


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update workflow

    Args:
        workflow_id: Workflow ID
        workflow_data: Updated workflow data
        db: Database session

    Returns:
        Updated workflow
    """
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found"
        )

    # Update fields
    update_data = workflow_data.model_dump(exclude_unset=True)

    # Handle steps separately (convert to dict)
    if 'steps' in update_data and update_data['steps']:
        update_data['steps'] = [step.model_dump() if hasattr(step, 'model_dump') else step for step in update_data['steps']]

    for field, value in update_data.items():
        setattr(workflow, field, value)

    await db.commit()
    await db.refresh(workflow)

    return workflow

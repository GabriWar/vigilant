"""Create workflow endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowResponse

router = APIRouter()


@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new workflow

    Args:
        workflow_data: Workflow configuration
        db: Database session

    Returns:
        Created workflow
    """
    # Check if name already exists
    from sqlalchemy import select
    result = await db.execute(select(Workflow).where(Workflow.name == workflow_data.name))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow with name '{workflow_data.name}' already exists"
        )

    # Create workflow
    workflow = Workflow(
        **workflow_data.model_dump(exclude={'steps'}),
        steps=[step.model_dump() for step in workflow_data.steps]
    )

    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return workflow

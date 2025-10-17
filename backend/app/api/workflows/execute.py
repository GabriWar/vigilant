"""Execute workflow endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, AsyncSessionLocal
from app.schemas.workflow import WorkflowExecutionRequest, WorkflowExecutionResponse
from app.services.workflow_service import WorkflowExecutor

router = APIRouter()


async def execute_workflow_background(workflow_id: int, override_variables: dict | None):
    """Execute workflow in background"""
    async with AsyncSessionLocal() as db:
        executor = WorkflowExecutor(db)
        await executor.execute_workflow(workflow_id, override_variables)


@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    workflow_id: int,
    execution_request: WorkflowExecutionRequest | None = None,
    background: bool = False,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute a workflow

    Args:
        workflow_id: Workflow ID
        execution_request: Optional execution parameters
        background: Execute in background (returns immediately)
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Workflow execution result
    """
    override_vars = execution_request.override_variables if execution_request else None

    if background:
        # Execute in background
        background_tasks.add_task(execute_workflow_background, workflow_id, override_vars)
        return {
            "status": "queued",
            "message": f"Workflow {workflow_id} queued for execution"
        }
    else:
        # Execute synchronously
        executor = WorkflowExecutor(db)
        execution = await executor.execute_workflow(workflow_id, override_vars)
        return execution

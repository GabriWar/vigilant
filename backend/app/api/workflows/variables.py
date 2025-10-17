"""Workflow variables endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.variable import Variable
from app.schemas.variable import VariableCreate, VariableUpdate, VariableResponse

router = APIRouter()


@router.post("/{workflow_id}/variables", response_model=VariableResponse, status_code=status.HTTP_201_CREATED)
async def create_variable(
    workflow_id: int,
    variable_data: VariableCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new variable for a workflow"""
    # Verify workflow_id matches
    if variable_data.workflow_id != workflow_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow ID mismatch"
        )

    variable = Variable(**variable_data.model_dump())
    db.add(variable)
    await db.commit()
    await db.refresh(variable)

    return variable


@router.get("/{workflow_id}/variables", response_model=List[VariableResponse])
async def list_variables(
    workflow_id: int,
    db: AsyncSession = Depends(get_db)
):
    """List all variables for a workflow"""
    result = await db.execute(
        select(Variable)
        .where(Variable.workflow_id == workflow_id)
        .order_by(Variable.created_at)
    )
    return list(result.scalars().all())


@router.get("/{workflow_id}/variables/{variable_id}", response_model=VariableResponse)
async def get_variable(
    workflow_id: int,
    variable_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific variable"""
    result = await db.execute(
        select(Variable)
        .where(Variable.id == variable_id, Variable.workflow_id == workflow_id)
    )
    variable = result.scalar_one_or_none()

    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variable {variable_id} not found"
        )

    return variable


@router.put("/{workflow_id}/variables/{variable_id}", response_model=VariableResponse)
async def update_variable(
    workflow_id: int,
    variable_id: int,
    variable_data: VariableUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a variable"""
    result = await db.execute(
        select(Variable)
        .where(Variable.id == variable_id, Variable.workflow_id == workflow_id)
    )
    variable = result.scalar_one_or_none()

    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variable {variable_id} not found"
        )

    # Update fields
    update_data = variable_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(variable, field, value)

    await db.commit()
    await db.refresh(variable)

    return variable


@router.delete("/{workflow_id}/variables/{variable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variable(
    workflow_id: int,
    variable_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a variable"""
    result = await db.execute(
        select(Variable)
        .where(Variable.id == variable_id, Variable.workflow_id == workflow_id)
    )
    variable = result.scalar_one_or_none()

    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variable {variable_id} not found"
        )

    await db.delete(variable)
    await db.commit()

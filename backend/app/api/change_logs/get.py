"""Get change log endpoint with full diff"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.change_log import ChangeLogWithDiff
from app.services.change_log_service import ChangeLogService

router = APIRouter()


@router.get("/{log_id}", response_model=ChangeLogWithDiff)
async def get_change_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get change log by ID with full diff content
    
    Args:
        log_id: Change log ID
        db: Database session
    
    Returns:
        Change log with decoded diff content
    """
    change_log = await ChangeLogService.get_change_log_with_diff(db, log_id)
    
    if not change_log:
        raise HTTPException(status_code=404, detail="Change log not found")
    
    return change_log

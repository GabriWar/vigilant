"""Compare change logs endpoint"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.change_log import ChangeLogComparison
from app.services.change_log_service import ChangeLogService

router = APIRouter()


@router.post("/compare", response_model=ChangeLogComparison)
async def compare_change_logs(
    log_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """
    Compare multiple change logs side by side
    
    Args:
        log_ids: List of change log IDs to compare (2-5 logs max)
        db: Database session
    
    Returns:
        Comparison data with diffs and metadata
    """
    if len(log_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 change logs required for comparison")
    
    if len(log_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 change logs can be compared at once")
    
    comparison = await ChangeLogService.compare_change_logs(db, log_ids)
    
    if not comparison:
        raise HTTPException(status_code=404, detail="One or more change logs not found")
    
    return comparison

"""Change logs statistics endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.change_log import ChangeLogStatistics
from app.services.change_log_service import ChangeLogService
from typing import Optional

router = APIRouter()


@router.get("/statistics", response_model=ChangeLogStatistics)
async def get_change_log_statistics(
    watcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    group_by: str = Query("day", pattern="^(day|week|month)$", description="Group frequency data by"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive change log statistics
    
    Args:
        watcher_id: Filter by watcher ID
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
        group_by: Group frequency data by day/week/month
        db: Database session
    
    Returns:
        Comprehensive statistics including totals, frequency data, and top watchers
    """
    statistics = await ChangeLogService.get_statistics(
        db,
        watcher_id=watcher_id,
        date_from=date_from,
        date_to=date_to,
        group_by=group_by
    )
    
    return statistics

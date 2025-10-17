"""List change logs endpoint with advanced filtering"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.change_log import ChangeLogListResponse
from app.services.change_log_service import ChangeLogService
from app.dependencies import verify_pagination

router = APIRouter()


@router.get("/", response_model=List[ChangeLogListResponse])
async def list_change_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    watcher_id: Optional[int] = Query(None),
    change_type: Optional[str] = Query(None, pattern="^(new|modified|error|unchanged)$"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    min_size: Optional[int] = Query(None, ge=0, description="Minimum change size in bytes"),
    max_size: Optional[int] = Query(None, ge=0, description="Maximum change size in bytes"),
    search: Optional[str] = Query(None, description="Search in diff content"),
    order_by: str = Query("detected_at", pattern="^(detected_at|new_size|change_type)$"),
    order_direction: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of change logs with advanced filtering
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        watcher_id: Filter by watcher ID
        change_type: Filter by change type (new, modified, error)
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
        min_size: Minimum change size in bytes
        max_size: Maximum change size in bytes
        search: Search in diff content
        order_by: Field to order by
        order_direction: Order direction (asc/desc)
        db: Database session
    
    Returns:
        List of change logs (without binary content)
    """
    verify_pagination(skip, limit)
    
    change_logs = await ChangeLogService.get_change_logs_with_filters(
        db,
        skip=skip,
        limit=limit,
        watcher_id=watcher_id,
        change_type=change_type,
        date_from=date_from,
        date_to=date_to,
        min_size=min_size,
        max_size=max_size,
        search=search,
        order_by=order_by,
        order_direction=order_direction
    )
    
    return change_logs

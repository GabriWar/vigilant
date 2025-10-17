"""List monitors endpoint"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.monitor import MonitorResponse
from app.services.monitor_service import MonitorService
from app.dependencies import verify_pagination

router = APIRouter()


@router.get("/", response_model=List[MonitorResponse])
async def list_monitors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    monitor_type: Optional[str] = Query(None, pattern="^(webpage|api)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all monitors
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_active: Filter by active status
        monitor_type: Filter by monitor type
        db: Database session
    
    Returns:
        List of monitors
    """
    verify_pagination(skip, limit)
    monitors = await MonitorService.get_monitors(
        db,
        skip=skip,
        limit=limit,
        is_active=is_active,
        monitor_type=monitor_type
    )
    return monitors

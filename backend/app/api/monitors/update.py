"""Update monitor endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.monitor import MonitorUpdate, MonitorResponse
from app.services.monitor_service import MonitorService

router = APIRouter()


@router.put("/{monitor_id}", response_model=MonitorResponse)
async def update_monitor(
    monitor_id: int,
    monitor_update: MonitorUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a monitor
    
    Args:
        monitor_id: Monitor ID
        monitor_update: Monitor update data
        db: Database session
    
    Returns:
        Updated monitor
    
    Raises:
        HTTPException: If monitor not found
    """
    monitor = await MonitorService.update_monitor(db, monitor_id, monitor_update)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor with id {monitor_id} not found"
        )
    return monitor

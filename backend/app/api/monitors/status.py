"""Monitor status endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.monitor import MonitorResponse
from app.services.monitor_service import MonitorService

router = APIRouter()


class MonitorStatusUpdate(BaseModel):
    """Schema for updating monitor status"""
    status: str
    error_message: str | None = None


@router.get("/{monitor_id}/status", response_model=MonitorResponse)
async def get_monitor_status(
    monitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current monitor status
    
    Args:
        monitor_id: Monitor ID
        db: Database session
    
    Returns:
        Monitor with current status
    
    Raises:
        HTTPException: If monitor not found
    """
    monitor = await MonitorService.get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor with id {monitor_id} not found"
        )
    return monitor


@router.patch("/{monitor_id}/status", response_model=MonitorResponse)
async def update_monitor_status(
    monitor_id: int,
    status_update: MonitorStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update monitor status
    
    Args:
        monitor_id: Monitor ID
        status_update: Status update data
        db: Database session
    
    Returns:
        Updated monitor
    
    Raises:
        HTTPException: If monitor not found
    """
    monitor = await MonitorService.update_status(
        db,
        monitor_id,
        status_update.status,
        status_update.error_message
    )
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor with id {monitor_id} not found"
        )
    return monitor

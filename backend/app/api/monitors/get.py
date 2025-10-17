"""Get single monitor endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.monitor import MonitorResponse
from app.services.monitor_service import MonitorService

router = APIRouter()


@router.get("/{monitor_id}", response_model=MonitorResponse)
async def get_monitor(
    monitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single monitor by ID
    
    Args:
        monitor_id: Monitor ID
        db: Database session
    
    Returns:
        Monitor details
    
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

"""Delete monitor endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.monitor_service import MonitorService

router = APIRouter()


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monitor(
    monitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a monitor
    
    Args:
        monitor_id: Monitor ID
        db: Database session
    
    Raises:
        HTTPException: If monitor not found
    """
    deleted = await MonitorService.delete_monitor(db, monitor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor with id {monitor_id} not found"
        )

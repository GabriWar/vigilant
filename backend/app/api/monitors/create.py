"""Create monitor endpoint"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.monitor import MonitorCreate, MonitorResponse
from app.services.monitor_service import MonitorService

router = APIRouter()


@router.post("/", response_model=MonitorResponse, status_code=status.HTTP_201_CREATED)
async def create_monitor(
    monitor: MonitorCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new monitor
    
    Args:
        monitor: Monitor data
        db: Database session
    
    Returns:
        Created monitor
    """
    new_monitor = await MonitorService.create_monitor(db, monitor)
    return new_monitor

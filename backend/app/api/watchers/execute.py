"""Watcher execution endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.watcher_service import WatcherService
from app.services.watcher_executor import WatcherExecutor
from loguru import logger

router = APIRouter()


@router.post("/{watcher_id}/execute")
async def execute_watcher(
    watcher_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Execute a watcher manually"""
    try:
        # Get the watcher
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if not watcher:
            raise HTTPException(status_code=404, detail="Watcher not found")
        
        if not watcher.is_active:
            raise HTTPException(status_code=400, detail="Watcher is not active")
        
        # Execute the watcher
        logger.info(f"Manual execution requested for watcher {watcher_id}")
        result = await WatcherExecutor.execute_watcher(db, watcher)
        
        return {
            "message": "Watcher executed successfully",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing watcher {watcher_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

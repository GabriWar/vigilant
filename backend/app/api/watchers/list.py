"""Watcher list and create endpoints"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.watcher import WatcherCreate, WatcherResponse, WatcherListResponse, WatcherStatistics
from app.services.watcher_service import WatcherService
from app.services.change_log_service import ChangeLogService

router = APIRouter()


@router.get("/", response_model=List[WatcherListResponse])
async def get_watchers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    execution_mode: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get list of watchers with optional filters"""
    try:
        watchers = await WatcherService.get_watchers(
            db, skip=skip, limit=limit, is_active=is_active, execution_mode=execution_mode
        )
        return watchers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=WatcherResponse)
async def create_watcher(
    watcher_data: WatcherCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new watcher"""
    try:
        watcher = await WatcherService.create_watcher(db, watcher_data)
        return watcher
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics", response_model=WatcherStatistics)
async def get_watcher_statistics(db: AsyncSession = Depends(get_db)):
    """Get watcher statistics"""
    try:
        stats = await WatcherService.get_statistics(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

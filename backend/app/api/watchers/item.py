"""Individual watcher operations (get, update, delete)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.watcher import WatcherResponse, WatcherUpdate
from app.services.watcher_service import WatcherService

router = APIRouter()


@router.get("/{watcher_id}", response_model=WatcherResponse)
async def get_watcher(
    watcher_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific watcher by ID"""
    try:
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if not watcher:
            raise HTTPException(status_code=404, detail="Watcher not found")
        return watcher
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{watcher_id}", response_model=WatcherResponse)
async def update_watcher(
    watcher_id: int,
    watcher_data: WatcherUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a watcher"""
    try:
        watcher = await WatcherService.update_watcher(db, watcher_id, watcher_data)
        if not watcher:
            raise HTTPException(status_code=404, detail="Watcher not found")
        return watcher
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{watcher_id}")
async def delete_watcher(
    watcher_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a watcher"""
    try:
        success = await WatcherService.delete_watcher(db, watcher_id)
        if not success:
            raise HTTPException(status_code=404, detail="Watcher not found")
        return {"message": "Watcher deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

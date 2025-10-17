"""List images endpoint"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.image import ImageResponse
from app.services.image_service import ImageService
from app.dependencies import verify_pagination

router = APIRouter()


@router.get("/", response_model=List[ImageResponse])
async def list_images(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    monitor_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all images
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        monitor_id: Filter by monitor ID
        db: Database session
    
    Returns:
        List of images
    """
    verify_pagination(skip, limit)
    images = await ImageService.get_images(
        db,
        skip=skip,
        limit=limit,
        monitor_id=monitor_id
    )
    return images
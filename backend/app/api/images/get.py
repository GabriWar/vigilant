"""Get image endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.image import ImageResponse
from app.services.image_service import ImageService

router = APIRouter()


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get image by ID
    
    Args:
        image_id: Image ID
        db: Database session
    
    Returns:
        Image details
    """
    image = await ImageService.get_image(db, image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return image
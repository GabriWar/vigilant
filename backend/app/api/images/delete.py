"""Delete image endpoint"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.image_service import ImageService

router = APIRouter()


@router.delete("/{image_id}")
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete image by ID
    
    Args:
        image_id: Image ID
        db: Database session
    
    Returns:
        Success message
    """
    await ImageService.delete_image(db, image_id)
    return {"message": "Image deleted successfully"}
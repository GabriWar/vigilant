"""Image service - business logic for images"""
from typing import List, Optional
from sqlalchemy import select, delete as sql_delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.image import Image


class ImageService:
    """Service for image operations"""

    @staticmethod
    async def get_image(db: AsyncSession, image_id: int) -> Optional[Image]:
        """Get image by ID"""
        result = await db.execute(select(Image).where(Image.id == image_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_images(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        monitor_id: Optional[int] = None
    ) -> List[Image]:
        """Get list of images with optional filtering"""
        query = select(Image)
        
        if monitor_id:
            query = query.where(Image.monitor_id == monitor_id)
        
        query = query.order_by(Image.downloaded_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def delete_image(db: AsyncSession, image_id: int) -> bool:
        """Delete image by ID"""
        result = await db.execute(select(Image).where(Image.id == image_id))
        image = result.scalar_one_or_none()
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        await db.delete(image)
        await db.commit()
        return True
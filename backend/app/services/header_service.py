"""Header service"""
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.header import Header
from app.schemas.header import HeaderCreate, HeaderUpdate


class HeaderService:
    """Service for managing headers"""

    @staticmethod
    async def create_header(db: AsyncSession, header_data: HeaderCreate) -> Header:
        """Create a new header"""
        header = Header(
            name=header_data.name,
            value=header_data.value,
            description=header_data.description,
            is_active=header_data.is_active
        )
        db.add(header)
        await db.commit()
        await db.refresh(header)
        return header

    @staticmethod
    async def get_header(db: AsyncSession, header_id: int) -> Optional[Header]:
        """Get a header by ID"""
        result = await db.execute(select(Header).where(Header.id == header_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_headers(db: AsyncSession, skip: int = 0, limit: int = 100, active_only: bool = False) -> List[Header]:
        """Get all headers with optional filtering"""
        query = select(Header)
        
        if active_only:
            query = query.where(Header.is_active == True)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_header(db: AsyncSession, header_id: int, header_data: HeaderUpdate) -> Optional[Header]:
        """Update a header"""
        header = await HeaderService.get_header(db, header_id)
        if not header:
            return None

        update_data = header_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(header, field, value)

        await db.commit()
        await db.refresh(header)
        return header

    @staticmethod
    async def delete_header(db: AsyncSession, header_id: int) -> bool:
        """Delete a header"""
        header = await HeaderService.get_header(db, header_id)
        if not header:
            return False

        await db.delete(header)
        await db.commit()
        return True

    @staticmethod
    async def get_active_headers_dict(db: AsyncSession) -> dict:
        """Get all active headers as a dictionary"""
        headers = await HeaderService.get_headers(db, active_only=True)
        return {header.name: header.value for header in headers}

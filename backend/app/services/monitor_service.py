"""Monitor service - business logic for monitors"""
from typing import List, Optional
from sqlalchemy import select, update as sql_update, delete as sql_delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.monitor import Monitor
from app.schemas.monitor import MonitorCreate, MonitorUpdate


class MonitorService:
    """Service for monitor operations"""

    @staticmethod
    async def create_monitor(db: AsyncSession, monitor_data: MonitorCreate) -> Monitor:
        """Create a new monitor"""
        monitor = Monitor(**monitor_data.model_dump())
        db.add(monitor)
        await db.commit()
        await db.refresh(monitor)
        return monitor

    @staticmethod
    async def get_monitor(db: AsyncSession, monitor_id: int) -> Optional[Monitor]:
        """Get monitor by ID"""
        result = await db.execute(select(Monitor).where(Monitor.id == monitor_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_monitors(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        monitor_type: Optional[str] = None
    ) -> List[Monitor]:
        """Get list of monitors with optional filters"""
        query = select(Monitor)

        if is_active is not None:
            query = query.where(Monitor.is_active == is_active)
        if monitor_type:
            query = query.where(Monitor.monitor_type == monitor_type)

        query = query.offset(skip).limit(limit).order_by(Monitor.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count_monitors(db: AsyncSession) -> int:
        """Count total monitors"""
        result = await db.execute(select(func.count(Monitor.id)))
        return result.scalar()

    @staticmethod
    async def update_monitor(
        db: AsyncSession,
        monitor_id: int,
        monitor_data: MonitorUpdate
    ) -> Optional[Monitor]:
        """Update monitor"""
        monitor = await MonitorService.get_monitor(db, monitor_id)
        if not monitor:
            return None

        update_data = monitor_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(monitor, field, value)

        await db.commit()
        await db.refresh(monitor)
        return monitor

    @staticmethod
    async def delete_monitor(db: AsyncSession, monitor_id: int) -> bool:
        """Delete monitor"""
        monitor = await MonitorService.get_monitor(db, monitor_id)
        if not monitor:
            return False

        await db.delete(monitor)
        await db.commit()
        return True

    @staticmethod
    async def update_status(
        db: AsyncSession,
        monitor_id: int,
        status: str,
        error_message: Optional[str] = None
    ) -> Optional[Monitor]:
        """Update monitor status"""
        monitor = await MonitorService.get_monitor(db, monitor_id)
        if not monitor:
            return None

        monitor.status = status
        monitor.error_message = error_message
        await db.commit()
        await db.refresh(monitor)
        return monitor

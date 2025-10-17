"""Watcher service - business logic for watchers"""
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.watcher import Watcher
from app.schemas.watcher import WatcherCreate, WatcherUpdate, WatcherStatistics


class WatcherService:
    """Service for watcher operations"""

    @staticmethod
    async def create_watcher(db: AsyncSession, watcher_data: WatcherCreate) -> Watcher:
        """Create a new watcher"""
        watcher = Watcher(**watcher_data.model_dump())
        db.add(watcher)
        await db.commit()
        await db.refresh(watcher)
        return watcher

    @staticmethod
    async def get_watcher(db: AsyncSession, watcher_id: int) -> Optional[Watcher]:
        """Get watcher by ID"""
        result = await db.execute(select(Watcher).where(Watcher.id == watcher_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_watchers(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        execution_mode: Optional[str] = None,
        content_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Watcher]:
        """Get list of watchers with optional filters"""
        query = select(Watcher)

        if is_active is not None:
            query = query.where(Watcher.is_active == is_active)
        if execution_mode:
            query = query.where(Watcher.execution_mode == execution_mode)
        if content_type:
            query = query.where(Watcher.content_type == content_type)
        if search:
            query = query.where(
                (Watcher.name.ilike(f"%{search}%")) |
                (Watcher.url.ilike(f"%{search}%"))
            )

        query = query.offset(skip).limit(limit).order_by(Watcher.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count_watchers(
        db: AsyncSession,
        is_active: Optional[bool] = None,
        execution_mode: Optional[str] = None
    ) -> int:
        """Count total watchers with optional filters"""
        query = select(func.count(Watcher.id))
        
        if is_active is not None:
            query = query.where(Watcher.is_active == is_active)
        if execution_mode:
            query = query.where(Watcher.execution_mode == execution_mode)
            
        result = await db.execute(query)
        return result.scalar()

    @staticmethod
    async def update_watcher(
        db: AsyncSession,
        watcher_id: int,
        watcher_data: WatcherUpdate
    ) -> Optional[Watcher]:
        """Update watcher"""
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if not watcher:
            return None

        update_data = watcher_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(watcher, field, value)

        await db.commit()
        await db.refresh(watcher)
        return watcher

    @staticmethod
    async def delete_watcher(db: AsyncSession, watcher_id: int) -> bool:
        """Delete watcher"""
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if not watcher:
            return False

        await db.delete(watcher)
        await db.commit()
        return True

    @staticmethod
    async def update_status(
        db: AsyncSession,
        watcher_id: int,
        status: str,
        error_message: Optional[str] = None
    ) -> Optional[Watcher]:
        """Update watcher status"""
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if not watcher:
            return None

        watcher.status = status
        watcher.error_message = error_message
        await db.commit()
        await db.refresh(watcher)
        return watcher

    @staticmethod
    async def increment_check_count(db: AsyncSession, watcher_id: int) -> None:
        """Increment watcher check count"""
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if watcher:
            watcher.check_count += 1
            await db.commit()

    @staticmethod
    async def increment_change_count(db: AsyncSession, watcher_id: int) -> None:
        """Increment watcher change count"""
        watcher = await WatcherService.get_watcher(db, watcher_id)
        if watcher:
            watcher.change_count += 1
            await db.commit()

    @staticmethod
    async def get_statistics(db: AsyncSession) -> WatcherStatistics:
        """Get watcher statistics"""
        # Total watchers
        total_result = await db.execute(select(func.count(Watcher.id)))
        total_watchers = total_result.scalar() or 0

        # Active watchers
        active_result = await db.execute(
            select(func.count(Watcher.id)).where(Watcher.is_active == True)
        )
        active_watchers = active_result.scalar() or 0

        # Inactive watchers
        inactive_watchers = total_watchers - active_watchers

        # Total checks and changes
        checks_result = await db.execute(select(func.sum(Watcher.check_count)))
        total_checks = checks_result.scalar() or 0

        changes_result = await db.execute(select(func.sum(Watcher.change_count)))
        total_changes = changes_result.scalar() or 0

        # By execution mode
        execution_mode_result = await db.execute(
            select(Watcher.execution_mode, func.count(Watcher.id))
            .group_by(Watcher.execution_mode)
        )
        by_execution_mode = {mode: count for mode, count in execution_mode_result.all()}

        # By status
        status_result = await db.execute(
            select(Watcher.status, func.count(Watcher.id))
            .group_by(Watcher.status)
        )
        by_status = {status: count for status, count in status_result.all()}

        # By content type
        content_type_result = await db.execute(
            select(Watcher.content_type, func.count(Watcher.id))
            .group_by(Watcher.content_type)
        )
        by_content_type = {content_type: count for content_type, count in content_type_result.all()}

        return WatcherStatistics(
            total_watchers=total_watchers,
            active_watchers=active_watchers,
            inactive_watchers=inactive_watchers,
            total_checks=total_checks,
            total_changes=total_changes,
            by_execution_mode=by_execution_mode,
            by_status=by_status,
            by_content_type=by_content_type
        )


"""ChangeLog service - business logic for change log management"""
from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.change_log import ChangeLog
from app.schemas.change_log import ChangeLogCreate


class ChangeLogService:
    """Service for change log operations"""

    @staticmethod
    async def create_change_log(db: AsyncSession, log_data: ChangeLogCreate) -> ChangeLog:
        """Create a new change log"""
        change_log = ChangeLog(**log_data.model_dump())
        db.add(change_log)
        await db.commit()
        await db.refresh(change_log)
        return change_log

    @staticmethod
    async def get_change_log(db: AsyncSession, log_id: int) -> Optional[ChangeLog]:
        """Get change log by ID"""
        result = await db.execute(select(ChangeLog).where(ChangeLog.id == log_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_change_logs(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        monitor_id: Optional[int] = None,
        request_id: Optional[int] = None,
        change_type: Optional[str] = None
    ) -> List[ChangeLog]:
        """
        Get all change logs with optional filtering

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            monitor_id: Filter by monitor ID
            request_id: Filter by request ID
            change_type: Filter by change type (new, modified, error)

        Returns:
            List of change logs
        """
        query = select(ChangeLog)

        # Apply filters
        filters = []
        if monitor_id:
            filters.append(ChangeLog.monitor_id == monitor_id)
        if request_id:
            filters.append(ChangeLog.request_id == request_id)
        if change_type:
            filters.append(ChangeLog.change_type == change_type)

        if filters:
            query = query.where(and_(*filters))

        query = query.offset(skip).limit(limit).order_by(ChangeLog.detected_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def delete_change_log(db: AsyncSession, log_id: int) -> bool:
        """Delete change log"""
        change_log = await ChangeLogService.get_change_log(db, log_id)
        if not change_log:
            return False

        await db.delete(change_log)
        await db.commit()
        return True

    @staticmethod
    async def get_change_log_statistics(db: AsyncSession) -> dict:
        """
        Get statistics about change logs

        Returns:
            Dictionary with change log statistics
        """
        from sqlalchemy import func

        # Total logs
        total_result = await db.execute(select(func.count(ChangeLog.id)))
        total_logs = total_result.scalar()

        # By type
        new_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(ChangeLog.change_type == 'new')
        )
        new_logs = new_result.scalar()

        modified_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(ChangeLog.change_type == 'modified')
        )
        modified_logs = modified_result.scalar()

        error_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(ChangeLog.change_type == 'error')
        )
        error_logs = error_result.scalar()

        return {
            "total": total_logs,
            "new": new_logs,
            "modified": modified_logs,
            "error": error_logs
        }

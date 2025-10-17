"""ChangeLog service - business logic for change log management"""
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, or_, func, desc, asc, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.models.change_log import ChangeLog
from app.models.watcher import Watcher
from app.schemas.change_log import ChangeLogCreate, ChangeLogListResponse, ChangeLogStatistics, ChangeLogComparison, ChangeLogComparisonItem, FrequencyDataPoint, TopWatcher, ChangeLogWithDiff


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
        watcher_id: Optional[int] = None,
        change_type: Optional[str] = None
    ) -> List[ChangeLog]:
        """
        Get all change logs with optional filtering

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            watcher_id: Filter by watcher ID
            change_type: Filter by change type (new, modified, error)

        Returns:
            List of change logs
        """
        query = select(ChangeLog)

        # Apply filters
        filters = []
        if watcher_id:
            filters.append(ChangeLog.watcher_id == watcher_id)
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
    async def get_change_logs_with_filters(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        watcher_id: Optional[int] = None,
        change_type: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_size: Optional[int] = None,
        max_size: Optional[int] = None,
        search: Optional[str] = None,
        order_by: str = "detected_at",
        order_direction: str = "desc"
    ) -> List[ChangeLogListResponse]:
        """
        Get change logs with advanced filtering

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            watcher_id: Filter by watcher ID
            change_type: Filter by change type
            date_from: Filter from date (YYYY-MM-DD)
            date_to: Filter to date (YYYY-MM-DD)
            min_size: Minimum change size
            max_size: Maximum change size
            search: Search in diff content
            order_by: Field to order by
            order_direction: Order direction

        Returns:
            List of change logs with watcher names
        """
        # Build query with joins
        query = select(ChangeLog).options(
            selectinload(ChangeLog.watcher)
        )

        # Apply filters
        filters = []
        if watcher_id:
            filters.append(ChangeLog.watcher_id == watcher_id)
        if change_type:
            filters.append(ChangeLog.change_type == change_type)
        if date_from:
            filters.append(ChangeLog.detected_at >= datetime.fromisoformat(date_from))
        if date_to:
            filters.append(ChangeLog.detected_at <= datetime.fromisoformat(date_to + " 23:59:59"))
        if min_size:
            filters.append(ChangeLog.new_size >= min_size)
        if max_size:
            filters.append(ChangeLog.new_size <= max_size)
        if search:
            # Search in diff content (if available)
            filters.append(ChangeLog.diff.contains(search.encode()))

        if filters:
            query = query.where(and_(*filters))

        # Apply ordering
        order_column = getattr(ChangeLog, order_by)
        if order_direction == "desc":
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(asc(order_column))

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        change_logs = result.scalars().all()

        # Convert to response format
        response_logs = []
        for log in change_logs:
            response_logs.append(ChangeLogListResponse(
                id=log.id,
                watcher_id=log.watcher_id,
                change_type=log.change_type,
                new_hash=log.new_hash,
                new_size=log.new_size,
                old_hash=log.old_hash,
                old_size=log.old_size,
                archive_path=log.archive_path,
                detected_at=log.detected_at,
                watcher_name=log.watcher.name if log.watcher else "Unknown",
                watcher_url=log.watcher.url if log.watcher else ""
            ))

        return response_logs

    @staticmethod
    async def get_change_log_with_diff(db: AsyncSession, log_id: int) -> Optional[ChangeLogWithDiff]:
        """
        Get change log by ID with decoded diff content

        Args:
            db: Database session
            log_id: Change log ID

        Returns:
            Change log with decoded diff or None
        """
        result = await db.execute(
            select(ChangeLog)
            .options(selectinload(ChangeLog.watcher))
            .where(ChangeLog.id == log_id)
        )
        change_log = result.scalar_one_or_none()
        
        if not change_log:
            return None

        # Decode diff if available
        diff_str = None
        if change_log.diff:
            try:
                diff_str = change_log.diff.decode('utf-8')
            except UnicodeDecodeError:
                diff_str = "[Binary content - cannot display]"

        return ChangeLogWithDiff(
            id=change_log.id,
            watcher_id=change_log.watcher_id,
            change_type=change_log.change_type,
            new_hash=change_log.new_hash,
            new_size=change_log.new_size,
            old_hash=change_log.old_hash,
            old_size=change_log.old_size,
            archive_path=change_log.archive_path,
            detected_at=change_log.detected_at,
            diff=diff_str
        )

    @staticmethod
    async def get_statistics(
        db: AsyncSession,
        watcher_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        group_by: str = "day"
    ) -> ChangeLogStatistics:
        """
        Get comprehensive change log statistics

        Args:
            db: Database session
            watcher_id: Filter by watcher ID
            date_from: Filter from date
            date_to: Filter to date
            group_by: Group frequency data by day/week/month

        Returns:
            Comprehensive statistics
        """
        # Build base query
        base_query = select(ChangeLog)
        filters = []
        
        if watcher_id:
            filters.append(ChangeLog.watcher_id == watcher_id)
        if date_from:
            filters.append(ChangeLog.detected_at >= datetime.fromisoformat(date_from))
        if date_to:
            filters.append(ChangeLog.detected_at <= datetime.fromisoformat(date_to + " 23:59:59"))

        if filters:
            base_query = base_query.where(and_(*filters))

        # Get totals
        total_result = await db.execute(select(func.count(ChangeLog.id)).select_from(base_query.subquery()))
        total_changes = total_result.scalar()

        # Get counts by type
        new_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(and_(ChangeLog.change_type == 'new', *filters))
        )
        new_changes = new_result.scalar()

        modified_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(and_(ChangeLog.change_type == 'modified', *filters))
        )
        modified_changes = modified_result.scalar()

        error_result = await db.execute(
            select(func.count(ChangeLog.id))
            .where(and_(ChangeLog.change_type == 'error', *filters))
        )
        error_changes = error_result.scalar()

        # Get size statistics
        size_result = await db.execute(
            select(
                func.avg(ChangeLog.new_size).label('avg_size'),
                func.min(ChangeLog.new_size).label('min_size'),
                func.max(ChangeLog.new_size).label('max_size'),
                func.sum(ChangeLog.new_size).label('total_size')
            ).where(and_(*filters))
        )
        size_stats = size_result.first()
        
        avg_change_size = float(size_stats.avg_size) if size_stats.avg_size else 0.0
        min_change_size = int(size_stats.min_size) if size_stats.min_size else 0
        max_change_size = int(size_stats.max_size) if size_stats.max_size else 0
        total_size_change = int(size_stats.total_size) if size_stats.total_size else 0

        # Get frequency data
        frequency_data = await ChangeLogService.get_frequency_data(db, filters, group_by)

        # Get top watchers
        top_watchers = await ChangeLogService.get_top_watchers(db, filters)

        return ChangeLogStatistics(
            total_changes=total_changes,
            new_changes=new_changes,
            modified_changes=modified_changes,
            error_changes=error_changes,
            avg_change_size=avg_change_size,
            min_change_size=min_change_size,
            max_change_size=max_change_size,
            total_size_change=total_size_change,
            frequency_data=frequency_data,
            top_watchers=top_watchers,
            date_from=date_from,
            date_to=date_to
        )

    @staticmethod
    async def get_frequency_data(db: AsyncSession, filters: List, group_by: str) -> List[FrequencyDataPoint]:
        """Get frequency data for charts"""
        # Determine date truncation based on group_by
        if group_by == "day":
            date_trunc = func.date(ChangeLog.detected_at)
        elif group_by == "week":
            date_trunc = func.date_trunc('week', ChangeLog.detected_at)
        elif group_by == "month":
            date_trunc = func.date_trunc('month', ChangeLog.detected_at)
        else:
            date_trunc = func.date(ChangeLog.detected_at)

        # Build query for frequency data
        from sqlalchemy import case
        query = select(
            date_trunc.label('date'),
            func.count(ChangeLog.id).label('total_count'),
            func.sum(case((ChangeLog.change_type == 'new', 1), else_=0)).label('new_count'),
            func.sum(case((ChangeLog.change_type == 'modified', 1), else_=0)).label('modified_count'),
            func.sum(case((ChangeLog.change_type == 'error', 1), else_=0)).label('error_count')
        ).group_by(date_trunc).order_by(date_trunc)

        if filters:
            query = query.where(and_(*filters))

        result = await db.execute(query)
        rows = result.all()

        frequency_data = []
        for row in rows:
            frequency_data.append(FrequencyDataPoint(
                date=row.date.strftime('%Y-%m-%d'),
                count=int(row.total_count),
                new_count=int(row.new_count),
                modified_count=int(row.modified_count),
                error_count=int(row.error_count)
            ))

        return frequency_data

    @staticmethod
    async def get_top_watchers(db: AsyncSession, filters: List) -> List[TopWatcher]:
        """Get top watchers by change count"""
        query = select(
            Watcher.id,
            Watcher.name,
            Watcher.url,
            Watcher.execution_mode,
            func.count(ChangeLog.id).label('change_count'),
            func.max(ChangeLog.detected_at).label('last_change')
        ).join(ChangeLog, Watcher.id == ChangeLog.watcher_id).group_by(Watcher.id, Watcher.name, Watcher.url, Watcher.execution_mode)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(desc('change_count')).limit(10)

        result = await db.execute(query)
        rows = result.all()

        top_watchers = []
        for row in rows:
            top_watchers.append(TopWatcher(
                id=row.id,
                name=row.name,
                url=row.url,
                execution_mode=row.execution_mode,
                change_count=int(row.change_count),
                last_change=row.last_change
            ))

        return top_watchers

    @staticmethod
    async def compare_change_logs(db: AsyncSession, log_ids: List[int]) -> Optional[ChangeLogComparison]:
        """
        Compare multiple change logs

        Args:
            db: Database session
            log_ids: List of change log IDs

        Returns:
            Comparison data or None if any log not found
        """
        # Get all change logs
        result = await db.execute(
            select(ChangeLog)
            .options(selectinload(ChangeLog.watcher))
            .where(ChangeLog.id.in_(log_ids))
        )
        change_logs = result.scalars().all()

        if len(change_logs) != len(log_ids):
            return None  # Some logs not found

        # Convert to comparison items
        comparison_items = []
        for log in change_logs:
            diff_str = None
            if log.diff:
                try:
                    diff_str = log.diff.decode('utf-8')
                except UnicodeDecodeError:
                    diff_str = "[Binary content - cannot display]"

            comparison_items.append(ChangeLogComparisonItem(
                id=log.id,
                detected_at=log.detected_at,
                change_type=log.change_type,
                old_size=log.old_size,
                new_size=log.new_size,
                diff=diff_str,
                watcher_name=log.watcher.name if log.watcher else "Unknown",
                watcher_url=log.watcher.url if log.watcher else ""
            ))

        # Sort by detection time
        comparison_items.sort(key=lambda x: x.detected_at)

        return ChangeLogComparison(
            change_logs=comparison_items,
            comparison_metadata={
                "total_logs": len(comparison_items),
                "date_range": {
                    "from": comparison_items[0].detected_at.isoformat(),
                    "to": comparison_items[-1].detected_at.isoformat()
                }
            }
        )

    @staticmethod
    async def get_change_log_statistics(db: AsyncSession) -> dict:
        """
        Get basic statistics about change logs (legacy method)

        Returns:
            Dictionary with change log statistics
        """
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

    @staticmethod
    async def get_latest_snapshot(
        db: AsyncSession,
        watcher_id: int
    ):
        """
        Get the latest snapshot for a watcher
        
        Args:
            db: Database session
            watcher_id: Watcher ID
            
        Returns:
            Latest Snapshot or None
        """
        from app.models.snapshot import Snapshot
        
        query = select(Snapshot).where(Snapshot.watcher_id == watcher_id)
        query = query.order_by(desc(Snapshot.created_at)).limit(1)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    def compute_hash(content: bytes) -> str:
        """
        Compute SHA256 hash of content
        
        Args:
            content: Content bytes
            
        Returns:
            Hex string hash
        """
        import hashlib
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def normalize_content(content: bytes, comparison_mode: str) -> bytes:
        """
        Normalize content based on comparison mode
        
        Args:
            content: Raw content bytes
            comparison_mode: 'hash', 'content_aware', or 'disabled'
            
        Returns:
            Normalized content bytes
        """
        if comparison_mode == 'content_aware':
            try:
                # Try to decode as text and normalize whitespace
                text = content.decode('utf-8')
                # Normalize whitespace: strip, replace multiple spaces with single
                import re
                normalized = re.sub(r'\s+', ' ', text.strip())
                return normalized.encode('utf-8')
            except UnicodeDecodeError:
                # If not text, return as-is
                return content
        return content

    @staticmethod
    def compute_diff(old_content: bytes, new_content: bytes) -> Optional[bytes]:
        """
        Compute unified diff between old and new content
        
        Args:
            old_content: Previous content
            new_content: New content
            
        Returns:
            Diff as bytes or None if not computable
        """
        try:
            import difflib
            
            # Try to decode as text
            old_text = old_content.decode('utf-8')
            new_text = new_content.decode('utf-8')
            
            # Compute unified diff
            old_lines = old_text.splitlines(keepends=True)
            new_lines = new_text.splitlines(keepends=True)
            
            diff = difflib.unified_diff(
                old_lines,
                new_lines,
                fromfile='old',
                tofile='new',
                lineterm=''
            )
            
            diff_text = '\n'.join(diff)
            return diff_text.encode('utf-8') if diff_text else None
            
        except (UnicodeDecodeError, AttributeError):
            # Binary content, can't compute text diff
            return None

    @staticmethod
    async def create_change_log_for_watcher(
        db: AsyncSession,
        watcher_id: int,
        response_body: str,
        status_code: int,
        comparison_mode: str = 'hash'
    ) -> ChangeLog:
        """
        Create change log for a watcher execution
        
        Args:
            db: Database session
            watcher_id: Watcher ID
            response_body: Response body from execution
            status_code: HTTP status code
            comparison_mode: Comparison mode ('hash', 'content_aware', 'disabled')
            
        Returns:
            Created ChangeLog
        """
        from app.models.snapshot import Snapshot
        from loguru import logger
        
        # Convert response to bytes
        new_content = response_body.encode('utf-8') if isinstance(response_body, str) else response_body
        new_size = len(new_content)
        
        # Get latest snapshot
        latest_snapshot = await ChangeLogService.get_latest_snapshot(db, watcher_id=watcher_id)
        
        # Determine change type
        if latest_snapshot is None:
            change_type = 'new'
            old_content = None
            old_hash = None
            old_size = None
            diff = None
        else:
            old_content = latest_snapshot.content
            old_hash = latest_snapshot.content_hash
            old_size = latest_snapshot.content_size
            
            # Normalize content for comparison if needed
            old_normalized = ChangeLogService.normalize_content(old_content, comparison_mode)
            new_normalized = ChangeLogService.normalize_content(new_content, comparison_mode)
            
            # Compute hashes
            old_compare_hash = ChangeLogService.compute_hash(old_normalized)
            new_compare_hash = ChangeLogService.compute_hash(new_normalized)
            
            if old_compare_hash == new_compare_hash:
                change_type = 'unchanged'
                diff = None
            else:
                change_type = 'modified'
                # Compute diff if not disabled
                if comparison_mode != 'disabled':
                    diff = ChangeLogService.compute_diff(old_content, new_content)
                    logger.debug(f"Computed diff, length={len(diff) if diff else 0}, comparison_mode={comparison_mode}")
                else:
                    diff = None
                    logger.debug(f"Diff disabled, comparison_mode={comparison_mode}")
        
        # Compute new hash
        new_hash = ChangeLogService.compute_hash(new_content)
        
        # Create change log
        change_log = ChangeLog(
            watcher_id=watcher_id,
            change_type=change_type,
            old_content=old_content,
            new_content=new_content,
            old_hash=old_hash,
            new_hash=new_hash,
            diff=diff,
            old_size=old_size,
            new_size=new_size
        )
        
        logger.debug(f"Watcher {watcher_id}: Created ChangeLog object with diff length={len(diff) if diff else 0}")
        
        db.add(change_log)
        
        # Update or create snapshot
        if latest_snapshot:
            latest_snapshot.content = new_content
            latest_snapshot.content_hash = new_hash
            latest_snapshot.content_size = new_size
            latest_snapshot.updated_at = datetime.now()
        else:
            # Create new snapshot
            snapshot = Snapshot(
                watcher_id=watcher_id,
                content=new_content,
                content_hash=new_hash,
                content_size=new_size
            )
            db.add(snapshot)
        
        await db.commit()
        await db.refresh(change_log)
        
        logger.info(f"Created change log for watcher {watcher_id}: type={change_type}, size={new_size}, diff_length={len(change_log.diff) if change_log.diff else 0}")
        
        return change_log

"""Setup service for initial configuration"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.watcher import Watcher
from loguru import logger


class SetupService:
    """Service for initial setup and configuration"""

    @staticmethod
    async def create_default_watchers(db: AsyncSession):
        """Create default watchers for testing the system"""
        try:
            # Check if watchers already exist
            from sqlalchemy import select, and_
            existing_watchers = await db.execute(
                select(Watcher).where(
                    and_(
                        Watcher.name.in_(['Cookie Test Watcher', 'Ping Test Watcher'])
                    )
                )
            )
            existing_count = len(existing_watchers.scalars().all())
            
            if existing_count > 0:
                logger.info("Default test watchers already exist, skipping creation")
                return

            # Watcher 1: Get cookie from /cookie-teste endpoint
            cookie_watcher = Watcher(
                name="Cookie Test Watcher",
                url="http://backend:8000/api/test/cookie-teste",
                method="GET",
                headers={"User-Agent": "Vigilant/2.0"},
                content_type="auto",
                execution_mode="scheduled",
                watch_interval=3600,  # 1 hour
                is_active=True,
                save_cookies=True,
                use_cookies=False,
                comparison_mode="hash"
            )

            # Watcher 2: Ping with cookie
            ping_watcher = Watcher(
                name="Ping Test Watcher",
                url="http://backend:8000/api/test/ping",
                method="GET",
                headers={"User-Agent": "Vigilant/2.0"},
                content_type="auto",
                execution_mode="scheduled",
                watch_interval=30,  # 30 seconds
                is_active=True,
                save_cookies=False,
                use_cookies=False,
                comparison_mode="hash"
            )

            db.add(cookie_watcher)
            db.add(ping_watcher)
            await db.commit()

            logger.info("Created default test watchers:")
            logger.info("- Cookie Test Watcher (every 1 hour)")
            logger.info("- Ping Test Watcher (every 30 seconds)")

        except Exception as e:
            logger.error(f"Error creating default watchers: {e}")
            await db.rollback()

    @staticmethod
    async def setup_database(db: AsyncSession):
        """Setup initial database configuration"""
        try:
            await SetupService.create_default_watchers(db)
            logger.info("Database setup completed successfully")
        except Exception as e:
            logger.error(f"Error setting up database: {e}")
            raise

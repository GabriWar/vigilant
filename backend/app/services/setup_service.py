"""Setup service for initial configuration"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.request import Request
from loguru import logger


class SetupService:
    """Service for initial setup and configuration"""

    @staticmethod
    async def create_default_requests(db: AsyncSession):
        """Create default requests for testing the system"""
        try:
            # Check if requests already exist
            from sqlalchemy import select, and_
            existing_requests = await db.execute(
                select(Request).where(
                    and_(
                        Request.name.in_(['Cookie Test Request', 'Ping Test Request'])
                    )
                )
            )
            existing_count = len(existing_requests.scalars().all())
            
            if existing_count > 0:
                logger.info("Default test requests already exist, skipping creation")
                return

            # Request 1: Get cookie from /cookie-teste endpoint
            cookie_request_data = {
                "url": "http://backend:8000/api/test/cookie-teste",
                "method": "GET",
                "headers": {
                    "User-Agent": "Vigilant/2.0"
                }
            }

            cookie_request = Request(
                name="Cookie Test Request",
                request_data=json.dumps(cookie_request_data),
                save_cookies=True,
                watch_interval=3600,  # 1 hour
                is_active=True
            )

            # Request 2: Ping with cookie
            ping_request_data = {
                "url": "http://backend:8000/api/test/ping",
                "method": "GET",
                "headers": {
                    "User-Agent": "Vigilant/2.0",
                    "Cookie": "test_cookie=will_be_replaced_by_cookies"
                }
            }

            ping_request = Request(
                name="Ping Test Request",
                request_data=json.dumps(ping_request_data),
                save_cookies=False,
                watch_interval=30,  # 30 seconds
                is_active=True
            )

            db.add(cookie_request)
            db.add(ping_request)
            await db.commit()

            logger.info("Created default test requests:")
            logger.info("- Cookie Test Request (every 1 hour)")
            logger.info("- Ping Test Request (every 30 seconds)")

        except Exception as e:
            logger.error(f"Error creating default requests: {e}")
            await db.rollback()

    @staticmethod
    async def setup_database(db: AsyncSession):
        """Setup initial database configuration"""
        try:
            await SetupService.create_default_requests(db)
            logger.info("Database setup completed successfully")
        except Exception as e:
            logger.error(f"Error setting up database: {e}")
            raise

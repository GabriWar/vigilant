"""Scheduler for background tasks"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.cookie_service import CookieService
from app.services.notification_service import NotificationService
from app.config import settings


class SchedulerService:
    """Service for managing scheduled tasks"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone="UTC")
        self._started = False

    async def start(self):
        """Start the scheduler"""
        if self._started:
            logger.warning("Scheduler already started")
            return

        logger.info("Starting scheduler...")

        # Add scheduled tasks
        self._add_cookie_check_task()
        self._add_cookie_cleanup_task()
        self._add_cookie_notification_task()

        self.scheduler.start()
        self._started = True
        logger.info("Scheduler started successfully")

    async def stop(self):
        """Stop the scheduler"""
        if not self._started:
            return

        logger.info("Stopping scheduler...")
        self.scheduler.shutdown()
        self._started = False
        logger.info("Scheduler stopped")

    def _add_cookie_check_task(self):
        """Add task to check cookies expiring soon (every hour)"""
        self.scheduler.add_job(
            self._check_cookies_expiring_soon,
            trigger=IntervalTrigger(hours=1),
            id="check_cookies_expiring_soon",
            name="Check cookies expiring soon",
            replace_existing=True
        )
        logger.info("Added task: Check cookies expiring soon (every 1 hour)")

    def _add_cookie_cleanup_task(self):
        """Add task to cleanup expired cookies (daily at 3 AM UTC)"""
        self.scheduler.add_job(
            self._cleanup_expired_cookies,
            trigger=CronTrigger(hour=3, minute=0),
            id="cleanup_expired_cookies",
            name="Cleanup expired cookies",
            replace_existing=True
        )
        logger.info("Added task: Cleanup expired cookies (daily at 3 AM UTC)")

    def _add_cookie_notification_task(self):
        """Add task to send notifications for expiring cookies (every 6 hours)"""
        self.scheduler.add_job(
            self._notify_expiring_cookies,
            trigger=IntervalTrigger(hours=6),
            id="notify_expiring_cookies",
            name="Notify expiring cookies",
            replace_existing=True
        )
        logger.info("Added task: Notify expiring cookies (every 6 hours)")

    async def _check_cookies_expiring_soon(self):
        """Check for cookies expiring within 24 hours"""
        logger.info("Running: Check cookies expiring soon")

        try:
            async with AsyncSessionLocal() as db:
                # Get cookies expiring in next 24 hours
                cookies = await CookieService.get_cookies_expiring_soon(db, hours=24)

                if cookies:
                    logger.warning(
                        f"Found {len(cookies)} cookie(s) expiring within 24 hours"
                    )
                    for cookie in cookies:
                        expires_in = CookieService.get_expires_in_seconds(cookie)
                        hours_left = expires_in // 3600 if expires_in else 0
                        logger.warning(
                            f"  - Cookie '{cookie.name}' (ID: {cookie.id}) "
                            f"expires in {hours_left} hours"
                        )
                else:
                    logger.info("No cookies expiring within 24 hours")

        except Exception as e:
            logger.error(f"Error checking cookies expiring soon: {e}")

    async def _cleanup_expired_cookies(self):
        """Delete all expired cookies"""
        logger.info("Running: Cleanup expired cookies")

        try:
            async with AsyncSessionLocal() as db:
                deleted_count = await CookieService.delete_expired_cookies(db)

                if deleted_count > 0:
                    logger.info(f"Deleted {deleted_count} expired cookie(s)")
                else:
                    logger.info("No expired cookies to delete")

        except Exception as e:
            logger.error(f"Error cleaning up expired cookies: {e}")

    async def _notify_expiring_cookies(self):
        """Send notifications for cookies expiring soon"""
        logger.info("Running: Notify expiring cookies")

        try:
            async with AsyncSessionLocal() as db:
                # Get cookies expiring in next 48 hours
                cookies = await CookieService.get_cookies_expiring_soon(db, hours=48)

                if not cookies:
                    logger.info("No cookies expiring soon, no notifications sent")
                    return

                # Group cookies by request
                from collections import defaultdict
                cookies_by_request = defaultdict(list)

                for cookie in cookies:
                    cookies_by_request[cookie.request_id].append(cookie)

                # Send notification for each request
                notification_count = 0
                for request_id, request_cookies in cookies_by_request.items():
                    cookie_names = [c.name for c in request_cookies]
                    expires_in_hours = min(
                        CookieService.get_expires_in_seconds(c) // 3600
                        for c in request_cookies
                    )

                    title = "🍪 Cookies Expiring Soon"
                    message = (
                        f"{len(request_cookies)} cookie(s) expiring within {expires_in_hours}h: "
                        f"{', '.join(cookie_names[:3])}"
                    )
                    if len(cookie_names) > 3:
                        message += f" and {len(cookie_names) - 3} more"

                    # Send web push notification
                    try:
                        await NotificationService.send_notification_to_all(
                            db=db,
                            title=title,
                            message=message,
                            data={
                                "type": "cookie_expiring",
                                "request_id": request_id,
                                "cookie_count": len(request_cookies)
                            }
                        )
                        notification_count += 1
                        logger.info(
                            f"Sent notification for request {request_id}: "
                            f"{len(request_cookies)} cookies expiring"
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to send notification for request "
                            f"{request_id}: {e}"
                        )

                logger.info(
                    f"Sent {notification_count} notification(s) for "
                    f"{len(cookies)} expiring cookie(s)"
                )

        except Exception as e:
            logger.error(f"Error notifying expiring cookies: {e}")


# Global scheduler instance
scheduler_service = SchedulerService()

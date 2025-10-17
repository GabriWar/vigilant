"""Notification service - business logic for push notifications"""
from typing import List, Optional
from sqlalchemy import select, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession
from pywebpush import webpush, WebPushException
import json
from datetime import datetime

from app.models.notification_subscription import NotificationSubscription
from app.schemas.notification import NotificationSubscriptionCreate, NotificationPayload
from app.config import settings


class NotificationService:
    """Service for push notification operations"""

    @staticmethod
    async def subscribe(
        db: AsyncSession,
        subscription_data: NotificationSubscriptionCreate,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> NotificationSubscription:
        """Create or update notification subscription"""
        
        # Check if subscription already exists
        result = await db.execute(
            select(NotificationSubscription).where(
                NotificationSubscription.endpoint == subscription_data.endpoint
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing subscription
            existing.p256dh_key = subscription_data.keys['p256dh']
            existing.auth_key = subscription_data.keys['auth']
            existing.is_active = True
            existing.user_agent = user_agent
            existing.ip_address = ip_address
            await db.commit()
            await db.refresh(existing)
            return existing
        
        # Create new subscription
        subscription = NotificationSubscription(
            endpoint=subscription_data.endpoint,
            p256dh_key=subscription_data.keys['p256dh'],
            auth_key=subscription_data.keys['auth'],
            user_agent=user_agent,
            ip_address=ip_address,
            is_active=True
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        return subscription

    @staticmethod
    async def unsubscribe(db: AsyncSession, endpoint: str) -> bool:
        """Unsubscribe from notifications"""
        result = await db.execute(
            sql_delete(NotificationSubscription).where(
                NotificationSubscription.endpoint == endpoint
            )
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def get_all_subscriptions(
        db: AsyncSession,
        is_active: bool = True
    ) -> List[NotificationSubscription]:
        """Get all notification subscriptions"""
        query = select(NotificationSubscription)
        if is_active:
            query = query.where(NotificationSubscription.is_active == True)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def send_notification(
        db: AsyncSession,
        payload: NotificationPayload,
        subscription_ids: Optional[List[int]] = None
    ) -> dict:
        """Send push notification to subscribers"""
        
        # Get subscriptions
        query = select(NotificationSubscription).where(
            NotificationSubscription.is_active == True
        )
        if subscription_ids:
            query = query.where(NotificationSubscription.id.in_(subscription_ids))
        
        result = await db.execute(query)
        subscriptions = list(result.scalars().all())
        
        # Prepare VAPID claims
        vapid_claims = {
            "sub": settings.VAPID_CLAIM_EMAIL
        }
        
        # Track results
        success_count = 0
        failed_count = 0
        failed_endpoints = []
        
        # Send to each subscription
        for subscription in subscriptions:
            try:
                # Prepare subscription info for pywebpush
                subscription_info = {
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh_key,
                        "auth": subscription.auth_key
                    }
                }
                
                # Send notification
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload.model_dump()),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=vapid_claims
                )
                
                # Update last used timestamp
                subscription.last_used_at = datetime.now()
                success_count += 1
                
            except WebPushException as e:
                failed_count += 1
                failed_endpoints.append(subscription.endpoint)
                
                # If subscription is expired/invalid, mark as inactive
                if e.response and e.response.status_code in [404, 410]:
                    subscription.is_active = False
        
        await db.commit()
        
        return {
            "success_count": success_count,
            "failed_count": failed_count,
            "total_subscriptions": len(subscriptions),
            "failed_endpoints": failed_endpoints
        }

    @staticmethod
    async def send_monitor_change_notification(
        db: AsyncSession,
        monitor_name: str,
        monitor_url: str,
        monitor_id: int
    ):
        """Send notification when a monitor detects a change"""
        payload = NotificationPayload(
            title=f"Change Detected: {monitor_name}",
            body=f"Changes detected in {monitor_url}",
            icon="/icon.png",
            badge="/badge.png",
            tag=f"monitor-{monitor_id}",
            data={
                "monitor_id": monitor_id,
                "url": monitor_url,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return await NotificationService.send_notification(db, payload)

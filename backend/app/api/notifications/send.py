"""Send push notification endpoint"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.notification import NotificationPayload
from app.services.notification_service import NotificationService

router = APIRouter()

@router.post("/send")
async def send_push_notification(
    payload: NotificationPayload,
    subscription_ids: Optional[List[int]] = None,
    db: AsyncSession = Depends(get_db)
):
    """Send push notification to subscribers"""
    result = await NotificationService.send_notification(db, payload, subscription_ids=subscription_ids)
    return result

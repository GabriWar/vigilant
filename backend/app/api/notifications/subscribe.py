"""Subscribe to push notifications endpoint"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.notification import NotificationSubscriptionCreate, NotificationSubscriptionResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.post("/subscribe", response_model=NotificationSubscriptionResponse)
async def subscribe_to_notifications(
    subscription: NotificationSubscriptionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to push notifications"""
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    new_subscription = await NotificationService.subscribe(
        db, subscription, user_agent=user_agent, ip_address=ip_address
    )
    return new_subscription

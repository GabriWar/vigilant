"""Unsubscribe from push notifications endpoint"""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.notification_service import NotificationService

router = APIRouter()

class UnsubscribeRequest(BaseModel):
    endpoint: str

@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe_from_notifications(data: UnsubscribeRequest, db: AsyncSession = Depends(get_db)):
    """Unsubscribe from push notifications"""
    await NotificationService.unsubscribe(db, data.endpoint)

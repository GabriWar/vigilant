"""Get VAPID public key endpoint"""
from fastapi import APIRouter
from app.schemas.notification import VapidPublicKeyResponse
from app.config import settings

router = APIRouter()

@router.get("/vapid-public-key", response_model=VapidPublicKeyResponse)
async def get_vapid_public_key():
    """Get VAPID public key for client-side subscription"""
    return VapidPublicKeyResponse(public_key=settings.VAPID_PUBLIC_KEY)

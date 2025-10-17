"""Notifications API router"""
from fastapi import APIRouter

from app.api.notifications import subscribe, unsubscribe, vapid_key, send

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Include all endpoints
router.include_router(subscribe.router)
router.include_router(unsubscribe.router)
router.include_router(vapid_key.router)
router.include_router(send.router)

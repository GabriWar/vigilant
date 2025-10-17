"""Monitors API router"""
from fastapi import APIRouter

from app.api.monitors import create, list, get, update, delete, status

router = APIRouter(prefix="/monitors", tags=["monitors"])

# Include all endpoints
router.include_router(create.router)
router.include_router(list.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)
router.include_router(status.router)

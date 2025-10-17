"""Images API router"""
from fastapi import APIRouter

from app.api.images import list, get, delete

router = APIRouter(prefix="/images", tags=["images"])

# Include all image endpoints
router.include_router(list.router)
router.include_router(get.router)
router.include_router(delete.router)
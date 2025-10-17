"""Headers API router"""
from fastapi import APIRouter
from app.api.headers import list, create, update, delete, get

router = APIRouter(prefix="/headers", tags=["headers"])

# Include all header endpoints
router.include_router(list.router)
router.include_router(create.router)
router.include_router(update.router)
router.include_router(delete.router)
router.include_router(get.router)
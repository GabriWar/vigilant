"""Watcher API routes"""
from fastapi import APIRouter
from app.api.watchers.list import router as list_router
from app.api.watchers.item import router as item_router
from app.api.watchers.execute import router as execute_router

router = APIRouter(prefix="/watchers", tags=["watchers"])

# Include routers in correct order (specific routes before parameterized ones)
router.include_router(list_router)
router.include_router(execute_router)  # /execute before /{id}
router.include_router(item_router)

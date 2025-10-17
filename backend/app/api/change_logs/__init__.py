"""Change logs API router"""
from fastapi import APIRouter
from .list import router as list_router
from .get import router as get_router
from .statistics import router as statistics_router
from .compare import router as compare_router

router = APIRouter(prefix="/change-logs", tags=["change-logs"])

# Include sub-routers in order - specific routes before parameterized routes
router.include_router(list_router)
router.include_router(statistics_router)  # Move before get_router
router.include_router(compare_router)
router.include_router(get_router)  # Move after specific routes

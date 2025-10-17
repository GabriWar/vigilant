"""API router"""
from fastapi import APIRouter

from app.api import watchers, notifications, images, workflows, logs, cookies, headers, change_logs

api_router = APIRouter()

# Include all API routers
api_router.include_router(watchers.router)
api_router.include_router(notifications.router)
api_router.include_router(images.router)
api_router.include_router(workflows.router)
api_router.include_router(logs.router)
api_router.include_router(cookies.router)
api_router.include_router(headers.router)
api_router.include_router(change_logs.router)

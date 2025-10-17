"""API router"""
from fastapi import APIRouter

from app.api import monitors, notifications, requests, images, workflows, logs, cookies, headers

api_router = APIRouter()

# Include all API routers
api_router.include_router(monitors.router)
api_router.include_router(notifications.router)
api_router.include_router(requests.router)
api_router.include_router(images.router)
api_router.include_router(workflows.router)
api_router.include_router(logs.router)
api_router.include_router(cookies.router)
api_router.include_router(headers.router)

"""Requests API router"""
from fastapi import APIRouter

from app.api.requests import list, create, get, update, delete, execute, test

router = APIRouter(prefix="/requests", tags=["requests"])

# Include all endpoints
router.include_router(list.router)
router.include_router(create.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)
router.include_router(execute.router)
router.include_router(test.router)

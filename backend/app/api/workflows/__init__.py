"""Workflows API router"""
from fastapi import APIRouter
from app.api.workflows import create, list, get, update, delete, execute, executions, variables

router = APIRouter(prefix="/workflows", tags=["workflows"])

# Workflow CRUD
router.include_router(create.router)
router.include_router(list.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)

# Workflow execution
router.include_router(execute.router)
router.include_router(executions.router)

# Variables
router.include_router(variables.router)

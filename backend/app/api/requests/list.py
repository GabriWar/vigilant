"""List requests endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.request import Request
from app.schemas.request import RequestResponse

router = APIRouter()


@router.get("/", response_model=List[RequestResponse])
async def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all requests with optional filtering"""
    query = select(Request)

    if is_active is not None:
        query = query.where(Request.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(Request.created_at.desc())

    result = await db.execute(query)
    requests = result.scalars().all()

    return requests

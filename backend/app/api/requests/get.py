"""Get single request endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.request import Request
from app.schemas.request import RequestResponse

router = APIRouter()


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific request by ID"""
    result = await db.execute(
        select(Request).where(Request.id == request_id)
    )
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    return request

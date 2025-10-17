"""Delete request endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.request import Request

router = APIRouter()


@router.delete("/{request_id}", status_code=204)
async def delete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a request"""
    result = await db.execute(
        select(Request).where(Request.id == request_id)
    )
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    await db.delete(request)
    await db.commit()

    return None

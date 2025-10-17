"""Update request endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.request import Request
from app.schemas.request import RequestUpdate, RequestResponse

router = APIRouter()


@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: int,
    request_data: RequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a request"""
    result = await db.execute(
        select(Request).where(Request.id == request_id)
    )
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Update fields
    update_data = request_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request, field, value)

    await db.commit()
    await db.refresh(request)

    return request

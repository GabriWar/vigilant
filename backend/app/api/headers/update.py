"""Header update endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.header import Header, HeaderUpdate
from app.services.header_service import HeaderService

router = APIRouter()


@router.put("/{header_id}", response_model=Header)
def update_header(
    header_id: int,
    header_data: HeaderUpdate,
    db: Session = Depends(get_db)
):
    """Update a header"""
    service = HeaderService(db)
    header = service.update_header(header_id, header_data)
    if not header:
        raise HTTPException(status_code=404, detail="Header not found")
    return header

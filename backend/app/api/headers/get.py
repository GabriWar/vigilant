"""Header retrieval endpoint"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.header import Header
from app.services.header_service import HeaderService

router = APIRouter()


@router.get("/", response_model=List[Header])
def get_headers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get all headers"""
    service = HeaderService(db)
    return service.get_headers(skip=skip, limit=limit, active_only=active_only)


@router.get("/{header_id}", response_model=Header)
def get_header(
    header_id: int,
    db: Session = Depends(get_db)
):
    """Get a header by ID"""
    service = HeaderService(db)
    header = service.get_header(header_id)
    if not header:
        raise HTTPException(status_code=404, detail="Header not found")
    return header

"""Header API endpoints"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.header import Header, HeaderCreate, HeaderUpdate
from app.services.header_service import HeaderService

router = APIRouter()


@router.post("/", response_model=Header)
async def create_header(
    header_data: HeaderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new header"""
    return await HeaderService.create_header(db, header_data)


@router.get("/", response_model=List[Header])
async def get_headers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Get all headers"""
    return await HeaderService.get_headers(db, skip=skip, limit=limit, active_only=active_only)


@router.get("/{header_id}", response_model=Header)
async def get_header(
    header_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a header by ID"""
    header = await HeaderService.get_header(db, header_id)
    if not header:
        raise HTTPException(status_code=404, detail="Header not found")
    return header


@router.put("/{header_id}", response_model=Header)
async def update_header(
    header_id: int,
    header_data: HeaderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a header"""
    header = await HeaderService.update_header(db, header_id, header_data)
    if not header:
        raise HTTPException(status_code=404, detail="Header not found")
    return header


@router.delete("/{header_id}")
async def delete_header(
    header_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a header"""
    success = await HeaderService.delete_header(db, header_id)
    if not success:
        raise HTTPException(status_code=404, detail="Header not found")
    return {"message": "Header deleted successfully"}

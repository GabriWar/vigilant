"""Header deletion endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.header_service import HeaderService

router = APIRouter()


@router.delete("/{header_id}")
def delete_header(
    header_id: int,
    db: Session = Depends(get_db)
):
    """Delete a header"""
    service = HeaderService(db)
    success = service.delete_header(header_id)
    if not success:
        raise HTTPException(status_code=404, detail="Header not found")
    return {"message": "Header deleted successfully"}

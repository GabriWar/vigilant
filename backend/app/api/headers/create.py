"""Header creation endpoint"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.header import Header, HeaderCreate
from app.services.header_service import HeaderService

router = APIRouter()


@router.post("/", response_model=Header)
def create_header(
    header_data: HeaderCreate,
    db: Session = Depends(get_db)
):
    """Create a new header"""
    service = HeaderService(db)
    return service.create_header(header_data)

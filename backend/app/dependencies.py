"""Shared dependencies for FastAPI endpoints"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db


async def get_db_session(db: AsyncSession = Depends(get_db)) -> AsyncSession:
    """Get database session dependency"""
    return db


def verify_pagination(
    skip: int = 0,
    limit: int = 100
) -> tuple[int, int]:
    """
    Verify and return pagination parameters

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Tuple of (skip, limit)

    Raises:
        HTTPException: If parameters are invalid
    """
    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skip must be >= 0"
        )

    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 1000"
        )

    return skip, limit

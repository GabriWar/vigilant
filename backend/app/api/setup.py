"""Setup endpoint for initial configuration"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.setup_service import SetupService
from loguru import logger

router = APIRouter(prefix="/setup", tags=["setup"])

@router.post("/initialize")
async def initialize_database(db: AsyncSession = Depends(get_db)):
    """
    Initialize database with default configuration
    
    Creates default test requests for monitoring system validation
    """
    try:
        await SetupService.setup_database(db)
        return {
            "status": "success",
            "message": "Database initialized successfully",
            "created_requests": [
                {
                    "name": "Cookie Test Request",
                    "description": "Gets test cookie from /api/test/cookie-teste",
                    "interval": "1 hour",
                    "saves_cookies": True
                },
                {
                    "name": "Ping Test Request", 
                    "description": "Pings /api/test/ping with cookie",
                    "interval": "30 seconds",
                    "uses_cookies": True
                }
            ]
        }
    except Exception as e:
        logger.error(f"Setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")

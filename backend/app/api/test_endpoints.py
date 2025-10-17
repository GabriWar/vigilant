"""Test endpoints for monitoring system"""
from fastapi import APIRouter, Response, Request
from datetime import datetime, timezone
import random
import string

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/ping")
async def ping(request: Request):
    """Ping endpoint that returns test data and received cookies"""
    # Get cookies from request
    received_cookies = dict(request.cookies)
    
    return {
        "status": "success",
        "message": "Ping successful!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "random_value": random.randint(1000, 9999),
        "data": {
            "server": "vigilant-backend",
            "version": "2.0.0",
            "uptime": "running"
        },
        "received_cookies": received_cookies,
        "cookie_count": len(received_cookies)
    }

@router.get("/cookie-teste")
async def cookie_teste(response: Response):
    """Cookie test endpoint that sets a test cookie"""
    # Generate a random cookie value
    cookie_value = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    
    # Set cookie
    response.set_cookie(
        key="test_cookie",
        value=cookie_value,
        max_age=3600,  # 1 hour
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    
    return {
        "status": "success",
        "message": "Cookie set successfully",
        "cookie_name": "test_cookie",
        "cookie_value": cookie_value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

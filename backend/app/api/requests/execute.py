"""Execute request endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import json

from app.database import get_db
from app.models.request import Request
from app.models.cookie import Cookie
from app.schemas.request import RequestResponse

router = APIRouter()


@router.post("/{request_id}/execute", response_model=RequestResponse)
async def execute_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Execute a request and save cookies"""
    import aiohttp
    from http.cookies import SimpleCookie

    result = await db.execute(
        select(Request).where(Request.id == request_id)
    )
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    try:
        # Parse request data
        request_data = json.loads(request.request_data)

        url = request_data.get("url")
        method = request_data.get("method", "GET").upper()
        headers = request_data.get("headers", {})
        body = request_data.get("body")

        if not url:
            raise HTTPException(status_code=400, detail="URL is required in request_data")

        # Execute request
        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                "headers": headers,
                "allow_redirects": True
            }

            if method in ["POST", "PUT", "PATCH"] and body:
                if isinstance(body, dict):
                    request_kwargs["json"] = body
                else:
                    request_kwargs["data"] = body

            async with session.request(method, url, **request_kwargs) as response:
                # Extract cookies if save_cookies is enabled
                if request.save_cookies:
                    # Delete old cookies for this request
                    await db.execute(
                        select(Cookie).where(Cookie.request_id == request_id)
                    )
                    old_cookies_result = await db.execute(
                        select(Cookie).where(Cookie.request_id == request_id)
                    )
                    old_cookies = old_cookies_result.scalars().all()
                    for old_cookie in old_cookies:
                        await db.delete(old_cookie)

                    # Save new cookies
                    cookie_jar = SimpleCookie()

                    # Get cookies from response headers
                    for cookie_header in response.headers.getall('Set-Cookie', []):
                        cookie_jar.load(cookie_header)

                    for cookie_name, morsel in cookie_jar.items():
                        cookie = Cookie(
                            request_id=request_id,
                            name=cookie_name,
                            value=morsel.value,
                            domain=morsel.get("domain"),
                            path=morsel.get("path", "/"),
                        )
                        db.add(cookie)

        # Update last_executed_at
        request.last_executed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(request)

        return request

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request_data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing request: {str(e)}")

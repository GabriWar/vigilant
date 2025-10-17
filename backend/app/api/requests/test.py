"""Test request endpoint"""
import json
import aiohttp
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/test", tags=["test"])


class CookieDetail(BaseModel):
    """Detailed cookie information"""
    name: str
    value: str
    domain: Optional[str] = None
    path: Optional[str] = None
    expires: Optional[str] = None  # ISO format string
    max_age: Optional[int] = None
    secure: bool = False
    http_only: bool = False
    same_site: Optional[str] = None
    is_expired: bool = False
    expires_in_seconds: Optional[int] = None


class TestRequestData(BaseModel):
    url: str
    method: str
    headers: Dict[str, str]
    body: Optional[str] = None
    cookies: Optional[Dict[str, str]] = None  # Additional cookies to send
    header_set_id: Optional[int] = None  # ID of header set to use


class TestRequestResponse(BaseModel):
    status: int
    statusText: str
    headers: Dict[str, str]
    body: str
    cookies: Optional[List[CookieDetail]] = None


def parse_cookie_from_set_cookie(set_cookie_header: str) -> CookieDetail:
    """
    Parse a Set-Cookie header into detailed cookie information

    Example Set-Cookie header:
    session_id=abc123; Domain=.example.com; Path=/; Expires=Wed, 09 Jun 2021 10:18:14 GMT; Secure; HttpOnly; SameSite=Lax
    """
    parts = [part.strip() for part in set_cookie_header.split(';')]

    # First part is always name=value
    if not parts:
        raise ValueError("Invalid Set-Cookie header")

    name_value = parts[0].split('=', 1)
    if len(name_value) != 2:
        raise ValueError("Invalid cookie name=value")

    cookie_name, cookie_value = name_value

    # Initialize cookie detail
    cookie_detail = CookieDetail(
        name=cookie_name.strip(),
        value=cookie_value.strip()
    )

    # Parse remaining attributes
    for part in parts[1:]:
        if '=' in part:
            attr_name, attr_value = part.split('=', 1)
            attr_name = attr_name.strip().lower()
            attr_value = attr_value.strip()

            if attr_name == 'domain':
                cookie_detail.domain = attr_value
            elif attr_name == 'path':
                cookie_detail.path = attr_value
            elif attr_name == 'expires':
                # Parse Expires date (RFC 2822 format)
                try:
                    from email.utils import parsedate_to_datetime
                    expires_dt = parsedate_to_datetime(attr_value)
                    cookie_detail.expires = expires_dt.isoformat()

                    # Calculate if expired and time remaining
                    now = datetime.now(timezone.utc)
                    if expires_dt.tzinfo is None:
                        expires_dt = expires_dt.replace(tzinfo=timezone.utc)

                    cookie_detail.is_expired = expires_dt < now
                    cookie_detail.expires_in_seconds = int((expires_dt - now).total_seconds())
                except Exception:
                    cookie_detail.expires = attr_value
            elif attr_name == 'max-age':
                try:
                    max_age = int(attr_value)
                    cookie_detail.max_age = max_age

                    # If max-age is present, it overrides expires
                    if max_age <= 0:
                        cookie_detail.is_expired = True
                        cookie_detail.expires_in_seconds = 0
                    else:
                        cookie_detail.is_expired = False
                        cookie_detail.expires_in_seconds = max_age

                        # Calculate absolute expiration time
                        now = datetime.now(timezone.utc)
                        expires_dt = now.timestamp() + max_age
                        cookie_detail.expires = datetime.fromtimestamp(expires_dt, tz=timezone.utc).isoformat()
                except ValueError:
                    pass
            elif attr_name == 'samesite':
                cookie_detail.same_site = attr_value
        else:
            # Boolean flags
            attr = part.strip().lower()
            if attr == 'secure':
                cookie_detail.secure = True
            elif attr == 'httponly':
                cookie_detail.http_only = True

    return cookie_detail


@router.get("/debug")
async def debug_test():
    """Debug endpoint to test basic connectivity"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("https://httpbin.org/get") as response:
                return {
                    "status": response.status,
                    "headers": dict(response.headers),
                    "body": await response.text()
                }
    except Exception as e:
        return {"error": str(e)}

@router.post("/", response_model=TestRequestResponse)
async def test_request(data: TestRequestData, db: Session = Depends(get_db)):
    """
    Test a request without saving it
    
    Args:
        data: Request test data
        db: Database session
        
    Returns:
        Test result with response details
    """
    try:
        # Get additional headers from database if header_set_id is provided
        additional_headers = {}
        if data.header_set_id:
            from app.services.header_service import HeaderService
            header_service = HeaderService(db)
            additional_headers = header_service.get_active_headers_dict()
        
        # Merge headers: additional headers first, then provided headers (provided headers override)
        merged_headers = {**additional_headers, **data.headers}
        
        # Prepare cookies
        cookies_to_send = data.cookies or {}
        
        # Create session with specific configuration to mimic browser behavior
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30, connect=10, sock_read=10)
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
            }
        ) as session:
            # Prepare request data
            request_kwargs = {
                'url': data.url,
                'method': data.method,
                'headers': merged_headers,
                'allow_redirects': True,
                'max_redirects': 10
            }
            
            # Add cookies if provided
            if cookies_to_send:
                request_kwargs['cookies'] = cookies_to_send
            
            # Add body for POST/PUT/PATCH requests only
            if data.body and data.method.upper() in ['POST', 'PUT', 'PATCH']:
                content_type = data.headers.get('content-type', '').lower()
                
                if 'application/json' in content_type:
                    # Try to parse as JSON, fallback to raw string
                    try:
                        request_kwargs['json'] = json.loads(data.body)
                    except json.JSONDecodeError:
                        request_kwargs['data'] = data.body
                elif 'application/x-www-form-urlencoded' in content_type:
                    # Form-encoded data
                    request_kwargs['data'] = data.body
                else:
                    # Raw data
                    request_kwargs['data'] = data.body
            
            # Make the request
            try:
                async with session.request(**request_kwargs) as response:
                    # Read response body
                    response_body = await response.text()

                    # Extract and parse cookies from Set-Cookie headers
                    cookies = []
                    set_cookie_headers = response.headers.getall('Set-Cookie', [])

                    if set_cookie_headers:
                        for set_cookie in set_cookie_headers:
                            try:
                                cookie_detail = parse_cookie_from_set_cookie(set_cookie)
                                cookies.append(cookie_detail)
                            except Exception as e:
                                # If parsing fails, create a basic cookie
                                print(f"Failed to parse cookie: {set_cookie}, error: {e}")
                                # Try to at least extract name=value
                                try:
                                    name_value = set_cookie.split(';')[0].split('=', 1)
                                    if len(name_value) == 2:
                                        cookies.append(CookieDetail(
                                            name=name_value[0].strip(),
                                            value=name_value[1].strip()
                                        ))
                                except:
                                    pass

                    return TestRequestResponse(
                        status=response.status,
                        statusText=response.reason,
                        headers=dict(response.headers),
                        body=response_body,
                        cookies=cookies if cookies else None
                    )
            except aiohttp.ClientResponseError as e:
                print(f"DEBUG: ClientResponseError: {e.status} - {e.message}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Request failed with status {e.status}: {e.message}"
                )
                
    except aiohttp.ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
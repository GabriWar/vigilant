"""Request executor service - executes requests automatically"""
import aiohttp
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from http.cookies import SimpleCookie
from app.models.request import Request
from app.models.cookie import Cookie
from app.services.cookie_service import CookieService


class RequestExecutor:
    """Service for executing requests"""

    @staticmethod
    async def execute_request(db: AsyncSession, request: Request) -> Dict[str, Any]:
        """
        Execute a single request
        
        Args:
            db: Database session
            request: Request to execute
            
        Returns:
            Execution result
        """
        try:
            logger.info(f"Executing request {request.id}: {request.name}")
            
            # Parse request data
            request_data = json.loads(request.request_data)
            
            # Get existing cookies for this request
            cookies_to_send = {}
            if request.use_cookies and request.cookie_request_id:
                # Use cookies from another request
                cookies = await CookieService.get_cookies_by_request(db, request.cookie_request_id)
                for cookie in cookies:
                    cookies_to_send[cookie.name] = cookie.value
                logger.info(f"Using {len(cookies)} cookies from request {request.cookie_request_id} for request {request.id}")
            elif request.save_cookies:
                # Use cookies from this request itself
                cookies = await CookieService.get_cookies_by_request(db, request.id)
                for cookie in cookies:
                    cookies_to_send[cookie.name] = cookie.value
                logger.info(f"Using {len(cookies)} existing cookies for request {request.id}")
            
            # Make HTTP request
            response_body, response_headers, response_cookies, status_code = await RequestExecutor._make_http_request(
                request_data, cookies_to_send
            )
            
            # Save cookies if configured
            if request.save_cookies:
                await RequestExecutor._save_cookies(db, request.id, response_cookies)
            
            # Update last_executed_at
            request.last_executed_at = datetime.now(timezone.utc)
            await db.commit()
            
            result = {
                'status': 'success',
                'status_code': status_code,
                'response_body': response_body,
                'response_headers': response_headers,
                'cookies_saved': len(response_cookies) if request.save_cookies else 0
            }
            
            logger.info(f"Request {request.id} executed successfully: {status_code}")
            return result
            
        except Exception as e:
            logger.error(f"Error executing request {request.id}: {e}")
            
            return {
                'status': 'error',
                'error': str(e)
            }

    @staticmethod
    async def _make_http_request(
        request_data: Dict[str, Any],
        cookies: Optional[Dict[str, str]] = None
    ) -> tuple[str, Dict[str, str], Dict[str, str], int]:
        """
        Make HTTP request
        
        Args:
            request_data: Request configuration
            cookies: Cookies to send
            
        Returns:
            Tuple of (response_body, response_headers, cookies, status_code)
        """
        url = request_data.get('url')
        method = request_data.get('method', 'GET').upper()
        headers = request_data.get('headers', {})
        body = request_data.get('body')

        connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30, connect=10, sock_read=10)

        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'Vigilant/2.0'}
        ) as session:
            request_kwargs = {
                'url': url,
                'method': method,
                'headers': headers,
                'allow_redirects': True,
            }

            # Add cookies if provided
            if cookies:
                request_kwargs['cookies'] = cookies

            # Add body if present
            if body and method in ['POST', 'PUT', 'PATCH']:
                content_type = headers.get('content-type', '').lower()

                if 'application/json' in content_type:
                    try:
                        request_kwargs['json'] = json.loads(body) if isinstance(body, str) else body
                    except json.JSONDecodeError:
                        request_kwargs['data'] = body
                else:
                    request_kwargs['data'] = body

            async with session.request(**request_kwargs) as response:
                response_body = await response.text()
                response_headers = dict(response.headers)

                # Extract cookies
                cookies_dict = {}
                for cookie in response.cookies.values():
                    cookies_dict[cookie.key] = cookie.value

                return response_body, response_headers, cookies_dict, response.status

    @staticmethod
    async def _save_cookies(db: AsyncSession, request_id: int, cookies: Dict[str, str]):
        """Save cookies from response"""
        try:
            # Delete old cookies for this request
            old_cookies_result = await db.execute(
                select(Cookie).where(Cookie.request_id == request_id)
            )
            old_cookies = old_cookies_result.scalars().all()
            for old_cookie in old_cookies:
                await db.delete(old_cookie)

            # Save new cookies
            for name, value in cookies.items():
                cookie = Cookie(
                    request_id=request_id,
                    name=name,
                    value=value,
                    domain=None,  # Could be extracted from response headers
                    path="/",
                )
                db.add(cookie)
                
            logger.info(f"Saved {len(cookies)} cookies for request {request_id}")
            
        except Exception as e:
            logger.error(f"Error saving cookies for request {request_id}: {e}")

    @staticmethod
    async def execute_all_active_requests(db: AsyncSession):
        """Execute all active requests that are due for execution"""
        try:
            from sqlalchemy import select, and_
            from datetime import datetime, timezone, timedelta
            
            # Get all active requests with watch_interval set
            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(Request).where(
                    and_(
                        Request.is_active == True,
                        Request.watch_interval.isnot(None)
                    )
                )
            )
            requests = result.scalars().all()
            
            # Filter requests that are due for execution
            due_requests = []
            for request in requests:
                if request.last_executed_at is None:
                    due_requests.append(request)
                else:
                    # Ensure both datetimes have timezone info
                    last_executed = request.last_executed_at
                    if last_executed.tzinfo is None:
                        last_executed = last_executed.replace(tzinfo=timezone.utc)
                    
                    time_since_last_execution = now - last_executed
                    if time_since_last_execution.total_seconds() >= request.watch_interval:
                        due_requests.append(request)
            
            logger.info(f"Found {len(due_requests)} requests due for execution")
            
            for request in due_requests:
                await RequestExecutor.execute_request(db, request)
                
        except Exception as e:
            logger.error(f"Error executing requests: {e}")

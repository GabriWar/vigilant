"""Monitor executor service - executes monitors automatically"""
import aiohttp
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from app.models.monitor import Monitor
from app.models.cookie import Cookie
from app.services.cookie_service import CookieService
from app.services.monitor_service import MonitorService


class MonitorExecutor:
    """Service for executing monitors"""

    @staticmethod
    async def execute_monitor(db: AsyncSession, monitor: Monitor) -> Dict[str, Any]:
        """
        Execute a single monitor
        
        Args:
            db: Database session
            monitor: Monitor to execute
            
        Returns:
            Execution result
        """
        try:
            logger.info(f"Executing monitor {monitor.id}: {monitor.name}")
            
            # Prepare request data
            request_data = {
                'url': monitor.url,
                'method': monitor.method or 'GET',
                'headers': monitor.headers or {},
                'body': monitor.body,
            }
            
            # Add cookies if configured
            cookies_to_send = {}
            if monitor.use_cookies and monitor.cookie_request_id:
                cookies = await CookieService.get_cookies_by_request(db, monitor.cookie_request_id)
                for cookie in cookies:
                    cookies_to_send[cookie.name] = cookie.value
                logger.info(f"Using {len(cookies)} cookies for monitor {monitor.id}")
            
            # Make HTTP request
            response_body, response_headers, response_cookies, status_code = await MonitorExecutor._make_http_request(
                request_data, cookies_to_send
            )
            
            # Save cookies if configured
            if monitor.save_cookies:
                await MonitorExecutor._save_cookies(db, monitor.id, response_cookies)
            
            # Update monitor status
            await MonitorService.update_status(
                db, 
                monitor.id, 
                "running", 
                None
            )
            
            # Update last_checked_at
            monitor.last_checked_at = datetime.now(timezone.utc)
            monitor.check_count = (monitor.check_count or 0) + 1
            
            await db.commit()
            
            result = {
                'status': 'success',
                'status_code': status_code,
                'response_body': response_body,
                'response_headers': response_headers,
                'cookies_saved': len(response_cookies) if monitor.save_cookies else 0,
                'cookies_used': len(cookies_to_send)
            }
            
            logger.info(f"Monitor {monitor.id} executed successfully: {status_code}")
            return result
            
        except Exception as e:
            logger.error(f"Error executing monitor {monitor.id}: {e}")
            
            # Update monitor status with error
            await MonitorService.update_status(
                db, 
                monitor.id, 
                "error", 
                str(e)
            )
            
            await db.commit()
            
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
    async def _save_cookies(db: AsyncSession, monitor_id: int, cookies: Dict[str, str]):
        """Save cookies from response"""
        try:
            # Delete old cookies for this monitor
            old_cookies_result = await db.execute(
                select(Cookie).where(Cookie.request_id == monitor_id)
            )
            old_cookies = old_cookies_result.scalars().all()
            for old_cookie in old_cookies:
                await db.delete(old_cookie)

            # Save new cookies
            for name, value in cookies.items():
                cookie = Cookie(
                    request_id=monitor_id,
                    name=name,
                    value=value,
                    domain=None,  # Could be extracted from response headers
                    path="/",
                )
                db.add(cookie)
                
            logger.info(f"Saved {len(cookies)} cookies for monitor {monitor_id}")
            
        except Exception as e:
            logger.error(f"Error saving cookies for monitor {monitor_id}: {e}")

    @staticmethod
    async def execute_all_active_monitors(db: AsyncSession):
        """Execute all active monitors that are due for execution"""
        try:
            from sqlalchemy import select, and_, func
            from datetime import datetime, timezone, timedelta
            
            # Get all active monitors
            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(Monitor).where(Monitor.is_active == True)
            )
            monitors = result.scalars().all()
            
            # Filter monitors that are due for execution
            due_monitors = []
            for monitor in monitors:
                if monitor.last_checked_at is None:
                    due_monitors.append(monitor)
                else:
                    # Ensure both datetimes have timezone info
                    last_checked = monitor.last_checked_at
                    if last_checked.tzinfo is None:
                        last_checked = last_checked.replace(tzinfo=timezone.utc)
                    
                    time_since_last_check = now - last_checked
                    if time_since_last_check.total_seconds() >= monitor.watch_interval:
                        due_monitors.append(monitor)
            
            logger.info(f"Found {len(due_monitors)} monitors due for execution")
            
            for monitor in due_monitors:
                await MonitorExecutor.execute_monitor(db, monitor)
                
        except Exception as e:
            logger.error(f"Error executing monitors: {e}")

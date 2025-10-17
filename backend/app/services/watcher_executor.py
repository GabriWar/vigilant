"""Watcher executor service - executes watchers automatically and manually"""
import aiohttp
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from app.models.watcher import Watcher
from app.models.cookie import Cookie
from app.services.cookie_service import CookieService
from app.services.watcher_service import WatcherService


class WatcherExecutor:
    """Service for executing watchers"""

    @staticmethod
    async def execute_watcher(db: AsyncSession, watcher: Watcher) -> Dict[str, Any]:
        """
        Execute a single watcher
        
        Args:
            db: Database session
            watcher: Watcher to execute
            
        Returns:
            Execution result
        """
        try:
            logger.info(f"Executing watcher {watcher.id}: {watcher.name}")
            
            # Prepare request data
            request_data = {
                'url': watcher.url,
                'method': watcher.method or 'GET',
                'headers': watcher.headers or {},
                'body': watcher.body,
            }
            
            # Add cookies if configured
            cookies_to_send = {}
            if watcher.use_cookies and watcher.cookie_watcher_id:
                cookies = await CookieService.get_cookies_by_request(db, watcher.cookie_watcher_id)
                for cookie in cookies:
                    cookies_to_send[cookie.name] = cookie.value
                logger.info(f"Using {len(cookies)} cookies for watcher {watcher.id}")
            
            # Make HTTP request
            response_body, response_headers, response_cookies, status_code = await WatcherExecutor._make_http_request(
                request_data, cookies_to_send
            )
            
            # Save cookies if configured
            if watcher.save_cookies:
                await WatcherExecutor._save_cookies(db, watcher.id, response_cookies)
            
            # Update watcher status
            await WatcherService.update_status(
                db, 
                watcher.id, 
                "success", 
                None
            )
            
            # Update last_checked_at
            watcher.last_checked_at = datetime.now(timezone.utc)
            watcher.check_count = (watcher.check_count or 0) + 1
            
            # Create change log
            from app.services.change_log_service import ChangeLogService
            await ChangeLogService.create_change_log_for_watcher(
                db, watcher.id, response_body, status_code, watcher.comparison_mode
            )
            
            await db.commit()
            
            result = {
                'status': 'success',
                'status_code': status_code,
                'response_body': response_body,
                'response_headers': response_headers,
                'cookies_saved': len(response_cookies) if watcher.save_cookies else 0,
                'cookies_used': len(cookies_to_send)
            }
            
            logger.info(f"Watcher {watcher.id} executed successfully: {status_code}")
            return result
            
        except Exception as e:
            logger.error(f"Error executing watcher {watcher.id}: {e}")
            
            # Update watcher status with error
            await WatcherService.update_status(
                db, 
                watcher.id, 
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
    async def _save_cookies(db: AsyncSession, watcher_id: int, cookies: Dict[str, str]):
        """Save cookies from response"""
        try:
            # Delete old cookies for this watcher
            old_cookies_result = await db.execute(
                select(Cookie).where(Cookie.watcher_id == watcher_id)
            )
            old_cookies = old_cookies_result.scalars().all()
            for old_cookie in old_cookies:
                await db.delete(old_cookie)

            # Save new cookies
            for name, value in cookies.items():
                cookie = Cookie(
                    watcher_id=watcher_id,
                    name=name,
                    value=value,
                    domain=None,  # Could be extracted from response headers
                    path="/",
                )
                db.add(cookie)
                
            logger.info(f"Saved {len(cookies)} cookies for watcher {watcher_id}")
            
        except Exception as e:
            logger.error(f"Error saving cookies for watcher {watcher_id}: {e}")

    @staticmethod
    async def execute_all_scheduled_watchers(db: AsyncSession):
        """Execute all active watchers that are scheduled and due for execution"""
        try:
            # Get all active watchers with scheduled or both execution mode
            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(Watcher).where(
                    (Watcher.is_active == True) &
                    (Watcher.execution_mode.in_(['scheduled', 'both']))
                )
            )
            watchers = result.scalars().all()
            
            # Filter watchers that are due for execution
            due_watchers = []
            for watcher in watchers:
                # Skip if watch_interval is not set
                if not watcher.watch_interval:
                    continue
                    
                if watcher.last_checked_at is None:
                    due_watchers.append(watcher)
                else:
                    # Ensure both datetimes have timezone info
                    last_checked = watcher.last_checked_at
                    if last_checked.tzinfo is None:
                        last_checked = last_checked.replace(tzinfo=timezone.utc)
                    
                    time_since_last_check = now - last_checked
                    if time_since_last_check.total_seconds() >= watcher.watch_interval:
                        due_watchers.append(watcher)
            
            logger.info(f"Found {len(due_watchers)} watchers due for execution")
            
            for watcher in due_watchers:
                await WatcherExecutor.execute_watcher(db, watcher)
                
        except Exception as e:
            logger.error(f"Error executing scheduled watchers: {e}")


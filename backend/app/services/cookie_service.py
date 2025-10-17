"""Cookie service - business logic for cookie management"""
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cookie import Cookie
from app.schemas.cookie import CookieCreate, CookieUpdate


class CookieService:
    """Service for cookie operations"""

    @staticmethod
    async def create_cookie(db: AsyncSession, cookie_data: CookieCreate) -> Cookie:
        """Create a new cookie"""
        cookie = Cookie(**cookie_data.model_dump())
        db.add(cookie)
        await db.commit()
        await db.refresh(cookie)
        return cookie

    @staticmethod
    async def get_cookie(db: AsyncSession, cookie_id: int) -> Optional[Cookie]:
        """Get cookie by ID"""
        result = await db.execute(select(Cookie).where(Cookie.id == cookie_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_cookies_by_request(
        db: AsyncSession,
        request_id: int
    ) -> List[Cookie]:
        """Get all cookies for a request"""
        result = await db.execute(
            select(Cookie)
            .where(Cookie.request_id == request_id)
            .order_by(Cookie.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_cookie(
        db: AsyncSession,
        cookie_id: int,
        cookie_data: CookieUpdate
    ) -> Optional[Cookie]:
        """Update cookie"""
        cookie = await CookieService.get_cookie(db, cookie_id)
        if not cookie:
            return None

        update_data = cookie_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(cookie, field, value)

        await db.commit()
        await db.refresh(cookie)
        return cookie

    @staticmethod
    async def delete_cookie(db: AsyncSession, cookie_id: int) -> bool:
        """Delete cookie"""
        cookie = await CookieService.get_cookie(db, cookie_id)
        if not cookie:
            return False

        await db.delete(cookie)
        await db.commit()
        return True

    @staticmethod
    def is_cookie_expired(cookie: Cookie) -> bool:
        """
        Check if a cookie is expired

        Args:
            cookie: Cookie model instance

        Returns:
            True if expired, False if valid or no expiration set
        """
        if not cookie.expires:
            # Session cookie (no expiration)
            return False

        now = datetime.now(timezone.utc)
        expires = cookie.expires

        # Ensure expires has timezone info
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        return expires < now

    @staticmethod
    def get_expires_in_seconds(cookie: Cookie) -> Optional[int]:
        """
        Get seconds until cookie expires

        Args:
            cookie: Cookie model instance

        Returns:
            Seconds until expiration, None if no expiration set, negative if expired
        """
        if not cookie.expires:
            return None

        now = datetime.now(timezone.utc)
        expires = cookie.expires

        # Ensure expires has timezone info
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        delta = expires - now
        return int(delta.total_seconds())

    @staticmethod
    async def get_expired_cookies(db: AsyncSession) -> List[Cookie]:
        """
        Get all expired cookies

        Returns:
            List of expired cookies
        """
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Cookie)
            .where(
                and_(
                    Cookie.expires.isnot(None),
                    Cookie.expires < now
                )
            )
            .order_by(Cookie.expires.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_cookies_expiring_soon(
        db: AsyncSession,
        hours: int = 24
    ) -> List[Cookie]:
        """
        Get cookies that will expire within specified hours

        Args:
            db: Database session
            hours: Number of hours to check (default: 24)

        Returns:
            List of cookies expiring soon
        """
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(hours=hours)

        result = await db.execute(
            select(Cookie)
            .where(
                and_(
                    Cookie.expires.isnot(None),
                    Cookie.expires > now,  # Not yet expired
                    Cookie.expires <= threshold  # But will expire soon
                )
            )
            .order_by(Cookie.expires.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_all_cookies(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        include_expired: bool = True
    ) -> List[Cookie]:
        """
        Get all cookies with optional filtering

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_expired: Whether to include expired cookies

        Returns:
            List of cookies
        """
        query = select(Cookie)

        if not include_expired:
            now = datetime.now(timezone.utc)
            query = query.where(
                or_(
                    Cookie.expires.is_(None),  # Session cookies
                    Cookie.expires > now  # Not expired
                )
            )

        query = query.offset(skip).limit(limit).order_by(Cookie.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def delete_expired_cookies(db: AsyncSession) -> int:
        """
        Delete all expired cookies

        Returns:
            Number of cookies deleted
        """
        expired_cookies = await CookieService.get_expired_cookies(db)
        count = len(expired_cookies)

        for cookie in expired_cookies:
            await db.delete(cookie)

        await db.commit()
        return count

    @staticmethod
    async def get_cookie_statistics(db: AsyncSession) -> dict:
        """
        Get statistics about cookies

        Returns:
            Dictionary with cookie statistics
        """
        from sqlalchemy import func

        # Total cookies
        total_result = await db.execute(select(func.count(Cookie.id)))
        total_cookies = total_result.scalar()

        # Expired cookies
        now = datetime.now(timezone.utc)
        expired_result = await db.execute(
            select(func.count(Cookie.id))
            .where(
                and_(
                    Cookie.expires.isnot(None),
                    Cookie.expires < now
                )
            )
        )
        expired_cookies = expired_result.scalar()

        # Expiring soon (24h)
        expiring_soon = len(await CookieService.get_cookies_expiring_soon(db, hours=24))

        # Session cookies (no expiration)
        session_result = await db.execute(
            select(func.count(Cookie.id))
            .where(Cookie.expires.is_(None))
        )
        session_cookies = session_result.scalar()

        # Valid cookies (not expired, have expiration)
        valid_cookies = total_cookies - expired_cookies - session_cookies

        return {
            "total": total_cookies,
            "valid": valid_cookies,
            "expired": expired_cookies,
            "expiring_soon_24h": expiring_soon,
            "session": session_cookies
        }

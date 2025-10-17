"""Pydantic schemas"""
from app.schemas.watcher import (
    WatcherBase, WatcherCreate, WatcherUpdate, WatcherInDB, WatcherResponse, 
    WatcherListResponse, WatcherWithStats, WatcherStatistics
)
from app.schemas.cookie import (
    CookieBase, CookieCreate, CookieUpdate, CookieInDB, CookieResponse
)
from app.schemas.snapshot import (
    SnapshotBase, SnapshotCreate, SnapshotInDB, SnapshotResponse, SnapshotWithContent
)
from app.schemas.change_log import (
    ChangeLogBase, ChangeLogCreate, ChangeLogInDB, ChangeLogResponse, 
    ChangeLogWithContent, ChangeLogWithDiff, ChangeLogListResponse, ChangeLogStatistics,
    TopWatcher
)
from app.schemas.image import (
    ImageBase, ImageCreate, ImageUpdate, ImageInDB, ImageResponse
)
from app.schemas.setting import (
    SettingBase, SettingCreate, SettingUpdate, SettingInDB, SettingResponse
)

__all__ = [
    # Watcher
    "WatcherBase", "WatcherCreate", "WatcherUpdate", "WatcherInDB", "WatcherResponse",
    "WatcherListResponse", "WatcherWithStats", "WatcherStatistics",
    # Cookie
    "CookieBase", "CookieCreate", "CookieUpdate", "CookieInDB", "CookieResponse",
    # Snapshot
    "SnapshotBase", "SnapshotCreate", "SnapshotInDB", "SnapshotResponse", "SnapshotWithContent",
    # ChangeLog
    "ChangeLogBase", "ChangeLogCreate", "ChangeLogInDB", "ChangeLogResponse", 
    "ChangeLogWithContent", "ChangeLogWithDiff", "ChangeLogListResponse", "ChangeLogStatistics",
    "TopWatcher",
    # Image
    "ImageBase", "ImageCreate", "ImageUpdate", "ImageInDB", "ImageResponse",
    # Setting
    "SettingBase", "SettingCreate", "SettingUpdate", "SettingInDB", "SettingResponse",
]

"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str = "mysql+aiomysql://vigilant:vigilant@mariadb:3306/vigilant"
    DATABASE_URL_SYNC: str = "mysql+pymysql://vigilant:vigilant@mariadb:3306/vigilant"

    # API
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Vigilant Monitor API"
    VERSION: str = "2.0.0"
    DEBUG: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # WebSocket
    WS_MESSAGE_QUEUE_SIZE: int = 100
    WS_HEARTBEAT_INTERVAL: int = 30

    # Monitoring
    DEFAULT_CHECK_INTERVAL: int = 60
    MAX_WORKERS: int = 5
    REQUEST_TIMEOUT: int = 30

    # Storage
    ARCHIVE_DIR: str = "archives"
    IMAGE_DIR: str = "images"
    MAX_ARCHIVE_SIZE_MB: int = 1000

    # Web Push Notifications
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "mailto:admin@example.com"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

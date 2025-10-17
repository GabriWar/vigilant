@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Vigilant 2.0 - Windows Setup Script
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed.
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Python not found. VAPID keys will be skipped.
    set SKIP_VAPID=true
) else (
    echo [OK] Python found
    set SKIP_VAPID=false
)
echo.

REM Install Python dependencies if Python is available
if "%SKIP_VAPID%"=="false" (
    echo [2/6] Installing Python dependencies...
    pip install -q py-vapid cryptography >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Failed to install dependencies. VAPID keys will be skipped.
        set SKIP_VAPID=true
    ) else (
        echo [OK] Dependencies installed
    )
    echo.
)

REM Generate VAPID keys
if "%SKIP_VAPID%"=="false" (
    echo [3/6] Generating VAPID keys...
    python -c "from py_vapid import Vapid; from cryptography.hazmat.primitives import serialization; import base64; vapid = Vapid(); vapid.generate_keys(); pk = vapid.private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption()).decode('utf-8'); pubk = vapid.public_key.public_bytes(encoding=serialization.Encoding.X962, format=serialization.PublicFormat.UncompressedPoint); pubk_b64 = base64.urlsafe_b64encode(pubk).decode('utf-8').rstrip('='); print(pk.replace('\n', '\\n') + '\n' + pubk_b64)" > .vapid_temp
    
    if exist .vapid_temp (
        set /p VAPID_PRIVATE=<.vapid_temp
        for /f "skip=1 delims=" %%a in (.vapid_temp) do set VAPID_PUBLIC=%%a
        del .vapid_temp
        echo [OK] VAPID keys generated
    ) else (
        echo [WARNING] VAPID key generation failed
        set SKIP_VAPID=true
    )
    echo.
)

REM Generate .env file
echo [4/6] Creating .env file...

REM Generate random secret (simplified for Windows)
for /f %%i in ('powershell -Command "[guid]::NewGuid().ToString('N')"') do set SECRET_KEY=%%i

(
echo # Database Configuration
echo DATABASE_URL=mysql+aiomysql://vigilant:vigilant@mariadb:3306/vigilant
echo DATABASE_URL_SYNC=mysql+pymysql://vigilant:vigilant@mariadb:3306/vigilant
echo.
echo # API Configuration
echo API_V1_PREFIX=/api
echo PROJECT_NAME=Vigilant Monitor API
echo VERSION=2.0.0
echo DEBUG=true
echo.
echo # CORS
echo BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
echo.
echo # Security
echo SECRET_KEY=!SECRET_KEY!
echo.
echo # WebSocket
echo WS_MESSAGE_QUEUE_SIZE=100
echo WS_HEARTBEAT_INTERVAL=30
echo.
echo # Monitoring
echo DEFAULT_CHECK_INTERVAL=60
echo MAX_WORKERS=5
echo REQUEST_TIMEOUT=30
echo.
echo # Storage
echo ARCHIVE_DIR=archives
echo IMAGE_DIR=images
echo MAX_ARCHIVE_SIZE_MB=1000
echo.
echo # Web Push Notifications
echo VAPID_PRIVATE_KEY=!VAPID_PRIVATE!
echo VAPID_PUBLIC_KEY=!VAPID_PUBLIC!
echo VAPID_CLAIM_EMAIL=mailto:admin@example.com
) > .env

echo [OK] .env file created
echo.

REM Create directories
echo [5/6] Creating directories...
if not exist backend\archives mkdir backend\archives
if not exist backend\images mkdir backend\images
if not exist logs mkdir logs
echo [OK] Directories created
echo.

REM Start Docker Compose
echo [6/6] Starting Docker containers...
echo This may take a few minutes on first run...
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo ========================================
echo          Setup Complete!
echo ========================================
echo.
echo Frontend:     http://localhost:5173
echo Backend API:  http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo.

if "%SKIP_VAPID%"=="true" (
    echo [WARNING] Notifications: Disabled
    echo To enable notifications later:
    echo   python backend\generate_vapid_keys.py
    echo   then add keys to .env and restart
    echo.
) else (
    echo [OK] Notifications: Enabled
    echo.
)

echo Useful Commands:
echo   View logs:        docker-compose logs -f
echo   Stop services:    docker-compose down
echo   Restart:          docker-compose restart
echo.
echo Ready to use! Open http://localhost:5173
echo.
pause

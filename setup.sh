#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Vigilant 2.0 - Automatic Setup Script   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    echo -e "${YELLOW}Please start Docker and try again:${NC}"
    echo -e "   ${BLUE}sudo systemctl start docker${NC}  (Linux)"
    echo -e "   ${BLUE}Open Docker Desktop${NC}        (macOS/Windows)"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"
echo ""

# Check if Python is available (for VAPID key generation)
echo -e "${BLUE}[1/6] Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠ Python3 not found. VAPID keys will be skipped (notifications won't work).${NC}"
    SKIP_VAPID=true
else
    echo -e "${GREEN}✓ Python3 found${NC}"
    SKIP_VAPID=false
fi
echo ""

# Generate VAPID keys
if [ "$SKIP_VAPID" = false ]; then
    echo -e "${BLUE}[2/6] Generating VAPID keys for web push notifications...${NC}"
    
    # Try to generate keys
    cd backend
    python3 generate_vapid_keys.py > /tmp/vapid_output.txt 2>&1
    
    if [ $? -eq 0 ] && [ -f vapid_keys.json ]; then
        # Extract keys from JSON file
        VAPID_PRIVATE=$(python3 -c "import json; print(json.load(open('vapid_keys.json'))['private_key'].replace('\n', '\\\\n'))" 2>/dev/null)
        VAPID_PUBLIC=$(python3 -c "import json; print(json.load(open('vapid_keys.json'))['public_key'])" 2>/dev/null)
        
        if [ -n "$VAPID_PRIVATE" ] && [ -n "$VAPID_PUBLIC" ]; then
            echo -e "${GREEN}✓ VAPID keys generated successfully${NC}"
        else
            echo -e "${YELLOW}⚠ VAPID key extraction failed. Notifications will be disabled.${NC}"
            SKIP_VAPID=true
        fi
    else
        echo -e "${YELLOW}⚠ VAPID key generation failed. Notifications will be disabled.${NC}"
        cat /tmp/vapid_output.txt 2>/dev/null | tail -5
        SKIP_VAPID=true
    fi
    cd ..
    echo ""
else
    echo -e "${BLUE}[2/6] Skipping VAPID key generation...${NC}"
    VAPID_PRIVATE=""
    VAPID_PUBLIC=""
    echo ""
fi

# Generate .env file
echo -e "${BLUE}[3/6] Creating .env file...${NC}"

# Generate random secret key
SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-in-production-$(date +%s)")

cat > .env << ENVFILE
# Database Configuration
DATABASE_URL=mysql+aiomysql://vigilant:vigilant@mariadb:3306/vigilant
DATABASE_URL_SYNC=mysql+pymysql://vigilant:vigilant@mariadb:3306/vigilant

# API Configuration
API_V1_PREFIX=/api
PROJECT_NAME=Vigilant Monitor API
VERSION=2.0.0
DEBUG=true

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Security
SECRET_KEY=${SECRET_KEY}

# WebSocket
WS_MESSAGE_QUEUE_SIZE=100
WS_HEARTBEAT_INTERVAL=30

# Monitoring
DEFAULT_CHECK_INTERVAL=60
MAX_WORKERS=5
REQUEST_TIMEOUT=30

# Storage
ARCHIVE_DIR=archives
IMAGE_DIR=images
MAX_ARCHIVE_SIZE_MB=1000

# Web Push Notifications
VAPID_PRIVATE_KEY=${VAPID_PRIVATE}
VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
VAPID_CLAIM_EMAIL=mailto:admin@example.com
ENVFILE

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Create necessary directories
echo -e "${BLUE}[4/6] Creating directories...${NC}"
mkdir -p backend/archives backend/images logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Remove version from docker-compose.yml if present
if grep -q "version:" docker-compose.yml 2>/dev/null; then
    echo -e "${BLUE}[5/6] Updating docker-compose.yml...${NC}"
    sed -i '/^version:/d' docker-compose.yml 2>/dev/null || sed -i '' '/^version:/d' docker-compose.yml 2>/dev/null
    echo -e "${GREEN}✓ docker-compose.yml updated${NC}"
    echo ""
fi

# Start Docker Compose
echo -e "${BLUE}[6/6] Starting Docker containers...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
echo ""

docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Docker containers started successfully!${NC}"
    echo ""
    
    # Wait for services to be ready
    echo -e "${BLUE}Waiting for services to initialize (30 seconds)...${NC}"
    
    for i in {30..1}; do
        echo -ne "${YELLOW}⏳ $i seconds remaining...\r${NC}"
        sleep 1
    done
    echo -e "${GREEN}✓ Services should be ready!${NC}                    "
    echo ""
    
    # Display success message
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          🎉 Setup Complete! 🎉             ║${NC}"
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo ""
    echo -e "${BLUE}📱 Frontend:${NC}     http://localhost:5173"
    echo -e "${BLUE}🔧 Backend API:${NC}  http://localhost:8000"
    echo -e "${BLUE}📚 API Docs:${NC}     http://localhost:8000/docs"
    echo ""
    
    if [ "$SKIP_VAPID" = true ]; then
        echo -e "${YELLOW}⚠️  Notifications Status:${NC} Disabled (VAPID keys not generated)"
        echo -e "   ${YELLOW}To enable notifications later:${NC}"
        echo -e "   ${BLUE}1. Install: pip install py-vapid cryptography ecdsa${NC}"
        echo -e "   ${BLUE}2. Run: python backend/generate_vapid_keys.py${NC}"
        echo -e "   ${BLUE}3. Add keys to .env and restart${NC}"
        echo ""
    else
        echo -e "${GREEN}✓  Notifications Status:${NC} Enabled"
        echo ""
    fi
    
    echo -e "${BLUE}📋 Useful Commands:${NC}"
    echo -e "   ${BLUE}View logs:${NC}           docker-compose logs -f"
    echo -e "   ${BLUE}Stop services:${NC}       docker-compose down"
    echo -e "   ${BLUE}Restart services:${NC}    docker-compose restart"
    echo ""
    echo -e "${GREEN}✨ Ready to use! Open http://localhost:5173 ✨${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to start Docker containers${NC}"
    echo -e "${YELLOW}Common issues:${NC}"
    echo -e "   ${BLUE}1. Docker not running:${NC} Start Docker Desktop or run 'sudo systemctl start docker'"
    echo -e "   ${BLUE}2. Port conflicts:${NC} Check if ports 3306, 8000, 5173 are already in use"
    echo -e "   ${BLUE}3. Permissions:${NC} Try running with sudo (Linux)"
    echo ""
    echo -e "${YELLOW}Check logs:${NC} docker-compose logs"
    exit 1
fi

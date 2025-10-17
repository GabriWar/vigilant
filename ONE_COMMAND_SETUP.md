# 🚀 One-Command Setup

## Linux / macOS

Just run:

```bash
./setup.sh
```

That's it! The script will:
1. ✅ Check Docker installation
2. ✅ Install Python dependencies
3. ✅ Generate VAPID keys automatically
4. ✅ Create .env file with all settings
5. ✅ Create necessary directories
6. ✅ Start all Docker containers
7. ✅ Wait for services to be ready

After ~30 seconds, open: **http://localhost:5173**

## Windows

Just run:

```cmd
setup.bat
```

Same automatic setup process!

## What the Script Does

### Generates .env automatically with:
- ✅ Random SECRET_KEY
- ✅ Database credentials
- ✅ VAPID keys for notifications
- ✅ All configuration ready

### Starts Everything:
- 🗄️ MariaDB database
- 🔧 FastAPI backend (with auto migrations)
- 💻 React frontend
- 🔔 Web push notifications (if Python available)

## If You Don't Have Python

The script will still work! It will:
- Skip VAPID key generation
- Create .env without notification keys
- Everything works except push notifications

You can add notifications later:
```bash
python backend/generate_vapid_keys.py
# Add keys to .env
docker-compose restart backend
```

## Troubleshooting

### Script fails?
```bash
# Make it executable
chmod +x setup.sh

# Run again
./setup.sh
```

### Services not starting?
```bash
# Check logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Want to start fresh?
```bash
# Stop everything
docker-compose down -v

# Run setup again
./setup.sh
```

## Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Create .env
cp .env.example .env

# 2. Start
docker-compose up -d
```

## Access Points

After setup completes:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000  
- **API Docs**: http://localhost:8000/docs

## Next Steps

1. Open http://localhost:5173
2. Click "Create Monitor"
3. Add a URL to watch
4. Enable notifications (button in header)
5. Done! 🎉

---

**TL;DR:** Run `./setup.sh` and open http://localhost:5173 in 30 seconds! 🚀

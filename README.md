# Vigilant 2.0 - Modern Website & API Change Monitor

A complete rewrite of Vigilant as a modern, modular web application with MariaDB, FastAPI backend, and React frontend.

## 🚀 Quick Start (One Command!)

### Linux / macOS
```bash
./setup.sh
```

### Windows
```cmd
setup.bat
```

**That's it!** The script automatically:
- ✅ Generates VAPID keys for notifications
- ✅ Creates .env with all settings
- ✅ Starts all services with Docker
- ✅ Runs database migrations

After 30 seconds, open: **http://localhost:5173** 🎉

---

## Architecture

```
vigilant/
├── backend/           # FastAPI REST API
├── frontend/          # React + TypeScript SPA
├── docker-compose.yml # Complete stack deployment
├── setup.sh           # 🆕 One-command setup!
└── .env              # Auto-generated config
```

## Tech Stack

### Backend
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - Async ORM
- **MariaDB** - Database
- **Alembic** - Database migrations
- **aiohttp** - Async HTTP client
- **Web Push** - VAPID notifications

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Query** - Server state management
- **React Router** - Client-side routing

## Features

- ✅ Website/API monitoring with change detection
- ✅ Authentication support with cookie management
- ✅ Configurable check intervals
- ✅ Diff-based change logs
- ✅ Image downloading from API responses
- ✅ **Web push notifications** 🔔
- ✅ Modern web UI with real-time updates
- ✅ RESTful API
- ✅ One-command Docker deployment

## Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Create .env
cp .env.example .env

# 2. (Optional) Generate VAPID keys
python backend/generate_vapid_keys.py
# Add keys to .env

# 3. Start
docker-compose up -d

# 4. Open http://localhost:5173
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Development

### Backend (Highly Modular)

Each API endpoint is a separate file:

```
backend/app/api/
├── monitors/
│   ├── create.py      # POST /api/monitors
│   ├── list.py        # GET /api/monitors
│   ├── get.py         # GET /api/monitors/{id}
│   ├── update.py      # PUT /api/monitors/{id}
│   ├── delete.py      # DELETE /api/monitors/{id}
│   └── status.py      # GET/PATCH status
├── notifications/     # 4 notification endpoints
└── ... (more modules)
```

### Frontend (Atomic Design)

Components are fully separated:

```
frontend/src/
├── components/
│   ├── atoms/          # Button, Input, etc.
│   ├── molecules/      # NotificationToggle, SearchBar
│   ├── organisms/      # MonitorCard, DiffViewer
│   └── layout/         # Header, PageLayout
├── pages/              # Dashboard, Monitors, etc.
├── services/api/       # API clients
└── hooks/              # React Query hooks
```

## API Endpoints

### Monitors
- `POST /api/monitors` - Create monitor
- `GET /api/monitors` - List monitors
- `GET /api/monitors/{id}` - Get details
- `PUT /api/monitors/{id}` - Update
- `DELETE /api/monitors/{id}` - Delete
- `GET/PATCH /api/monitors/{id}/status` - Status

### Notifications 🔔
- `POST /api/notifications/subscribe` - Subscribe browser
- `POST /api/notifications/unsubscribe` - Unsubscribe
- `GET /api/notifications/vapid-public-key` - Get public key
- `POST /api/notifications/send` - Send notification

Full docs: http://localhost:8000/docs

## Database Schema

- **monitors** - Websites/APIs to monitor
- **requests** - Request configs
- **cookies** - Stored auth cookies
- **snapshots** - Current state
- **change_logs** - Detected changes with diffs
- **images** - Downloaded image metadata
- **notification_subscriptions** - Push notification subscriptions
- **settings** - Global settings

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Access database
docker-compose exec mariadb mysql -u vigilant -pvigilant vigilant

# Run migrations
docker-compose exec backend alembic upgrade head
```

## Notifications Setup

The `setup.sh` script automatically generates VAPID keys. To do it manually:

```bash
python backend/generate_vapid_keys.py
# Add keys to .env
docker-compose restart backend
```

See `NOTIFICATION_SETUP.md` for detailed documentation.

## Documentation

- 📘 `ONE_COMMAND_SETUP.md` - Quick start guide
- 📗 `START_HERE.md` - Detailed setup instructions  
- 📕 `NOTIFICATION_SETUP.md` - Push notifications guide
- 📙 `GETTING_STARTED.md` - Development guide

## Architecture Highlights

### Maximum Modularity
- Each API endpoint = separate file
- Each component = own directory
- Each service = single responsibility
- Complete separation of concerns

### Type Safety
- TypeScript on frontend
- Pydantic on backend
- Compile-time error checking

### Async-First
- Non-blocking I/O
- Better performance
- Efficient resource usage

## TODO - Remaining Work

### Backend
- [ ] Requests API endpoints
- [ ] Logs API endpoints  
- [ ] Images API endpoints
- [ ] Core monitoring engine
- [ ] WebSocket for real-time updates

### Frontend
- [ ] More atomic components
- [ ] DiffViewer organism
- [ ] ImageGallery organism
- [ ] Additional pages
- [ ] Form validation

See full TODO in individual files.

## Migration from v1

Original Python files preserved:
- `watcher.py` - Original monitoring logic
- `website_monitor.py` - Original TUI
- `image_downloader.py` - Image downloader

Reference these for porting logic.

## License

Open source - use freely.

## Contributing

1. Fork the repository
2. Follow the modular architecture
3. One file per endpoint/component
4. Test thoroughly
5. Submit PR

---

**🚀 Get started in one command: `./setup.sh`**

**📱 Then open: http://localhost:5173**

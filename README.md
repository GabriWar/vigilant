# Vigilant - Website & API Change Monitor

A Python-based monitoring tool that tracks changes in websites and API endpoints, with support for authentication, cookie management, and automatic image downloading.

## Features

- 🔍 Monitor websites and API endpoints for changes
- 🔐 Authentication support with cookie persistence
- 📸 Automatic image downloading from API responses
- 📊 Diff-based change detection with full content archiving
- ⏰ Configurable check intervals (seconds/minutes/hours/days)
- 🎨 Terminal UI for easy configuration
- 📝 Detailed logging with timestamps

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### 1. Configure Authentication (if needed)

Add your login request to `config/requests.json`:

```bash
python website_monitor.py
# Select: Manage Requests → Add new request
# Paste your fetch() request from browser DevTools
# Enable "save cookies" if the response sets authentication cookies
```

### 2. Add URLs to Monitor

Add webpages/APIs to monitor in `config/urls.json`:

```bash
python website_monitor.py
# Select: Manage Webpages → Add new webpage
# Enter the URL and optionally link to an auth request
```

### 3. Start Monitoring

#### Option A: Interactive TUI (Terminal UI)
```bash
python website_monitor.py
# Select: Manage Webpages → Watch webpage
```

#### Option B: Monitor All (Batch Mode)
```bash
python watcher.py
# Monitors all configured URLs and requests simultaneously
```

## Project Structure

```
vigilant/
├── config/                      # Configuration files (gitignored)
│   ├── urls.json               # URLs/APIs to monitor
│   ├── requests.json           # Authentication requests
│   ├── cookies/                # Saved authentication cookies
│   ├── urls.json.example       # Example URL configuration
│   └── requests.json.example   # Example request configuration
│
├── logs/                        # Change detection logs with diffs
├── snapshots/                   # Current state snapshots
├── html_archive/               # Archived webpage content by timestamp
├── requests_archive/           # Archived API responses by timestamp
├── downloaded_images/          # Auto-downloaded images from APIs
│
├── website_monitor.py          # Main TUI application
├── watcher.py                  # Core monitoring engine
├── image_downloader.py         # Standalone image downloader
├── test_login.py              # Test authentication requests
└── requirements.txt            # Python dependencies
```

## Configuration

### URLs Configuration (`config/urls.json`)

```json
[
  {
    "url": "https://example.com/api/data",
    "request_name": "Login Request",
    "watch_interval": 60,
    "watch_interval_display": "1 minutes"
  }
]
```

### Requests Configuration (`config/requests.json`)

```json
[
  {
    "name": "Login Request",
    "request": "fetch(\"https://example.com/login\", {\"method\": \"POST\", \"body\": \"user=admin&pass=secret\"})",
    "save_cookies": true,
    "watch_interval": 300,
    "watch_interval_display": "5 minutes"
  }
]
```

## How It Works

1. **Authentication**: Executes login requests to obtain cookies
2. **Monitoring**: Fetches configured URLs/APIs at specified intervals
3. **Change Detection**: Compares SHA256 hashes to detect changes
4. **Logging**: Saves full content + unified diffs when changes occur
5. **Archiving**: Stores timestamped snapshots of all content
6. **Images**: Automatically downloads images from JSON API responses

## Special Features

### Automatic Image Downloading

When monitoring APIs that return image URLs (like `server_processing_pics.php`), Vigilant automatically:
- Parses JSON responses for image URLs
- Downloads all images with authentication
- Organizes by timestamp
- Saves metadata (filename, date, location, etc.)

Images are saved to: `downloaded_images/[timestamp]/`

### Cookie Management

- Cookies are automatically saved from authentication requests
- Reused for subsequent requests to the same endpoint
- Stored in: `config/cookies/[request_name].json`

### Diff-Based Logging

Changes are logged with:
- Full unified diff showing exactly what changed
- Timestamp and content size comparison
- Link to archived full content
- Separate archives for webpages (HTML) vs requests (JSON)

## Usage Examples

### Test Authentication
```bash
python test_login.py
# Tests the login request and shows cookies received
```

### Download Images Manually
```bash
python image_downloader.py
# Downloads all current images from the pictures API
```

### Watch Single Webpage
```bash
python website_monitor.py
# Interactive menu to select specific webpage to watch
```

### Monitor Everything
```bash
python watcher.py
# Monitors all configured URLs and requests in batch mode
```

## Tips

- **Finding API Endpoints**: Use browser DevTools (F12) → Network tab → Filter by XHR/Fetch
- **Copy as Fetch**: Right-click on request → Copy → Copy as fetch
- **Cookie Debugging**: Check `config/cookies/` to see what cookies were saved
- **View Diffs**: Check `logs/` for detailed change reports
- **Browse Archives**: Open `html_archive/` or `requests_archive/` to see historical snapshots

## Requirements

- Python 3.7+
- aiohttp >= 3.8.0

## License

Open source - use freely for monitoring your own services.

## Security Note

⚠️ **Important**: Never commit `config/` directory to public repositories as it may contain:
- Authentication credentials
- Session cookies
- Private API endpoints

The `.gitignore` is configured to exclude these by default.

#!/usr/bin/env python3
"""
Website/Request monitoring and change detection
"""

import asyncio
import aiohttp
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Any


class Watcher:
    """Handles monitoring of URLs and requests for changes"""

    def __init__(self):
        self.config_dir = Path('config')
        self.snapshots_dir = Path('snapshots')
        self.logs_dir = Path('logs')
        self.cookies_dir = self.config_dir / 'cookies'
        self.html_archive_dir = Path('html_archive')
        self.requests_archive_dir = Path('requests_archive')
        self.state_file = Path('watch_state.json')
        self._ensure_directories()
        self.state = self._load_state()

    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        self.config_dir.mkdir(exist_ok=True)
        self.snapshots_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
        self.cookies_dir.mkdir(exist_ok=True, parents=True)
        self.html_archive_dir.mkdir(exist_ok=True)
        self.requests_archive_dir.mkdir(exist_ok=True)

    def _load_state(self) -> Dict:
        """Load watch state (last check times, etc)"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_state(self):
        """Save watch state"""
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)

    def _update_last_check(self, identifier: str):
        """Update last check time for an identifier"""
        self.state[identifier] = {
            'last_check': datetime.now().isoformat(),
            'last_check_timestamp': datetime.now().timestamp()
        }
        self._save_state()

    def get_last_check(self, identifier: str) -> Optional[str]:
        """Get last check time for an identifier"""
        if identifier in self.state:
            return self.state[identifier].get('last_check')
        return None

    def _get_snapshot_path(self, identifier: str) -> Path:
        """Get the snapshot file path for a URL/request"""
        safe_name = "".join(c for c in identifier if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        return self.snapshots_dir / f"{safe_name}.json"

    def _get_log_path(self, identifier: str) -> Path:
        """Get the log file path for a URL/request"""
        safe_name = "".join(c for c in identifier if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        return self.logs_dir / f"{safe_name}.log"

    def _hash_content(self, content: str) -> str:
        """Generate hash of content for comparison"""
        return hashlib.sha256(content.encode()).hexdigest()

    def _load_snapshot(self, identifier: str) -> Optional[Dict]:
        """Load previous snapshot"""
        snapshot_path = self._get_snapshot_path(identifier)
        if snapshot_path.exists():
            with open(snapshot_path, 'r') as f:
                return json.load(f)
        return None

    def _save_snapshot(self, identifier: str, content: str, content_hash: str):
        """Save current snapshot"""
        snapshot_path = self._get_snapshot_path(identifier)
        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'hash': content_hash,
            'content': content
        }
        with open(snapshot_path, 'w') as f:
            json.dump(snapshot, f, indent=2)

    def _save_html_archive(self, identifier: str, content: str, timestamp: str, is_request: bool = False):
        """Save HTML/response content to archive with timestamp"""
        # Create subdirectory for this identifier
        safe_name = "".join(c for c in identifier if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_').replace('https', '').replace('http', '').replace('://', '').replace('/', '_')

        # Use different directory for requests vs webpages
        if is_request:
            item_dir = self.requests_archive_dir / safe_name
        else:
            item_dir = self.html_archive_dir / safe_name

        item_dir.mkdir(exist_ok=True)

        # Save with timestamp filename
        timestamp_clean = timestamp.replace(':', '-').replace('.', '-')

        # Use .json extension for request responses, .html for webpages
        extension = '.json' if is_request else '.html'
        archive_file = item_dir / f"{timestamp_clean}{extension}"

        with open(archive_file, 'w', encoding='utf-8') as f:
            f.write(content)

        return archive_file

    def _log_change(self, identifier: str, content: str, is_new: bool = False, previous_content: str = None, is_request: bool = False):
        """Log changes with diff"""
        log_path = self._get_log_path(identifier)
        timestamp = datetime.now().isoformat()

        # Save archive (HTML for webpages, JSON for requests)
        archive_file = self._save_html_archive(identifier, content, timestamp, is_request=is_request)

        separator = "=" * 80
        change_type = "NEW" if is_new else "CHANGE DETECTED"
        content_type = "Request Response" if is_request else "Webpage"

        log_entry = f"""
{separator}
{content_type} {change_type} - {timestamp}
Monitoring: {identifier}
Archive File: {archive_file}
{separator}

"""

        if is_new:
            log_entry += f"First time monitoring this page.\n"
            log_entry += f"Content size: {len(content)} bytes\n"
        else:
            # Generate diff
            import difflib

            # Split into lines for diff
            old_lines = previous_content.splitlines(keepends=True) if previous_content else []
            new_lines = content.splitlines(keepends=True)

            # Generate unified diff
            diff = difflib.unified_diff(
                old_lines,
                new_lines,
                fromfile=f'Previous version',
                tofile=f'Current version ({timestamp})',
                lineterm='\n'
            )

            diff_text = ''.join(diff)

            log_entry += f"Content size changed: {len(previous_content) if previous_content else 0} → {len(content)} bytes\n"
            log_entry += f"\nDIFF:\n"
            log_entry += f"{'-' * 80}\n"
            log_entry += diff_text
            log_entry += f"\n{'-' * 80}\n"

        log_entry += f"""
{separator}
END OF LOG ENTRY
{separator}

"""

        with open(log_path, 'a') as f:
            f.write(log_entry)

    def _load_cookies(self, request_name: str) -> Dict:
        """Load cookies for a request"""
        cookie_file = self.cookies_dir / f"{request_name}.json"
        if cookie_file.exists():
            with open(cookie_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_cookies(self, request_name: str, cookies: Dict):
        """Save cookies from response"""
        cookie_file = self.cookies_dir / f"{request_name}.json"
        with open(cookie_file, 'w') as f:
            json.dump(cookies, f, indent=2)

    def _parse_fetch_request(self, fetch_code: str) -> Dict[str, Any]:
        """Parse fetch() JavaScript code into request parameters"""
        # Extract URL
        url_match = re.search(r'fetch\s*\(\s*["\']([^"\']+)["\']', fetch_code)
        if not url_match:
            raise ValueError("Could not parse URL from fetch request")

        url = url_match.group(1)

        # Try to extract the options object
        options = {}

        # Extract method
        method_match = re.search(r'"method"\s*:\s*"(\w+)"', fetch_code)
        if method_match:
            options['method'] = method_match.group(1)
        else:
            options['method'] = 'GET'

        # Extract headers (simplified parsing)
        headers = {}
        headers_match = re.search(r'"headers"\s*:\s*\{([^}]+)\}', fetch_code, re.DOTALL)
        if headers_match:
            headers_str = headers_match.group(1)
            # Simple regex to extract key-value pairs
            header_pairs = re.findall(r'"([^"]+)"\s*:\s*"([^"]*)"', headers_str)
            for key, value in header_pairs:
                headers[key] = value

        options['headers'] = headers

        # Extract body
        body_match = re.search(r'"body"\s*:\s*"([^"]*)"', fetch_code)
        if body_match:
            options['body'] = body_match.group(1)

        # Extract credentials
        creds_match = re.search(r'"credentials"\s*:\s*"([^"]+)"', fetch_code)
        if creds_match:
            options['credentials'] = creds_match.group(1)

        return {'url': url, 'options': options}

    async def _execute_request(self, request_data: str, request_name: Optional[str] = None) -> str:
        """Execute a fetch request and return the response content"""
        parsed = self._parse_fetch_request(request_data)
        url = parsed['url']
        options = parsed['options']

        # Load cookies if request_name is provided
        if request_name:
            cached_cookies = self._load_cookies(request_name)
            if cached_cookies:
                # Add cookies to headers
                cookie_header = "; ".join([f"{k}={v}" for k, v in cached_cookies.items()])
                if 'headers' not in options:
                    options['headers'] = {}
                options['headers']['cookie'] = cookie_header

        async with aiohttp.ClientSession() as session:
            method = options.get('method', 'GET')
            headers = options.get('headers', {})
            body = options.get('body', None)

            timeout = aiohttp.ClientTimeout(total=30)  # 30 second timeout
            async with session.request(method, url, headers=headers, data=body, timeout=timeout) as response:
                content = await response.text()

                # Save cookies if request_name is provided
                if request_name and response.cookies:
                    cookies_dict = {k: v.value for k, v in response.cookies.items()}
                    self._save_cookies(request_name, cookies_dict)

                return content

    async def _fetch_url(self, url: str, request_name: Optional[str] = None) -> str:
        """Fetch URL content, optionally using a saved request for auth"""
        if request_name:
            # Load the request
            requests_file = self.config_dir / 'requests.json'
            if requests_file.exists():
                with open(requests_file, 'r') as f:
                    requests = json.load(f)

                # Find the request by name
                request = next((r for r in requests if r.get('name') == request_name), None)
                if request:
                    # Execute the auth request first
                    await self._execute_request(request['request'], request_name if request.get('save_cookies') else None)

                    # Load cookies for the main URL request
                    cookies = self._load_cookies(request_name) if request.get('save_cookies') else {}

                    # Now fetch the URL with cookies
                    async with aiohttp.ClientSession() as session:
                        if cookies:
                            cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
                            headers = {'cookie': cookie_header}
                        else:
                            headers = {}

                        timeout = aiohttp.ClientTimeout(total=30)
                        async with session.get(url, headers=headers, timeout=timeout) as response:
                            return await response.text()

        # Simple URL fetch without auth
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=timeout) as response:
                return await response.text()

    async def _download_images_from_json(self, json_data: str, request_name: str):
        """Download images from pictures API response"""
        try:
            data = json.loads(json_data)
            aa_data = data.get('aaData', [])

            if not aa_data:
                return

            # Create images directory
            images_dir = Path('downloaded_images')
            images_dir.mkdir(exist_ok=True)

            # Create batch directory with timestamp
            from datetime import datetime
            batch_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            batch_dir = images_dir / batch_timestamp
            batch_dir.mkdir(exist_ok=True)

            # Load cookies
            cookies = self._load_cookies(request_name)
            if not cookies:
                return

            downloaded = 0
            async with aiohttp.ClientSession() as session:
                for item in aa_data:
                    # Extract image URL from HTML
                    img_html = item[1]
                    url_match = re.search(r'href="([^"]+)"', img_html)

                    if url_match:
                        img_url = url_match.group(1)

                        # Extract filename
                        title_match = re.search(r'title="([^"]+)"', img_html)
                        filename = title_match.group(1) if title_match else f"image_{item[5]}.jpg"
                        safe_filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_', '.')).rstrip()

                        save_path = batch_dir / safe_filename

                        # Download
                        cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
                        headers = {'cookie': cookie_header}
                        timeout = aiohttp.ClientTimeout(total=30)

                        async with session.get(img_url, headers=headers, timeout=timeout) as response:
                            if response.status == 200:
                                content = await response.read()
                                with open(save_path, 'wb') as f:
                                    f.write(content)
                                downloaded += 1

            if downloaded > 0:
                print(f"  📸 Downloaded {downloaded} images to: {batch_dir}")

        except Exception as e:
            print(f"  Error downloading images: {e}")

    async def check_webpage(self, url: str, request_name: Optional[str] = None) -> bool:
        """Check a webpage for changes. Returns True if changed."""
        identifier = url

        try:
            # Update last check time
            self._update_last_check(identifier)

            # Fetch current content
            content = await self._fetch_url(url, request_name)

            # Check if this is the pictures API and download images
            if 'server_processing_pics.php' in url and request_name:
                await self._download_images_from_json(content, request_name)

            # Calculate hash
            content_hash = self._hash_content(content)

            # Load previous snapshot
            previous = self._load_snapshot(identifier)

            # Check for changes
            if previous is None:
                # First time seeing this page
                self._save_snapshot(identifier, content, content_hash)
                self._log_change(identifier, content, is_new=True, previous_content=None, is_request=False)
                return True
            elif previous['hash'] != content_hash:
                # Content changed
                previous_content = previous.get('content', '')
                self._save_snapshot(identifier, content, content_hash)
                self._log_change(identifier, content, is_new=False, previous_content=previous_content, is_request=False)
                return True

            return False

        except Exception as e:
            print(f"Error checking {url}: {e}")
            return False

    async def check_request(self, request_name: str, request_data: str, save_cookies: bool = False) -> bool:
        """Check a request for changes. Returns True if changed."""
        identifier = request_name

        try:
            # Update last check time
            self._update_last_check(identifier)

            # Execute request
            content = await self._execute_request(request_data, request_name if save_cookies else None)

            # Calculate hash
            content_hash = self._hash_content(content)

            # Load previous snapshot
            previous = self._load_snapshot(identifier)

            # Check for changes
            if previous is None:
                # First time seeing this response
                self._save_snapshot(identifier, content, content_hash)
                self._log_change(identifier, content, is_new=True, previous_content=None, is_request=True)
                return True
            elif previous['hash'] != content_hash:
                # Content changed
                previous_content = previous.get('content', '')
                self._save_snapshot(identifier, content, content_hash)
                self._log_change(identifier, content, is_new=False, previous_content=previous_content, is_request=True)
                return True

            return False

        except Exception as e:
            print(f"Error checking request {request_name}: {e}")
            return False


async def watch_all():
    """Watch all configured URLs and requests"""
    watcher = Watcher()

    # Load URLs
    urls_file = Path('config/urls.json')
    urls = []
    if urls_file.exists():
        with open(urls_file, 'r') as f:
            urls = json.load(f)

    # Load requests
    requests_file = Path('config/requests.json')
    requests = []
    if requests_file.exists():
        with open(requests_file, 'r') as f:
            requests = json.load(f)

    print("Starting monitoring...")
    print(f"Watching {len(urls)} webpage(s) and {len(requests)} request(s)")

    while True:
        # Check all webpages
        for webpage in urls:
            url = webpage.get('url')
            request_name = webpage.get('request_name')

            print(f"Checking webpage: {url}")
            changed = await watcher.check_webpage(url, request_name)
            if changed:
                print(f"  ✓ Change detected! Logged to logs/{url.replace('://', '_').replace('/', '_')}.log")
            else:
                print(f"  - No changes")

        # Check all requests
        for request in requests:
            name = request.get('name')
            request_data = request.get('request')
            save_cookies = request.get('save_cookies', False)

            print(f"Checking request: {name}")
            changed = await watcher.check_request(name, request_data, save_cookies)
            if changed:
                print(f"  ✓ Change detected! Logged to logs/{name}.log")
            else:
                print(f"  - No changes")

        # Wait before next check (e.g., 60 seconds)
        print("\nWaiting 60 seconds before next check...\n")
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(watch_all())

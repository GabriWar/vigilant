#!/usr/bin/env python3
"""
Simple TUI for website change detection
"""

import curses
from curses import wrapper
from curses.textpad import Textbox, rectangle
import json
import os
import subprocess
from pathlib import Path


def init_colors():
    """Initialize color pairs for the TUI"""
    if curses.has_colors():
        curses.start_color()
        curses.init_pair(1, curses.COLOR_CYAN, curses.COLOR_BLACK)     # Title
        curses.init_pair(2, curses.COLOR_GREEN, curses.COLOR_BLACK)    # Success
        curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)   # Warning
        curses.init_pair(4, curses.COLOR_RED, curses.COLOR_BLACK)      # Error
        curses.init_pair(5, curses.COLOR_MAGENTA, curses.COLOR_BLACK)  # Highlight
        curses.init_pair(6, curses.COLOR_WHITE, curses.COLOR_BLACK)    # Normal
        curses.init_pair(7, curses.COLOR_BLUE, curses.COLOR_BLACK)     # Info


def draw_border(stdscr, height, width):
    """Draw a border around the screen"""
    stdscr.clear()
    stdscr.border()


def get_text_input(stdscr, title, prompt, input_y_start=5, multiline=False):
    """Generic function to get text input from user"""
    height, width = stdscr.getmaxyx()

    # Draw border
    draw_border(stdscr, height, width)

    # Title
    stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)

    # Instructions
    stdscr.addstr(3, 2, prompt)

    # Draw input box border
    input_y = input_y_start
    input_x = 2
    input_width = width - 6
    input_height = 8 if multiline else 3

    rectangle(stdscr, input_y - 1, input_x - 1, input_y + input_height, input_x + input_width)

    # Create input window
    input_win = curses.newwin(input_height, input_width, input_y, input_x)
    input_win.keypad(True)

    # Help text
    help_text = "Press Ctrl+G to submit | Ctrl+C to cancel"
    stdscr.addstr(input_y + input_height + 2, 2, help_text, curses.A_DIM)

    stdscr.refresh()

    # Create textbox for input
    box = Textbox(input_win)
    box.edit()

    # Get the content
    text = box.gather().strip()

    return text


def get_yes_no(stdscr, title, question):
    """Get yes/no answer from user"""
    height, width = stdscr.getmaxyx()

    # Draw border
    draw_border(stdscr, height, width)

    # Title
    stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)

    # Question
    stdscr.addstr(height // 2 - 1, 2, question)

    # Options
    options = "Press 'y' for Yes or 'n' for No"
    stdscr.addstr(height // 2 + 1, 2, options, curses.A_DIM)

    stdscr.refresh()

    # Wait for y or n
    while True:
        key = stdscr.getch()
        if key in [ord('y'), ord('Y')]:
            return True
        elif key in [ord('n'), ord('N')]:
            return False
        elif key == 3:  # Ctrl+C
            raise KeyboardInterrupt


def get_watch_type(stdscr, title):
    """Get watch type from user (URL or Request)"""
    height, width = stdscr.getmaxyx()

    # Draw border
    draw_border(stdscr, height, width)

    # Title
    stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)

    # Question
    question = "What do you want to watch?"
    stdscr.addstr(height // 2 - 2, 2, question, curses.A_BOLD)

    # Options
    stdscr.addstr(height // 2, 2, "1. URL (watch a webpage)")
    stdscr.addstr(height // 2 + 1, 2, "2. Request (watch a single API request)")

    help_text = "Press '1' or '2' to select"
    stdscr.addstr(height // 2 + 3, 2, help_text, curses.A_DIM)

    stdscr.refresh()

    # Wait for 1 or 2
    while True:
        key = stdscr.getch()
        if key == ord('1'):
            return 'url'
        elif key == ord('2'):
            return 'request'
        elif key == 3:  # Ctrl+C
            raise KeyboardInterrupt


def load_urls():
    """Load URLs from JSON file"""
    config_dir = Path('config')
    config_dir.mkdir(exist_ok=True)
    urls_file = config_dir / 'urls.json'
    if urls_file.exists():
        with open(urls_file, 'r') as f:
            return json.load(f)
    return []


def save_urls(urls):
    """Save URLs to JSON file"""
    config_dir = Path('config')
    config_dir.mkdir(exist_ok=True)
    with open(config_dir / 'urls.json', 'w') as f:
        json.dump(urls, f, indent=2)


def load_requests():
    """Load requests from JSON file"""
    config_dir = Path('config')
    config_dir.mkdir(exist_ok=True)
    requests_file = config_dir / 'requests.json'
    if requests_file.exists():
        with open(requests_file, 'r') as f:
            return json.load(f)
    return []


def save_requests(requests):
    """Save requests to JSON file"""
    config_dir = Path('config')
    config_dir.mkdir(exist_ok=True)
    with open(config_dir / 'requests.json', 'w') as f:
        json.dump(requests, f, indent=2)


def ensure_cookies_folder():
    """Ensure cookies folder exists"""
    cookies_dir = Path('config/cookies')
    cookies_dir.mkdir(exist_ok=True, parents=True)
    return cookies_dir


def get_cookie_file_path(request_name):
    """Get the cookie file path for a request"""
    cookies_dir = ensure_cookies_folder()
    # Sanitize filename
    safe_name = "".join(c for c in request_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_name = safe_name.replace(' ', '_')
    return cookies_dir / f"{safe_name}.json"


def load_cookies(request_name):
    """Load cookies for a specific request"""
    cookie_file = get_cookie_file_path(request_name)
    if cookie_file.exists():
        with open(cookie_file, 'r') as f:
            return json.load(f)
    return {}


def save_cookies(request_name, cookies):
    """Save cookies for a specific request"""
    cookie_file = get_cookie_file_path(request_name)
    with open(cookie_file, 'w') as f:
        json.dump(cookies, f, indent=2)


def get_menu_choice(stdscr, title, options):
    """Generic menu selection function"""
    height, width = stdscr.getmaxyx()

    # Draw border
    draw_border(stdscr, height, width)

    # Title with color
    title_attr = curses.color_pair(1) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
    stdscr.addstr(1, (width - len(title)) // 2, title, title_attr)

    # Add decorative line
    stdscr.addstr(2, 2, "─" * (width - 4))

    # Display options
    start_y = height // 2 - len(options) // 2
    for idx, option in enumerate(options):
        option_attr = curses.color_pair(5) if curses.has_colors() else curses.A_NORMAL
        stdscr.addstr(start_y + idx, 4, f"[{idx + 1}]", option_attr)
        stdscr.addstr(start_y + idx, 8, option)

    help_text = f"Press 1-{len(options)} to select | Ctrl+C to cancel"
    help_attr = curses.color_pair(7) | curses.A_DIM if curses.has_colors() else curses.A_DIM
    stdscr.addstr(height - 3, 2, help_text, help_attr)

    stdscr.refresh()

    # Wait for valid selection
    while True:
        key = stdscr.getch()
        if key == 3:  # Ctrl+C
            raise KeyboardInterrupt
        # Check if key is in valid range
        if ord('1') <= key <= ord('9'):
            choice = key - ord('1')
            if 0 <= choice < len(options):
                return choice


def list_items(stdscr, title, items, item_type):
    """List items and allow selection"""
    if not items:
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)
        stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)
        stdscr.addstr(height // 2, 2, f"No {item_type} found.")
        stdscr.addstr(height - 2, 2, "Press any key to return...", curses.A_DIM)
        stdscr.refresh()
        stdscr.getch()
        return None

    height, width = stdscr.getmaxyx()
    draw_border(stdscr, height, width)

    stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)
    stdscr.addstr(3, 2, f"Select a {item_type}:", curses.A_BOLD)

    # Display items
    start_y = 5
    for idx, item in enumerate(items):
        if idx >= height - 8:  # Prevent overflow
            stdscr.addstr(start_y + idx, 2, "... (more items not shown)")
            break

        # Display based on type
        if item_type == "webpage":
            display_text = f"{idx + 1}. {item.get('url', 'N/A')}"
        else:  # request
            name = item.get('name', 'Unnamed')
            display_text = f"{idx + 1}. {name}"

        if len(display_text) > width - 4:
            display_text = display_text[:width - 7] + "..."

        stdscr.addstr(start_y + idx, 2, display_text)

    help_text = f"Press 1-{len(items)} to select | 'b' to go back"
    stdscr.addstr(height - 3, 2, help_text, curses.A_DIM)

    stdscr.refresh()

    # Wait for selection
    while True:
        key = stdscr.getch()
        if key in [ord('b'), ord('B')]:
            return None
        elif key == 3:  # Ctrl+C
            raise KeyboardInterrupt
        elif ord('1') <= key <= ord('9'):
            choice = key - ord('1')
            if 0 <= choice < len(items):
                return choice


def add_webpage(stdscr, existing_url=None, index=None):
    """Add or edit a webpage to monitor"""
    title = "Edit Webpage" if existing_url else "Add Webpage"

    # Get URL from user
    if existing_url:
        # For editing, show current URL
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)
        stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)
        stdscr.addstr(3, 2, f"Current URL: {existing_url.get('url', 'N/A')}")
        stdscr.addstr(4, 2, "Leave blank to keep the same URL")
        stdscr.refresh()

    url = get_text_input(stdscr, title, "Enter the URL to monitor:")

    # If editing and URL is empty, keep the old one
    if existing_url and not url:
        url = existing_url['url']
    elif not url:
        raise ValueError("URL cannot be empty")

    # Ask if request is needed for authentication
    needs_request = get_yes_no(stdscr, title,
                               "Do you need to use a saved request for authentication?")

    request_name = None
    if needs_request:
        # Load available requests
        requests = load_requests()
        if requests:
            # Let user select a request
            selected = list_items(stdscr, "Select Request", requests, "request")
            if selected is not None:
                request_name = requests[selected]['name']
        else:
            height, width = stdscr.getmaxyx()
            draw_border(stdscr, height, width)
            stdscr.addstr(height // 2, 2, "No saved requests found. Please add a request first.")
            stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
            stdscr.refresh()
            stdscr.getch()
            return

    # Load existing URLs
    urls = load_urls()

    # Create new entry
    new_entry = {
        "url": url,
        "request_name": request_name
    }

    # Add or update
    if index is not None:
        urls[index] = new_entry
        success_msg = "Webpage updated successfully!"
    else:
        urls.append(new_entry)
        success_msg = "Webpage saved successfully!"

    # Save to file
    save_urls(urls)

    # Display success message
    height, width = stdscr.getmaxyx()
    draw_border(stdscr, height, width)

    stdscr.addstr(height // 2 - 2, 2, success_msg, curses.A_BOLD)
    stdscr.addstr(height // 2 - 1, 2, f"URL: {url}")
    if request_name:
        stdscr.addstr(height // 2, 2, f"Auth request: {request_name}")

    stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
    stdscr.refresh()
    stdscr.getch()


def add_request(stdscr, existing_request=None, index=None):
    """Add or edit a request"""
    title = "Edit Request" if existing_request else "Add Request"

    # Get request name
    if existing_request:
        # For editing, show current name
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)
        stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)
        stdscr.addstr(3, 2, f"Current name: {existing_request.get('name', 'N/A')}")
        stdscr.addstr(4, 2, "Leave blank to keep the same name")
        stdscr.refresh()

    name = get_text_input(stdscr, title, "Enter a name for this request:")

    # If editing and name is empty, keep the old one
    if existing_request and not name:
        name = existing_request['name']
    elif not name:
        raise ValueError("Request name cannot be empty")

    # Get request details
    if existing_request:
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)
        stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)
        stdscr.addstr(3, 2, "Current request:")
        # Show preview of current request (truncated)
        current_req = existing_request.get('request', '')
        preview = current_req[:100] + "..." if len(current_req) > 100 else current_req
        stdscr.addstr(4, 2, preview[:width-4])
        stdscr.addstr(5, 2, "Leave blank to keep the same request")
        stdscr.refresh()

    request_data = get_text_input(stdscr, title,
                                 "Enter the request (fetch format):",
                                 input_y_start=5, multiline=True)

    # If editing and request is empty, keep the old one
    if existing_request and not request_data:
        request_data = existing_request['request']
    elif not request_data:
        raise ValueError("Request data cannot be empty")

    # Ask if we should save response cookies
    save_cookies = get_yes_no(stdscr, title,
                              "Should this request save response cookies?")

    # Load existing requests
    requests = load_requests()

    # Create new entry
    new_entry = {
        "name": name,
        "request": request_data,
        "save_cookies": save_cookies
    }

    # If saving cookies, ensure the cookie file exists
    if save_cookies:
        ensure_cookies_folder()
        # Initialize empty cookies if new request
        if not existing_request or not existing_request.get('save_cookies'):
            save_cookies(name, {})

    # Add or update
    if index is not None:
        requests[index] = new_entry
        success_msg = "Request updated successfully!"
    else:
        requests.append(new_entry)
        success_msg = "Request saved successfully!"

    # Save to file
    save_requests(requests)

    # Display success message
    height, width = stdscr.getmaxyx()
    draw_border(stdscr, height, width)

    stdscr.addstr(height // 2 - 1, 2, success_msg, curses.A_BOLD)
    stdscr.addstr(height // 2, 2, f"Name: {name}")

    stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
    stdscr.refresh()
    stdscr.getch()


def edit_webpage_menu(stdscr, webpage, index):
    """Show edit menu for a webpage"""
    while True:
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)

        title = "Edit Webpage"
        title_attr = curses.color_pair(1) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
        stdscr.addstr(1, (width - len(title)) // 2, title, title_attr)
        stdscr.addstr(2, 2, "─" * (width - 4))

        # Display current webpage info
        info_attr = curses.color_pair(5) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
        stdscr.addstr(4, 2, "Current webpage:", info_attr)
        stdscr.addstr(5, 4, f"URL: {webpage.get('url', 'N/A')}")
        req_name = webpage.get('request_name')
        stdscr.addstr(6, 4, f"Auth request: {req_name if req_name else 'None'}")

        # Show watch interval if exists
        interval = webpage.get('watch_interval_display', 'Not set')
        stdscr.addstr(7, 4, f"Watch interval: {interval}")

        # Menu options
        stdscr.addstr(9, 2, "1. Edit URL and auth request")
        stdscr.addstr(10, 2, "2. Change auth request only")
        stdscr.addstr(11, 2, "3. Edit watch interval")
        stdscr.addstr(12, 2, "4. Delete webpage")
        stdscr.addstr(13, 2, "5. Back")

        help_attr = curses.color_pair(7) | curses.A_DIM if curses.has_colors() else curses.A_DIM
        stdscr.addstr(height - 3, 2, "Press 1-5 to select", help_attr)
        stdscr.refresh()

        key = stdscr.getch()
        if key == ord('1'):
            add_webpage(stdscr, existing_url=webpage, index=index)
            return
        elif key == ord('2'):
            # Change auth request only
            needs_request = get_yes_no(stdscr, "Change Auth Request",
                                       "Do you want to use a saved request for authentication?")
            request_name = None
            if needs_request:
                requests = load_requests()
                if requests:
                    selected = list_items(stdscr, "Select Request", requests, "request")
                    if selected is not None:
                        request_name = requests[selected]['name']
                        urls = load_urls()
                        urls[index]['request_name'] = request_name
                        save_urls(urls)
                        webpage['request_name'] = request_name
            else:
                urls = load_urls()
                urls[index]['request_name'] = None
                save_urls(urls)
                webpage['request_name'] = None
        elif key == ord('3'):
            # Edit watch interval
            try:
                interval_seconds, interval_display = get_watch_interval(stdscr)
                urls = load_urls()
                urls[index]['watch_interval'] = interval_seconds
                urls[index]['watch_interval_display'] = interval_display
                save_urls(urls)
                webpage['watch_interval'] = interval_seconds
                webpage['watch_interval_display'] = interval_display
            except ValueError:
                pass
        elif key == ord('4'):
            # Confirm deletion
            if get_yes_no(stdscr, "Delete Webpage", "Are you sure you want to delete this webpage?"):
                urls = load_urls()
                del urls[index]
                save_urls(urls)

                height, width = stdscr.getmaxyx()
                draw_border(stdscr, height, width)
                success_attr = curses.color_pair(2) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
                stdscr.addstr(height // 2, 2, "Webpage deleted successfully!", success_attr)
                stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
                stdscr.refresh()
                stdscr.getch()
            return
        elif key == ord('5'):
            return
        elif key == 3:  # Ctrl+C
            raise KeyboardInterrupt


def get_watch_interval(stdscr):
    """Get watch interval from user"""
    # Ask for time unit
    height, width = stdscr.getmaxyx()
    draw_border(stdscr, height, width)

    title = "Watch Interval"
    stdscr.addstr(1, (width - len(title)) // 2, title, curses.A_BOLD)

    stdscr.addstr(3, 2, "How often should the page be checked?", curses.A_BOLD)
    stdscr.addstr(5, 2, "1. Seconds")
    stdscr.addstr(6, 2, "2. Minutes")
    stdscr.addstr(7, 2, "3. Hours")
    stdscr.addstr(8, 2, "4. Days")

    stdscr.addstr(height - 3, 2, "Press 1-4 to select", curses.A_DIM)
    stdscr.refresh()

    # Get time unit
    unit_map = {ord('1'): 'seconds', ord('2'): 'minutes', ord('3'): 'hours', ord('4'): 'days'}
    multiplier_map = {'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400}

    while True:
        key = stdscr.getch()
        if key in unit_map:
            unit = unit_map[key]
            break
        elif key == 3:
            raise KeyboardInterrupt

    # Get interval value
    interval_str = get_text_input(stdscr, "Watch Interval", f"Enter interval in {unit}:")

    try:
        interval_value = int(interval_str)
        if interval_value <= 0:
            raise ValueError("Interval must be positive")

        # Convert to seconds
        interval_seconds = interval_value * multiplier_map[unit]

        return interval_seconds, f"{interval_value} {unit}"
    except ValueError:
        raise ValueError("Invalid interval value")


def watch_webpage(stdscr, webpage):
    """Watch a single webpage for changes - TERMINAL MODE"""
    url = webpage.get('url')
    interval_seconds = webpage.get('watch_interval', 60)
    interval_display = webpage.get('watch_interval_display', f"{interval_seconds} seconds")

    # Exit curses mode for terminal output
    curses.endwin()

    print("\n" + "=" * 80)
    print("WEBPAGE MONITORING - TERMINAL MODE")
    print("=" * 80)
    print(f"URL: {url}")
    print(f"Interval: {interval_display}")
    print(f"Auth Request: {webpage.get('request_name', 'None')}")
    print("=" * 80)
    print("\nPress Ctrl+C to stop\n")

    import asyncio
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from watcher import Watcher
    from datetime import datetime

    watcher = Watcher()

    # Check cookies
    req_name = webpage.get('request_name')
    if req_name:
        cookies = load_cookies(req_name)
        if cookies:
            print(f"\n✓ COOKIES LOADED ({len(cookies)} items):")
            for key, value in cookies.items():
                print(f"  {key}: {value[:60]}...")
        else:
            print("\n⚠ WARNING: No cookies cached!")
            print("  First request will execute login to get cookies.\n")

    async def monitor():
        check_count = 0
        changes_count = 0

        while True:
            check_count += 1
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"\n[{timestamp}] Check #{check_count}")
            print("  Fetching URL...", end='', flush=True)

            try:
                import time
                start_time = time.time()
                changed = await watcher.check_webpage(url, req_name)
                elapsed = time.time() - start_time

                # Load snapshot
                snapshot = watcher._load_snapshot(url)
                if snapshot:
                    content = snapshot.get('content', '')
                    content_hash = snapshot.get('hash', 'N/A')

                    print(f" Done in {elapsed:.2f}s")
                    print(f"  Content size: {len(content)} bytes")
                    print(f"  Content hash: {content_hash[:16]}...")

                    if changed:
                        changes_count += 1
                        print(f"\n  🔔 CHANGE DETECTED! (Total: {changes_count})")

                        # Find the latest HTML archive
                        import re
                        safe_name = re.sub(r'[^\w\s-]', '', url).strip().replace(' ', '_')
                        safe_name = safe_name.replace('https', '').replace('http', '').replace('_', '_')
                        html_dir = Path('html_archive') / safe_name
                        if html_dir.exists():
                            html_files = sorted(html_dir.glob('*.html'), key=lambda p: p.stat().st_mtime, reverse=True)
                            if html_files:
                                print(f"  📄 HTML saved to: {html_files[0]}")
                                print(f"  📂 Open in browser: file://{html_files[0].absolute()}")
                                print(f"  📝 Diff logged to: logs/")
                    else:
                        print(f"\n  ✓ No changes")

                    # Show FULL HTML
                    print(f"\n  {'='*76}")
                    print(f"  FULL HTML CONTENT:")
                    print(f"  {'='*76}")
                    print(content)
                    print(f"  {'='*76}")
                    print(f"  END OF HTML CONTENT")
                    print(f"  {'='*76}")

                    # Show cookies on every check
                    if req_name:
                        cookies = load_cookies(req_name)
                        print(f"\n  {'='*76}")
                        print(f"  COOKIES USED FOR THIS REQUEST:")
                        print(f"  {'='*76}")
                        if cookies:
                            print(f"  ✓ Using {len(cookies)} cookie(s):")
                            for key, value in cookies.items():
                                print(f"    {key} = {value}")
                        else:
                            print(f"  ⚠ WARNING: No cookies available!")
                            print(f"  The auth request may not have set cookies.")
                        print(f"  {'='*76}")

            except Exception as e:
                print(f" ERROR!")
                print(f"  ✗ {e}")
                import traceback
                traceback.print_exc()

            print(f"\n  Waiting {interval_seconds} seconds...")
            print("-" * 80)

            # Countdown
            for remaining in range(interval_seconds, 0, -1):
                print(f"\r  Next check in: {remaining}s ", end='', flush=True)
                await asyncio.sleep(1)

            print("\r" + " " * 30, end='\r')

    try:
        asyncio.run(monitor())
    except KeyboardInterrupt:
        print("\n\n✓ Stopped by user")
        print("=" * 80)


def manage_webpages(stdscr):
    """Manage webpages (watch/add/edit)"""
    while True:
        options = ["Add new webpage", "Edit existing webpage", "Watch webpage", "Back to main menu"]
        choice = get_menu_choice(stdscr, "Manage Webpages", options)

        if choice == 0:  # Add
            add_webpage(stdscr)
        elif choice == 1:  # Edit
            urls = load_urls()
            selected = list_items(stdscr, "Select Webpage", urls, "webpage")
            if selected is not None:
                edit_webpage_menu(stdscr, urls[selected], selected)
        elif choice == 2:  # Watch
            urls = load_urls()
            selected = list_items(stdscr, "Select Webpage to Watch", urls, "webpage")
            if selected is not None:
                watch_webpage(stdscr, urls[selected])
        elif choice == 3:  # Back
            break


def edit_request_menu(stdscr, request, index):
    """Show edit menu for a request"""
    while True:
        height, width = stdscr.getmaxyx()
        draw_border(stdscr, height, width)

        title = "Edit Request"
        title_attr = curses.color_pair(1) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
        stdscr.addstr(1, (width - len(title)) // 2, title, title_attr)
        stdscr.addstr(2, 2, "─" * (width - 4))

        # Display current request info
        info_attr = curses.color_pair(5) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
        stdscr.addstr(4, 2, "Current request:", info_attr)
        stdscr.addstr(5, 4, f"Name: {request.get('name', 'N/A')}")

        # Show preview of request
        req_data = request.get('request', '')
        preview = req_data[:80] + "..." if len(req_data) > 80 else req_data
        stdscr.addstr(6, 4, f"Request: {preview}")

        # Show if cookies are saved
        saves_cookies = request.get('save_cookies', False)
        cookie_attr = curses.color_pair(2) if saves_cookies and curses.has_colors() else curses.A_NORMAL
        stdscr.addstr(7, 4, f"Saves cookies: {'Yes' if saves_cookies else 'No'}", cookie_attr)

        # Show cookie cache status
        line_num = 8
        if saves_cookies:
            cookies = load_cookies(request.get('name', ''))
            cookie_status = "Cached" if cookies else "Empty"
            cache_attr = curses.color_pair(2) if cookies and curses.has_colors() else curses.color_pair(3)
            stdscr.addstr(line_num, 4, f"Cookie cache: {cookie_status}", cache_attr if curses.has_colors() else curses.A_NORMAL)
            line_num += 1

        # Show watch interval
        interval = request.get('watch_interval_display', 'Not set')
        stdscr.addstr(line_num, 4, f"Watch interval: {interval}")

        # Menu options
        start_y = line_num + 2
        stdscr.addstr(start_y, 2, "1. Edit request details")
        stdscr.addstr(start_y + 1, 2, "2. Edit watch interval")
        stdscr.addstr(start_y + 2, 2, "3. Delete request")
        menu_offset = 3
        if saves_cookies:
            stdscr.addstr(start_y + 3, 2, "4. Clear cookie cache")
            stdscr.addstr(start_y + 4, 2, "5. Back")
            menu_offset = 5
        else:
            stdscr.addstr(start_y + 3, 2, "4. Back")
            menu_offset = 4

        help_attr = curses.color_pair(7) | curses.A_DIM if curses.has_colors() else curses.A_DIM
        stdscr.addstr(height - 3, 2, f"Press 1-{menu_offset} to select", help_attr)
        stdscr.refresh()

        key = stdscr.getch()
        if key == ord('1'):
            add_request(stdscr, existing_request=request, index=index)
            return
        elif key == ord('2'):
            # Edit watch interval
            try:
                interval_seconds, interval_display = get_watch_interval(stdscr)
                requests = load_requests()
                requests[index]['watch_interval'] = interval_seconds
                requests[index]['watch_interval_display'] = interval_display
                save_requests(requests)
                request['watch_interval'] = interval_seconds
                request['watch_interval_display'] = interval_display
            except ValueError:
                pass
        elif key == ord('3'):
            # Confirm deletion
            if get_yes_no(stdscr, "Delete Request", "Are you sure you want to delete this request?"):
                requests = load_requests()
                # Delete cookie file if it exists
                if request.get('save_cookies'):
                    cookie_file = get_cookie_file_path(request.get('name', ''))
                    if cookie_file.exists():
                        cookie_file.unlink()

                del requests[index]
                save_requests(requests)

                height, width = stdscr.getmaxyx()
                draw_border(stdscr, height, width)
                success_attr = curses.color_pair(2) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
                stdscr.addstr(height // 2, 2, "Request deleted successfully!", success_attr)
                stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
                stdscr.refresh()
                stdscr.getch()
            return
        elif key == ord('4'):
            if saves_cookies:
                # Clear cookie cache
                if get_yes_no(stdscr, "Clear Cookies", "Are you sure you want to clear the cookie cache?"):
                    save_cookies(request.get('name', ''), {})

                    height, width = stdscr.getmaxyx()
                    draw_border(stdscr, height, width)
                    success_attr = curses.color_pair(2) | curses.A_BOLD if curses.has_colors() else curses.A_BOLD
                    stdscr.addstr(height // 2, 2, "Cookie cache cleared!", success_attr)
                    stdscr.addstr(height - 2, 2, "Press any key to continue...", curses.A_DIM)
                    stdscr.refresh()
                    stdscr.getch()
            else:
                return
        elif key == ord('5') and saves_cookies:
            return
        elif key == 3:  # Ctrl+C
            raise KeyboardInterrupt


def watch_request(stdscr, request):
    """Watch a single request for changes - TERMINAL MODE"""
    name = request.get('name')
    interval_seconds = request.get('watch_interval', 60)
    interval_display = request.get('watch_interval_display', f"{interval_seconds} seconds")

    # Exit curses mode for terminal output
    curses.endwin()

    print("\n" + "=" * 80)
    print("REQUEST MONITORING - TERMINAL MODE")
    print("=" * 80)
    print(f"Request: {name}")
    print(f"Interval: {interval_display}")
    print(f"Save cookies: {request.get('save_cookies', False)}")
    print("=" * 80)
    print("\nPress Ctrl+C to stop\n")

    import asyncio
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from watcher import Watcher
    from datetime import datetime

    watcher = Watcher()

    # Check cookies
    if request.get('save_cookies'):
        cookies = load_cookies(name)
        if cookies:
            print(f"\n✓ COOKIES LOADED ({len(cookies)} items):")
            for key, value in cookies.items():
                print(f"  {key}: {value[:60]}...")
        else:
            print("\n⚠ No cookies cached yet.\n")

    async def monitor():
        check_count = 0
        changes_count = 0

        while True:
            check_count += 1
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"\n[{timestamp}] Check #{check_count}")
            print("  Executing request...", end='', flush=True)

            try:
                import time
                start_time = time.time()
                changed = await watcher.check_request(
                    name,
                    request.get('request'),
                    request.get('save_cookies', False)
                )
                elapsed = time.time() - start_time

                # Load snapshot
                snapshot = watcher._load_snapshot(name)
                if snapshot:
                    content = snapshot.get('content', '')
                    content_hash = snapshot.get('hash', 'N/A')

                    print(f" Done in {elapsed:.2f}s")
                    print(f"  Response size: {len(content)} bytes")
                    print(f"  Response hash: {content_hash[:16]}...")

                    if changed:
                        changes_count += 1
                        print(f"\n  🔔 CHANGE DETECTED! (Total: {changes_count})")

                        # Find the latest request archive
                        safe_name = name.replace(' ', '_')
                        req_dir = Path('requests_archive') / safe_name
                        if req_dir.exists():
                            req_files = sorted(req_dir.glob('*.json'), key=lambda p: p.stat().st_mtime, reverse=True)
                            if req_files:
                                print(f"  📄 Response saved to: {req_files[0]}")
                                print(f"  📝 Diff logged to: logs/")

                        # Show cookies saved
                        if request.get('save_cookies'):
                            cookies = load_cookies(name)
                            if cookies:
                                print(f"  🍪 Cookies saved: {len(cookies)} items")
                    else:
                        print(f"\n  ✓ No changes")

                    # Show FULL RESPONSE
                    print(f"\n  {'='*76}")
                    print(f"  FULL RESPONSE CONTENT:")
                    print(f"  {'='*76}")
                    print(content)
                    print(f"  {'='*76}")
                    print(f"  END OF RESPONSE CONTENT")
                    print(f"  {'='*76}")

                    # Always show cookies if save_cookies is enabled
                    if request.get('save_cookies'):
                        cookies = load_cookies(name)
                        print(f"\n  {'='*76}")
                        print(f"  COOKIES FROM RESPONSE:")
                        print(f"  {'='*76}")
                        if cookies:
                            print(f"  ✓ Found {len(cookies)} cookie(s):")
                            for key, value in cookies.items():
                                print(f"    {key} = {value}")
                        else:
                            print(f"  ⚠ WARNING: No cookies received in response!")
                            print(f"  This might mean:")
                            print(f"    - Login failed")
                            print(f"    - Server didn't send Set-Cookie headers")
                            print(f"    - Credentials are incorrect")
                        print(f"  {'='*76}")

            except Exception as e:
                print(f" ERROR!")
                print(f"  ✗ {e}")
                import traceback
                traceback.print_exc()

            print(f"\n  Waiting {interval_seconds} seconds...")
            print("-" * 80)

            # Countdown
            for remaining in range(interval_seconds, 0, -1):
                print(f"\r  Next check in: {remaining}s ", end='', flush=True)
                await asyncio.sleep(1)

            print("\r" + " " * 30, end='\r')

    try:
        asyncio.run(monitor())
    except KeyboardInterrupt:
        print("\n\n✓ Stopped by user")
        print("=" * 80)


def manage_requests(stdscr):
    """Manage requests (watch/add/edit)"""
    while True:
        options = ["Add new request", "Edit existing request", "Watch request", "Back to main menu"]
        choice = get_menu_choice(stdscr, "Manage Requests", options)

        if choice == 0:  # Add
            add_request(stdscr)
        elif choice == 1:  # Edit
            requests = load_requests()
            selected = list_items(stdscr, "Select Request", requests, "request")
            if selected is not None:
                edit_request_menu(stdscr, requests[selected], selected)
        elif choice == 2:  # Watch
            requests = load_requests()
            selected = list_items(stdscr, "Select Request to Watch", requests, "request")
            if selected is not None:
                watch_request(stdscr, requests[selected])
        elif choice == 3:  # Back
            break


def main(stdscr):
    """Main TUI function"""
    # Initialize colors
    init_colors()
    curses.curs_set(1)  # Show cursor

    try:
        while True:
            # Main menu
            options = ["Manage Webpages", "Manage Requests", "Exit"]
            choice = get_menu_choice(stdscr, "Website Change Monitor", options)

            if choice == 0:  # Webpages
                manage_webpages(stdscr)
            elif choice == 1:  # Requests
                manage_requests(stdscr)
            elif choice == 2:  # Exit
                break

    except KeyboardInterrupt:
        pass
    except Exception as e:
        stdscr.clear()
        stdscr.addstr(0, 0, f"Error: {str(e)}")
        stdscr.refresh()
        stdscr.getch()


if __name__ == "__main__":
    wrapper(main)

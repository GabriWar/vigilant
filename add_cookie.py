#!/usr/bin/env python3
"""
Quick script to manually add cookies for a request
"""
import json
from pathlib import Path

def add_cookie():
    request_name = input("Enter request name (e.g., 'cokie MobileTracker'): ").strip()

    print("\nEnter cookies in format: name=value")
    print("Press Enter with empty line when done")

    cookies = {}
    while True:
        cookie_input = input("Cookie: ").strip()
        if not cookie_input:
            break

        if '=' in cookie_input:
            name, value = cookie_input.split('=', 1)
            cookies[name.strip()] = value.strip()
        else:
            print("Invalid format. Use: name=value")

    if cookies:
        # Save cookies
        cookies_dir = Path('cookies')
        cookies_dir.mkdir(exist_ok=True)

        safe_name = "".join(c for c in request_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        cookie_file = cookies_dir / f"{safe_name}.json"

        with open(cookie_file, 'w') as f:
            json.dump(cookies, f, indent=2)

        print(f"\n✓ Saved {len(cookies)} cookies to {cookie_file}")
        print("\nCookies saved:")
        for name, value in cookies.items():
            print(f"  {name}: {value[:50]}...")
    else:
        print("No cookies entered")

if __name__ == "__main__":
    add_cookie()

#!/usr/bin/env python3
"""
Test the login request to see what cookies are returned
"""
import asyncio
import aiohttp
import json
from pathlib import Path

async def test_login():
    print("=" * 80)
    print("TESTING LOGIN REQUEST")
    print("=" * 80)

    # Load the request
    with open('config/requests.json', 'r') as f:
        requests = json.load(f)

    login_request = requests[0]
    print(f"\nRequest name: {login_request['name']}")
    print(f"Save cookies: {login_request.get('save_cookies', False)}")
    print("\nExecuting login request...")
    print("-" * 80)

    # The login endpoint
    url = "https://mobile-tracker-free.com/login/getLogin.php"

    headers = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,pt;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": '"Not?A_Brand";v="99", "Chromium";v="130"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-requested-with": "XMLHttpRequest",
        "referer": "https://mobile-tracker-free.com/login/",
        "origin": "https://mobile-tracker-free.com"
    }

    body = "login=fakemailoffakers%40gmail.com&pass=grdcg0222%2B*"

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, data=body) as response:
            print(f"\nResponse Status: {response.status}")
            print(f"Response Headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            print(f"\n{'=' * 80}")
            print("COOKIES IN RESPONSE:")
            print("=" * 80)

            if response.cookies:
                print(f"Found {len(response.cookies)} cookie(s):\n")
                for cookie_name, cookie in response.cookies.items():
                    print(f"  Name: {cookie_name}")
                    print(f"  Value: {cookie.value}")
                    print(f"  Domain: {cookie.get('domain', 'N/A')}")
                    print(f"  Path: {cookie.get('path', 'N/A')}")
                    print(f"  Secure: {cookie.get('secure', False)}")
                    print(f"  HttpOnly: {cookie.get('httponly', False)}")
                    print()

                # Save cookies
                cookies_dict = {k: v.value for k, v in response.cookies.items()}
                cookies_dir = Path('config/cookies')
                cookies_dir.mkdir(exist_ok=True, parents=True)
                cookie_file = cookies_dir / "cokie_MobileTracker.json"

                with open(cookie_file, 'w') as f:
                    json.dump(cookies_dict, f, indent=2)

                print(f"✓ Cookies saved to: {cookie_file}")
                print(f"\nCookie file contents:")
                with open(cookie_file, 'r') as f:
                    print(f.read())
            else:
                print("⚠ NO COOKIES IN RESPONSE!")
                print("\nThis could mean:")
                print("  1. Login failed (check credentials)")
                print("  2. Server doesn't use cookies for this endpoint")
                print("  3. Cookies are set via JavaScript, not HTTP headers")

            print(f"\n{'=' * 80}")
            print("RESPONSE BODY:")
            print("=" * 80)
            content = await response.text()
            print(content)
            print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_login())

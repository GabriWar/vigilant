#!/usr/bin/env python3
"""
Download images from the pictures API response
"""
import asyncio
import aiohttp
import json
import re
from pathlib import Path
from datetime import datetime


async def download_image(session, url, save_path, cookies):
    """Download a single image"""
    try:
        cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
        headers = {'cookie': cookie_header}

        timeout = aiohttp.ClientTimeout(total=30)
        async with session.get(url, headers=headers, timeout=timeout) as response:
            if response.status == 200:
                content = await response.read()
                with open(save_path, 'wb') as f:
                    f.write(content)
                return True
            else:
                print(f"  Failed to download: {url} (status {response.status})")
                return False
    except Exception as e:
        print(f"  Error downloading {url}: {e}")
        return False


async def process_pictures_response(json_data, cookies):
    """Process pictures API response and download images"""

    # Create images directory
    images_dir = Path('downloaded_images')
    images_dir.mkdir(exist_ok=True)

    # Parse JSON
    try:
        data = json.loads(json_data) if isinstance(json_data, str) else json_data
        aa_data = data.get('aaData', [])
    except json.JSONDecodeError:
        print("Error: Invalid JSON data")
        return

    if not aa_data:
        print("No images found in response")
        return

    print(f"\nFound {len(aa_data)} images to download")

    # Create session timestamp for this batch
    batch_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    batch_dir = images_dir / batch_timestamp
    batch_dir.mkdir(exist_ok=True)

    # Create metadata file
    metadata = []

    async with aiohttp.ClientSession() as session:
        for idx, item in enumerate(aa_data):
            # item structure:
            # [0] - checkbox HTML
            # [1] - image link HTML
            # [2] - date
            # [3] - filename/size
            # [4] - location
            # [5] - ID

            # Extract image URL from HTML
            img_html = item[1]
            url_match = re.search(r'href="([^"]+)"', img_html)

            if url_match:
                img_url = url_match.group(1)

                # Extract filename from title
                title_match = re.search(r'title="([^"]+)"', img_html)
                filename = title_match.group(1) if title_match else f"image_{item[5]}.jpg"

                # Clean filename
                safe_filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_', '.')).rstrip()

                # Extract metadata
                date = item[2]
                file_info = item[3]
                location = re.sub(r'<[^>]+>', '', item[4])  # Strip HTML tags
                img_id = item[5]

                # Save path
                save_path = batch_dir / safe_filename

                print(f"  [{idx+1}/{len(aa_data)}] Downloading: {filename}")

                # Download image
                success = await download_image(session, img_url, save_path, cookies)

                if success:
                    print(f"    ✓ Saved to: {save_path}")

                    # Add to metadata
                    metadata.append({
                        'id': img_id,
                        'filename': filename,
                        'saved_as': str(save_path),
                        'date': date,
                        'file_info': file_info.replace('<br />', ' ').replace('<span>', '').replace('</span>', ''),
                        'location': location.strip(),
                        'url': img_url
                    })

    # Save metadata
    metadata_file = batch_dir / '_metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Downloaded {len(metadata)} images to: {batch_dir}")
    print(f"✓ Metadata saved to: {metadata_file}")


async def main():
    """Main function to test image downloading"""

    # Load cookies
    cookies_dir = Path('config/cookies')
    cookie_file = cookies_dir / "cokie_MobileTracker.json"

    if not cookie_file.exists():
        print("Error: No cookies found. Run the login first.")
        return

    with open(cookie_file, 'r') as f:
        cookies = json.load(f)

    print(f"Loaded {len(cookies)} cookie(s)")

    # Fetch the pictures API
    url = "https://mobile-tracker-free.com/dashboard/scripts/data/server_processing_pics.php"

    async with aiohttp.ClientSession() as session:
        cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
        headers = {'cookie': cookie_header}

        print(f"\nFetching: {url}")
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                json_data = await response.text()
                print(f"✓ Got response ({len(json_data)} bytes)")

                # Process and download images
                await process_pictures_response(json_data, cookies)
            else:
                print(f"Error: Failed to fetch API (status {response.status})")


if __name__ == "__main__":
    asyncio.run(main())

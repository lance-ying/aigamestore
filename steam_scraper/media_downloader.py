"""Media downloading functions for Steam game assets."""

import os
import requests
from urllib.parse import urlparse
from .config import SCREENSHOTS_DIR, ICONS_DIR, VIDEOS_DIR, REQUEST_TIMEOUT, MAX_SCREENSHOTS

def sanitize_filename(filename):
    """Sanitize filename to be filesystem-safe."""
    # Remove or replace problematic characters
    filename = filename.replace(':', '_')
    filename = filename.replace('/', '_')
    filename = filename.replace('\\', '_')
    filename = filename.replace('?', '_')
    filename = filename.replace('<', '_')
    filename = filename.replace('>', '_')
    filename = filename.replace('|', '_')
    filename = filename.replace('"', '_')
    filename = filename.replace('*', '_')
    filename = filename.strip()
    
    # Limit length and ensure it's not empty
    filename = filename[:100] if len(filename) > 100 else filename
    return filename or 'unnamed'

def download_file(url, file_path, timeout=REQUEST_TIMEOUT):
    """Download a file from URL to local path."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"    Error downloading {url}: {e}")
        return False

def download_game_media(app_id, app_details):
    """Download media assets for a Steam game."""
    safe_name = sanitize_filename(app_details['name'])
    media_info = {
        'header_image_path': '',
        'screenshots': [],
        'has_video': False,
        'video_path': ''
    }
    
    # Download header image (icon equivalent)
    if app_details['header_image']:
        header_filename = f"{safe_name}_{app_id}_header.jpg"
        header_path = os.path.join(ICONS_DIR, header_filename)
        
        if download_file(app_details['header_image'], header_path):
            media_info['header_image_path'] = header_path
            print(f"    Downloaded header image: {header_filename}")
    
    # Download screenshots
    screenshot_urls = app_details['screenshot_urls'][:MAX_SCREENSHOTS]
    for i, screenshot_url in enumerate(screenshot_urls, 1):
        screenshot_filename = f"{safe_name}_{app_id}_screenshot_{i}.jpg"
        screenshot_path = os.path.join(SCREENSHOTS_DIR, screenshot_filename)
        
        if download_file(screenshot_url, screenshot_path):
            media_info['screenshots'].append(screenshot_path)
            print(f"    Downloaded screenshot {i}: {screenshot_filename}")
    
    # Note: Steam doesn't provide direct video URLs in app details API
    # Videos would require additional API calls or web scraping
    
    return media_info
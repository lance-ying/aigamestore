"""Configuration settings for the Steam scraper."""

import os

# API Configuration
STEAM_API_KEY = "E74C4D879AF94430AOC5F02855E360F0"

# Steam API URLs
STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/search/results/"
STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails"
STEAM_API_BASE = "https://api.steampowered.com"
STEAM_STORE_SERVICE_URL = f"{STEAM_API_BASE}/IStoreService/GetAppList/v1/"

# Directory Configuration
BASE_OUTPUT_DIR = "steam_data"
MEDIA_DIR = os.path.join(BASE_OUTPUT_DIR, "media")
SCREENSHOTS_DIR = os.path.join(MEDIA_DIR, "screenshots")
ICONS_DIR = os.path.join(MEDIA_DIR, "icons")
VIDEOS_DIR = os.path.join(MEDIA_DIR, "videos")
JSON_OUTPUT_DIR = os.path.join(BASE_OUTPUT_DIR, "json")

# Processing Configuration
BATCH_SIZE = 5  # Reduced from 10 to be more conservative
MAX_SCREENSHOTS = 5
REQUEST_TIMEOUT = 30
BATCH_DELAY = 5  # Increased from 2 to 5 seconds

# Steam Categories - using internal Steam API parameters
STEAM_CATEGORIES = {
    'top_sellers': 'topsellers',
    'new_trending': 'popularnew', 
    'global_top_sellers': 'globaltopsellers',
    'popular_upcoming': 'popularcomingsoon',
    'specials': 'specials',
    'action': {'category1': '19'},
    'adventure': {'category1': '25'},
    'indie': {'category1': '492'},
    'rpg': {'category1': '122'},
    'strategy': {'category1': '2'},
    'simulation': {'category1': '599'},
    'sports': {'category1': '701'},
    'racing': {'category1': '699'}
}
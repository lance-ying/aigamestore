"""Alternative Steam API functions using ISteamApps and web scraping."""

import requests
import time
import json
import random
from .config import (
    STEAM_API_KEY, STEAM_APP_DETAILS_URL, REQUEST_TIMEOUT
)

def get_all_steam_games():
    """Get all Steam games using ISteamApps API."""
    try:
        url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        apps = data.get('applist', {}).get('apps', [])
        
        # Filter only games (rough heuristic - exclude obvious non-games)
        games = []
        for app in apps:
            name = app.get('name', '').lower()
            # Skip obvious non-games
            if any(skip_word in name for skip_word in ['soundtrack', 'trailer', 'beta', 'demo', 'dlc']):
                continue
            games.append(app)
        
        return games
    except Exception as e:
        print(f"Error getting Steam games list: {e}")
        return []

def fetch_top_games_by_category(category_key, limit=50):
    """Simulate fetching top games by category using sample popular games."""
    print(f"Simulating top {limit} games for category: {category_key}")
    
    # For demo purposes, use some well-known popular Steam game IDs
    popular_app_ids = [
        730,    # Counter-Strike 2
        578080, # PUBG
        1085660, # Destiny 2
        570,    # Dota 2
        440,    # Team Fortress 2
        271590, # Grand Theft Auto V
        413150, # Stardew Valley
        292030, # The Witcher 3
        1151640, # Horizon Zero Dawn
        1086940, # Baldur's Gate 3
        1174180, # Red Dead Redemption 2
        1245620, # ELDEN RING
        381210,  # Dead by Daylight
        1172470, # Apex Legends
        252490,  # Rust
        105600,  # Terraria
        346110,  # ARK: Survival Evolved
        230410,  # Warframe
        774361,  # Fall Guys
        945360   # Among Us
    ]
    
    # Shuffle and take a sample
    random.shuffle(popular_app_ids)
    selected_ids = popular_app_ids[:limit]
    
    games = []
    for i, app_id in enumerate(selected_ids):
        # Get basic info first to get the name
        app_details = get_basic_app_info(app_id)
        if app_details and app_details.get('name'):
            game = {
                'app_id': app_id,
                'name': app_details['name'],
                'price': 'N/A'  # We'll get this from detailed info later
            }
            games.append(game)
        
        # Rate limiting
        time.sleep(0.5)
    
    return games

def get_basic_app_info(app_id):
    """Get basic app info from Steam Store API."""
    try:
        params = {
            'appids': app_id,
            'format': 'json'
        }
        
        response = requests.get(STEAM_APP_DETAILS_URL, params=params, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            app_data = data.get(str(app_id), {})
            
            if app_data.get('success') and app_data.get('data'):
                result = app_data['data']
                return {
                    'name': result.get('name', ''),
                    'type': result.get('type', '')
                }
    except Exception as e:
        print(f"Error getting basic info for {app_id}: {e}")
    
    return None

def get_app_details(app_id):
    """Get detailed app info from Steam Store API.
    
    Returns:
        dict: App details if successful, None if rate limited/banned, empty dict otherwise
    """
    try:
        params = {
            'appids': app_id,
            'format': 'json'
        }
        
        response = requests.get(STEAM_APP_DETAILS_URL, params=params, timeout=REQUEST_TIMEOUT)
        
        # Check for rate limiting
        if response.status_code == 429:
            print(f"    ⚠ Rate limited (429) for app_id {app_id}")
            return None  # Signal to caller to wait longer
        
        if response.status_code == 403:
            print(f"    ⚠ Forbidden (403) for app_id {app_id} - possible IP ban")
            return None
        
        if response.status_code != 200:
            print(f"    ⚠ HTTP {response.status_code} for app_id {app_id}")
            return None
        
        data = response.json()
        app_data = data.get(str(app_id), {})
        
        # Check if Steam returned success: false
        if not app_data.get('success', False):
            print(f"    ⚠ Steam API returned success: false for app_id {app_id}")
            return None
        
        if app_data.get('data'):
            result = app_data['data']
            
            app_details = {
                'name': result.get('name', ''),
                'description': result.get('detailed_description', ''),
                'short_description': result.get('short_description', ''),
                'genres': [g['description'] for g in result.get('genres', [])],
                'categories': [c['description'] for c in result.get('categories', [])],
                'screenshot_urls': [s['path_thumbnail'] for s in result.get('screenshots', [])],
                'header_image': result.get('header_image', ''),
                'price_overview': result.get('price_overview', {}),
                'metacritic': result.get('metacritic', {}),
                'release_date': result.get('release_date', {}),
                'developers': result.get('developers', []),
                'publishers': result.get('publishers', []),
                'platforms': result.get('platforms', {}),
                'steam_appid': result.get('steam_appid', app_id),
                'required_age': result.get('required_age', 0),
                'is_free': result.get('is_free', False),
                'supported_languages': result.get('supported_languages', ''),
                'website': result.get('website', ''),
                'pc_requirements': result.get('pc_requirements', {}),
                'recommendations': result.get('recommendations', {})
            }
            
            # Determine primary genre
            app_details['primary_genre'] = app_details['genres'][0] if app_details['genres'] else 'Unknown'
            
            return app_details
                
    except Exception as e:
        print(f"    Error getting app details for {app_id}: {e}")
    
    return create_empty_app_details()

def create_empty_app_details():
    """Create empty app details structure."""
    return {
        'name': '',
        'description': '',
        'short_description': '',
        'genres': [],
        'categories': [],
        'screenshot_urls': [],
        'header_image': '',
        'price_overview': {},
        'metacritic': {},
        'release_date': {},
        'developers': [],
        'publishers': [],
        'platforms': {},
        'steam_appid': 0,
        'required_age': 0,
        'is_free': False,
        'supported_languages': '',
        'website': '',
        'pc_requirements': {},
        'recommendations': {},
        'primary_genre': 'Unknown'
    }
"""Functions for interacting with the Steam API."""

import requests
import time
import json
from .config import (
    STEAM_API_KEY, STEAM_STORE_SEARCH_URL, STEAM_APP_DETAILS_URL,
    REQUEST_TIMEOUT, STEAM_CATEGORIES, STEAM_STORE_SERVICE_URL
)

def fetch_top_games_by_category(category_key, limit=50):
    """Fetch top games from Steam Store search API for a specific category."""
    if category_key not in STEAM_CATEGORIES:
        print(f"Unknown category: {category_key}")
        return None
    
    category_param = STEAM_CATEGORIES[category_key]
    
    try:
        params = {
            'term': '',
            'count': limit,
            'start': 0,
            'cc': 'US',
            'l': 'english',
            'snr': '1_7_7_230_7'
        }
        
        # Handle different category parameter structures
        if isinstance(category_param, str):
            # For special filters like 'topsellers'
            params['filter'] = category_param
        elif isinstance(category_param, dict):
            # For genre categories
            params.update(category_param)
        
        print(f"Requesting: {STEAM_STORE_SEARCH_URL} with params: {params}")
        response = requests.get(STEAM_STORE_SEARCH_URL, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        print(f"Response keys: {data.keys() if data else 'No data'}")
        
        if data.get('success') == 1:
            if data.get('results_html'):
                # Parse the HTML to extract app IDs
                return parse_search_results(data['results_html'])
            elif data.get('items'):
                # Alternative response format
                games = []
                for item in data['items'][:limit]:
                    game = {
                        'app_id': item.get('id', 0),
                        'name': item.get('name', ''),
                        'price': item.get('price', {}).get('final_formatted', 'N/A')
                    }
                    games.append(game)
                return games
        else:
            print(f"API returned success=0 for category {category_key}")
            print(f"Full response: {data}")
            return []
            
    except Exception as e:
        print(f"Error fetching category {category_key}: {e}")
        import traceback
        traceback.print_exc()
        return None

def parse_search_results(html_content):
    """Parse Steam search results HTML to extract app IDs and basic info."""
    import re
    
    # Extract app IDs from data-ds-appid attributes
    app_id_pattern = r'data-ds-appid="(\d+)"'
    app_ids = re.findall(app_id_pattern, html_content)
    
    # Extract game names from titles
    title_pattern = r'<span class="title">([^<]+)</span>'
    titles = re.findall(title_pattern, html_content)
    
    # Extract prices
    price_pattern = r'<div class="discount_final_price">([^<]+)</div>'
    prices = re.findall(price_pattern, html_content)
    
    games = []
    for i, app_id in enumerate(app_ids):
        game = {
            'app_id': int(app_id),
            'name': titles[i] if i < len(titles) else f"Game {app_id}",
            'price': prices[i].strip() if i < len(prices) else 'N/A'
        }
        games.append(game)
    
    return games

def get_app_details(app_id):
    """Get detailed app info from Steam Store API."""
    try:
        params = {
            'appids': app_id,
            'key': STEAM_API_KEY,
            'format': 'json'
        }
        
        response = requests.get(STEAM_APP_DETAILS_URL, params=params, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            app_data = data.get(str(app_id), {})
            
            if app_data.get('success') and app_data.get('data'):
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
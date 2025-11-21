"""Client for fetching app details from iTunes Search API."""

import requests
from .config import ITUNES_SEARCH_URL, REQUEST_TIMEOUT


def get_app_details(app_id, country_code='us'):
    """Get detailed app info from iTunes Search API.
    
    Args:
        app_id: The app ID to look up
        country_code: Two-letter country code (e.g., 'us', 'cn', 'br')
        
    Returns:
        dict: App details including description, rating, genre, etc.
    """
    try:
        url = f"{ITUNES_SEARCH_URL}?id={app_id}&country={country_code}"
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                result = data['results'][0]
                
                app_details = {
                    'name': result.get('trackName', 'Unknown'),
                    'description': result.get('description', ''),
                    'developer': result.get('sellerName', 'Unknown'),
                    'genres': result.get('genres', []),
                    'primary_genre': result.get('primaryGenreName', 'Games'),
                    'rating': result.get('averageUserRating', 0),
                    'rating_count': result.get('userRatingCount', 0),
                    'version': result.get('version', ''),
                    'price': result.get('price', 0),
                    'content_rating': result.get('contentAdvisoryRating', ''),
                    'release_notes': result.get('releaseNotes', ''),
                    'icon_url': result.get('artworkUrl512', result.get('artworkUrl100', '')),
                    'screenshot_urls': result.get('screenshotUrls', []),
                    'app_store_url': result.get('trackViewUrl', ''),
                    'bundle_id': result.get('bundleId', ''),
                    'features': result.get('features', []),
                }
                
                # Determine specific genre (non-generic)
                specific_genres = [g for g in app_details['genres'] if g != 'Games' and 'Game' not in g]
                app_details['specific_genre'] = specific_genres[0] if specific_genres else app_details['primary_genre']
                
                return app_details
                
    except Exception as e:
        print(f"Error getting app details for {app_id} in {country_code}: {e}")
    
    return create_empty_app_details()


def create_empty_app_details():
    """Create empty app details structure for error cases."""
    return {
        'name': 'Unknown',
        'description': '',
        'developer': 'Unknown',
        'genres': [],
        'primary_genre': 'Games',
        'specific_genre': 'Games',
        'rating': 0,
        'rating_count': 0,
        'version': '',
        'price': 0,
        'content_rating': '',
        'release_notes': '',
        'icon_url': '',
        'screenshot_urls': [],
        'app_store_url': '',
        'bundle_id': '',
        'features': []
    }


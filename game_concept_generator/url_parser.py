"""URL parsing utilities for App Store URLs."""

import re


def extract_url_info(url):
    """Extract app ID and country code from App Store URL.
    
    Args:
        url: App Store URL string
        
    Returns:
        tuple: (app_id, country_code)
        
    Examples:
        >>> extract_url_info("https://apps.apple.com/cn/app/game/id6479760623")
        ('6479760623', 'cn')
        >>> extract_url_info("https://apps.apple.com/us/app/game/id1234567890")
        ('1234567890', 'us')
    """
    # Extract country code (defaults to 'us' if not found)
    country_match = re.search(r'apps\.apple\.com/([a-z]{2})/app/', url)
    country_code = country_match.group(1) if country_match else 'us'
    
    # Extract app ID
    app_id_match = re.search(r'/id(\d+)', url)
    app_id = app_id_match.group(1) if app_id_match else None
    
    return app_id, country_code


def extract_game_name_from_url(url):
    """Extract game name from App Store URL.
    
    Args:
        url: App Store URL string
        
    Returns:
        str: Formatted game name
        
    Example:
        >>> extract_game_name_from_url("https://apps.apple.com/us/app/subway-surfers/id512939461")
        'Subway Surfers'
    """
    name_match = re.search(r'/app/([^/]+)/id', url)
    if name_match:
        # Convert URL slug to readable name
        name_slug = name_match.group(1)
        return name_slug.replace('-', ' ').title()
    return "Unknown Game"







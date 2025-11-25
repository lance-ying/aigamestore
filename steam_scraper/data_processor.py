"""Data processing functions for Steam games."""

import time
from .steam_api_alt import fetch_top_games_by_category, get_app_details
from .media_downloader import download_game_media
from .config import BATCH_DELAY, BATCH_SIZE

def process_games_data(category_key, limit=50):
    """Process games data for a specific Steam category."""
    print(f"\nFetching top {limit} games for category: {category_key}")
    
    # Fetch basic game list from category
    basic_games = fetch_top_games_by_category(category_key, limit)
    if not basic_games:
        print(f"No games found for category: {category_key}")
        return []
    
    print(f"Found {len(basic_games)} games in category {category_key}")
    
    detailed_games = []
    
    for i, basic_game in enumerate(basic_games, 1):
        app_id = basic_game['app_id']
        print(f"Processing game {i}/{len(basic_games)}: {basic_game['name']} (ID: {app_id})")
        
        # Get detailed app information
        app_details = get_app_details(app_id)
        
        if app_details['name']:  # Only process if we got valid details
            # Combine basic info with detailed info
            game_data = {
                'rank': i,
                'app_id': app_id,
                'name': app_details['name'],
                'category': category_key,
                'basic_info': basic_game,
                'details': app_details,
                'media': {
                    'header_image_path': '',
                    'screenshots': [],
                    'has_video': False,
                    'video_path': ''
                }
            }
            
            # Download media assets
            try:
                media_info = download_game_media(app_id, app_details)
                game_data['media'].update(media_info)
            except Exception as e:
                print(f"    Error downloading media for {app_details['name']}: {e}")
            
            detailed_games.append(game_data)
        else:
            print(f"    Skipped {basic_game['name']} - could not get details")
        
        # Rate limiting
        if i % BATCH_SIZE == 0 and i < len(basic_games):
            print(f"    Processed {i} games. Pausing for {BATCH_DELAY} seconds...")
            time.sleep(BATCH_DELAY)
    
    print(f"Successfully processed {len(detailed_games)} games for {category_key}")
    return detailed_games

def create_simple_game_data(game_data):
    """Create a simplified version of game data for easier consumption."""
    return {
        'rank': game_data['rank'],
        'app_id': game_data['app_id'],
        'name': game_data['name'],
        'category': game_data['category'],
        'primary_genre': game_data['details']['primary_genre'],
        'genres': game_data['details']['genres'],
        'developers': game_data['details']['developers'],
        'publishers': game_data['details']['publishers'],
        'release_date': game_data['details']['release_date'].get('date', ''),
        'price': game_data['details']['price_overview'].get('final_formatted', 'Free' if game_data['details']['is_free'] else 'N/A'),
        'is_free': game_data['details']['is_free'],
        'metacritic_score': game_data['details']['metacritic'].get('score', 0),
        'short_description': game_data['details']['short_description'][:200] + '...' if len(game_data['details']['short_description']) > 200 else game_data['details']['short_description'],
        'header_image_path': game_data['media']['header_image_path'],
        'screenshot_count': len(game_data['media']['screenshots']),
        'has_video': game_data['media']['has_video']
    }
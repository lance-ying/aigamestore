"""JSON export functions for Steam games data."""

import json
import os
from datetime import datetime
from .config import JSON_OUTPUT_DIR, BASE_OUTPUT_DIR
from .data_processor import create_simple_game_data

def ensure_directories_exist():
    """Ensure all required directories exist."""
    os.makedirs(JSON_OUTPUT_DIR, exist_ok=True)

def save_games_to_json(games_data, category_key):
    """Save games data to JSON files (both full and simple versions)."""
    ensure_directories_exist()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Full data JSON
    full_filename = f"steam_{category_key}_{timestamp}.json"
    full_path = os.path.join(JSON_OUTPUT_DIR, full_filename)
    
    # Simple data JSON
    simple_filename = f"steam_{category_key}_simple_{timestamp}.json"
    simple_path = os.path.join(JSON_OUTPUT_DIR, simple_filename)
    
    # Latest files (without timestamp)
    latest_full_filename = f"steam_{category_key}_latest.json"
    latest_full_path = os.path.join(JSON_OUTPUT_DIR, latest_full_filename)
    
    latest_simple_filename = f"steam_{category_key}_simple_latest.json"
    latest_simple_path = os.path.join(JSON_OUTPUT_DIR, latest_simple_filename)
    
    # Create simple data
    simple_games_data = [create_simple_game_data(game) for game in games_data]
    
    try:
        # Save full data with timestamp
        with open(full_path, 'w', encoding='utf-8') as f:
            json.dump(games_data, f, indent=2, ensure_ascii=False)
        
        # Save simple data with timestamp
        with open(simple_path, 'w', encoding='utf-8') as f:
            json.dump(simple_games_data, f, indent=2, ensure_ascii=False)
        
        # Save latest full data
        with open(latest_full_path, 'w', encoding='utf-8') as f:
            json.dump(games_data, f, indent=2, ensure_ascii=False)
        
        # Save latest simple data
        with open(latest_simple_path, 'w', encoding='utf-8') as f:
            json.dump(simple_games_data, f, indent=2, ensure_ascii=False)
        
        print(f"JSON files saved:")
        print(f"  Full: {full_filename}")
        print(f"  Simple: {simple_filename}")
        print(f"  Latest full: {latest_full_filename}")
        print(f"  Latest simple: {latest_simple_filename}")
        
        return full_path, simple_path
    except Exception as e:
        print(f"Error saving JSON files: {e}")
        return None, None

def print_json_summary(games_data, category_key):
    """Print a summary of the JSON data created."""
    total_games = len(games_data)
    total_screenshots = sum(len(g['media']['screenshots']) for g in games_data)
    total_header_images = len([g for g in games_data if g['media']['header_image_path']])
    
    # Genre breakdown
    genre_counts = {}
    for game in games_data:
        primary_genre = game['details']['primary_genre']
        genre_counts[primary_genre] = genre_counts.get(primary_genre, 0) + 1
    
    print(f"\n📊 STEAM {category_key.upper()} SUMMARY")
    print("=" * 50)
    print(f"🎮 Total games: {total_games}")
    print(f"📸 Screenshots downloaded: {total_screenshots}")
    print(f"🖼️  Header images downloaded: {total_header_images}")
    
    print(f"\n🏷️  Genre breakdown:")
    for genre, count in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {genre}: {count}")

def create_readme_file():
    """Create a README file explaining the Steam data structure."""
    readme_content = """# Steam Games Data

This directory contains scraped data from Steam's top games across various categories.

## File Structure

```
steam_data/
├── json/                           # JSON data files
│   ├── steam_[category]_[timestamp].json      # Full data with timestamp
│   ├── steam_[category]_simple_[timestamp].json # Simple data with timestamp
│   ├── steam_[category]_latest.json           # Latest full data
│   └── steam_[category]_simple_latest.json    # Latest simple data
└── media/                          # Downloaded media assets
    ├── icons/                      # Game header images
    ├── screenshots/                # Game screenshots
    └── videos/                     # Game videos (if available)
```

## Data Structure

### Full JSON Structure
Each game entry contains:
- `rank`: Position in the category
- `app_id`: Steam App ID
- `name`: Game name
- `category`: Steam category
- `basic_info`: Basic information from search results
- `details`: Detailed game information from Steam API
- `media`: Downloaded media file paths

### Simple JSON Structure
Simplified version with key fields:
- `rank`, `app_id`, `name`, `category`
- `primary_genre`, `genres`, `developers`, `publishers`
- `release_date`, `price`, `is_free`
- `metacritic_score`, `short_description`
- Media file information

## Steam Categories Supported

- `top_sellers`: Current top selling games
- `new_trending`: New and trending games
- `global_top_sellers`: Global top sellers
- `popular_upcoming`: Popular upcoming releases
- `specials`: Games on special/sale
- `action`, `adventure`, `indie`, `rpg`, `strategy`, `simulation`, `sports`, `racing`: Genre-based categories

## Usage

The JSON files can be used for:
- Game analytics and research
- Building Steam game databases
- Market analysis and trends
- Game recommendation systems

## Data Freshness

Files with timestamps show when the data was collected. Use `*_latest.json` files for the most recent data.
"""
    
    readme_path = os.path.join(BASE_OUTPUT_DIR, "README.md")
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        print(f"README.md created: {readme_path}")
    except Exception as e:
        print(f"Error creating README: {e}")
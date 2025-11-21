"""Main entry point for the Game Concept Generator."""

import time
from typing import List, Dict, Optional
from .url_parser import extract_url_info, extract_game_name_from_url
from .app_store_client import get_app_details
from .concept_generator import generate_mechanic_focused_concepts
from .config import BATCH_SIZE, BATCH_DELAY


def generate_concept_from_url(url: str, verbose: bool = True) -> Optional[Dict]:
    """Generate a game concept from a single App Store URL.
    
    Args:
        url: App Store URL
        verbose: Print progress messages
        
    Returns:
        dict: Game data with concept, or None if failed
    """
    results = generate_concepts_from_urls([url], verbose=verbose)
    return results[0] if results else None


def generate_concepts_from_urls(urls: List[str], verbose: bool = True, batch_size: int = BATCH_SIZE) -> List[Dict]:
    """Generate game concepts from a list of App Store URLs.
    
    Args:
        urls: List of App Store URLs
        verbose: Print progress messages
        batch_size: Number of games to process per AI batch
        
    Returns:
        list: List of game data dictionaries with concepts
    """
    if verbose:
        print("=" * 70)
        print("GAME CONCEPT GENERATOR")
        print("=" * 70)
        print(f"\n📋 Processing {len(urls)} games")
        print(f"📦 Batch size: {batch_size}\n")
    
    # Step 1: Fetch game details
    if verbose:
        print("=" * 70)
        print("STEP 1: FETCHING GAME DETAILS")
        print("=" * 70)
    
    games_data = []
    
    for i, url in enumerate(urls, 1):
        if verbose:
            print(f"\n[{i}/{len(urls)}] {url}")
        
        app_id, country_code = extract_url_info(url)
        
        if not app_id:
            if verbose:
                print(f"  ❌ Could not extract app ID")
            continue
        
        if verbose:
            print(f"  📱 App ID: {app_id}, Country: {country_code.upper()}")
        
        # Fetch app details
        app_details = get_app_details(app_id, country_code)
        
        if not app_details.get('description'):
            if verbose:
                print(f"  ❌ No description found")
            continue
        
        # Use API name if available, otherwise extract from URL
        name = app_details.get('name', extract_game_name_from_url(url))
        
        game_data = {
            'url': url,
            'app_id': app_id,
            'country': country_code,
            'name': name,
            'developer': app_details.get('developer', 'Unknown'),
            'genre': app_details.get('specific_genre', 'Games'),
            'price': "Free" if app_details.get('price', 0) == 0 else f"${app_details.get('price', 0):.2f}",
            'rating': app_details.get('rating', 0),
            'rating_count': app_details.get('rating_count', 0),
            'description': app_details.get('description', ''),
            'version': app_details.get('version', ''),
            'features': app_details.get('features', []),
            'icon_url': app_details.get('icon_url', ''),
            'rank': i
        }
        
        if verbose:
            print(f"  ✅ {game_data['name']} by {game_data['developer']}")
            print(f"     Genre: {game_data['genre']}")
            if game_data['rating'] > 0:
                print(f"     Rating: {game_data['rating']:.2f}/5.0 ({game_data['rating_count']:,} reviews)")
        
        games_data.append(game_data)
        
        # Rate limiting
        time.sleep(1.5)
    
    if not games_data:
        if verbose:
            print("\n❌ No games to process")
        return []
    
    # Step 2: Generate concepts
    if verbose:
        print()
        print("=" * 70)
        print(f"STEP 2: GENERATING CONCEPTS ({len(games_data)} games)")
        print("=" * 70)
    
    # Process in batches
    for batch_start in range(0, len(games_data), batch_size):
        batch_end = min(batch_start + batch_size, len(games_data))
        batch_games = games_data[batch_start:batch_end]
        
        batch_num = (batch_start // batch_size) + 1
        total_batches = (len(games_data) + batch_size - 1) // batch_size
        
        if verbose:
            print(f"\n🔄 Batch {batch_num}/{total_batches}: Processing {len(batch_games)} games...")
        
        # Generate concepts
        concepts = generate_mechanic_focused_concepts(batch_games)
        
        if concepts:
            if verbose:
                print(f"  ✅ Generated {len(concepts)}/{len(batch_games)} concepts")
            
            # Apply concepts to games
            for i, game in enumerate(batch_games, 1):
                if i in concepts:
                    game['concept'] = concepts[i]
                    if verbose:
                        print(f"     ✅ {game['name']}")
                else:
                    game['concept'] = ""
                    if verbose:
                        print(f"     ❌ {game['name']}: Failed")
        else:
            if verbose:
                print(f"  ❌ Batch failed")
            for game in batch_games:
                game['concept'] = ""
        
        # Rate limiting between batches
        if batch_end < len(games_data):
            if verbose:
                print(f"  ⏸️  Waiting {BATCH_DELAY} seconds before next batch...")
            time.sleep(BATCH_DELAY)
    
    # Format output
    output_data = []
    for game in games_data:
        rating_str = f"{game['rating']:.5f}/5.0 ({game['rating_count']} reviews)" if game['rating'] > 0 else "No ratings"
        
        output_entry = {
            "concept": game.get('concept', ''),
            "name": game['name'],
            "developer": game['developer'],
            "genre": game['genre'],
            "price": game['price'],
            "rating": rating_str,
            "rank": game['rank'],
            "country": game['country'],
            "app_id": game['app_id'],
            "url": game['url']
        }
        
        output_data.append(output_entry)
    
    if verbose:
        # Summary
        concepts_generated = sum(1 for game in output_data if game.get('concept', '').strip())
        print()
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"✅ Successfully generated: {concepts_generated}/{len(output_data)} concepts")
        print(f"❌ Failed: {len(output_data) - concepts_generated}/{len(output_data)}")
        print("=" * 70)
    
    return output_data


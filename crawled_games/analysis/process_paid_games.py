#!/usr/bin/env python3
"""
Script to process all paid games data and apply the same filters as free games.
"""

import json
import pandas as pd
import numpy as np
import re
from pathlib import Path
from typing import Dict, Any

def parse_filename(filename):
    """Parse genre and country from filename for paid games."""
    name_without_ext = filename.replace('.json', '')
    
    # Handle paid games format: top_chart_{genre}_games_{country}_paid.json
    pattern = r'top_chart_(.+)_games_(.+)_paid'
    match = re.match(pattern, name_without_ext)
    
    if match:
        genre = match.group(1)
        country = match.group(2)
        return genre, country
    else:
        print(f"Warning: Could not parse paid filename {filename}")
        return None, None

def load_and_process_json(file_path, genre, country):
    """Load JSON file and extract game data for paid games."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        games_data = []
        
        if 'top_charts' in data and isinstance(data['top_charts'], list):
            for game in data['top_charts']:
                game_data = {
                    'genre': genre,
                    'country': country,
                    'game_name': game.get('title', ''),
                    'subtitle': game.get('subtitle', ''),
                    'rating': game.get('rating', 0.0),
                    'reviews': game.get('reviews', 0),
                    'position': game.get('position', 0),
                    'app_id': game.get('id', ''),
                    'bundle_id': game.get('bundle_id', ''),
                    'release_date': game.get('release_date', ''),
                    'is_free': game.get('price', {}).get('is_free', False),  # Paid games should be False
                    'formatted_price': game.get('price', {}).get('formatted_price', ''),
                    'currency': game.get('price', {}).get('currency', ''),
                    'app_store_url': game.get('link', ''),
                    'searchapi_url': game.get('searchapi_link', '')
                }
                games_data.append(game_data)
        
        return games_data
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def get_us_priority_data(group):
    """Get data prioritizing US versions, then GB versions for paid games."""
    us_version = group[group['country'] == 'us']
    gb_version = group[group['country'] == 'gb']
    
    if len(us_version) > 0:
        priority_row = us_version.iloc[0]
        priority_country = 'us'
    elif len(gb_version) > 0:
        priority_row = gb_version.iloc[0]
        priority_country = 'gb'
    else:
        priority_row = group.iloc[0]
        priority_country = 'other'
    
    subtitle = priority_row['subtitle']
    app_store_url = priority_row['app_store_url']
    searchapi_url = priority_row['searchapi_url']
    formatted_price = priority_row['formatted_price']
    currency = priority_row['currency']
    
    # Aggregate other fields
    countries = ', '.join(sorted(group['country'].unique()))
    genres = ', '.join(sorted(group['genre'].unique()))
    max_reviews = group['reviews'].max()
    avg_rating = round(group['rating'].mean(), 2)
    best_position = group['position'].min()
    
    # Get latest release date
    try:
        dates = pd.to_datetime(group['release_date'], errors='coerce')
        latest_date = dates.max().strftime('%Y-%m-%d') if not pd.isna(dates.max()) else group['release_date'].iloc[0]
    except:
        latest_date = group['release_date'].iloc[0]
    
    return pd.Series({
        'countries': countries,
        'genres': genres,
        'max_reviews': max_reviews,
        'avg_rating': avg_rating,
        'best_position': best_position,
        'subtitle': subtitle,
        'app_id': group['app_id'].iloc[0],
        'bundle_id': group['bundle_id'].iloc[0],
        'release_date': latest_date,
        'is_free': group['is_free'].iloc[0],
        'formatted_price': formatted_price,
        'currency': currency,
        'app_store_url': app_store_url,
        'searchapi_url': searchapi_url,
        'country_count': len(group['country'].unique()),
        'genre_count': len(group['genre'].unique()),
        'has_us_version': len(us_version) > 0,
        'has_gb_version': len(gb_version) > 0,
        'priority_country': priority_country
    })

def process_paid_games():
    """Process all paid games data and apply filters."""
    # Set the directory path for paid games
    paid_games_dir = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/raw_data/paid')
    
    # Get all JSON files from paid subdirectories
    json_files = []
    for genre_dir in ['action', 'adventure', 'board', 'casual', 'puzzle']:
        genre_path = paid_games_dir / genre_dir
        if genre_path.exists():
            json_files.extend(list(genre_path.glob('*.json')))
    
    print(f"Found {len(json_files)} paid game JSON files to process")
    
    all_games_data = []
    
    # Process each JSON file
    for json_file in json_files:
        print(f"Processing: {json_file.name}")
        
        # Parse filename to get genre and country
        genre, country = parse_filename(json_file.name)
        
        if genre and country:
            # Load and process the JSON file
            games_data = load_and_process_json(json_file, genre, country)
            all_games_data.extend(games_data)
            print(f"  - Extracted {len(games_data)} games")
        else:
            print(f"  - Skipped due to filename parsing error")
    
    if not all_games_data:
        print("No paid games data extracted")
        return None
    
    # Create DataFrame
    df = pd.DataFrame(all_games_data)
    print(f"\nTotal paid games loaded: {len(df)}")
    
    # Apply filters: >=10k reviews and >=4.0 rating
    df_filtered = df[(df['reviews'] >= 10000) & (df['rating'] >= 4.0)]
    print(f"After filtering (>=10k reviews & >=4.0 rating): {len(df_filtered)} games")
    
    if len(df_filtered) == 0:
        print("No paid games meet the filtering criteria")
        return None
    
    # Group by game name and prioritize US versions
    print("Aggregating data for duplicate games...")
    aggregated = df_filtered.groupby('game_name').apply(get_us_priority_data).reset_index()
    
    # Sort by max reviews (descending) then by avg rating (descending)
    aggregated = aggregated.sort_values(['max_reviews', 'avg_rating'], ascending=[False, False])
    
    print(f"After aggregation: {len(aggregated)} unique paid games")
    
    # Count how many games have US/GB versions
    us_games_count = aggregated['has_us_version'].sum()
    gb_games_count = aggregated['has_gb_version'].sum()
    us_or_gb_count = len(aggregated[aggregated['priority_country'].isin(['us', 'gb'])])
    
    print(f"Games with US versions: {us_games_count} ({us_games_count/len(aggregated)*100:.1f}%)")
    print(f"Games with GB versions: {gb_games_count} ({gb_games_count/len(aggregated)*100:.1f}%)")
    print(f"Games with US or GB versions: {us_or_gb_count} ({us_or_gb_count/len(aggregated)*100:.1f}%)")
    
    # Save processed paid games data
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/paid_games_data.csv')
    aggregated.to_csv(csv_path, index=False)
    print(f"Paid games data saved to: {csv_path}")
    
    # Show some examples
    print(f"\n=== TOP 10 PAID GAMES ===")
    top_games = aggregated.head(10)
    for idx, row in top_games.iterrows():
        print(f"{row['game_name']} - {row['max_reviews']:,} reviews, {row['avg_rating']:.1f}★ ({row['formatted_price']})")
    
    return aggregated

def main():
    """Main function to process paid games."""
    print("=== PROCESSING PAID GAMES DATA ===")
    df_paid = process_paid_games()
    
    if df_paid is not None:
        print(f"\n=== PAID GAMES SUMMARY ===")
        print(f"Total unique paid games: {len(df_paid)}")
        print(f"Average rating: {df_paid['avg_rating'].mean():.2f}")
        print(f"Average reviews: {df_paid['max_reviews'].mean():,.0f}")
        print(f"Games with US versions: {df_paid['has_us_version'].sum()}")
        print(f"Games with GB versions: {df_paid['has_gb_version'].sum()}")
        
        # Show genre distribution
        print(f"\nGenre distribution:")
        all_genres = []
        for genres_str in df_paid['genres']:
            all_genres.extend([g.strip() for g in genres_str.split(',')])
        
        genre_counts = pd.Series(all_genres).value_counts()
        for genre, count in genre_counts.items():
            print(f"  {genre}: {count} games")
        
        print(f"\nPaid games processing complete!")
    else:
        print("No paid games data to process.")

if __name__ == "__main__":
    main()

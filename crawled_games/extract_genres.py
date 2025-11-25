#!/usr/bin/env python3
"""Extract genre information from Steam game pages."""

import csv
import re
import time
import requests
from html import unescape
from pathlib import Path
from typing import List, Dict, Optional

def extract_genre_from_html(html_content: str) -> Optional[str]:
    """
    Extract genre information from Steam HTML page.
    
    Looks for pattern: <b>Genre:</b> <span>...<a>...</a></span>
    Returns comma-separated list of genres.
    """
    # Pattern to match: <b>Genre:</b> followed by span with links
    # The genre names are in <a> tags within the span
    pattern = r'<b>Genre:</b>\s*<span[^>]*>(.*?)</span>'
    
    match = re.search(pattern, html_content, re.DOTALL)
    if not match:
        return None
    
    span_content = match.group(1)
    
    # Extract text from <a> tags
    genre_pattern = r'<a[^>]*>([^<]+)</a>'
    genres = re.findall(genre_pattern, span_content)
    
    if genres:
        # Clean up and join genres
        genres = [unescape(genre.strip()) for genre in genres]
        return ', '.join(genres)
    
    return None

def extract_description_from_html(html_content: str) -> Optional[str]:
    """
    Extract game description from Steam HTML page.
    
    Looks for pattern: <div class="game_description_snippet">...</div>
    Returns the description text.
    """
    # Pattern to match: <div class="game_description_snippet">description text</div>
    pattern = r'<div class="game_description_snippet">\s*(.*?)\s*</div>'
    
    match = re.search(pattern, html_content, re.DOTALL)
    if not match:
        return None
    
    description = match.group(1).strip()
    
    if description:
        # Clean up HTML entities and extra whitespace
        description = unescape(description)
        # Remove extra whitespace and newlines
        description = ' '.join(description.split())
        return description
    
    return None

def fetch_game_info(url: str, session: requests.Session, delay: float = 1.0) -> Dict[str, Optional[str]]:
    """
    Fetch genre and description for a single game URL.
    
    Args:
        url: Steam game URL
        session: requests session for connection pooling
        delay: Delay between requests in seconds
        
    Returns:
        Dictionary with 'genre' and 'description' keys
    """
    result = {'genre': None, 'description': None}
    
    try:
        # Add delay to be respectful to Steam's servers
        time.sleep(delay)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = session.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        html_content = response.text
        
        # Extract both genre and description
        result['genre'] = extract_genre_from_html(html_content)
        result['description'] = extract_description_from_html(html_content)
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"  Error fetching {url}: {e}")
        return result
    except Exception as e:
        print(f"  Unexpected error for {url}: {e}")
        return result

def extract_genres_from_csv(input_csv: str, output_csv: str, delay: float = 1.0, start_from: int = 0):
    """
    Read game URLs from CSV, fetch genres and descriptions, and write to output CSV.
    
    Args:
        input_csv: Input CSV with name and url columns
        output_csv: Output CSV with name, url, genre, and description columns
        delay: Delay between requests in seconds
        start_from: Start from this row index (for resuming)
    """
    # Read input CSV
    games = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        games = list(reader)
    
    print(f"Found {len(games)} games in {input_csv}")
    print(f"Starting from row {start_from}")
    
    # Create output CSV with genre and description columns
    output_exists = Path(output_csv).exists()
    fieldnames = ['name', 'url', 'genre', 'description']
    
    # If resuming, read existing data
    existing_data = {}
    if output_exists and start_from > 0:
        try:
            with open(output_csv, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_data[row['url']] = {
                        'genre': row.get('genre', ''),
                        'description': row.get('description', '')
                    }
            print(f"Loaded {len(existing_data)} existing entries")
        except Exception as e:
            print(f"Warning: Could not read existing output file: {e}")
            print("Starting fresh...")
            existing_data = {}
    
    # Use session for connection pooling
    session = requests.Session()
    
    # Process each game
    processed = 0
    success_count = 0
    error_count = 0
    skipped_count = 0
    genre_success = 0
    desc_success = 0
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for i, game in enumerate(games):
            url = game['url']
            name = game['name']
            
            # If resuming and this row was already processed, write existing data
            if i < start_from:
                if url in existing_data:
                    writer.writerow({
                        'name': name,
                        'url': url,
                        'genre': existing_data[url].get('genre', ''),
                        'description': existing_data[url].get('description', '')
                    })
                    skipped_count += 1
                else:
                    # Write with empty fields if not in existing data
                    writer.writerow({
                        'name': name,
                        'url': url,
                        'genre': '',
                        'description': ''
                    })
                continue
            
            print(f"[{i+1}/{len(games)}] Fetching info for: {name}")
            
            game_info = fetch_game_info(url, session, delay=delay if i > start_from else 0)
            
            genre = game_info.get('genre', '')
            description = game_info.get('description', '')
            
            if genre:
                genre_success += 1
                print(f"  ✓ Genre: {genre}")
            else:
                print(f"  ✗ No genre found")
            
            if description:
                desc_success += 1
                # Truncate description for display if too long
                desc_display = description[:100] + '...' if len(description) > 100 else description
                print(f"  ✓ Description: {desc_display}")
            else:
                print(f"  ✗ No description found")
            
            if genre or description:
                success_count += 1
            else:
                error_count += 1
            
            writer.writerow({
                'name': name,
                'url': url,
                'genre': genre or '',
                'description': description or ''
            })
            
            processed += 1
            
            # Flush to disk periodically and show progress
            if processed % 10 == 0:
                f.flush()
                remaining = len(games) - i - 1
                print(f"Progress: {processed} processed, {genre_success} genres, {desc_success} descriptions, {error_count} errors, {remaining} remaining")
    
    session.close()
    
    print(f"\nCompleted!")
    print(f"  Total processed: {processed}")
    print(f"  Games with genre: {genre_success}")
    print(f"  Games with description: {desc_success}")
    print(f"  Games with both: {success_count}")
    print(f"  Games with neither: {error_count}")
    if skipped_count > 0:
        print(f"  Skipped (already processed): {skipped_count}")
    print(f"  Output saved to: {output_csv}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract genres and descriptions from Steam game pages')
    parser.add_argument('--input', default='indie_games.csv', help='Input CSV file')
    parser.add_argument('--output', default='indie_games_with_genres.csv', help='Output CSV file')
    parser.add_argument('--delay', type=float, default=1.0, help='Delay between requests in seconds')
    parser.add_argument('--start-from', type=int, default=0, help='Start from this row index (for resuming)')
    
    args = parser.parse_args()
    
    extract_genres_from_csv(args.input, args.output, delay=args.delay, start_from=args.start_from)


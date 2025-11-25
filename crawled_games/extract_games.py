#!/usr/bin/env python3
"""Extract game names and URLs from Steam HTML file."""

import re
import csv
from pathlib import Path
from html import unescape

def extract_games_from_html(html_file: str, output_csv: str):
    """
    Extract game names and URLs from Steam HTML file.
    
    The pattern is: href="https://store.steampowered.com/app/xxx" followed by
    the game name in a div with class StoreSaleWidgetTitle
    """
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    games = []
    seen_urls = set()
    
    # Find all instances of the pattern where we have:
    # 1. A link to store.steampowered.com/app/XXXXX
    # 2. Followed by a div with class containing "StoreSaleWidgetTitle" with the game name
    
    # More robust pattern: look for the structure where the title div comes after the app link
    # The pattern seems to be: <a href="...app/XXXXX/Game_Name?...">...<div class="...StoreSaleWidgetTitle">Game Name</div>
    
    # Strategy: Find all app URLs, then for each find the nearest StoreSaleWidgetTitle
    
    # Find all app URLs with their positions
    app_url_pattern = r'href="(https://store\.steampowered\.com/app/(\d+)(?:/[^"?]*)?(?:\?[^"]*)?)"'
    url_matches = list(re.finditer(app_url_pattern, content))
    
    # Also look for the title pattern
    title_pattern = r'<div class="[^"]*StoreSaleWidgetTitle[^"]*">([^<]+)</div>'
    title_matches = list(re.finditer(r'<div class="[^"]*StoreSaleWidgetTitle[^"]*">([^<]+)</div>', content))
    
    # For each URL, find the closest title that comes after it
    for url_match in url_matches:
        full_url = url_match.group(1)
        app_id = url_match.group(2)
        
        # Clean URL to just https://store.steampowered.com/app/XXXXX
        clean_url = f"https://store.steampowered.com/app/{app_id}"
        
        # Skip if we've seen this URL
        if clean_url in seen_urls:
            continue
        
        url_end_pos = url_match.end()
        
        # Look for the title that comes after this URL
        # Search within a reasonable window (5000 chars after the URL)
        search_end = min(len(content), url_end_pos + 5000)
        search_content = content[url_end_pos:search_end]
        
        # Find the first StoreSaleWidgetTitle after this URL
        title_match = re.search(r'<div class="[^"]*StoreSaleWidgetTitle[^"]*">([^<]+)</div>', search_content)
        
        if title_match:
            game_name = unescape(title_match.group(1).strip())
            if game_name:  # Only add if we have a valid name
                games.append({
                    'name': game_name,
                    'url': clean_url
                })
                seen_urls.add(clean_url)
    
    # Write to CSV
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'url'])
        writer.writeheader()
        writer.writerows(games)
    
    print(f"Extracted {len(games)} unique games to {output_csv}")
    return games

if __name__ == "__main__":
    html_file = "Indie.html"
    output_csv = "indie_games.csv"
    
    games = extract_games_from_html(html_file, output_csv)
    
    # Print first few games as sample
    print("\nFirst 10 games:")
    for i, game in enumerate(games[:10], 1):
        print(f"{i}. {game['name']} - {game['url']}")


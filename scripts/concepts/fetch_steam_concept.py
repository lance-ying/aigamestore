#!/usr/bin/env python3
"""Fetch description and aboutme from a Steam game URL."""

import sys
import re
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from steam_scraper.steam_api import get_app_details

def extract_app_id_from_url(url):
    """Extract app ID from Steam URL."""
    match = re.search(r'/app/(\d+)/', url)
    if match:
        return int(match.group(1))
    return None

def fetch_steam_concept(url):
    """Fetch description and aboutme from Steam URL."""
    app_id = extract_app_id_from_url(url)
    if not app_id:
        print(f"Error: Could not extract app ID from URL: {url}")
        return None
    
    print(f"Fetching details for App ID: {app_id}")
    app_details = get_app_details(app_id)
    
    if not app_details:
        print("Error: Could not fetch app details")
        return None
    
    # Extract description (short_description) and aboutme (detailed_description)
    description = app_details.get('short_description', '')
    aboutme = app_details.get('description', '')  # This is the detailed_description
    
    result = {
        'app_id': app_id,
        'name': app_details.get('name', ''),
        'description': description,
        'aboutme': aboutme,
        'full_concept': f"{description}\n\n{aboutme}" if description and aboutme else (description or aboutme)
    }
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_steam_concept.py <steam_url> [--save-to <file>]")
        print("Example: python fetch_steam_concept.py https://store.steampowered.com/app/582010/Monster_Hunter_World/")
        print("Example: python fetch_steam_concept.py <url> --save-to temp_concept.txt")
        sys.exit(1)
    
    url = sys.argv[1]
    save_to = None
    
    # Check for --save-to flag
    if len(sys.argv) >= 4 and sys.argv[2] == '--save-to':
        save_to = sys.argv[3]
    
    result = fetch_steam_concept(url)
    
    if result:
        print("\n" + "="*80)
        print(f"Game: {result['name']}")
        print(f"App ID: {result['app_id']}")
        print("="*80)
        print("\nDESCRIPTION:")
        print("-"*80)
        print(result['description'])
        print("\n" + "="*80)
        print("\nABOUT ME (Detailed Description):")
        print("-"*80)
        print(result['aboutme'])
        print("\n" + "="*80)
        print("\nFULL CONCEPT (Description + About Me):")
        print("-"*80)
        print(result['full_concept'])
        print("="*80)
        
        # Save to file if requested
        if save_to:
            output_path = Path(save_to)
            output_path.write_text(result['full_concept'], encoding='utf-8')
            print(f"\n✓ Saved concept to: {output_path}")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()


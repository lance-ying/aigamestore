"""Fetch game descriptions from App Store URLs and save to text files."""

import sys
import time
from pathlib import Path

# Add parent directory to path to import game_concept_generator modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from game_concept_generator.url_parser import extract_url_info, extract_game_name_from_url
from game_concept_generator.app_store_client import get_app_details


def sanitize_filename(name):
    """Convert a game name to a safe filename."""
    # Remove invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '_')
    # Remove extra spaces and limit length
    name = ' '.join(name.split())
    return name[:100]  # Limit to 100 chars


def fetch_and_save_descriptions(input_file, output_dir=None):
    """Fetch descriptions from URLs and save to text files.
    
    Args:
        input_file: Path to file containing URLs (one per line)
        output_dir: Directory to save text files (default: same as input file)
    """
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ File not found: {input_file}")
        return
    
    # Determine output directory
    if output_dir:
        output_path = Path(output_dir)
    else:
        output_path = input_path.parent
    
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Read URLs
    urls = []
    with open(input_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and line.startswith('http'):
                urls.append(line)
    
    print(f"📋 Found {len(urls)} URLs to process\n")
    
    # Process each URL
    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] Processing: {url}")
        
        # Extract app ID and country
        app_id, country_code = extract_url_info(url)
        
        if not app_id:
            print(f"  ❌ Could not extract app ID")
            continue
        
        print(f"  📱 App ID: {app_id}, Country: {country_code.upper()}")
        
        # Fetch app details
        app_details = get_app_details(app_id, country_code)
        
        if not app_details.get('description'):
            print(f"  ❌ No description found")
            continue
        
        # Get game name
        name = app_details.get('name', extract_game_name_from_url(url))
        developer = app_details.get('developer', 'Unknown')
        genre = app_details.get('specific_genre', 'Games')
        
        print(f"  ✅ {name} by {developer}")
        
        # Create filename
        safe_name = sanitize_filename(name)
        output_file = output_path / f"{safe_name}.txt"
        
        # Write description to file
        description = app_details.get('description', '')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Game: {name}\n")
            f.write(f"Developer: {developer}\n")
            f.write(f"Genre: {genre}\n")
            f.write(f"App ID: {app_id}\n")
            f.write(f"URL: {url}\n")
            f.write(f"\n{'='*70}\n\n")
            f.write(description)
        
        print(f"  💾 Saved to: {output_file}\n")
        
        # Rate limiting
        if i < len(urls):
            time.sleep(1.5)
    
    print(f"✅ Completed! Saved {len(urls)} description files to {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_descriptions.py <input_file> [output_dir]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    fetch_and_save_descriptions(input_file, output_dir)



#!/usr/bin/env python3
"""Add full App Store descriptions to temp concept files."""

import sys
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from game_concept_generator.url_parser import extract_url_info
from game_concept_generator.app_store_client import get_app_details


def add_description_to_file(file_path: Path):
    """Read temp concept file, fetch App Store description, and append it."""
    print(f"\nProcessing: {file_path.name}")
    
    # Read current content
    if not file_path.exists():
        print(f"  ❌ File not found: {file_path}")
        return False
    
    content = file_path.read_text(encoding='utf-8')
    
    # Check if description already added (look for "Full Description:" marker)
    if "Full Description:" in content:
        print(f"  ⏭️  Description already added, skipping")
        return True
    
    # Extract App Store URL
    url = None
    for line in content.split('\n'):
        if line.startswith('App Store URL:'):
            url = line.replace('App Store URL:', '').strip()
            break
    
    if not url or url == "(Not found in CSV - game from metadata.json)":
        print(f"  ⚠️  No App Store URL found in file")
        return False
    
    print(f"  📱 URL: {url}")
    
    # Extract app ID and country
    app_id, country_code = extract_url_info(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return False
    
    print(f"  🔍 App ID: {app_id}, Country: {country_code.upper()}")
    
    # Fetch app details
    print(f"  ⏳ Fetching description from App Store...")
    app_details = get_app_details(app_id, country_code)
    
    if not app_details or not app_details.get('description'):
        print(f"  ❌ No description found")
        return False
    
    description = app_details.get('description', '')
    name = app_details.get('name', 'Unknown')
    
    print(f"  ✅ Fetched description for: {name}")
    print(f"  📝 Description length: {len(description)} characters")
    
    # Append description to file
    new_content = content.rstrip() + "\n\n" + "="*80 + "\n"
    new_content += "Full Description:\n"
    new_content += "="*80 + "\n\n"
    new_content += description + "\n"
    
    file_path.write_text(new_content, encoding='utf-8')
    print(f"  💾 Updated file: {file_path.name}")
    
    return True


def main():
    """Process all temp concept files."""
    # Automatically find all temp_concept files that don't have full descriptions yet
    project_root = Path(__file__).resolve().parents[2]
    temp_files = []
    
    for file_path in project_root.glob("temp_concept_*.txt"):
        content = file_path.read_text(encoding='utf-8')
        # Only include files that don't have "Full Description:" yet
        if "Full Description:" not in content:
            temp_files.append(file_path.name)
    
    # Sort for consistent processing
    temp_files.sort()
    
    if not temp_files:
        print("="*80)
        print("No temp concept files found that need descriptions added")
        print("="*80)
        return
    
    success_count = 0
    
    print("="*80)
    print("Adding App Store Descriptions to Temp Concept Files")
    print("="*80)
    print(f"Found {len(temp_files)} files to process")
    
    for filename in temp_files:
        file_path = project_root / filename
        if add_description_to_file(file_path):
            success_count += 1
        
        # Rate limiting between requests
        time.sleep(1.5)
    
    print("\n" + "="*80)
    print(f"✅ Completed! Successfully updated {success_count}/{len(temp_files)} files")
    print("="*80)


if __name__ == "__main__":
    main()


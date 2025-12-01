#!/usr/bin/env python3
"""Generate temp concept files for Steam game URLs."""

import sys
import time
import re
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from steam_scraper.steam_api import get_app_details


def extract_app_id_from_url(url):
    """Extract app ID from Steam URL."""
    match = re.search(r'/app/(\d+)/', url)
    if match:
        return int(match.group(1))
    return None


def create_temp_concept_file(url: str) -> bool:
    """Create a temp concept file for a given Steam URL."""
    print(f"\nProcessing: {url}")
    
    # Extract app ID
    app_id = extract_app_id_from_url(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return False
    
    print(f"  📱 App ID: {app_id}")
    
    # Fetch app details
    print(f"  ⏳ Fetching app details...")
    app_details = get_app_details(app_id)
    
    if not app_details:
        print(f"  ❌ No app details found")
        return False
    
    name = app_details.get('name', 'Unknown')
    short_description = app_details.get('short_description', '')
    detailed_description = app_details.get('description', '')
    
    if not short_description and not detailed_description:
        print(f"  ❌ No description found")
        return False
    
    print(f"  ✅ Fetched: {name}")
    
    # Use short description as the initial concept, or first paragraph of detailed description
    if short_description:
        concept = short_description
    else:
        # Take first paragraph of detailed description
        concept_lines = detailed_description.split('\n')
        first_paragraph = concept_lines[0] if concept_lines else detailed_description[:500]
        if len(first_paragraph) > 500:
            sentences = first_paragraph.split('.')
            if len(sentences) > 1:
                concept = '. '.join(sentences[:2]) + '.'
            else:
                concept = first_paragraph[:500] + '...'
        else:
            concept = first_paragraph
    
    # Create filename from game name
    safe_name = name.lower().replace(' ', '_').replace('-', '_')
    # Remove special characters
    safe_name = ''.join(c for c in safe_name if c.isalnum() or c == '_')
    filename = f"temp_concept_{safe_name}.txt"
    file_path = project_root / filename
    
    # Write temp concept file
    content = f"{concept}\n\nSteam URL: {url}\n"
    
    file_path.write_text(content, encoding='utf-8')
    print(f"  💾 Created: {filename}")
    
    return True


def add_full_description_to_file(file_path: Path) -> bool:
    """Add full description section to temp concept file."""
    print(f"\nProcessing: {file_path.name}")
    
    # Read current content
    if not file_path.exists():
        print(f"  ❌ File not found: {file_path}")
        return False
    
    content = file_path.read_text(encoding='utf-8')
    
    # Check if description already added
    if "Full Description:" in content:
        print(f"  ⏭️  Description already added, skipping")
        return True
    
    # Extract Steam URL
    url = None
    for line in content.split('\n'):
        if line.startswith('Steam URL:'):
            url = line.replace('Steam URL:', '').strip()
            break
    
    if not url:
        print(f"  ⚠️  No Steam URL found in file")
        return False
    
    print(f"  📱 URL: {url}")
    
    # Extract app ID
    app_id = extract_app_id_from_url(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return False
    
    print(f"  🔍 App ID: {app_id}")
    
    # Fetch app details
    print(f"  ⏳ Fetching description from Steam...")
    app_details = get_app_details(app_id)
    
    if not app_details:
        print(f"  ❌ No app details found")
        return False
    
    short_description = app_details.get('short_description', '')
    detailed_description = app_details.get('description', '')
    name = app_details.get('name', 'Unknown')
    
    if not short_description and not detailed_description:
        print(f"  ❌ No description found")
        return False
    
    print(f"  ✅ Fetched description for: {name}")
    
    # Combine both descriptions
    full_description_parts = []
    if short_description:
        full_description_parts.append(short_description)
    if detailed_description:
        if short_description:
            full_description_parts.append("\n\n" + detailed_description)
        else:
            full_description_parts.append(detailed_description)
    
    full_description = "".join(full_description_parts)
    print(f"  📝 Description length: {len(full_description)} characters")
    
    # Append description to file
    new_content = content.rstrip() + "\n\n" + "="*80 + "\n"
    new_content += "Full Description:\n"
    new_content += "="*80 + "\n\n"
    new_content += full_description + "\n"
    
    file_path.write_text(new_content, encoding='utf-8')
    print(f"  💾 Updated file: {file_path.name}")
    
    return True


def main():
    """Generate temp concept files for all Steam URLs."""
    urls = [
        "https://store.steampowered.com/app/1061090/Jump_King/",
        "https://store.steampowered.com/app/916730/Gato_Roboto/",
        "https://store.steampowered.com/app/1509960/PICO_PARK/",
        "https://store.steampowered.com/app/204360/Castle_Crashers/",
        "https://store.steampowered.com/app/312520/Rain_World/",
        "https://store.steampowered.com/app/200900/Cave_Story/",
        "https://store.steampowered.com/app/287980/Mini_Metro/",
        "https://store.steampowered.com/app/736260/Baba_Is_You/",
        "https://store.steampowered.com/app/1473350/the_Gnorp_Apologue/",
        "https://store.steampowered.com/app/3045200/Beatblock/",
        "https://store.steampowered.com/app/1456880/ElecHead/",
        "https://store.steampowered.com/app/2721890/oo/",
    ]
    
    print("="*80)
    print("Generating Temp Concept Files for Steam Games")
    print("="*80)
    
    success_count = 0
    for url in urls:
        if create_temp_concept_file(url):
            success_count += 1
        
        # Rate limiting between requests
        time.sleep(1.5)
    
    print("\n" + "="*80)
    print(f"✅ Completed! Created {success_count}/{len(urls)} temp concept files")
    print("="*80)
    
    # Now add full descriptions
    print("\n" + "="*80)
    print("Adding Full Descriptions to Temp Concept Files")
    print("="*80)
    
    desc_success_count = 0
    for url in urls:
        app_id = extract_app_id_from_url(url)
        if not app_id:
            continue
        
        app_details = get_app_details(app_id)
        if not app_details:
            continue
        
        name = app_details.get('name', 'Unknown')
        safe_name = name.lower().replace(' ', '_').replace('-', '_')
        safe_name = ''.join(c for c in safe_name if c.isalnum() or c == '_')
        filename = f"temp_concept_{safe_name}.txt"
        file_path = project_root / filename
        
        if add_full_description_to_file(file_path):
            desc_success_count += 1
        
        # Rate limiting between requests
        time.sleep(1.5)
    
    print("\n" + "="*80)
    print(f"✅ Completed! Successfully updated {desc_success_count}/{success_count} files with full descriptions")
    print("="*80)


if __name__ == "__main__":
    main()


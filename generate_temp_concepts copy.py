#!/usr/bin/env python3
"""Generate temp concept files for App Store URLs."""

import sys
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from game_concept_generator.url_parser import extract_url_info, extract_game_name_from_url
from game_concept_generator.app_store_client import get_app_details


def create_temp_concept_file(url: str) -> bool:
    """Create a temp concept file for a given App Store URL."""
    print(f"\nProcessing: {url}")
    
    # Extract app ID and country
    app_id, country_code = extract_url_info(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return False
    
    print(f"  📱 App ID: {app_id}, Country: {country_code.upper()}")
    
    # Fetch app details
    print(f"  ⏳ Fetching app details...")
    app_details = get_app_details(app_id, country_code)
    
    if not app_details or not app_details.get('description'):
        print(f"  ❌ No description found")
        return False
    
    name = app_details.get('name', extract_game_name_from_url(url))
    description = app_details.get('description', '')
    
    print(f"  ✅ Fetched: {name}")
    
    # Create a basic concept from the first paragraph of description
    # Take first 2-3 sentences or first 500 chars, whichever comes first
    concept_lines = description.split('\n')
    first_paragraph = concept_lines[0] if concept_lines else description[:500]
    
    # If first paragraph is too long, truncate to first sentence
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
    content = f"{concept}\n\nApp Store URL: {url}\n"
    
    file_path.write_text(content, encoding='utf-8')
    print(f"  💾 Created: {filename}")
    
    return True


def main():
    """Generate temp concept files for all URLs."""
    urls = [
        "https://apps.apple.com/us/app/tds-tower-destiny-survive/id6480174499",
        "https://apps.apple.com/us/app/hit-master-3d-knife-assassin/id1534471879",
        "https://apps.apple.com/us/app/risk-global-domination/id1051334048",
        "https://apps.apple.com/us/app/brotato/id6445884925",
        "https://apps.apple.com/us/app/shawarma-legend/id6479530421",
        "https://apps.apple.com/us/app/friday-night-funkin-mobile/id6740428530",
        "https://apps.apple.com/us/app/downwell/id1032708262",
        "https://apps.apple.com/us/app/super-meat-boy-forever/id1617800007",
        "https://apps.apple.com/us/app/hoplite/id782438457",
        "https://apps.apple.com/us/app/onebit-adventure/id1481297211",
        "https://apps.apple.com/us/app/knights-of-pen-paper-2/id6450895672",
        "https://apps.apple.com/us/app/enter-the-gungeon/id1100429641",
        "https://apps.apple.com/us/app/terraria/id640364616",
        "https://apps.apple.com/us/app/monument-valley-2/id1187265767",
        "https://apps.apple.com/us/app/balatro/id6502453075",
        "https://apps.apple.com/us/app/slay-the-spire/id1491530147",
        "https://apps.apple.com/us/app/tomb-of-the-mask-pixel-maze/id1057889290",
        "https://apps.apple.com/us/app/snake-vs-block/id1233739175",
        "https://apps.apple.com/us/app/square-bird-flappy-chicken/id1435729435",
        "https://apps.apple.com/us/app/go-escape-casual-ball-games/id1435951901",
        "https://apps.apple.com/us/app/jelly-shift-obstacle-course/id1467252438",
        "https://apps.apple.com/us/app/battle-disc/id1468445666",
        "https://apps.apple.com/us/app/flappy-dunk/id1235581326",
        "https://apps.apple.com/us/app/dune/id1291851950",
        "https://apps.apple.com/us/app/tiny-wings/id417817520",
        "https://apps.apple.com/us/app/stack-ball-3d/id1456732568",
        "https://apps.apple.com/us/app/tank-stars/id1347123739",
        "https://apps.apple.com/us/app/bottle-flip-3d-tap-to-jump/id1447504309",
        "https://apps.apple.com/us/app/going-balls/id1499081620",
        "https://apps.apple.com/us/app/temple-run/id420009108",
        "https://apps.apple.com/us/app/jetpack-joyride/id457446957",
        "https://apps.apple.com/us/app/doodle-jump-2/id1542340137",
        "https://apps.apple.com/us/app/leps-world-jump-n-run-games/id486717857",
        "https://apps.apple.com/us/app/super-mario-run/id1145275343",
        "https://apps.apple.com/us/app/sonic-the-hedgehog-classic/id316025912",
        "https://apps.apple.com/us/app/mega-man-x/id469343097",
        "https://apps.apple.com/us/app/sonic-runners-adventure/id1306844643",
        "https://apps.apple.com/us/app/dead-cells/id1389752090",
        "https://apps.apple.com/us/app/bastion/id1467063160",
        "https://apps.apple.com/us/app/20-minutes-till-dawn/id1635123906",
        "https://apps.apple.com/us/app/loop-hero/id6464048549",
        "https://apps.apple.com/us/app/stone-story-rpg/id1076120218",
        "https://apps.apple.com/us/app/battleheart-legacy/id666508823",
        "https://apps.apple.com/us/app/peglin/id6446336622",
        "https://apps.apple.com/us/app/vampire-survivors/id6444525702",
        "https://apps.apple.com/us/app/archero/id1453651052",
        "https://apps.apple.com/us/app/ballz/id1139609950",
        "https://apps.apple.com/us/app/stack/id1080487957",
        "https://apps.apple.com/us/app/hop/id1154436120",
        "https://apps.apple.com/us/app/leap-day/id1083451870",
        "https://apps.apple.com/us/app/sprint-rpg/id1277023608",
        "https://apps.apple.com/us/app/redungeon/id1119569595",
        "https://apps.apple.com/us/app/vault/id1009227147",
        "https://apps.apple.com/us/app/gopogo/id1030322270",
        "https://apps.apple.com/us/app/platform-panic/id940103464",
    ]
    
    print("="*80)
    print("Generating Temp Concept Files")
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


if __name__ == "__main__":
    main()


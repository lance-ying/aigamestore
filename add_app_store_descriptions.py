#!/usr/bin/env python3
"""Add full App Store descriptions to temp concept files."""

import sys
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
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
    temp_files = [
        "temp_concept_paper_io.txt",
        "temp_concept_mario_kart_tour.txt",
        "temp_concept_brawl_stars.txt",
        "temp_concept_crossy_road.txt",
        "temp_concept_hill_climb_racing.txt",
        "temp_concept_ridiculous_fishing.txt",
        "temp_concept_poly_bridge_2.txt",
        "temp_concept_tds___tower_destiny_survive.txt",
        "temp_concept_hit_master_3d_knife_assassin.txt",
        "temp_concept_risk_global_domination.txt",
        "temp_concept_brotato.txt",
        "temp_concept_shawarma_legend.txt",
        "temp_concept_friday_night_funkin_mobile.txt",
        "temp_concept_downwell.txt",
        "temp_concept_super_meat_boy_forever.txt",
        "temp_concept_hoplite.txt",
        "temp_concept_onebit_adventure.txt",
        "temp_concept_knights_of_pen__paper_2.txt",
        "temp_concept_enter_the_gungeon.txt",
        "temp_concept_terraria.txt",
        "temp_concept_monument_valley_2.txt",
        "temp_concept_balatro.txt",
        "temp_concept_slay_the_spire.txt",
        "temp_concept_tomb_of_the_mask_pixel_maze.txt",
        "temp_concept_snake_vs_block.txt",
        "temp_concept_square_bird___flappy_chicken.txt",
        "temp_concept_go_escape___casual_ball_games.txt",
        "temp_concept_jelly_shift___obstacle_course.txt",
        "temp_concept_battle_disc.txt",
        "temp_concept_flappy_dunk.txt",
        "temp_concept_dune.txt",
        "temp_concept_tiny_wings.txt",
        "temp_concept_stack_ball_3d.txt",
        "temp_concept_tank_stars.txt",
        "temp_concept_bottle_flip_3d__tap_to_jump.txt",
        "temp_concept_going_balls.txt",
        "temp_concept_temple_run.txt",
        "temp_concept_jetpack_joyride.txt",
        "temp_concept_doodle_jump_2.txt",
        "temp_concept_leps_world___jump_n_run_games.txt",
        "temp_concept_super_mario_run.txt",
        "temp_concept_sonic_the_hedgehog_classic.txt",
        "temp_concept_mega_man_x.txt",
        "temp_concept_sonic_runners_adventure.txt",
        "temp_concept_dead_cells.txt",
        "temp_concept_bastion.txt",
        "temp_concept_20_minutes_till_dawn.txt",
        "temp_concept_loop_hero.txt",
        "temp_concept_stone_story_rpg.txt",
        "temp_concept_battleheart_legacy.txt",
        "temp_concept_peglin.txt",
        "temp_concept_vampire_survivors.txt",
        "temp_concept_archero.txt",
        "temp_concept_ballz.txt",
        "temp_concept_stack.txt",
        "temp_concept_hop.txt",
        "temp_concept_leap_day.txt",
        "temp_concept_sprint_rpg.txt",
        "temp_concept_redungeon.txt",
        "temp_concept_vault.txt",
        "temp_concept_gopogo.txt",
        "temp_concept_platform_panic.txt",
    ]
    
    project_root = Path(__file__).parent
    success_count = 0
    
    print("="*80)
    print("Adding App Store Descriptions to Temp Concept Files")
    print("="*80)
    
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


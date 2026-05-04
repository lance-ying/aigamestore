#!/usr/bin/env python3
"""
Copy the 14 games that had controls added to a new directory.

This script reads games_with_html_controls.csv to find games without controls,
then copies them to a new directory called add_controls_14_games.
"""

import csv
import shutil
from pathlib import Path


def main():
    # Get project root
    project_root = Path(__file__).resolve().parents[2]
    csv_path = project_root / 'games_with_html_controls.csv'
    base_path = project_root / 'games' / 'games_final'
    output_dir = project_root / 'games' / 'add_controls_14_games'
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created output directory: {output_dir}")
    
    # Directories to search
    directories = [
        base_path / 'blue_purple_games_flattened_modded',
        base_path / 'games_pilot',
        base_path / 'purple_yellow_games_flattened',
        base_path / 'red_green_games_flattened',
    ]
    
    # Load games without controls from CSV
    games_to_copy = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['has_controls'].lower() == 'false':
                game_name = row['game_name']
                # Find the game directory
                for dir_path in directories:
                    game_path = dir_path / game_name
                    if game_path.exists() and (game_path / 'index.html').exists():
                        games_to_copy.append((game_name, game_path))
                        break
    
    print(f"\nFound {len(games_to_copy)} games to copy:\n")
    for i, (game_name, game_path) in enumerate(games_to_copy, 1):
        print(f"  {i}. {game_name}")
    
    # Copy each game
    print(f"\nCopying games to {output_dir}...\n")
    copied = 0
    failed = 0
    
    for game_name, game_path in games_to_copy:
        dest_path = output_dir / game_name
        
        try:
            # Remove destination if it exists
            if dest_path.exists():
                shutil.rmtree(dest_path)
            
            # Copy the entire game directory
            shutil.copytree(game_path, dest_path)
            print(f"✅ Copied: {game_name}")
            copied += 1
        except Exception as e:
            print(f"❌ Failed to copy {game_name}: {e}")
            failed += 1
    
    # Summary
    print(f"\n{'='*80}")
    print(f"COPY SUMMARY")
    print(f"{'='*80}")
    print(f"Total games: {len(games_to_copy)}")
    print(f"Successfully copied: {copied}")
    print(f"Failed: {failed}")
    print(f"Output directory: {output_dir}")
    print(f"{'='*80}\n")


if __name__ == '__main__':
    main()


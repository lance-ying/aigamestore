#!/usr/bin/env python3
"""
Flatten all games from games_final subdirectories into a single games_final_true directory.

This script copies all game directories from:
- blue_purple_games_flattened_modded
- games_pilot
- purple_yellow_games_flattened
- red_green_games_flattened

Into a single directory: games_final_true
"""

import shutil
from pathlib import Path


def main():
    # Get project root
    project_root = Path(__file__).resolve().parents[2]
    base_path = project_root / 'games' / 'games_final'
    output_dir = project_root / 'games' / 'games_final_true'
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created output directory: {output_dir}\n")
    
    # Source directories
    source_dirs = [
        base_path / 'blue_purple_games_flattened_modded',
        base_path / 'games_pilot',
        base_path / 'purple_yellow_games_flattened',
        base_path / 'red_green_games_flattened',
    ]
    
    all_games = []
    skipped = []
    
    # Collect all game directories
    for source_dir in source_dirs:
        if not source_dir.exists():
            print(f"Warning: Source directory not found: {source_dir}")
            continue
        
        print(f"Scanning: {source_dir.name}")
        game_dirs = [d for d in source_dir.iterdir() if d.is_dir()]
        
        for game_dir in game_dirs:
            # Skip backup directories and hidden directories
            if '_backup_' in game_dir.name or game_dir.name.startswith('.'):
                continue
            
            # Check if index.html exists (to verify it's a game directory)
            if (game_dir / 'index.html').exists():
                all_games.append((game_dir.name, game_dir))
    
    print(f"\nFound {len(all_games)} game directories to copy\n")
    
    # Copy each game
    copied = 0
    failed = 0
    conflicts = []
    
    for game_name, game_path in all_games:
        dest_path = output_dir / game_name
        
        # Check for conflicts
        if dest_path.exists():
            conflicts.append(game_name)
            print(f"⚠️  Conflict: {game_name} already exists, skipping...")
            failed += 1
            continue
        
        try:
            # Copy the entire game directory
            shutil.copytree(game_path, dest_path)
            copied += 1
            if copied % 10 == 0:
                print(f"  Copied {copied} games...")
        except Exception as e:
            print(f"❌ Failed to copy {game_name}: {e}")
            failed += 1
    
    # Summary
    print(f"\n{'='*80}")
    print(f"FLATTEN SUMMARY")
    print(f"{'='*80}")
    print(f"Total games found: {len(all_games)}")
    print(f"Successfully copied: {copied}")
    print(f"Failed/Skipped: {failed}")
    if conflicts:
        print(f"\nConflicts (games with duplicate names): {len(conflicts)}")
        for name in conflicts[:10]:  # Show first 10
            print(f"  - {name}")
        if len(conflicts) > 10:
            print(f"  ... and {len(conflicts) - 10} more")
    print(f"\nOutput directory: {output_dir}")
    print(f"{'='*80}\n")


if __name__ == '__main__':
    main()


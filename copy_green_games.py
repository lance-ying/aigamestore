#!/usr/bin/env python3
"""Copy all green-flagged games from games/games to games/green_flag_games."""

import json
import shutil
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).parent
FLAGS_FILE = PROJECT_ROOT / "flags.json"
SOURCE_DIR = PROJECT_ROOT / "games" / "games"
DEST_DIR = PROJECT_ROOT / "games" / "green_flag_games"


def load_flags():
    """Load flags from flags.json."""
    if not FLAGS_FILE.exists():
        print(f"Error: {FLAGS_FILE} not found")
        return {}
    
    with open(FLAGS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_game_path(full_path: str) -> str:
    """
    Extract relative game path from full path.
    
    Examples:
    - /Users/heyodogo/code/gordian/games/games/2112td:-tower-defense-survival
      -> 2112td:-tower-defense-survival
    - /Users/heyodogo/code/gordian/games/games/magicus_regenerated/game_0000/sample_0
      -> magicus_regenerated/game_0000/sample_0
    """
    # Remove the project root prefix
    games_games_prefix = "/games/games/"
    if games_games_prefix in full_path:
        idx = full_path.index(games_games_prefix) + len(games_games_prefix)
        return full_path[idx:]
    return ""


def get_green_flagged_games():
    """Get list of green-flagged games in games/games directory."""
    flags = load_flags()
    green_games = []
    
    for full_path, flag_color in flags.items():
        if flag_color.lower() == "green" and "/games/games/" in full_path:
            game_path = extract_game_path(full_path)
            if game_path:
                green_games.append(game_path)
    
    return green_games


def copy_game(source_path: Path, dest_path: Path) -> bool:
    """Copy a game directory from source to destination."""
    try:
        if not source_path.exists():
            print(f"  ⚠️  Source not found: {source_path}")
            return False
        
        # Remove destination if it exists
        if dest_path.exists():
            print(f"  ⚠️  Removing existing: {dest_path}")
            shutil.rmtree(dest_path)
        
        # Copy the directory
        shutil.copytree(source_path, dest_path)
        return True
    except Exception as e:
        print(f"  ❌ Error copying {source_path}: {e}")
        return False


def main():
    """Main function to copy all green-flagged games."""
    print("=" * 80)
    print("Copying Green-Flagged Games")
    print("=" * 80)
    
    # Get list of green-flagged games
    green_games = get_green_flagged_games()
    
    if not green_games:
        print("No green-flagged games found in games/games directory")
        return
    
    print(f"\nFound {len(green_games)} green-flagged games:")
    for game in sorted(green_games):
        print(f"  - {game}")
    
    # Create destination directory
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nDestination directory: {DEST_DIR}")
    
    # Copy each game
    print("\n" + "=" * 80)
    print("Copying games...")
    print("=" * 80)
    
    success_count = 0
    failed_games = []
    
    for game_path in sorted(green_games):
        source_path = SOURCE_DIR / game_path
        dest_path = DEST_DIR / game_path
        
        print(f"\n[{success_count + 1}/{len(green_games)}] {game_path}")
        
        if copy_game(source_path, dest_path):
            print(f"  ✅ Copied successfully")
            success_count += 1
        else:
            failed_games.append(game_path)
    
    # Summary
    print("\n" + "=" * 80)
    print("Summary")
    print("=" * 80)
    print(f"Total games found: {len(green_games)}")
    print(f"Successfully copied: {success_count}")
    print(f"Failed: {len(failed_games)}")
    
    if failed_games:
        print("\nFailed games:")
        for game in failed_games:
            print(f"  - {game}")
    
    print(f"\n✅ Done! Games copied to: {DEST_DIR}")


if __name__ == "__main__":
    main()


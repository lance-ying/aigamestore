#!/usr/bin/env python3
"""Copy blue games from games/games and purple games from games/single_prompt_with_testing to a combined directory."""

import json
import shutil
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FLAGS_FILE = PROJECT_ROOT / "flags.json"
SOURCE_DIR_GAMES = PROJECT_ROOT / "games" / "games"
SOURCE_DIR_SINGLE_PROMPT = PROJECT_ROOT / "games" / "single_prompt_with_testing"
DEST_DIR = PROJECT_ROOT / "games" / "blue_purple_games"


def load_flags():
    """Load flags from flags.json."""
    if not FLAGS_FILE.exists():
        print(f"Error: {FLAGS_FILE} not found")
        return {}
    
    with open(FLAGS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_game_path(full_path: str, source_type: str) -> str:
    """
    Extract relative game path from full path.
    
    Args:
        full_path: Full path from flags.json
        source_type: Either "games" or "single_prompt"
    
    Returns:
        Relative game path
    """
    if source_type == "games":
        # Extract from /games/games/...
        games_games_prefix = "/games/games/"
        if games_games_prefix in full_path:
            idx = full_path.index(games_games_prefix) + len(games_games_prefix)
            return full_path[idx:]
    elif source_type == "single_prompt":
        # Extract from /games/single_prompt_with_testing/...
        single_prompt_prefix = "/games/single_prompt_with_testing/"
        if single_prompt_prefix in full_path:
            idx = full_path.index(single_prompt_prefix) + len(single_prompt_prefix)
            return full_path[idx:]
    
    return ""


def get_blue_games_from_games():
    """Get list of blue-flagged games in games/games directory."""
    flags = load_flags()
    blue_games = []
    
    for full_path, flag_color in flags.items():
        if flag_color.lower() == "blue" and "/games/games/" in full_path:
            game_path = extract_game_path(full_path, "games")
            if game_path:
                blue_games.append(("games", game_path))
    
    return blue_games


def get_purple_games_from_single_prompt():
    """Get list of purple-flagged games in games/single_prompt_with_testing directory."""
    flags = load_flags()
    purple_games = []
    
    for full_path, flag_color in flags.items():
        if flag_color.lower() == "purple" and "/games/single_prompt_with_testing/" in full_path:
            game_path = extract_game_path(full_path, "single_prompt")
            if game_path:
                purple_games.append(("single_prompt", game_path))
    
    return purple_games


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
    """Main function to copy blue and purple games."""
    print("=" * 80)
    print("Copying Blue Games (from games/games) and Purple Games (from single_prompt_with_testing)")
    print("=" * 80)
    
    # Get lists of games
    blue_games = get_blue_games_from_games()
    purple_games = get_purple_games_from_single_prompt()
    
    all_games = blue_games + purple_games
    
    if not all_games:
        print("No blue or purple games found")
        return
    
    print(f"\nFound {len(blue_games)} blue games from games/games:")
    for source_type, game_path in sorted(blue_games, key=lambda x: x[1]):
        print(f"  - {game_path}")
    
    print(f"\nFound {len(purple_games)} purple games from single_prompt_with_testing:")
    for source_type, game_path in sorted(purple_games, key=lambda x: x[1]):
        print(f"  - {game_path}")
    
    # Create destination directory
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nDestination directory: {DEST_DIR}")
    
    # Copy each game
    print("\n" + "=" * 80)
    print("Copying games...")
    print("=" * 80)
    
    success_count = 0
    failed_games = []
    
    for source_type, game_path in sorted(all_games, key=lambda x: x[1]):
        if source_type == "games":
            source_path = SOURCE_DIR_GAMES / game_path
        else:  # single_prompt
            source_path = SOURCE_DIR_SINGLE_PROMPT / game_path
        
        # For single_prompt games, prefix with "single_prompt_" to avoid conflicts
        if source_type == "single_prompt":
            dest_path = DEST_DIR / f"single_prompt_{game_path}"
        else:
            dest_path = DEST_DIR / game_path
        
        print(f"\n[{success_count + 1}/{len(all_games)}] {source_type}: {game_path}")
        
        if copy_game(source_path, dest_path):
            print(f"  ✅ Copied successfully")
            success_count += 1
        else:
            failed_games.append((source_type, game_path))
    
    # Summary
    print("\n" + "=" * 80)
    print("Summary")
    print("=" * 80)
    print(f"Total blue games found: {len(blue_games)}")
    print(f"Total purple games found: {len(purple_games)}")
    print(f"Total games: {len(all_games)}")
    print(f"Successfully copied: {success_count}")
    print(f"Failed: {len(failed_games)}")
    
    if failed_games:
        print("\nFailed games:")
        for source_type, game in failed_games:
            print(f"  - {source_type}: {game}")
    
    print(f"\n✅ Done! Games copied to: {DEST_DIR}")


if __name__ == "__main__":
    main()

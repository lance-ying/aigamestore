#!/usr/bin/env python3
"""
Batch fix games to convert held keypresses to tap-based controls with increased movement.

This script applies a consistent fix across games to make them VLM-friendly:
- Converts held keypresses to tap-based (single press = action)
- Increases movement distance per press to compensate

Usage:
    python scripts/batch/batch_fix_keypresses.py --directory public/games
    python scripts/batch/batch_fix_keypresses.py --directory public/games_gen_halloween --max-games 5
    python scripts/batch/batch_fix_keypresses.py --directory public/games --pattern "space-*"
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List
import fnmatch


def list_games(directory: str, pattern: str = "*") -> List[Path]:
    """List all valid game directories."""
    games_path = Path(directory)
    
    if not games_path.exists():
        print(f"Error: Directory not found: {directory}")
        return []
    
    games = []
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip backup directories
        if '_backup_' in item.name:
            continue
        
        # Skip hidden directories
        if item.name.startswith('.'):
            continue
        
        # Apply pattern filter
        if not fnmatch.fnmatch(item.name, pattern):
            continue
        
        # Check if index.html exists
        if not (item / "index.html").exists():
            continue
        
        games.append(item)
    
    # Sort alphabetically
    games.sort(key=lambda x: x.name)
    
    return games


def get_keypress_fix_feedback() -> str:
    """Generate the consistent feedback for keypress fixes."""
    return """CRITICAL: Make all controls tap-based for VLM compatibility.

REQUIRED CHANGES:

1. REMOVE HELD KEYPRESS MECHANICS:
   - Convert all continuous key-hold controls to single-tap controls
   - Each keypress should trigger ONE discrete action
   - Remove any code that checks for keys being held down continuously
   - Example: Instead of "while key is held, move 2px per frame", make it "on key tap, move 30px once"

2. INCREASE MOVEMENT DISTANCE:
   - Multiply all movement distances by 3-5x to compensate for tap-based control
   - If a character moved 5 pixels per frame when held, make each tap move 20-30 pixels
   - Ensure actions are still controllable but cover enough ground per press

3. SPECIFIC IMPLEMENTATION:
   - Arrow keys: Single tap moves player by significant distance (not continuous)
   - Space/action keys: Single tap performs full action (jump, shoot, etc.)
   - Remove velocity accumulation from held keys
   - Keep momentum/physics if they exist, but trigger from single taps

4. MAINTAIN GAME FEEL:
   - Keep the game playable and responsive
   - Preserve all existing game mechanics (just change input method)
   - Test that the game is still completable with tap-based controls

5. DO NOT BREAK:
   - Existing game logic, scoring, collision detection
   - Game phases (start, playing, game over)
   - Any other controls (Enter, ESC, R, etc.)

VALIDATION:
- After changes, the game should be playable using only discrete key taps
- No key should need to be held down to play effectively
- Movement per tap should feel substantial but controllable

Apply these changes to all movement and action controls in the game."""


def fix_game(game_path: Path, feedback: str, model: str = "anthropic:claude-4.5-sonnet") -> bool:
    """Run fix_game.py for a single game."""
    try:
        print(f"\n{'='*80}")
        print(f"Fixing: {game_path.name}")
        print(f"Path: {game_path}")
        print(f"{'='*80}\n")
        
        result = subprocess.run(
            [
                "uv", "run", "python", "fix_game.py",
                str(game_path),
                feedback,
                "--model", model,
            ],
            capture_output=False,
            text=True,
            check=False
        )
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error fixing {game_path.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch fix games to use tap-based controls instead of held keypresses"
    )
    parser.add_argument(
        "--directory",
        default="public/games",
        help="Directory containing games to fix (default: public/games)"
    )
    parser.add_argument(
        "--pattern",
        default="*",
        help="Glob pattern to filter games (e.g., 'space-*', 'halloween-*')"
    )
    parser.add_argument(
        "--model",
        default="anthropic:claude-4.5-sonnet",
        help="Model to use for fixes (default: anthropic:claude-4.5-sonnet)"
    )
    parser.add_argument(
        "--max-games",
        type=int,
        help="Maximum number of games to fix (optional)"
    )
    parser.add_argument(
        "--skip-to",
        type=int,
        default=0,
        help="Skip to this game index (for resuming)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List games that would be fixed without actually fixing them"
    )
    
    args = parser.parse_args()
    
    # List all games
    print(f"Scanning directory: {args.directory}")
    if args.pattern != "*":
        print(f"Using pattern filter: {args.pattern}")
    
    games = list_games(args.directory, args.pattern)
    
    if not games:
        print(f"\nNo games found in {args.directory}")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        games = games[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        games = games[:args.max_games]
    
    total = len(games)
    print(f"\nFound {total} games to fix")
    
    # Show games list
    print(f"\nGames to process:")
    for i, game in enumerate(games, 1):
        print(f"  {i}. {game.name}")
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        return
    
    # Show the feedback that will be applied
    print(f"\n{'='*80}")
    print("FEEDBACK TO BE APPLIED:")
    print(f"{'='*80}")
    feedback = get_keypress_fix_feedback()
    for line in feedback.split('\n')[:10]:  # Show first 10 lines
        print(f"  {line}")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    response = input(f"Proceed with fixing {total} games? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Fix each game
    successful = 0
    failed = 0
    failed_games = []
    
    for i, game_path in enumerate(games, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_path.name}")
        print(f"{'#'*80}")
        
        # Apply the fix
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            print(f"✅ Successfully fixed {game_path.name}")
        else:
            failed += 1
            failed_games.append(game_path.name)
            print(f"❌ Failed to fix {game_path.name}")
    
    # Summary
    print(f"\n{'='*80}")
    print(f"BATCH FIX SUMMARY")
    print(f"{'='*80}")
    print(f"Total games processed: {total}")
    print(f"Successfully fixed: {successful}")
    print(f"Failed: {failed}")
    
    if failed_games:
        print(f"\nFailed games:")
        for game_name in failed_games:
            print(f"  - {game_name}")
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()


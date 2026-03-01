#!/usr/bin/env python3
"""
Batch remove pause overlays from all games.

This script removes the pause screen overlay while keeping the freeze/unfreeze functionality intact.
When paused, the game simply freezes with no visual overlay.

Usage:
    python scripts/batch/batch_remove_pause_overlay.py --directory games/added_controls_14_games
    python scripts/batch/batch_remove_pause_overlay.py --directory games/added_controls_14_games --max-games 5
    python scripts/batch/batch_remove_pause_overlay.py --directory games/added_controls_14_games --skip-to 3
    python scripts/batch/batch_remove_pause_overlay.py --directory games/added_controls_14_games --model google:gemini-2.5-flash
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


def get_remove_pause_overlay_feedback() -> str:
    """Generate the consistent feedback for removing pause overlays."""
    return """Remove the pause overlay. When game is paused, freeze everything but show NO visual overlay, NO "PAUSED" text, NO instructions.

FIND AND DELETE/COMMENT OUT:
- Any code that draws the pause overlay (semi-transparent background)
- Any text that says "PAUSED"
- Any pause instructions (like "Press ESC to Resume")
- The entire pause rendering function if it only draws the overlay

KEEP INTACT:
- The pause state system (pause flag, pause game phase)
- The pause input handler (ESC key)
- The game freeze logic

CRITICAL: Output the complete modified files in <code filename="game.js"> format with all fixes applied. Do not just analyze - provide complete working files."""


def fix_game(game_path: Path, feedback: str, model: str = "google:gemini-2.5-flash") -> bool:
    """Run fix_game.py for a single game."""
    try:
        print(f"\n{'='*80}")
        print(f"Fixing: {game_path.name}")
        print(f"Path: {game_path}")
        print(f"{'='*80}\n")

        # Get the path to fix_game.py relative to project root
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent
        fix_game_path = project_root / "scripts" / "utils" / "fix_game.py"

        result = subprocess.run(
            [
                "uv", "run", "python", str(fix_game_path),
                str(game_path),
                feedback,
                "--model", model,
            ],
            capture_output=False,
            text=True,
            check=False,
            cwd=project_root  # Run from project root
        )

        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error fixing {game_path.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch remove pause overlays from all games while keeping freeze functionality"
    )
    parser.add_argument(
        "--directory",
        default="games/added_controls_14_games",
        help="Directory containing games to fix (default: games/added_controls_14_games)"
    )
    parser.add_argument(
        "--pattern",
        default="*",
        help="Glob pattern to filter games (e.g., 'space-*', 'neon-*')"
    )
    parser.add_argument(
        "--model",
        default="google:gemini-2.5-flash",
        help="Model to use for fixes (default: google:gemini-2.5-flash)"
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

    # Normalize model name - add google: prefix if it's a gemini model without it
    model = args.model
    if model.startswith("gemini") and ":" not in model:
        model = f"google:{model}"
        print(f"Note: Normalized model name to: {model}")

    args.model = model

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
    feedback = get_remove_pause_overlay_feedback()
    for line in feedback.split('\n')[:15]:  # Show first 15 lines
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

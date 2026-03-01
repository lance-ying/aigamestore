#!/usr/bin/env python3
"""
Batch fix games to make them deterministic for replay.

This script applies fixes to replace Math.random() with seeded RNG to ensure
games can be replayed deterministically from inputs.json and logs.json.

Usage:
    python batch_fix_replay_determinism.py --directory games/games_pilot
    python batch_fix_replay_determinism.py --directory games/games_pilot --max-games 5
    python batch_fix_replay_determinism.py --directory games/games_pilot --skip-to 3
    python batch_fix_replay_determinism.py --directory games/games_pilot --model google:gemini-2.5-flash
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


def get_replay_determinism_feedback() -> str:
    """Generate the consistent feedback for making games deterministic."""
    return """Make the game fully deterministic by replacing all Math.random() calls with a seeded random number generator to enable accurate replay from inputs.json and logs.json.

REQUIRED CHANGES:

1. CREATE SEEDED RNG MODULE:
   - Create a new file "rng.js" in the game directory
   - Implement a seeded random number generator using a Linear Congruential Generator (LCG) or similar algorithm
   - Export functions: setSeed(seed), random(), randomRange(min, max), randomInt(min, max)
   - Initialize with seed 42 to match p.randomSeed(42) used in setup()

2. REPLACE ALL Math.random() CALLS:
   - Find all instances of Math.random() in all JavaScript files
   - Replace Math.random() with rng.random() (or appropriate function from rng.js)
   - Replace Math.random() * range with rng.randomRange(0, range)
   - Replace Math.floor(Math.random() * range) with rng.randomInt(0, range-1)
   - Ensure the RNG module is imported at the top of files that use it

3. INITIALIZE RNG IN SETUP:
   - In the game's setup() function, after p.randomSeed(42), also call rng.setSeed(42)
   - This ensures both p5.js random and the custom RNG use the same seed

4. FILES TO CHECK AND MODIFY:
   - game.js - Check for Math.random() in game logic
   - entities.js - Check for Math.random() in entity behavior (enemy AI, bullet spread, etc.)
   - Any other JavaScript files that use Math.random()

5. PRESERVE FUNCTIONALITY:
   - The game should behave identically to before, just with deterministic randomness
   - All gameplay mechanics, visuals, and features should remain intact
   - Only the source of randomness should change (Math.random() -> rng.random())

6. TESTING:
   - After changes, the game should produce identical results when run with the same inputs
   - Running the game twice with identical inputs should produce pixel-perfect identical output

VALIDATION:
- All Math.random() calls should be replaced with rng.random() or appropriate RNG function
- rng.js file should exist and export the required functions
- RNG should be initialized with seed 42 in setup()
- Game should still function normally and be playable
- Game should be deterministic (same inputs = same output)

Apply these changes to make the game fully deterministic for replay functionality."""


def fix_game(game_path: Path, feedback: str, model: str = "google:gemini-2.5-flash") -> bool:
    """Run fix_game.py for a single game."""
    try:
        print(f"\n{'='*80}")
        print(f"Fixing: {game_path.name}")
        print(f"Path: {game_path}")
        print(f"{'='*80}\n")
        
        # Add parent directory to path for imports
        script_dir = Path(__file__).parent
        sys.path.insert(0, str(script_dir))
        
        # Use FeedbackFixIterator directly
        from iterators.feedback_fix import FeedbackFixIterator
        iterator = FeedbackFixIterator(model=model)
        result = iterator.iterate(
            str(game_path),
            feedback,
            debug_prompts=False,
            use_planning=True,
            in_place=True,
        )
        
        num_updated = result.get("num_files_updated", 0)
        if num_updated > 0:
            print(f"✓ Updated {num_updated} file(s)")
            if result.get("analysis"):
                print("\nAnalysis:")
                for line in result.get("analysis", "").split('\n'):
                    if line.strip():
                        print(f"  {line}")
        
        return num_updated > 0
    except Exception as e:
        print(f"❌ Error fixing {game_path.name}: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch fix games to make them deterministic for replay"
    )
    parser.add_argument(
        "--directory",
        default="games/games_pilot",
        help="Directory containing games to fix (default: games/games_pilot)"
    )
    parser.add_argument(
        "--pattern",
        default="*",
        help="Glob pattern to filter games (e.g., 'space-*', 'halloween-*')"
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
    
    # Normalize model name
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
    feedback = get_replay_determinism_feedback()
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

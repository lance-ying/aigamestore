#!/usr/bin/env python3
"""
Batch script to add 9 more levels to all games in a directory.

This script uses FeedbackFixIterator to add:
- 3 easy levels
- 3 medium difficulty levels  
- 3 very difficult levels

Usage:
    python scripts/batch/batch_add_levels.py --directory public/games
    python scripts/batch/batch_add_levels.py --directory public/games --max-games 5
    python scripts/batch/batch_add_levels.py --directory public/games --skip-to 10
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List
import fnmatch

# Add parent directory to path to import iterators
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# NOTE: Import FeedbackFixIterator lazily (only when needed, not in dry-run)
# from iterators.feedback_fix import FeedbackFixIterator

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


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


def get_levels_feedback() -> str:
    """Generate the feedback prompt for adding 9 more levels."""
    return """Add 9 more levels to this game, expanding the level progression significantly.

CRITICAL REQUIREMENTS - PLAYABILITY FIRST:

1. LEVEL STRUCTURE:
   - Add exactly 9 new levels total
   - Levels should be numbered sequentially after the existing levels
   - Maintain the existing level structure and format used in the game
   - Use the EXACT same data structure/format as existing levels - do not change the format

2. DIFFICULTY PROGRESSION (MUST BE PLAYABLE):

   - Levels 1-3 (VERY EASY - Tutorial-like):
     * These MUST be significantly easier than any existing level
     * Use the simplest possible layouts - minimal obstacles/enemies
     * If the game has enemies, use 50% fewer than the easiest existing level
     * If the game has obstacles, use 30% fewer than the easiest existing level
     * Make paths wide and clear - no tight spaces or precision required
     * Generous time limits, resources, or forgiving mechanics
     * These should be completable by a beginner on first try
     * Test mentally: Can a new player complete this without frustration?
   
   - Levels 4-6 (Medium - Gradual Challenge):
     * Slightly more challenging than easy levels, but still very achievable
     * Use layouts similar to existing easy/medium levels in the game
     * Moderate enemy/obstacle density - not overwhelming
     * Require some skill but remain fair and completable
     * Should feel like natural progression from easy levels
   
   - Levels 7-9 (Hard - Expert Challenge):
     * Very difficult but still completable
     * Complex layouts requiring strategy and skill
     * High enemy/obstacle density but with clear paths to success
     * May require multiple attempts but should feel fair
     * Should challenge expert players without being impossible

3. PLAYABILITY VALIDATION (CRITICAL):
   - Each level MUST be completable - there must be a valid path to victory
   - Test each level design mentally before implementing:
     * Can the player reach the goal/exit?
     * Are win conditions achievable?
     * Are there any impossible situations or dead ends?
   - Use proven patterns from existing levels - don't invent new mechanics
   - If the game has collision detection, ensure paths are wide enough
   - If the game has enemies, ensure they don't block required paths
   - If the game has time limits, make them generous for easy levels

4. IMPLEMENTATION GUIDELINES:
   - Preserve ALL existing game mechanics and code structure exactly
   - Use the IDENTICAL level data format/structure as existing levels
   - Copy the structure of existing levels and modify only the data
   - Ensure levels are properly integrated into the level selection/progression system
   - Update any level count variables (e.g., totalLevels, maxLevel) to include the 9 new levels
   - Update level selection UI if present (e.g., level select screen, level counter)
   - Make sure the game can properly load and play all new levels
   - Do NOT change any game logic, only add level data

5. LEVEL DESIGN PRINCIPLES:
   - Start simple, then gradually increase complexity
   - Each level should feel unique but use familiar mechanics
   - Easy levels should teach/refine basic skills
   - Hard levels should test mastery of all mechanics
   - Ensure smooth difficulty curve - no sudden spikes
   - Maintain the game's core gameplay loop exactly as-is

6. CODE QUALITY:
   - Only modify level data files (e.g., levels.js, levelData.js, levelManager.js)
   - Do NOT modify game logic files unless absolutely necessary for level integration
   - Keep level data clean and well-organized
   - Add comments if helpful, but maintain existing code style

7. TESTING CHECKLIST:
   - Verify all 9 new levels can be loaded without errors
   - Ensure level progression works (can advance from level to level)
   - Check that win/loss conditions work for new levels
   - Verify level selection/UI shows all new levels
   - Confirm easy levels are actually easy and completable

Apply these changes while preserving all existing functionality and game mechanics. Prioritize playability and simplicity, especially for the first 3 levels."""


def fix_game(game_path: Path, feedback: str, model: str = "anthropic:claude-4.5-sonnet", verbose: bool = True) -> dict:
    """Apply level addition fix to a single game using FeedbackFixIterator."""
    # Lazy import - only import when actually needed (not in dry-run)
    try:
        from iterators.feedback_fix import FeedbackFixIterator
    except ImportError as e:
        return {
            "success": False,
            "num_files": 0,
            "updated_files": [],
            "analysis": None,
            "error": f"Failed to import FeedbackFixIterator: {e}"
        }
    
    try:
        if verbose:
            print(f"\n{'='*80}")
            print(f"Processing: {game_path.name}")
            print(f"Path: {game_path}")
            print(f"{'='*80}\n")
        
        # Initialize iterator
        iterator = FeedbackFixIterator(
            model=model,
            temperature=0.6,
            thinking=True,
            thinking_budget=8000,
        )
        
        # Apply fix
        result = iterator.iterate(
            game_dir=str(game_path),
            feedback=feedback,
            debug_prompts=False,
            use_planning=True,
            in_place=True,
        )
        
        # Extract results
        num_files = result.get("num_files_updated", 0)
        updated_files = result.get("updated_files", [])
        analysis = result.get("analysis")
        
        if verbose:
            if num_files > 0:
                print(f"✅ Successfully updated {num_files} file(s):")
                for file in updated_files:
                    print(f"   - {file}")
            else:
                print(f"⚠️  No files were updated")
            
            if analysis:
                print(f"\nAnalysis:")
                for line in analysis.strip().split('\n'):
                    print(f"   {line}")
        
        return {
            "success": num_files > 0,
            "num_files": num_files,
            "updated_files": updated_files,
            "analysis": analysis,
            "error": None
        }
        
    except Exception as e:
        error_msg = f"Error processing {game_path.name}: {e}"
        if verbose:
            print(f"❌ {error_msg}")
        return {
            "success": False,
            "num_files": 0,
            "updated_files": [],
            "analysis": None,
            "error": str(e)
        }


def main():
    print("Starting batch_add_levels.py...")
    sys.stdout.flush()
    
    parser = argparse.ArgumentParser(
        description="Batch add 9 more levels to all games in a directory"
    )
    parser.add_argument(
        "--directory",
        default="public/games",
        help="Directory containing games to process (default: public/games)"
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
        help="Maximum number of games to process (optional)"
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
        help="List games that would be processed without actually processing them"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Reduce output verbosity"
    )
    
    args = parser.parse_args()
    print(f"Arguments parsed: dry_run={args.dry_run}, directory={args.directory}")
    sys.stdout.flush()
    
    # List all games
    print(f"Scanning directory: {args.directory}")
    sys.stdout.flush()
    if args.pattern != "*":
        print(f"Using pattern filter: {args.pattern}")
        sys.stdout.flush()
    
    games = list_games(args.directory, args.pattern)
    print(f"Found {len(games)} games")
    sys.stdout.flush()
    
    if not games:
        print(f"\nNo games found in {args.directory}")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        sys.stdout.flush()
        games = games[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        games = games[:args.max_games]
    
    total = len(games)
    print(f"\nFound {total} games to process")
    sys.stdout.flush()
    
    # Show games list
    print(f"\nGames to process:")
    for i, game in enumerate(games, 1):
        print(f"  {i}. {game.name}")
    sys.stdout.flush()
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        sys.stdout.flush()
        return
    
    # Show the feedback that will be applied
    if not args.quiet:
        print(f"\n{'='*80}")
        print("FEEDBACK TO BE APPLIED:")
        print(f"{'='*80}")
        feedback = get_levels_feedback()
        for line in feedback.split('\n')[:15]:  # Show first 15 lines
            print(f"  {line}")
        print("  ... (see full feedback in first game)")
        print(f"{'='*80}\n")
        sys.stdout.flush()
    
    # Confirm before proceeding
    response = input(f"Proceed with adding levels to {total} games? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Process each game
    successful = 0
    failed = 0
    failed_games = []
    results_summary = []
    
    for i, game_path in enumerate(games, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_path.name}")
        print(f"{'#'*80}")
        sys.stdout.flush()
        
        # Apply the fix
        result = fix_game(game_path, feedback, args.model, verbose=not args.quiet)
        results_summary.append({
            "game": game_path.name,
            "result": result
        })
        
        if result["success"]:
            successful += 1
            print(f"✅ Successfully processed {game_path.name}")
        else:
            failed += 1
            failed_games.append({
                "name": game_path.name,
                "error": result.get("error", "Unknown error")
            })
            print(f"❌ Failed to process {game_path.name}")
        sys.stdout.flush()
    
    # Summary
    print(f"\n{'='*80}")
    print(f"BATCH LEVEL ADDITION SUMMARY")
    print(f"{'='*80}")
    print(f"Total games processed: {total}")
    print(f"Successfully processed: {successful}")
    print(f"Failed: {failed}")
    
    if failed_games:
        print(f"\nFailed games:")
        for game_info in failed_games:
            print(f"  - {game_info['name']}: {game_info['error']}")
    
    # Show file update summary
    total_files_updated = sum(r["result"]["num_files"] for r in results_summary if r["result"]["success"])
    print(f"\nTotal files updated across all games: {total_files_updated}")
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
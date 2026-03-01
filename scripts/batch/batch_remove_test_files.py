#!/usr/bin/env python3
"""
Batch remove automated testing files and test-related code from games.

This script removes all automated testing infrastructure including test controller files,
test mode buttons, and test-related code from games, leaving only the core game functionality.

Usage:
    python scripts/batch/batch_remove_test_files.py --directory games/games_pilot
    python scripts/batch/batch_remove_test_files.py --directory games/games_pilot --max-games 5
    python scripts/batch/batch_remove_test_files.py --directory games/games_pilot --skip-to 3
    python scripts/batch/batch_remove_test_files.py --directory games/games_pilot --model google:gemini-2.5-flash
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


def get_remove_test_files_feedback() -> str:
    """Generate the consistent feedback for removing test files and test-related code."""
    return """Remove all automated testing files and test-related code from the game, leaving only the core game functionality that works in HUMAN mode.

REQUIRED CHANGES:

1. DELETE TEST FILES:
   - Delete the file "automated_testing_controller.js" if it exists
   - Delete the file "testController.js" if it exists
   - Delete the file "testing.js" if it exists
   - These files should be completely removed from the game directory

2. REMOVE TEST FILE REFERENCES FROM HTML (index.html):
   - Remove any <script> tags that reference test files:
     * <script type="module" src="automated_testing_controller.js"></script>
     * <script type="module" src="testController.js"></script>
     * <script type="module" src="testing.js"></script>
   - Remove all test mode buttons from the HTML:
     * All buttons with onclick="window.setControlMode('TEST_1')" through 'TEST_5'
     * Examples: "TEST 1", "TEST 2", "TEST 3", "TEST 4", "TEST 5" buttons
     * Any buttons that set control mode to TEST_* values
   - If the control-buttons div becomes empty after removing test buttons, remove the entire div
   - Keep the "Human Mode" button only if it's useful, or remove all control buttons if only one mode remains

3. REMOVE TEST IMPORTS FROM JAVASCRIPT FILES:
   - Remove all import statements that reference test files:
     * import { game_testing_controller } from './automated_testing_controller.js'
     * import { get_automated_testing_action } from './automated_testing_controller.js'
     * import { TestController } from './testController.js'
     * import ... from './testing.js'
     * Any other imports from test files

4. REMOVE TEST-RELATED CODE FROM JAVASCRIPT:
   - Remove all calls to test controller functions:
     * game_testing_controller()
     * get_automated_testing_action()
     * Any other test controller function calls
   - Remove all code blocks that check for test control modes:
     * if (gameState.controlMode.startsWith("TEST"))
     * if (gameState.controlMode === "TEST_1") through "TEST_5"
     * switch cases for TEST_1, TEST_2, TEST_3, TEST_4, TEST_5
     * Any conditional logic that branches on test control modes
   - Remove window assignments for test controllers:
     * window.game_testing_controller = ...
     * window.setControlMode function if it's only used for test modes
   - Remove any variables, functions, or logic that are only used for testing
   - Ensure the game defaults to or only uses "HUMAN" control mode

5. PRESERVE CORE GAME FUNCTIONALITY:
   - Keep all game logic, rendering, and gameplay mechanics intact
   - Keep all player controls (keyboard, mouse, etc.)
   - Keep all game screens (start, playing, paused, game over, etc.)
   - Ensure the game still works and is playable after removing test code
   - The game should work normally in HUMAN mode

6. CLEAN UP:
   - Remove any unused variables or functions that were only used by test code
   - Ensure there are no broken imports or references after removing test files
   - Make sure the game initializes and runs without errors

VALIDATION:
- No test files (automated_testing_controller.js, testController.js, testing.js) should exist
- No script tags referencing test files should be in index.html
- No test mode buttons should be visible in the HTML
- No imports from test files should exist in JavaScript files
- No test control mode logic should remain in the code
- The game should run and be playable in HUMAN mode only
- All game functionality should remain intact

Apply these changes to completely remove all automated testing infrastructure while preserving the core game."""


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
        description="Batch remove automated testing files and test-related code from games"
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
    feedback = get_remove_test_files_feedback()
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

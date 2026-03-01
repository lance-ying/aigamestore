#!/usr/bin/env python3
"""
Batch add auto-restart functionality to games.

This script adds automatic restart functionality to games so they restart automatically
after game over without requiring the user to press R or R+Enter.

Usage:
    python scripts/batch/batch_add_auto_restart.py --directory games/games_pilot
    python scripts/batch/batch_add_auto_restart.py --directory games/games_pilot --max-games 5
    python scripts/batch/batch_add_auto_restart.py --directory games/games_pilot --skip-to 3
    python scripts/batch/batch_add_auto_restart.py --directory games/games_pilot --model google:gemini-2.5-flash
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


def get_add_auto_restart_feedback() -> str:
    """Generate the consistent feedback for adding auto-restart functionality."""
    return """Add automatic restart functionality to the game so it restarts automatically after game over without requiring user input (R key or R+Enter).

REQUIRED CHANGES:

1. IDENTIFY GAME OVER STATES:
   - Find where the game transitions to GAME_OVER_WIN or GAME_OVER_LOSE phases
   - Locate the game loop or update function (usually in game.js or main game file)
   - Identify where gameState.gamePhase is set to GAME_OVER_WIN or GAME_OVER_LOSE

2. ADD AUTO-RESTART LOGIC:
   - Add a timer/counter that triggers after the game reaches GAME_OVER state
   - After 1 second (30 frames at 30fps, or 60 frames at 60fps), automatically restart
   - The restart should:
     * Reset gameState.gamePhase to "START" or "PLAYING" (depending on game structure)
     * Reset all game state variables (score, level, player position, etc.)
     * Call the game initialization/reset function if one exists
     * Clear any game over screen displays

3. IMPLEMENTATION PATTERNS:

   Pattern 1: Using frame counter in game loop
   ```javascript
   // In game loop/update function
   if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
       if (!gameState.autoRestartTimer) {
           gameState.autoRestartTimer = gameState.frameCount;
       }
       // Auto-restart after 1 second (30 frames at 30fps, 60 frames at 60fps)
       const framesToWait = gameState.frameRate || 30;
       if (gameState.frameCount - gameState.autoRestartTimer > framesToWait) {
           restartGame(); // or resetGame(), initializeGame(), etc.
           gameState.autoRestartTimer = null;
       }
   }
   ```

   Pattern 2: Using setTimeout
   ```javascript
   // When game over is detected
   if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
       if (!gameState.autoRestartScheduled) {
           gameState.autoRestartScheduled = true;
           setTimeout(() => {
               restartGame(); // or resetGame(), initializeGame(), etc.
               gameState.autoRestartScheduled = false;
           }, 1000); // 1 second
       }
   }
   ```

   Pattern 3: Reset timer when phase changes
   ```javascript
   // Reset timer when entering new phase
   if (gameState.gamePhase !== "GAME_OVER_WIN" && gameState.gamePhase !== "GAME_OVER_LOSE") {
       gameState.autoRestartTimer = null;
   }
   ```

4. PRESERVE MANUAL RESTART:
   - Keep the R key functionality working (users can still manually restart)
   - If R is pressed during auto-restart countdown, restart immediately
   - Manual restart should cancel any pending auto-restart timer

5. FILES TO MODIFY:
   - game.js (main game loop/update function)
   - input.js (if restart logic is handled there)
   - globals.js (if you need to add autoRestartTimer to gameState)
   - Any file that handles game phase transitions

6. RESTART FUNCTION:
   - Use the existing restart function if one exists (restartGame(), resetGame(), initializeGame(), etc.)
   - If no restart function exists, create one that:
     * Resets gameState.gamePhase to "START" or "PLAYING"
     * Resets score, level, player state, etc.
     * Reinitializes the game

7. TIMING CONSIDERATIONS:
   - Wait 1 second after game over before restarting
   - This gives a brief moment to see the game over screen
   - Adjust timing based on game's frame rate (30fps = 30 frames, 60fps = 60 frames)

8. PRESERVE FUNCTIONALITY:
   - Don't break existing game logic
   - Keep all gameplay mechanics intact
   - Ensure the game still works normally
   - Manual restart (R key) should still work

VALIDATION:
- After game over, the game should automatically restart after 1 second
- Manual restart (R key) should still work and take priority
- Game state should be properly reset on auto-restart
- No errors should occur during auto-restart
- The game should continue playing normally after auto-restart

Apply these changes to add automatic restart functionality to the game."""


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
        description="Batch add auto-restart functionality to games"
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
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip confirmation prompt and proceed automatically"
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
    feedback = get_add_auto_restart_feedback()
    for line in feedback.split('\n')[:10]:  # Show first 10 lines
        print(f"  {line}")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    if not args.yes:
        response = input(f"Proceed with adding auto-restart to {total} games? (y/n): ")
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
            print(f"✅ Successfully added auto-restart to {game_path.name}")
        else:
            failed += 1
            failed_games.append(game_path.name)
            print(f"❌ Failed to add auto-restart to {game_path.name}")
    
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

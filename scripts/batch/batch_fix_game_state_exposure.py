#!/usr/bin/env python3
"""
Batch fix games to ensure recorder script can detect and record scores.

This script applies gameState exposure fixes to all problematic games:
- Exposes gameState/getGameState on window object
- Ensures score property exists and is accessible
- Verifies compatibility with recorder script (frontend/lib/utils/recorder-script.ts)

Note: This script does NOT add auto-start functionality. It only fixes gameState exposure.

Fixes are applied to:
- 5 games with invalid structure (gameState not exposed)
- 12 games with all zeros (score stays at 0, likely never started)
- Total: 17 problematic games

Usage:
    python batch_fix_game_state_exposure.py                    # Fix all problematic games (default directory)
    python batch_fix_game_state_exposure.py --directory /path/to/games  # Fix games in custom directory
    python batch_fix_game_state_exposure.py --type invalid     # Fix only invalid structure games
    python batch_fix_game_state_exposure.py --type all-zeros   # Fix only all-zeros games
    python batch_fix_game_state_exposure.py --max-games 5
    python batch_fix_game_state_exposure.py --skip-to 3
    python batch_fix_game_state_exposure.py --model google:gemini-2.5-flash
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List

# Games with invalid structure (from check_scores_structure.py)
INVALID_STRUCTURE_GAMES = [
    "aether-arena-rivals-of-the-abyss",
    "cookie-clicker",
    "snakeio",
    "stack-threejs-game",
    "stickman-fury",
]

# Games with all zeros (proper structure but score stays at 0 - likely never started)
ALL_ZEROS_GAMES = [
    "cannon-shot",
    "color-road-3d",
    "easy-delivery-co",
    "kart-tour-3d",
    "mini-golf-madness",
    "plants-vs-zombies-tower-defense",
    "pogo-punk-3d",
    "red-dungeon",
    "tilt-roller",
    "undertale-battle-system",
    "voxelcraft",
    "webfishing-sim",
]

# All problematic games
ALL_PROBLEMATIC_GAMES = INVALID_STRUCTURE_GAMES + ALL_ZEROS_GAMES

# Default games directory (can be overridden with --directory argument)
DEFAULT_GAMES_DIR = Path(__file__).parent / "frontend" / "public" / "all_92_games"


def get_game_state_exposure_feedback() -> str:
    """Generate the consistent feedback for exposing gameState/getGameState (invalid structure games)."""
    return """Expose the game's gameState object and/or getGameState function on the window object so the recorder script can detect and record scores.

This fix is for games that have gameState defined but don't expose it to window, causing the recorder script to fail to detect scores.

REQUIRED CHANGES:

1. IDENTIFY GAME STATE LOCATION:
   - Find where gameState is defined (usually in globals.js, game.js, or a state file)
   - Check if there's a getGameState() function that returns gameState
   - Check if gameState is exported as an ES6 module (export const gameState = ...)

2. EXPOSE TO WINDOW OBJECT:
   - If gameState is exported but not exposed to window, add:
     * window.gameState = gameState;
   - If getGameState() function exists but not exposed, add:
     * window.getGameState = getGameState;
   - If both exist, expose both for maximum compatibility

3. PLACEMENT OF WINDOW EXPOSURE:
   - Add window exposure AFTER the gameState/getGameState definitions
   - If using ES6 modules, add the exposure after the export statement
   - For getGameState function, add it right after the function definition
   - For gameState object, add it after the object is fully defined

4. EXAMPLE PATTERNS:
   
   Pattern 1: ES6 export with function
   ```javascript
   export function getGameState() {
       return gameState;
   }
   window.getGameState = getGameState;  // ADD THIS
   ```
   
   Pattern 2: ES6 export with const
   ```javascript
   export const gameState = {
       score: 0,
       // ... other properties
   };
   window.gameState = gameState;  // ADD THIS
   window.getGameState = () => gameState;  // OPTIONAL: also add function
   ```
   
   Pattern 3: Non-module (already on window)
   ```javascript
   window.gameState = {
       score: 0,
       // ... already exposed, no changes needed
   };
   ```

5. FILES TO CHECK:
   - globals.js (most common location)
   - game.js (if gameState is defined there)
   - state.js, game_state.js, state_manager.js (alternative names)
   - Any file that exports gameState or getGameState

6. PRESERVE FUNCTIONALITY:
   - Do NOT modify the gameState object structure
   - Do NOT change how gameState is used internally
   - Only add window exposure - this is purely for external access
   - Ensure the game still works exactly as before

7. VALIDATION:
   - After changes, window.gameState or window.getGameState() should be accessible
   - The recorder script should be able to detect scores from gameState.score
   - Game functionality should remain completely unchanged

Apply these changes to expose gameState/getGameState on the window object.

IMPORTANT: After making changes, verify that:
- window.gameState or window.getGameState() is accessible
- gameState.score property exists and can be read
- The recorder script (from frontend/lib/utils/recorder-script.ts) can detect scores using:
  * window.getGameState().score
  * window.gameState.score
  * window.getGameState().player.score (if nested)
  * Other common score property names (totalScore, currentScore, levelScore)"""


def get_all_zeros_feedback() -> str:
    """Generate feedback for games with all zeros (score stays at 0 - game never starts)."""
    return """Fix the game so that scores are properly recorded by the recorder script. The game currently has proper structure but score stays at 0, likely because the game never transitions from START phase to PLAYING phase.

REQUIRED CHANGES:

1. ENSURE GAME STATE EXPOSURE:
   - Verify gameState or getGameState is exposed on window:
     * window.gameState = gameState; OR
     * window.getGameState = getGameState;
   - This ensures the recorder script can access gameState

2. ENSURE SCORE PROPERTY EXISTS:
   - Verify gameState has a score property:
     * gameState.score (most common)
     * gameState.player.score (if nested)
     * gameState.totalScore, gameState.currentScore, or gameState.levelScore (alternatives)
   - The recorder script checks these properties in order

3. AUTO-START FUNCTIONALITY (if game requires user input to start):
   - If the game requires pressing ENTER or clicking a button to start:
     * Add auto-start after a short delay (e.g., 500ms) OR
     * Automatically call the start function when gamePhase is "START" for more than 1 second
     * This ensures the game transitions to "PLAYING" phase during automated testing
   - Example pattern:
     ```javascript
     // In game loop or initialization
     if (gameState.gamePhase === "START" && gameState.frameCount > 30) {
         startGame(); // Auto-start after 1 second (30 frames at 30fps)
     }
     ```
   - OR add a timeout:
     ```javascript
     setTimeout(() => {
         if (gameState.gamePhase === "START") {
             startGame();
         }
     }, 1000);
     ```

4. VERIFY SCORE UPDATES:
   - Ensure score is updated during gameplay:
     * gameState.score += points; (when player scores)
     * gameState.player.score += points; (if using nested structure)
   - Score should increase during PLAYING phase

5. COMPATIBILITY WITH RECORDER SCRIPT:
   - The recorder script (frontend/lib/utils/recorder-script.ts) checks for scores using:
     * window.getGameState() or window.gameState
     * Then looks for: player.score, score, totalScore, currentScore, levelScore, finalScore
   - Ensure at least one of these properties exists and is a number
   - The recorder checks every frame, so score should be accessible throughout gameplay

6. FILES TO CHECK:
   - globals.js (gameState definition)
   - game.js (game loop, start function)
   - input.js (start button/key handler)
   - Any file that manages gamePhase transitions

7. PRESERVE FUNCTIONALITY:
   - Manual play should still work (user can still press ENTER/click to start)
   - Auto-start should only be a fallback for automated testing
   - All gameplay mechanics should remain intact

8. VALIDATION:
   - After changes, the game should:
     * Expose gameState/getGameState on window
     * Auto-start after ~1 second if no user input
     * Update score during gameplay
     * Be detectable by the recorder script

Apply these changes to ensure scores are properly recorded by the recorder script.

IMPORTANT: After making changes, verify that:
- window.gameState or window.getGameState() is accessible
- gameState.score (or equivalent) exists and updates during gameplay
- The game auto-starts if it requires user input
- The recorder script can detect and record scores throughout the session"""


def fix_game(game_name: str, feedback: str, games_dir: Path, model: str = "google:gemini-2.5-flash") -> bool:
    """Run fix_game.py for a single game using the feedback system."""
    game_path = games_dir / game_name
    
    if not game_path.exists():
        print(f"⚠ {game_name}: Directory not found")
        return False
    
    try:
        print(f"\n{'='*80}")
        print(f"Fixing: {game_name}")
        print(f"Path: {game_path}")
        print(f"{'='*80}\n")
        
        # Get the path to fix_game.py relative to project root
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent
        fix_game_path = project_root / "scripts" / "utils" / "fix_game.py"
        
        if not fix_game_path.exists():
                print(f"❌ Error: Could not find fix_game.py")
            print(f"   Expected at: {fix_game_path}")
                return False
        
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
        print(f"❌ Error fixing {game_name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch fix games to expose gameState/getGameState on window"
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
        "--games",
        nargs="+",
        help="Specific games to fix (default: all problematic games)"
    )
    parser.add_argument(
        "--type",
        choices=["invalid", "all-zeros", "all"],
        default="all",
        help="Type of games to fix: 'invalid' (invalid structure), 'all-zeros' (score stays 0), or 'all' (both)"
    )
    parser.add_argument(
        "--directory",
        type=str,
        help=f"Directory containing games to fix (default: {DEFAULT_GAMES_DIR})"
    )
    
    args = parser.parse_args()
    
    # Determine games directory
    if args.directory:
        games_dir = Path(args.directory).resolve()
        if not games_dir.exists():
            print(f"❌ Error: Directory not found: {games_dir}")
            return
        print(f"Using games directory: {games_dir}")
    else:
        games_dir = DEFAULT_GAMES_DIR.resolve()
        print(f"Using default games directory: {games_dir}")
    
    # Normalize model name
    model = args.model
    if model.startswith("gemini") and ":" not in model:
        model = f"google:{model}"
        print(f"Note: Normalized model name to: {model}")
    
    # Determine which games to fix and their types
    if args.games:
        games_to_fix = args.games
        # Determine type for each game
        game_types = {}
        for game in games_to_fix:
            if game in INVALID_STRUCTURE_GAMES:
                game_types[game] = "invalid"
            elif game in ALL_ZEROS_GAMES:
                game_types[game] = "all-zeros"
            else:
                game_types[game] = "unknown"  # Will use all-zeros feedback as default
    else:
        if args.type == "invalid":
            games_to_fix = INVALID_STRUCTURE_GAMES
            game_types = {g: "invalid" for g in INVALID_STRUCTURE_GAMES}
        elif args.type == "all-zeros":
            games_to_fix = ALL_ZEROS_GAMES
            game_types = {g: "all-zeros" for g in ALL_ZEROS_GAMES}
        else:  # all
            games_to_fix = ALL_PROBLEMATIC_GAMES
            game_types = {g: "invalid" for g in INVALID_STRUCTURE_GAMES}
            game_types.update({g: "all-zeros" for g in ALL_ZEROS_GAMES})
    
    # Filter to only games that exist
    existing_games = []
    for game_name in games_to_fix:
        game_path = games_dir / game_name
        if game_path.exists():
            existing_games.append(game_name)
        else:
            print(f"⚠ Skipping {game_name}: Directory not found at {game_path}")
    
    if not existing_games:
        print(f"\nNo valid games found to fix")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        existing_games = existing_games[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        existing_games = existing_games[:args.max_games]
    
    total = len(existing_games)
    print(f"\nFound {total} games to fix")
    
    # Show games list with types
    print(f"\nGames to process:")
    for i, game_name in enumerate(existing_games, 1):
        game_type = game_types.get(game_name, "unknown")
        type_label = "INVALID STRUCTURE" if game_type == "invalid" else "ALL ZEROS" if game_type == "all-zeros" else "UNKNOWN"
        print(f"  {i}. {game_name} [{type_label}]")
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        return
    
    # Show the feedback that will be applied
    print(f"\n{'='*80}")
    print("FEEDBACK TO BE APPLIED:")
    print(f"{'='*80}")
    print("  GameState exposure fix for all games:")
    print("  - Expose gameState/getGameState to window")
    print("  - Ensure score property exists and is accessible")
    print("  - Verify compatibility with recorder script")
    print("  (Note: Auto-start functionality is NOT included)")
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
    
    for i, game_name in enumerate(existing_games, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_name}")
        game_type = game_types.get(game_name, "unknown")
        type_label = "INVALID STRUCTURE" if game_type == "invalid" else "ALL ZEROS" if game_type == "all-zeros" else "UNKNOWN"
        print(f"# Type: {type_label}")
        print(f"{'#'*80}")
        
        # Use the gameState exposure feedback for all games (no auto-start)
        feedback = get_game_state_exposure_feedback()
        
        # Apply the fix
        success = fix_game(game_name, feedback, games_dir, model)
        
        if success:
            successful += 1
            print(f"✅ Successfully fixed {game_name}")
        else:
            failed += 1
            failed_games.append(game_name)
            print(f"❌ Failed to fix {game_name}")
    
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

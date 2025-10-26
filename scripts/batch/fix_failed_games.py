#!/usr/bin/env python3
"""
Batch fix games that failed testing using test results JSON.

Usage:
    python batch_fix_failed_games.py --results public/test_results.json --failure-type start
    python batch_fix_failed_games.py --results public/test_results.json --failure-type all
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any


def load_test_results(results_path: str) -> Dict[str, Any]:
    """Load test results from JSON file."""
    with open(results_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_feedback(game: Dict[str, Any], failure_type: str) -> str:
    """Generate appropriate feedback based on the failure type."""
    failure_info = game.get('failure_info', {})
    reasons = failure_info.get('reasons', [])
    details = failure_info.get('details', {})
    
    feedback_parts = []
    
    if 'Start on Enter failed' in reasons or failure_type == 'start':
        start_info = details.get('start_on_enter', {})
        phase_before = start_info.get('phase_before')
        phase_after = start_info.get('phase_after')
        visual_changed = start_info.get('visual_changed')
        
        if phase_before is None and phase_after is None:
            feedback_parts.append(
                "The game does not properly expose its state. Please ensure:\n"
                "1. Add window.getGameState() function that returns an object with a 'gamePhase' or 'phase' field\n"
                "2. The phase should be 'START' initially and change to 'PLAYING' when Enter is pressed\n"
                "3. Make sure the state is updated before the game starts responding to gameplay inputs"
            )
        elif phase_before == phase_after:
            feedback_parts.append(
                f"The game phase does not change when Enter is pressed. Currently stuck at '{phase_before}'.\n"
                "Please fix the Enter key handler to transition from 'START' to 'PLAYING' phase.\n"
                "Ensure the gamePhase field in window.getGameState() updates correctly."
            )
        elif not visual_changed:
            feedback_parts.append(
                "The game phase changes correctly, but there are no visual changes on the canvas.\n"
                "Ensure the canvas is being redrawn after pressing Enter to start the game."
            )
    
    if 'Interaction failed' in reasons:
        interaction_info = details.get('interaction', {})
        state_changed = interaction_info.get('state_changed')
        visual_changed = interaction_info.get('visual_changed')
        
        if not state_changed and not visual_changed:
            feedback_parts.append(
                "The game does not respond to player inputs (arrow keys, space, etc.).\n"
                "Ensure input handlers are active during PLAYING phase and update both game state and visuals."
            )
        elif not state_changed:
            feedback_parts.append(
                "Visuals update but game state doesn't change during gameplay.\n"
                "Make sure window.getGameState() returns updated values as the game progresses."
            )
        elif not visual_changed:
            feedback_parts.append(
                "Game state updates but canvas doesn't redraw.\n"
                "Ensure the render/draw function is called each frame during gameplay."
            )
    
    if 'Page errors' in ' '.join(reasons):
        page_errors = details.get('page_errors', [])
        if page_errors:
            unique_errors = list(set(page_errors[:5]))  # Get unique errors
            feedback_parts.append(
                f"JavaScript errors detected:\n" + 
                "\n".join(f"- {error}" for error in unique_errors) +
                "\n\nPlease fix these errors to ensure the game runs correctly."
            )
    
    if not feedback_parts:
        feedback_parts.append("The game has testing failures. Please review and fix any issues.")
    
    return "\n\n".join(feedback_parts)


def fix_game(game_path: str, feedback: str, model: str = "anthropic:claude-4.5-sonnet") -> bool:
    """Run fix_game.py for a single game."""
    try:
        print(f"\n{'='*80}")
        print(f"Fixing: {game_path}")
        print(f"{'='*80}")
        print(f"\nFeedback being sent:")
        print(f"{'-'*80}")
        for line in feedback.split('\n'):
            print(f"  {line}")
        print(f"{'-'*80}\n")
        
        result = subprocess.run(
            [
                "uv", "run", "python", "fix_game.py",
                game_path,
                feedback,
                "--model", model,
            ],
            capture_output=False,
            text=True,
            check=False
        )
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error fixing {game_path}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch fix games that failed testing"
    )
    parser.add_argument(
        "--results",
        required=True,
        help="Path to test_results.json file"
    )
    parser.add_argument(
        "--failure-type",
        choices=["start", "interaction", "errors", "all"],
        default="start",
        help="Type of failures to fix (default: start)"
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
    
    args = parser.parse_args()
    
    # Load test results
    print(f"Loading test results from: {args.results}")
    results = load_test_results(args.results)
    
    # Filter games based on failure type
    games_to_fix: List[Dict[str, Any]] = []
    
    for game in results.get('games', []):
        if game['status'] == 'PASS':
            continue
        
        reasons = game['failure_info'].get('reasons', [])
        
        if args.failure_type == 'all':
            games_to_fix.append(game)
        elif args.failure_type == 'start' and 'Start on Enter failed' in reasons:
            games_to_fix.append(game)
        elif args.failure_type == 'interaction' and 'Interaction failed' in reasons:
            games_to_fix.append(game)
        elif args.failure_type == 'errors' and any('Page errors' in r for r in reasons):
            games_to_fix.append(game)
    
    # Apply max_games limit
    if args.max_games:
        games_to_fix = games_to_fix[:args.max_games]
    
    # Apply skip_to
    if args.skip_to > 0:
        games_to_fix = games_to_fix[args.skip_to:]
    
    total = len(games_to_fix)
    print(f"\nFound {total} games to fix (failure type: {args.failure_type})")
    
    if total == 0:
        print("No games to fix!")
        return
    
    # Confirm before proceeding
    print(f"\nGames to fix:")
    for i, game in enumerate(games_to_fix, 1):
        display_name = game.get('title') or game['name']
        print(f"  {i}. {display_name}")
    
    response = input(f"\nProceed with fixing {total} games? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Fix each game
    successful = 0
    failed = 0
    
    for i, game in enumerate(games_to_fix, 1):
        game_path = game['path']
        display_name = game.get('title') or game['name']
        
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {display_name}")
        print(f"{'#'*80}")
        
        # Generate feedback
        feedback = generate_feedback(game, args.failure_type)
        
        # Fix the game
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            print(f"✅ Successfully fixed {display_name}")
        else:
            failed += 1
            print(f"❌ Failed to fix {display_name}")
    
    # Summary
    print(f"\n{'='*80}")
    print(f"BATCH FIX SUMMARY")
    print(f"{'='*80}")
    print(f"Total games processed: {total}")
    print(f"Successfully fixed: {successful}")
    print(f"Failed: {failed}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()


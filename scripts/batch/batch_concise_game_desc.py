#!/usr/bin/env python3
"""
Batch make game descriptions concise across all games.

This script processes all games in a directory and uses an LLM to make their
descriptions short and concise. It works on descriptions in both index.html
and metadata.json.

Usage:
    python scripts/batch/batch_concise_game_desc.py --directory games/games_final_true
    python scripts/batch/batch_concise_game_desc.py --directory games/games_final_true --dry-run
    python scripts/batch/batch_concise_game_desc.py --directory games/games_final_true --max-games 5
    python scripts/batch/batch_concise_game_desc.py --directory games/games_final_true --model google:gemini-2.5-flash
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple
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


def get_description_from_metadata(metadata_path: Path) -> Optional[str]:
    """Extract description text from metadata.json."""
    if not metadata_path.exists():
        return None
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        description = metadata.get('game_info', {}).get('description', '')
        return description if description else None
    except Exception as e:
        print(f"  Error reading metadata.json: {e}")
        return None


def get_concise_description_feedback(description_text: str) -> str:
    """Generate the feedback for making description concise."""
    return f"""Make the game description short and concise.

REQUIRED CHANGES:

1. UPDATE DESCRIPTION IN index.html:
   - If a <p id="gameDescription"> element exists, make its text shorter and more concise
   - Keep only the essential information about gameplay and objectives
   - Remove verbose explanations, redundant phrases, and unnecessary details
   - Aim for 1-3 sentences maximum
   - Keep the same styling and placement

2. UPDATE DESCRIPTION IN metadata.json:
   - Update the "description" field in game_info to match the concise version
   - Ensure it's the same text as in the HTML

CURRENT DESCRIPTION (make this concise):
{description_text}

GUIDELINES FOR CONCISENESS:
- Focus on core gameplay mechanics and main objective
- Remove filler words and phrases
- Combine related ideas into single sentences
- Remove examples and detailed explanations
- Keep it under 150 characters if possible, maximum 200 characters
- Maintain clarity and essential information

VALIDATION:
- The description in index.html should be concise (1-3 sentences, under 200 chars)
- The description in metadata.json should match the HTML version
- Both should be shorter than the original
- Essential gameplay information should be preserved

Apply these changes to make the description concise while preserving essential information."""


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
        description="Batch make game descriptions concise"
    )
    parser.add_argument(
        "--directory",
        default="games/games_final_true",
        help="Directory containing games to fix (default: games/games_final_true)"
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
    print(f"\nFound {total} games to process")
    
    # Show games list
    print(f"\nGames to process:")
    for i, game in enumerate(games, 1):
        print(f"  {i}. {game.name}")
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        return
    
    # Show the feedback that will be applied (sample)
    print(f"\n{'='*80}")
    print("FEEDBACK TO BE APPLIED:")
    print(f"{'='*80}")
    sample_feedback = get_concise_description_feedback("Sample game description that needs to be made concise...")
    for line in sample_feedback.split('\n')[:15]:  # Show first 15 lines
        print(f"  {line}")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    if not args.yes:
        response = input(f"Proceed with making descriptions concise for {total} games? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    # Fix each game
    successful = 0
    failed = 0
    skipped = 0
    failed_games = []
    
    for i, game_path in enumerate(games, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_path.name}")
        print(f"{'#'*80}")
        
        # Get description from metadata
        metadata_path = game_path / 'metadata.json'
        description_text = get_description_from_metadata(metadata_path)
        
        if not description_text:
            print(f"⚠️  Warning: No description found in metadata.json for {game_path.name}, skipping...")
            skipped += 1
            continue
        
        # Check if description is already short (under 200 chars)
        if len(description_text) <= 200:
            print(f"ℹ️  Description is already concise ({len(description_text)} chars), skipping...")
            skipped += 1
            continue
        
        # Generate feedback with actual description
        feedback = get_concise_description_feedback(description_text)
        
        # Apply the fix
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            print(f"✅ Successfully made description concise for {game_path.name}")
        else:
            failed += 1
            failed_games.append(game_path.name)
            print(f"❌ Failed to make description concise for {game_path.name}")
    
    # Summary
    print(f"\n{'='*80}")
    print(f"BATCH FIX SUMMARY")
    print(f"{'='*80}")
    print(f"Total games processed: {total}")
    print(f"Successfully fixed: {successful}")
    print(f"Skipped (no description or already concise): {skipped}")
    print(f"Failed: {failed}")
    
    if failed_games:
        print(f"\nFailed games:")
        for game_name in failed_games:
            print(f"  - {game_name}")
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()


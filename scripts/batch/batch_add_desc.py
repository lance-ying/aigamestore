#!/usr/bin/env python3
"""
Batch add descriptions to games that are missing them in their index.html files.

This script reads the games_with_html_controls.csv file to identify games without descriptions,
then uses an LLM to add description text from metadata.json to their index.html files.

Usage:
    python scripts/batch/batch_add_desc.py
    python scripts/batch/batch_add_desc.py --dry-run
    python scripts/batch/batch_add_desc.py --max-games 5
    python scripts/batch/batch_add_desc.py --model google:gemini-2.5-flash
    python scripts/batch/batch_add_desc.py --directory games/games_final_true
"""

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple


def load_games_without_descriptions(csv_path: Path, directory: str = None) -> List[Tuple[str, Path]]:
    """
    Load games that don't have descriptions from the CSV file.
    Returns list of (game_name, game_path) tuples.
    """
    games_to_fix = []
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}")
        return games_to_fix
    
    # Determine base path
    if directory:
        base_path = csv_path.parent / directory
        if not base_path.exists():
            print(f"Error: Directory not found: {base_path}")
            return games_to_fix
        # Single directory - search directly
        search_dirs = [base_path]
    else:
        # Default: search in games_final subdirectories
        base_path = csv_path.parent / 'games' / 'games_final'
        search_dirs = [
            base_path / 'blue_purple_games_flattened_modded',
            base_path / 'games_pilot',
            base_path / 'purple_yellow_games_flattened',
            base_path / 'red_green_games_flattened',
        ]
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['has_description'].lower() == 'false':
                game_name = row['game_name']
                # Find the game directory
                for dir_path in search_dirs:
                    if not dir_path.exists():
                        continue
                    game_path = dir_path / game_name
                    if game_path.exists() and (game_path / 'index.html').exists():
                        games_to_fix.append((game_name, game_path))
                        break
    
    return games_to_fix


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


def get_add_description_feedback(description_text: str) -> str:
    """Generate the feedback for adding description to index.html."""
    return f"""Add game description to the index.html file for this game.

REQUIRED CHANGES:

1. ADD DESCRIPTION ELEMENT:
   - Add a <p> element with id="gameDescription" containing the game's description
   - The element should be styled consistently with other games:
     * Use style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;"
     * Keep the description text readable and well-formatted
   
2. PLACEMENT:
   - If a <div class="control-buttons"> exists, place the gameDescription element after it
   - If a <h1 id="gameTitle"> exists, place it after the title
   - Otherwise, place it before the game container/canvas or before the gameControls element
   - Ensure proper spacing and indentation

3. FORMAT DESCRIPTION TEXT:
   - Use the exact description text from metadata.json
   - Keep paragraphs readable (you may need to add line breaks for long descriptions)
   - Preserve the original meaning and formatting

DESCRIPTION TO ADD:
{description_text}

VALIDATION:
- The <p id="gameDescription"> element must exist in the HTML
- The description text should match the metadata.json description
- The element should be placed in an appropriate location (after title/buttons, before game container)
- The styling should match other games' description elements
- No existing gameDescription element should be duplicated

Apply these changes to add the game description to the index.html file."""


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
        description="Batch add descriptions to games missing them in index.html"
    )
    parser.add_argument(
        "--csv",
        default="games_with_html_controls.csv",
        help="Path to CSV file (default: games_with_html_controls.csv)"
    )
    parser.add_argument(
        "--directory",
        default=None,
        help="Directory containing games (default: searches games_final subdirectories, or specify like 'games/games_final_true')"
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
    parser.add_argument(
        "--model",
        default="google:gemini-2.5-flash",
        help="Model to use for fixes (default: google:gemini-2.5-flash)"
    )
    
    args = parser.parse_args()
    
    # Normalize model name - add google: prefix if it's a gemini model without it
    model = args.model
    if model.startswith("gemini") and ":" not in model:
        model = f"google:{model}"
        print(f"Note: Normalized model name to: {model}")
    
    args.model = model
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    csv_path = project_root / args.csv
    
    # Load games without descriptions
    print(f"Loading games from: {csv_path}")
    if args.directory:
        print(f"Searching in directory: {args.directory}")
    games_to_fix = load_games_without_descriptions(csv_path, args.directory)
    
    if not games_to_fix:
        print("No games found that need descriptions added.")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        games_to_fix = games_to_fix[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        games_to_fix = games_to_fix[:args.max_games]
    
    total = len(games_to_fix)
    print(f"\nFound {total} games without descriptions")
    
    # Show games list
    print(f"\nGames to process:")
    for i, (game_name, game_path) in enumerate(games_to_fix, 1):
        print(f"  {i}. {game_name}")
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        return
    
    # Show the feedback that will be applied (sample)
    print(f"\n{'='*80}")
    print("FEEDBACK TO BE APPLIED:")
    print(f"{'='*80}")
    sample_feedback = get_add_description_feedback("Sample description text from metadata.json")
    for line in sample_feedback.split('\n')[:15]:  # Show first 15 lines
        print(f"  {line}")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    if not args.yes:
        response = input(f"Proceed with adding descriptions to {total} games? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    # Fix each game
    successful = 0
    failed = 0
    failed_games = []
    
    for i, (game_name, game_path) in enumerate(games_to_fix, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_name}")
        print(f"{'#'*80}")
        
        # Get description from metadata
        metadata_path = game_path / 'metadata.json'
        description_text = get_description_from_metadata(metadata_path)
        
        if not description_text:
            print(f"⚠️  Warning: No description found in metadata.json for {game_name}, skipping...")
            failed += 1
            failed_games.append(game_name)
            continue
        
        # Generate feedback with actual description
        feedback = get_add_description_feedback(description_text)
        
        # Apply the fix
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            print(f"✅ Successfully added description to {game_name}")
        else:
            failed += 1
            failed_games.append(game_name)
            print(f"❌ Failed to add description to {game_name}")
    
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


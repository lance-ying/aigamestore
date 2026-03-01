#!/usr/bin/env python3
"""
Batch add controls to games that are missing them in their index.html files.

This script reads the games_with_html_controls.csv file to identify games without controls,
then uses an LLM to add control instructions from metadata.json to their index.html files.

Usage:
    python scripts/batch/batch_add_controls.py
    python scripts/batch/batch_add_controls.py --dry-run
    python scripts/batch/batch_add_controls.py --max-games 5
    python scripts/batch/batch_add_controls.py --model google:gemini-2.5-flash
"""

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple


def load_games_without_controls(csv_path: Path, games_directory: Path = None) -> List[Tuple[str, Path]]:
    """
    Load games that don't have controls from the CSV file.
    Returns list of (game_name, game_path) tuples.
    
    Args:
        csv_path: Path to the CSV file
        games_directory: Optional directory containing games (flat structure).
                        If None, uses nested structure in games/games_final
    """
    games_to_fix = []
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}")
        return games_to_fix
    
    # Determine game directory structure
    if games_directory:
        # Flat structure: games are directly in games_directory
        base_path = games_directory
        flat_structure = True
    else:
        # Nested structure: games are in subdirectories
        base_path = csv_path.parent / 'games' / 'games_final'
        flat_structure = False
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['has_controls'].lower() == 'false':
                game_name = row['game_name']
                
                if flat_structure:
                    # Flat structure: game is directly in base_path
                    game_path = base_path / game_name
                    if game_path.exists() and (game_path / 'index.html').exists():
                        games_to_fix.append((game_name, game_path))
                else:
                    # Nested structure: search in subdirectories
                    directories = [
                        base_path / 'blue_purple_games_flattened_modded',
                        base_path / 'games_pilot',
                        base_path / 'purple_yellow_games_flattened',
                        base_path / 'red_green_games_flattened',
                    ]
                    for dir_path in directories:
                        game_path = dir_path / game_name
                        if game_path.exists() and (game_path / 'index.html').exists():
                            games_to_fix.append((game_name, game_path))
                            break
    
    return games_to_fix


def get_controls_from_metadata(metadata_path: Path) -> Optional[str]:
    """Extract controls text from metadata.json."""
    if not metadata_path.exists():
        return None
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        controls = metadata.get('game_info', {}).get('controls', '')
        return controls if controls else None
    except Exception as e:
        print(f"  Error reading metadata.json: {e}")
        return None


def get_add_controls_feedback(controls_text: str) -> str:
    """Generate the feedback for adding controls to index.html."""
    return f"""Add control instructions to the index.html file for this game.

REQUIRED CHANGES:

1. ADD CONTROLS ELEMENT:
   - Add a <p> element with id="gameControls" containing the game's control instructions
   - The element should be styled consistently with other games:
     * Use style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;"
     * Format the controls text in a readable way (use " | " separators between control items)
   
2. PLACEMENT:
   - If a <p id="gameDescription"> element exists, place the gameControls element after it
   - Otherwise, if a <div class="control-buttons"> exists, place it after that div
   - If neither exists, place it before the closing </body> tag
   - Ensure proper spacing and indentation

3. FORMAT CONTROLS TEXT:
   - Convert the controls from metadata.json format to HTML-friendly format
   - Remove leading dashes ("- ") from each line
   - Join multiple control items with " | " separator
   - Keep the text clear and readable

CONTROLS TO ADD:
{controls_text}

VALIDATION:
- The <p id="gameControls"> element must exist in the HTML
- The controls text should be properly formatted and readable
- The element should be placed in an appropriate location (after gameDescription, after control-buttons, or before </body>)
- The styling should match other games' control elements
- No existing gameControls element should be duplicated

Apply these changes to add the control instructions to the index.html file."""


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
        description="Batch add controls to games missing them in index.html"
    )
    parser.add_argument(
        "--csv",
        default="games_with_html_controls.csv",
        help="Path to CSV file (default: games_with_html_controls.csv)"
    )
    parser.add_argument(
        "--directory",
        default=None,
        help="Directory containing games (default: uses nested structure in games/games_final)"
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
    
    # Determine games directory
    games_directory = None
    if args.directory:
        games_directory = Path(args.directory)
        if not games_directory.is_absolute():
            games_directory = project_root / args.directory
    
    # Load games without controls
    print(f"Loading games from: {csv_path}")
    if games_directory:
        print(f"Using games directory: {games_directory}")
    games_to_fix = load_games_without_controls(csv_path, games_directory)
    
    if not games_to_fix:
        print("No games found that need controls added.")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        games_to_fix = games_to_fix[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        games_to_fix = games_to_fix[:args.max_games]
    
    total = len(games_to_fix)
    print(f"\nFound {total} games without controls")
    
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
    sample_feedback = get_add_controls_feedback("Sample controls text from metadata.json")
    for line in sample_feedback.split('\n')[:15]:  # Show first 15 lines
        print(f"  {line}")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    if not args.yes:
        response = input(f"Proceed with adding controls to {total} games? (y/n): ")
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
        
        # Get controls from metadata
        metadata_path = game_path / 'metadata.json'
        controls_text = get_controls_from_metadata(metadata_path)
        
        if not controls_text:
            print(f"⚠️  Warning: No controls found in metadata.json for {game_name}, skipping...")
            failed += 1
            failed_games.append(game_name)
            continue
        
        # Generate feedback with actual controls
        feedback = get_add_controls_feedback(controls_text)
        
        # Apply the fix
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            print(f"✅ Successfully added controls to {game_name}")
        else:
            failed += 1
            failed_games.append(game_name)
            print(f"❌ Failed to add controls to {game_name}")
    
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


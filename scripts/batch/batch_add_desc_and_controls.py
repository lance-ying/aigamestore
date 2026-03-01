#!/usr/bin/env python3
"""
Batch add descriptions and/or controls to games that are missing them in their index.html files.

This script reads the games_with_html_controls.csv file to identify games without descriptions
and/or controls, then uses an LLM to add them from metadata.json to their index.html files.

Usage:
    python scripts/batch/batch_add_desc_and_controls.py                    # Add both descriptions and controls
    python scripts/batch/batch_add_desc_and_controls.py --only desc        # Add only descriptions
    python scripts/batch/batch_add_desc_and_controls.py --only controls    # Add only controls
    python scripts/batch/batch_add_desc_and_controls.py --directory games/games_final_true
    python scripts/batch/batch_add_desc_and_controls.py --dry-run
    python scripts/batch/batch_add_desc_and_controls.py --max-games 5
    python scripts/batch/batch_add_desc_and_controls.py --model google:gemini-2.5-flash
"""

import argparse
import csv
import json
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional, Tuple, Set


def get_all_games_from_directory(games_directory: Path, need_description: bool = True, need_controls: bool = True) -> List[Tuple[str, Path, Set[str]]]:
    """
    Get all games from directory without scanning - just process all games.
    Returns list of (game_name, game_path, needs) tuples where needs is a set of what's needed.
    
    Args:
        games_directory: Directory containing games (flat structure)
        need_description: If True, add description to needs
        need_controls: If True, add controls to needs
    """
    games_to_fix = []
    
    if not games_directory.exists():
        print(f"Error: Directory not found: {games_directory}")
        return games_to_fix
    
    # Get all game directories
    for game_dir in games_directory.iterdir():
        if not game_dir.is_dir() or game_dir.name.startswith('.') or '_backup_' in game_dir.name:
            continue
        
        html_path = game_dir / 'index.html'
        if not html_path.exists():
            continue
        
        needs = set()
        if need_description:
            needs.add('description')
        if need_controls:
            needs.add('controls')
        
        if needs:
            games_to_fix.append((game_dir.name, game_dir, needs))
    
    return games_to_fix


def scan_directory_for_games(games_directory: Path, need_description: bool = True, need_controls: bool = True) -> List[Tuple[str, Path, Set[str]]]:
    """
    Scan directory directly to find games that need descriptions and/or controls.
    Returns list of (game_name, game_path, needs) tuples where needs is a set of what's needed.
    
    Args:
        games_directory: Directory containing games (flat structure)
        need_description: If True, check for missing descriptions
        need_controls: If True, check for missing controls
    """
    games_to_fix = []
    
    if not games_directory.exists():
        print(f"Error: Directory not found: {games_directory}")
        return games_to_fix
    
    class QuickParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.has_description = False
            self.has_controls = False
            self.in_game_description = False
            self.in_game_controls = False
        
        def handle_starttag(self, tag, attrs):
            attrs_dict = dict(attrs)
            if tag in ('p', 'div'):
                if attrs_dict.get('id') == 'gameDescription':
                    self.in_game_description = True
                    self.has_description = True
                elif attrs_dict.get('id') == 'gameControls':
                    self.in_game_controls = True
                    self.has_controls = True
        
        def handle_endtag(self, tag):
            if tag in ('p', 'div'):
                self.in_game_description = False
                self.in_game_controls = False
    
    # Scan all game directories
    for game_dir in games_directory.iterdir():
        if not game_dir.is_dir() or game_dir.name.startswith('.') or '_backup_' in game_dir.name:
            continue
        
        html_path = game_dir / 'index.html'
        if not html_path.exists():
            continue
        
        needs = set()
        
        # Check HTML for existing elements
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            parser = QuickParser()
            parser.feed(html_content)
            
            if need_description and not parser.has_description:
                needs.add('description')
            if need_controls and not parser.has_controls:
                needs.add('controls')
        except Exception as e:
            print(f"  Warning: Error checking {game_dir.name}: {e}")
            # If we can't check, assume both are needed if requested
            if need_description:
                needs.add('description')
            if need_controls:
                needs.add('controls')
        
        if needs:
            games_to_fix.append((game_dir.name, game_dir, needs))
    
    return games_to_fix


def load_games_from_csv(csv_path: Path, games_directory: Path = None, 
                        need_description: bool = True, need_controls: bool = True) -> List[Tuple[str, Path, Set[str]]]:
    """
    Load games that need descriptions and/or controls from the CSV file.
    Returns list of (game_name, game_path, needs) tuples where needs is a set of what's needed.
    
    Args:
        csv_path: Path to the CSV file
        games_directory: Optional directory containing games (flat structure).
                        If None, uses nested structure in games/games_final
        need_description: If True, include games missing descriptions
        need_controls: If True, include games missing controls
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
            game_name = row['game_name']
            needs = set()
            
            # Check what's needed
            if need_description and row.get('has_description', '').lower() == 'false':
                needs.add('description')
            if need_controls and row.get('has_controls', '').lower() == 'false':
                needs.add('controls')
            
            # Skip if nothing is needed
            if not needs:
                continue
            
            # Find the game directory
            if flat_structure:
                # Flat structure: game is directly in base_path
                game_path = base_path / game_name
                if game_path.exists() and (game_path / 'index.html').exists():
                    games_to_fix.append((game_name, game_path, needs))
            else:
                # Nested structure: search in subdirectories
                directories = [
                    base_path / 'blue_purple_games_flattened_modded',
                    base_path / 'games_pilot',
                    base_path / 'purple_yellow_games_flattened',
                    base_path / 'red_green_games_flattened',
                ]
                for dir_path in directories:
                    if not dir_path.exists():
                        continue
                    game_path = dir_path / game_name
                    if game_path.exists() and (game_path / 'index.html').exists():
                        games_to_fix.append((game_name, game_path, needs))
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


def get_add_description_feedback(description_text: str) -> str:
    """Generate the feedback for adding concise description to index.html."""
    return f"""Add or update game description in the index.html file for this game. The description must be SHORT and CONCISE.

REQUIRED CHANGES:

1. ADD OR UPDATE DESCRIPTION ELEMENT:
   - If a <p id="gameDescription"> element exists, make its text concise (1-3 sentences, max 200 characters)
   - If it doesn't exist, add a <p> element with id="gameDescription" containing a concise description
   - The element should be styled consistently with other games:
     * Use style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;"
     * Keep the description text readable and well-formatted
   
2. PLACEMENT:
   - If a <div class="control-buttons"> exists, place the gameDescription element after it
   - If a <h1 id="gameTitle"> exists, place it after the title
   - Otherwise, place it before the game container/canvas or before the gameControls element
   - Ensure proper spacing and indentation

3. MAKE DESCRIPTION CONCISE:
   - The description MUST be 1-3 sentences maximum
   - Keep it under 200 characters
   - Focus on core gameplay mechanics and main objective
   - Remove filler words, verbose explanations, and unnecessary details
   - Use the description from metadata.json as a starting point, but make it shorter if needed
   - If the metadata description is too long, condense it to the essential information

ORIGINAL DESCRIPTION FROM METADATA:
{description_text}

GUIDELINES FOR CONCISENESS:
- Focus on core gameplay mechanics and main objective
- Remove filler words and phrases
- Combine related ideas into single sentences
- Remove examples and detailed explanations
- Keep it under 200 characters
- Maintain clarity and essential information

VALIDATION:
- The <p id="gameDescription"> element must exist in the HTML
- The description must be concise (1-3 sentences, under 200 characters)
- The element should be placed in an appropriate location (after title/buttons, before game container)
- The styling should match other games' description elements
- No existing gameDescription element should be duplicated

Apply these changes to add or update the game description to be concise in the index.html file."""


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


def get_combined_feedback(description_text: str, controls_text: str) -> str:
    """Generate combined feedback for adding both concise description and controls."""
    return f"""Add or update both game description and control instructions in the index.html file for this game. The description must be SHORT and CONCISE.

REQUIRED CHANGES:

1. ADD OR UPDATE DESCRIPTION ELEMENT:
   - If a <p id="gameDescription"> element exists, make its text concise (1-3 sentences, max 200 characters)
   - If it doesn't exist, add a <p> element with id="gameDescription" containing a concise description
   - The element should be styled consistently with other games:
     * Use style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;"
     * Keep the description text readable and well-formatted
   
2. ADD CONTROLS ELEMENT:
   - Add a <p> element with id="gameControls" containing the game's control instructions
   - The element should be styled consistently with other games:
     * Use style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;"
     * Format the controls text in a readable way (use " | " separators between control items)

3. PLACEMENT ORDER:
   - Place the gameDescription element first
   - Place the gameControls element immediately after gameDescription
   - If a <div class="control-buttons"> exists, place both elements after it
   - If a <h1 id="gameTitle"> exists, place gameDescription after the title
   - Ensure proper spacing and indentation between elements

4. MAKE DESCRIPTION CONCISE:
   - The description MUST be 1-3 sentences maximum
   - Keep it under 200 characters
   - Focus on core gameplay mechanics and main objective
   - Remove filler words, verbose explanations, and unnecessary details
   - Use the description from metadata.json as a starting point, but make it shorter if needed
   - If the metadata description is too long, condense it to the essential information

5. FORMAT CONTROLS TEXT:
   - Convert the controls from metadata.json format to HTML-friendly format
   - Remove leading dashes ("- ") from each line
   - Join multiple control items with " | " separator
   - Keep the text clear and readable

ORIGINAL DESCRIPTION FROM METADATA:
{description_text}

GUIDELINES FOR CONCISENESS:
- Focus on core gameplay mechanics and main objective
- Remove filler words and phrases
- Combine related ideas into single sentences
- Remove examples and detailed explanations
- Keep it under 200 characters
- Maintain clarity and essential information

CONTROLS TO ADD:
{controls_text}

VALIDATION:
- Both <p id="gameDescription"> and <p id="gameControls"> elements must exist in the HTML
- The description must be concise (1-3 sentences, under 200 characters)
- The controls text should be properly formatted and readable
- gameDescription should come before gameControls
- Both elements should be placed in appropriate locations
- The styling should match other games' description and control elements
- No existing gameDescription or gameControls elements should be duplicated

Apply these changes to add or update both the concise game description and control instructions to the index.html file."""


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
        description="Batch add descriptions and/or controls to games missing them in index.html"
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
        "--no-csv",
        action="store_true",
        help="Scan directory directly without using CSV file (requires --directory)"
    )
    parser.add_argument(
        "--all-games",
        action="store_true",
        help="Process all games in directory without scanning (requires --no-csv)"
    )
    parser.add_argument(
        "--only",
        choices=["desc", "controls", "both"],
        default="both",
        help="What to add: 'desc' (only descriptions), 'controls' (only controls), or 'both' (default: both)"
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
    
    # Determine what to add
    need_description = args.only in ["desc", "both"]
    need_controls = args.only in ["controls", "both"]
    
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
    
    # Load games that need fixes
    if args.no_csv:
        if not games_directory:
            print("❌ Error: --no-csv requires --directory to be specified")
            return
        if args.all_games:
            print(f"Processing all games in directory: {games_directory}")
            print(f"Mode: {args.only}")
            games_to_fix = get_all_games_from_directory(games_directory, need_description, need_controls)
        else:
            print(f"Scanning directory directly: {games_directory}")
            print(f"Mode: {args.only}")
            games_to_fix = scan_directory_for_games(games_directory, need_description, need_controls)
    else:
        print(f"Loading games from: {csv_path}")
        if games_directory:
            print(f"Using games directory: {games_directory}")
        print(f"Mode: {args.only}")
        games_to_fix = load_games_from_csv(csv_path, games_directory, need_description, need_controls)
    
    if not games_to_fix:
        print("No games found that need fixes.")
        return
    
    # Apply skip_to
    if args.skip_to > 0:
        print(f"Skipping first {args.skip_to} games...")
        games_to_fix = games_to_fix[args.skip_to:]
    
    # Apply max_games limit
    if args.max_games:
        games_to_fix = games_to_fix[:args.max_games]
    
    total = len(games_to_fix)
    
    # Show games list with what they need
    print(f"\nFound {total} games that need fixes")
    print(f"\nGames to process:")
    for i, (game_name, game_path, needs) in enumerate(games_to_fix, 1):
        needs_str = ", ".join(sorted(needs))
        print(f"  {i}. {game_name} (needs: {needs_str})")
    
    if args.dry_run:
        print("\n[DRY RUN] No games will be modified.")
        return
    
    # Show the feedback that will be applied (sample)
    print(f"\n{'='*80}")
    print("FEEDBACK TO BE APPLIED:")
    print(f"{'='*80}")
    if args.only == "both":
        print("  Adding both descriptions and controls")
    elif args.only == "desc":
        print("  Adding descriptions only")
    else:
        print("  Adding controls only")
    print("  ... (see full feedback in first fix)")
    print(f"{'='*80}\n")
    
    # Confirm before proceeding
    if not args.yes:
        response = input(f"Proceed with fixing {total} games? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    # Fix each game
    successful = 0
    failed = 0
    failed_games = []
    
    for i, (game_name, game_path, needs) in enumerate(games_to_fix, 1):
        print(f"\n{'#'*80}")
        print(f"# Game {i}/{total}: {game_name}")
        print(f"# Needs: {', '.join(sorted(needs))}")
        print(f"{'#'*80}")
        
        # Get metadata
        metadata_path = game_path / 'metadata.json'
        description_text = get_description_from_metadata(metadata_path) if 'description' in needs else None
        controls_text = get_controls_from_metadata(metadata_path) if 'controls' in needs else None
        
        # Check if we have what we need
        missing = []
        if 'description' in needs and not description_text:
            missing.append('description')
        if 'controls' in needs and not controls_text:
            missing.append('controls')
        
        if missing:
            print(f"⚠️  Warning: Missing data in metadata.json for {game_name} ({', '.join(missing)}), skipping...")
            failed += 1
            failed_games.append(game_name)
            continue
        
        # Generate feedback based on what's needed
        if 'description' in needs and 'controls' in needs:
            feedback = get_combined_feedback(description_text, controls_text)
        elif 'description' in needs:
            feedback = get_add_description_feedback(description_text)
        else:  # controls only
            feedback = get_add_controls_feedback(controls_text)
        
        # Apply the fix
        success = fix_game(game_path, feedback, args.model)
        
        if success:
            successful += 1
            added = ', '.join(sorted(needs))
            print(f"✅ Successfully added {added} to {game_name}")
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


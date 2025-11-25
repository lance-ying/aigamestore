#!/usr/bin/env python3
"""
Batch game generator that reads from CSV file and generates games using p5.js.

Reads from CSV file (indie_games_vlm_classification.csv) and:
- Combines 'description' and 'aboutme' fields as the game concept
- Generates games using p5.js only
- Creates a manifest linking generated games back to CSV rows
"""

import argparse
import csv
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, TYPE_CHECKING
import re
import os

# Add project root to Python path so we can import llm_interface
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent.parent  # Go up from scripts/batch/ to project root
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = project_root / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    # Remove surrounding quotes if present
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()

def slugify_game_name(name: str) -> str:
    """
    Convert game name to a slug format (kebab-case).
    
    Args:
        name: Original game name
        
    Returns:
        Slugified version (lowercase, special chars replaced with hyphens)
    """
    # Convert to lowercase
    slug = name.lower()
    
    # Replace common separators with hyphens
    slug = re.sub(r'[:\-_\s]+', '-', slug)
    
    # Remove special characters
    slug = re.sub(r'[^\w\-]', '', slug)
    
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug


def load_games_from_csv(csv_path: str, start_row: int = 0, limit: int = 100, reverse: bool = False) -> List[Dict[str, Any]]:
    """
    Load games from CSV file.
    
    Args:
        csv_path: Path to CSV file
        start_row: Row to start from (0-based, excluding header). If reverse=True, counts from the end
        limit: Maximum number of rows to load
        reverse: If True, process from bottom to top
        
    Returns:
        List of dicts with CSV row data + row index
    """
    games = []
    csv_file = Path(csv_path)
    
    if not csv_file.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    total_rows = len(rows)
    
    if reverse:
        # Process from bottom to top
        # start_row=0 means start from the very last row
        # start_row=10 means start 10 rows from the end
        end_index = total_rows - start_row
        start_index = max(0, end_index - limit)
        rows_to_process = rows[start_index:end_index]
        # Reverse the list so we process from bottom to top
        rows_to_process = list(reversed(rows_to_process))
    else:
        # Normal processing from top to bottom
        end_row = min(start_row + limit, total_rows)
        rows_to_process = rows[start_row:end_row]
    
    for i, row in enumerate(rows_to_process):
        if reverse:
            # Calculate actual row index from the end
            csv_row_index = end_index - 1 - i
        else:
            csv_row_index = start_row + i
        
        # Combine description and aboutme for concept
        description = row.get('description', '').strip()
        aboutme = row.get('aboutme', '').strip()
        
        # Format: description\n\naboutme (if both exist)
        if description and aboutme:
            concept = f"{description}\n\n{aboutme}"
        elif description:
            concept = description
        elif aboutme:
            concept = aboutme
        else:
            concept = ""
        
        game_data = {
            'csv_row_index': csv_row_index,
            'game_name': row.get('game_name', ''),
            'description': description,
            'aboutme': aboutme,
            'concept': concept,
            'game_url': row.get('game_url', ''),
            'genre': row.get('genre', ''),
            'classification': row.get('classification', ''),
            'vlm_suitability_score': row.get('vlm_suitability_score', ''),
            # Include all other CSV fields
            **{k: v for k, v in row.items() if k not in ['game_name', 'description', 'aboutme', 'game_url', 'genre', 'classification', 'vlm_suitability_score']}
        }
        
        games.append(game_data)
    
    return games


def generate_game(
    concept: str,
    game_index: int,
    name: str = None,
    dry_run: bool = False,
    output_folder: str = None,
    csv_row_index: int = None,
    use_new_p5_gen: bool = False
) -> Dict[str, Any]:
    """
    Generate a single game using p5.js.
    
    Args:
        concept: Game concept description
        game_index: Index for the game
        name: Game name (optional, for display)
        dry_run: If True, just print command without executing
        output_folder: Custom output folder name under games/
        csv_row_index: Original CSV row index (for manifest)
        use_new_p5_gen: If True, use the new expanded p5.js generator config
        
    Returns:
        Dict with generation result
    """
    if use_new_p5_gen:
        config_file = "configs/generators/p5_gen.yaml"  # New expanded version
        library = "p5.js (new expanded)"
    else:
        config_file = "configs/generators/p5_gen.yaml"  # Default (same file, but flag indicates new version)
        library = "p5.js"
    
    # Create a temporary concept file
    temp_concept_file = Path(f"temp_concept_{game_index}.txt")
    temp_concept_file.write_text(concept, encoding="utf-8")
    
    cmd = [
        "uv", "run", "python", "scripts/cli/generate_game.py",
        "--config", config_file,
        "--concept", str(temp_concept_file),
        "--game_index", str(game_index)
    ]
    
    # Add custom output folder if specified
    if output_folder:
        cmd.extend(["--output_folder", output_folder])
    
    print(f"\n{'='*80}")
    print(f"Game #{game_index}: {name or 'Unnamed'}")
    print(f"Library: {library}")
    print(f"Concept preview: {concept[:100]}...")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*80}\n")
    
    if dry_run:
        temp_concept_file.unlink()
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "dry_run",
        }
    
    try:
        # Run from project root directory with PYTHONPATH set
        env = os.environ.copy()
        env['PYTHONPATH'] = str(project_root)
        
        result = subprocess.run(
            cmd,
            cwd=project_root,
            env=env,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )
        
        # Clean up temp file
        temp_concept_file.unlink()
        
        if result.returncode == 0:
            output_dir = result.stdout.strip().split('\n')[-1]
            print(f"✓ Successfully generated: {output_dir}")
            return {
                "game_index": game_index,
                "name": name,
                "library": library,
                "status": "success",
                "output_dir": output_dir,
                "csv_row_index": csv_row_index,
            }
        else:
            print(f"✗ Failed to generate game #{game_index}")
            print(f"Error: {result.stderr}")
            return {
                "game_index": game_index,
                "name": name,
                "library": library,
                "status": "failed",
                "error": result.stderr,
            }
    except subprocess.TimeoutExpired:
        temp_concept_file.unlink()
        print(f"✗ Timeout generating game #{game_index}")
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "timeout",
        }
    except Exception as e:
        if temp_concept_file.exists():
            temp_concept_file.unlink()
        print(f"✗ Exception generating game #{game_index}: {e}")
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "exception",
            "error": str(e),
        }


def extract_game_metadata(game_dir: Path) -> Dict[str, str]:
    """
    Extract metadata from generated game directory.
    
    Args:
        game_dir: Path to generated game directory
        
    Returns:
        Dict with title, description, controls
    """
    metadata_path = game_dir / "metadata.json"
    
    result = {
        'title': game_dir.name,
        'description': '',
        'controls': '',
    }
    
    if not metadata_path.exists():
        return result
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        game_info = metadata.get('game_info', {})
        
        # Extract title
        if game_info.get('title'):
            result['title'] = game_info['title']
        
        # Extract description
        if game_info.get('description'):
            result['description'] = game_info['description']
        
        # Extract controls
        if game_info.get('controls'):
            result['controls'] = game_info['controls']
    
    except Exception as e:
        print(f"    Warning: Error reading metadata from {metadata_path}: {e}")
    
    return result


def create_manifest(generation_results: List[Dict[str, Any]], csv_games: List[Dict[str, Any]], output_path: Path, output_dir: str = None) -> None:
    """
    Create manifest JSON file linking generated games to CSV rows.
    
    Args:
        generation_results: List of generation result dicts
        csv_games: List of CSV game data dicts
        output_path: Path to save manifest JSON
        output_dir: Custom output directory name (for path construction)
    """
    manifest = []
    
    # Create mapping from csv_row_index to CSV game data
    csv_map = {game['csv_row_index']: game for game in csv_games}
    
    for result in generation_results:
        if result.get("status") != "success":
            continue
        
        csv_row_index = result.get("csv_row_index")
        if csv_row_index is None:
            continue
        
        csv_data = csv_map.get(csv_row_index, {})
        game_name = result.get("name") or csv_data.get("game_name", "Unknown")
        output_dir_path = result.get("output_dir", "")
        
        # Extract metadata from generated game
        if output_dir_path:
            game_dir = Path(output_dir_path)
            metadata = extract_game_metadata(game_dir)
        else:
            metadata = {'title': game_name, 'description': '', 'controls': ''}
        
        # Generate slug from game name
        slug = slugify_game_name(game_name)
        
        # Construct path
        if output_dir:
            path = f"/{output_dir}/{slug}"
        else:
            # Extract relative path from output_dir if it's a full path
            if output_dir_path:
                # Try to extract games/... path
                if "games/" in output_dir_path:
                    path = "/" + output_dir_path.split("games/")[-1]
                else:
                    path = f"/games/{slug}"
            else:
                path = f"/games/{slug}"
        
        # Create manifest entry
        manifest_entry = {
            "id": slug,
            "title": metadata.get('title', game_name),
            "description": metadata.get('description', ''),
            "controls": metadata.get('controls', ''),
            "path": path,
            "csv_row_index": csv_row_index,
            "csv_data": {
                "game_name": csv_data.get("game_name", ""),
                "game_url": csv_data.get("game_url", ""),
                "genre": csv_data.get("genre", ""),
                "classification": csv_data.get("classification", ""),
                "vlm_suitability_score": csv_data.get("vlm_suitability_score", ""),
                "description": csv_data.get("description", ""),
                "aboutme": csv_data.get("aboutme", ""),
            },
            "source": "steam_csv"
        }
        
        manifest.append(manifest_entry)
    
    # Write manifest
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✓ Manifest saved to: {output_path}")
    print(f"  Generated {len(manifest)} manifest entries")


def main():
    parser = argparse.ArgumentParser(
        description="Batch game generator that reads from CSV and generates games using p5.js"
    )
    parser.add_argument(
        "--csv",
        type=str,
        default="crawled_games/input_games/indie_games_vlm_classification.csv",
        help="Path to CSV file with game data"
    )
    parser.add_argument(
        "--start-row",
        type=int,
        default=0,
        help="CSV row to start from (0-based, excluding header, default: 0)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum number of games to generate (default: 100)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show commands without executing"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        help="Custom output directory name under games/ (e.g., 'steam_games')"
    )
    parser.add_argument(
        "--manifest-output",
        type=str,
        default="crawled_games/input_games/steam_games_manifest.json",
        help="Path to save manifest JSON file (default: crawled_games/input_games/steam_games_manifest.json)"
    )
    parser.add_argument(
        "--inverse",
        action="store_true",
        help="Process CSV from bottom to top (start from the end and work backwards)"
    )
    parser.add_argument(
        "--p5-gen-new",
        action="store_true",
        help="Use the new expanded p5.js generator config (with max_tokens: 80000 and comprehensive instructions)"
    )
    
    args = parser.parse_args()
    
    # Load games from CSV
    try:
        csv_games = load_games_from_csv(args.csv, start_row=args.start_row, limit=args.limit, reverse=args.inverse)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return 1
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return 1
    
    total_csv_rows = len(csv_games)
    if total_csv_rows == 0:
        print(f"Error: No games found in CSV (start_row={args.start_row}, limit={args.limit})")
        return 1
    
    print(f"Loaded {total_csv_rows} games from CSV")
    if args.inverse:
        # Calculate actual row range for display
        # Read CSV to get total row count
        with open(args.csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            total_csv_file_rows = len(list(reader))
        end_row = total_csv_file_rows - args.start_row
        start_row = max(0, end_row - args.limit)
        print(f"Processing CSV rows {start_row} to {end_row - 1} (inverse mode: from bottom)")
    else:
        print(f"Processing CSV rows {args.start_row} to {args.start_row + total_csv_rows - 1}")
    if args.output_dir:
        print(f"Output directory: games/{args.output_dir}")
    if args.p5_gen_new:
        print(f"Using NEW expanded p5.js generator (max_tokens: 80000, comprehensive instructions)")
    
    # Generate games
    generation_results = []
    
    for i, game_data in enumerate(csv_games):
        csv_row_index = game_data['csv_row_index']
        # Use CSV row index as game_index to maintain consistency
        game_index = csv_row_index
        game_name = game_data.get('game_name', f'Game {game_index}')
        concept = game_data.get('concept', '')
        
        print(f"\n[{game_index}] {game_name} (CSV row {csv_row_index})")
        print(f"  Concept preview: {concept[:100]}...")
        
        # Generate game (always use p5.js)
        result = generate_game(
            concept=concept,
            game_index=game_index,
            name=game_name,
            dry_run=args.dry_run,
            output_folder=args.output_dir,
            csv_row_index=csv_row_index,
            use_new_p5_gen=args.p5_gen_new
        )
        generation_results.append(result)
    
    # Create manifest
    if not args.dry_run:
        manifest_path = Path(args.manifest_output)
        create_manifest(generation_results, csv_games, manifest_path, args.output_dir)
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"CSV rows processed: {args.start_row} to {args.start_row + total_csv_rows - 1}")
    print(f"Total games processed: {total_csv_rows}")
    if args.output_dir:
        print(f"Output directory: games/{args.output_dir}")
    
    if generation_results:
        success_count = sum(1 for r in generation_results if r.get("status") == "success")
        failed_count = sum(1 for r in generation_results if r.get("status") == "failed")
        timeout_count = sum(1 for r in generation_results if r.get("status") == "timeout")
        exception_count = sum(1 for r in generation_results if r.get("status") == "exception")
        
        print(f"\nGeneration Results:")
        print(f"  ✓ Success: {success_count}")
        print(f"  ✗ Failed: {failed_count}")
        print(f"  ⏱ Timeout: {timeout_count}")
        print(f"  ⚠ Exception: {exception_count}")
    
    print(f"{'='*80}\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())


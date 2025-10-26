#!/usr/bin/env python3
"""
Update unique_suitable_games_with_concepts.csv with generation status.

This script adds a 'generated' column to the CSV indicating whether each game
has been generated and exists in public/games/.

Usage:
    python scripts/data_processing/update_csv_generation_status.py
    python scripts/data_processing/update_csv_generation_status.py --csv path/to/games.csv
    python scripts/data_processing/update_csv_generation_status.py --games-dir public/games
"""

import argparse
import csv
import os
import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Set


def slugify_game_name(name: str) -> str:
    """
    Convert game name to a slug format for directory matching.
    
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


def extract_game_name_from_metadata(metadata_path: Path) -> str:
    """
    Extract the original game name from metadata.json.
    
    Tries to find:
    1. 'original_game_name' from the concept
    2. 'game_name' from the concept
    3. Falls back to empty string
    
    Args:
        metadata_path: Path to metadata.json file
        
    Returns:
        Original game name or empty string
    """
    try:
        import json
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Try to get concept from game_info
        concept = metadata.get('game_info', {}).get('concept')
        
        if not concept:
            return ''
        
        # Parse concept (might be a JSON string or dict)
        if isinstance(concept, str):
            try:
                concept_data = json.loads(concept)
            except json.JSONDecodeError:
                return ''
        else:
            concept_data = concept
        
        # Try original_game_name first
        if concept_data.get('original_game_name'):
            return concept_data['original_game_name']
        
        # Fall back to game_name
        if concept_data.get('game_name'):
            return concept_data['game_name']
        
        return ''
    
    except Exception:
        return ''


def get_game_directories_with_metadata(games_dir: str) -> dict:
    """
    Get all game directories with their original game names from metadata.
    
    Args:
        games_dir: Path to games directory
        
    Returns:
        Dict mapping normalized original game names to directory paths
    """
    games_path = Path(games_dir)
    
    if not games_path.exists():
        print(f"Warning: Games directory '{games_dir}' does not exist")
        return {}
    
    game_mapping = {}
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip backup directories
        if '_backup_' in item.name:
            continue
        
        # Skip hidden directories
        if item.name.startswith('.'):
            continue
        
        # Look for metadata.json
        metadata_path = item / 'metadata.json'
        
        if metadata_path.exists():
            original_name = extract_game_name_from_metadata(metadata_path)
            
            if original_name:
                # Normalize the name for matching
                normalized_name = original_name.lower().strip()
                game_mapping[normalized_name] = str(item)
    
    return game_mapping


def find_matching_game_dir(game_name: str, game_mapping: dict) -> bool:
    """
    Check if a game exists in the games directory by matching against metadata.
    
    Args:
        game_name: Original game name from CSV
        game_mapping: Dict mapping normalized original game names to directory paths
        
    Returns:
        True if a match is found, False otherwise
    """
    # Normalize the CSV game name
    normalized_name = game_name.lower().strip()
    
    # Direct match
    if normalized_name in game_mapping:
        return True
    
    # Try with some Unicode normalization variations
    # Remove common punctuation and extra spaces
    cleaned_name = re.sub(r'[:\-™®©]', '', normalized_name)
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
    
    if cleaned_name in game_mapping:
        return True
    
    # Check for close matches (handles slight variations)
    for stored_name in game_mapping.keys():
        # If names are very similar (ignoring punctuation and spacing)
        cleaned_stored = re.sub(r'[:\-™®©]', '', stored_name)
        cleaned_stored = re.sub(r'\s+', ' ', cleaned_stored).strip()
        
        if cleaned_name == cleaned_stored:
            return True
    
    return False


def create_backup(csv_path: str) -> str:
    """
    Create a timestamped backup of the CSV file.
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        Path to backup file
    """
    csv_file = Path(csv_path)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = csv_file.parent / f"{csv_file.stem}_backup_{timestamp}{csv_file.suffix}"
    
    shutil.copy2(csv_path, backup_path)
    return str(backup_path)


def update_csv_with_generation_status(
    input_csv: str,
    games_dir: str,
    create_backup_file: bool = True
) -> None:
    """
    Update CSV with generation status column.
    
    Args:
        input_csv: Path to input CSV file
        games_dir: Path to games directory
        create_backup_file: Whether to create a backup before modifying
    """
    csv_path = Path(input_csv)
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {input_csv}")
        return
    
    print(f"Reading CSV: {input_csv}")
    
    # Create backup if requested
    if create_backup_file:
        backup_path = create_backup(input_csv)
        print(f"Backup created: {backup_path}")
    
    # Get all game directories with metadata
    print(f"\nScanning games directory: {games_dir}")
    print(f"Reading metadata.json files...")
    game_mapping = get_game_directories_with_metadata(games_dir)
    print(f"Found {len(game_mapping)} games with valid metadata")
    
    # Read CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Check if 'generated' column already exists
        if 'generated' in fieldnames:
            print("\nWarning: 'generated' column already exists. It will be updated.")
        else:
            # Add 'generated' to fieldnames
            fieldnames = list(fieldnames) + ['generated']
        
        for row in reader:
            rows.append(row)
    
    print(f"Read {len(rows)} games from CSV")
    
    # Update each row with generation status
    generated_count = 0
    not_generated_count = 0
    
    print("\nChecking generation status for each game...")
    for row in rows:
        game_name = row.get('game_name', '')
        
        if find_matching_game_dir(game_name, game_mapping):
            row['generated'] = 'True'
            generated_count += 1
        else:
            row['generated'] = 'False'
            not_generated_count += 1
    
    # Write updated CSV
    print(f"\nWriting updated CSV...")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n{'='*60}")
    print("UPDATE COMPLETE")
    print(f"{'='*60}")
    print(f"Total games in CSV: {len(rows)}")
    print(f"Generated (found in {games_dir}): {generated_count}")
    print(f"Not generated: {not_generated_count}")
    print(f"Updated CSV saved to: {input_csv}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Update CSV with game generation status",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage (uses default paths)
  python scripts/data_processing/update_csv_generation_status.py
  
  # Custom CSV path
  python scripts/data_processing/update_csv_generation_status.py --csv path/to/games.csv
  
  # Custom games directory
  python scripts/data_processing/update_csv_generation_status.py --games-dir public/games
  
  # Skip backup creation
  python scripts/data_processing/update_csv_generation_status.py --no-backup
        """
    )
    
    parser.add_argument(
        '--csv',
        default='public/unique_suitable_games_with_concepts.csv',
        help='Path to CSV file (default: public/unique_suitable_games_with_concepts.csv)'
    )
    
    parser.add_argument(
        '--games-dir',
        default='public/games',
        help='Path to games directory (default: public/games)'
    )
    
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip creating backup file'
    )
    
    args = parser.parse_args()
    
    # Run the update
    update_csv_with_generation_status(
        input_csv=args.csv,
        games_dir=args.games_dir,
        create_backup_file=not args.no_backup
    )


if __name__ == "__main__":
    main()


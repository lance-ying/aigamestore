#!/usr/bin/env python3
"""
Flatten nested game directories and rename them based on the title tag in index.html.

This script:
1. Finds all index.html files recursively in the source directory
2. Extracts the title from each index.html
3. Copies the directory containing index.html to a new location
4. Renames the directory to a sanitized version of the title
5. Handles conflicts by adding a numeric suffix
"""

import re
import shutil
from pathlib import Path
from html.parser import HTMLParser
from typing import Optional, Tuple


class TitleExtractor(HTMLParser):
    """HTML parser to extract the title tag or h1#gameTitle content."""
    
    def __init__(self):
        super().__init__()
        self.title = None
        self.in_title = False
        self.in_h1_game_title = False
    
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'title':
            self.in_title = True
        elif tag.lower() == 'h1':
            # Check if this h1 has id="gameTitle"
            for attr_name, attr_value in attrs:
                if attr_name.lower() == 'id' and attr_value == 'gameTitle':
                    self.in_h1_game_title = True
                    break
    
    def handle_endtag(self, tag):
        if tag.lower() == 'title':
            self.in_title = False
        elif tag.lower() == 'h1':
            self.in_h1_game_title = False
    
    def handle_data(self, data):
        if self.in_title:
            self.title = data.strip()
        elif self.in_h1_game_title and not self.title:
            # Use h1 as fallback if no title tag found
            self.title = data.strip()


def extract_title(html_path: Path) -> Optional[str]:
    """Extract the title from an HTML file."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parser = TitleExtractor()
        parser.feed(content)
        return parser.title
    except Exception as e:
        print(f"  ⚠️  Error reading {html_path}: {e}")
        return None


def sanitize_name(name: str) -> str:
    """
    Convert a game title to a valid directory name.
    
    - Removes special characters
    - Replaces spaces with hyphens
    - Converts to lowercase
    - Removes leading/trailing hyphens
    - Limits length
    """
    # Remove HTML entities and decode
    name = name.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    
    # Remove special characters, keep alphanumeric, spaces, hyphens, underscores
    name = re.sub(r'[^\w\s\-]', '', name)
    
    # Replace multiple spaces/hyphens with single hyphen
    name = re.sub(r'[\s\-_]+', '-', name)
    
    # Convert to lowercase
    name = name.lower()
    
    # Remove leading/trailing hyphens
    name = name.strip('-')
    
    # Limit length to 100 characters
    if len(name) > 100:
        name = name[:100].rstrip('-')
    
    # Ensure it's not empty
    if not name:
        name = "untitled-game"
    
    return name


def find_all_games(source_dir: Path) -> list[Tuple[Path, Path]]:
    """
    Find all index.html files and return tuples of (html_path, game_dir).
    
    Returns:
        List of tuples: (index.html path, directory containing index.html)
    """
    games = []
    
    for html_path in source_dir.rglob("index.html"):
        # Skip backup directories
        if '_backup_' in str(html_path):
            continue
        
        # Get the directory containing this index.html
        game_dir = html_path.parent
        
        games.append((html_path, game_dir))
    
    return games


def get_unique_dest_name(base_name: str, dest_dir: Path, existing_names: set) -> str:
    """
    Get a unique destination name, adding a suffix if needed.
    
    Args:
        base_name: Base sanitized name
        dest_dir: Destination directory
        existing_names: Set of names already used
    
    Returns:
        Unique name for the destination
    """
    if base_name not in existing_names and not (dest_dir / base_name).exists():
        return base_name
    
    # Try with numeric suffix
    counter = 1
    while True:
        candidate = f"{base_name}-{counter}"
        if candidate not in existing_names and not (dest_dir / candidate).exists():
            return candidate
        counter += 1


def main():
    """Main function to flatten and rename games."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Flatten nested game directories and rename them based on title tags"
    )
    parser.add_argument(
        "--source",
        default="games/purple_yellow_games",
        help="Source directory containing games (default: games/purple_yellow_games)"
    )
    parser.add_argument(
        "--dest",
        default="games/purple_yellow_games_flattened",
        help="Destination directory for flattened games (default: games/purple_yellow_games_flattened)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually copying files"
    )
    
    args = parser.parse_args()
    
    # Setup paths
    project_root = Path(__file__).parent
    source_dir = project_root / args.source
    dest_dir = project_root / args.dest
    
    if not source_dir.exists():
        print(f"Error: Source directory not found: {source_dir}")
        return
    
    print("=" * 80)
    print("Flattening and Renaming Games")
    print("=" * 80)
    print(f"Source: {source_dir}")
    print(f"Destination: {dest_dir}")
    if args.dry_run:
        print("DRY RUN MODE - No files will be copied")
    print()
    
    # Find all games
    print("Scanning for games...")
    games = find_all_games(source_dir)
    
    if not games:
        print("No games found (no index.html files)")
        return
    
    print(f"Found {len(games)} games\n")
    
    # Extract titles and prepare for copying
    game_data = []
    title_to_count = {}
    
    print("Extracting titles from index.html files...")
    for html_path, game_dir in games:
        title = extract_title(html_path)
        if not title:
            print(f"  ⚠️  Could not extract title from: {game_dir}")
            title = game_dir.name  # Fallback to directory name
        
        sanitized = sanitize_name(title)
        
        # Track title usage for conflict detection
        title_to_count[sanitized] = title_to_count.get(sanitized, 0) + 1
        
        game_data.append({
            'html_path': html_path,
            'game_dir': game_dir,
            'original_title': title,
            'sanitized_name': sanitized,
            'relative_path': game_dir.relative_to(source_dir)
        })
    
    # Create destination directory
    if not args.dry_run:
        dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy games
    print("\n" + "=" * 80)
    print("Processing games...")
    print("=" * 80)
    
    existing_names = set()
    success_count = 0
    failed_games = []
    name_mappings = []
    
    for i, game_info in enumerate(game_data, 1):
        game_dir = game_info['game_dir']
        original_title = game_info['original_title']
        sanitized = game_info['sanitized_name']
        
        # Get unique destination name
        dest_name = get_unique_dest_name(sanitized, dest_dir, existing_names)
        existing_names.add(dest_name)
        
        dest_path = dest_dir / dest_name
        
        # Show what we're doing
        print(f"\n[{i}/{len(game_data)}] {game_dir.name}")
        print(f"  Title: {original_title}")
        print(f"  Sanitized: {sanitized}")
        if dest_name != sanitized:
            print(f"  → Renamed to: {dest_name} (conflict resolved)")
        print(f"  Source: {game_dir}")
        print(f"  Dest: {dest_path}")
        
        name_mappings.append({
            'original_path': str(game_info['relative_path']),
            'original_title': original_title,
            'new_name': dest_name
        })
        
        if args.dry_run:
            print("  [DRY RUN] Would copy")
            success_count += 1
            continue
        
        # Copy the directory
        try:
            if dest_path.exists():
                print(f"  ⚠️  Removing existing: {dest_path}")
                shutil.rmtree(dest_path)
            
            shutil.copytree(game_dir, dest_path)
            print(f"  ✅ Copied successfully")
            success_count += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed_games.append(game_info)
    
    # Summary
    print("\n" + "=" * 80)
    print("Summary")
    print("=" * 80)
    print(f"Total games found: {len(games)}")
    print(f"Successfully processed: {success_count}")
    print(f"Failed: {len(failed_games)}")
    
    if failed_games:
        print("\nFailed games:")
        for game_info in failed_games:
            print(f"  - {game_info['game_dir']}")
    
    # Save name mappings
    if not args.dry_run and name_mappings:
        import json
        mappings_file = dest_dir / "name_mappings.json"
        with open(mappings_file, 'w', encoding='utf-8') as f:
            json.dump(name_mappings, f, indent=2, ensure_ascii=False)
        print(f"\nName mappings saved to: {mappings_file}")
    
    print(f"\n✅ Done! Flattened games in: {dest_dir}")


if __name__ == "__main__":
    main()

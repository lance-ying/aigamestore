#!/usr/bin/env python3
"""
Fix absolute paths in game index.html files.

Converts absolute paths like `/games/game-name/file.js` to relative paths like `file.js`
to fix issues when games are served from the project root.
"""

import re
import sys
from pathlib import Path

# Get project root (assuming script is in scripts/)
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
GAMES_DIR = PROJECT_ROOT / "games" / "games"


def fix_paths_in_html(html_content: str, game_dir_name: str) -> tuple[str, bool]:
    """
    Fix absolute paths in HTML content.
    
    Args:
        html_content: The HTML content to fix
        game_dir_name: The name of the game directory (e.g., "adventure-star-roll-of-fate")
    
    Returns:
        Tuple of (fixed_html, was_changed)
    """
    original_content = html_content
    changed = False
    
    # Pattern 1: /games/{game-name}/file.js -> file.js
    # This handles the incorrect absolute path missing the nested games/ directory
    pattern1 = rf'src="/games/{re.escape(game_dir_name)}/([^"]+)"'
    replacement1 = r'src="\1"'
    
    if re.search(pattern1, html_content):
        html_content = re.sub(pattern1, replacement1, html_content)
        changed = True
    
    # Pattern 2: /games/games/{game-name}/file.js -> file.js
    # This handles cases where the path was already fixed to include games/games/
    pattern2 = rf'src="/games/games/{re.escape(game_dir_name)}/([^"]+)"'
    replacement2 = r'src="\1"'
    
    if re.search(pattern2, html_content):
        html_content = re.sub(pattern2, replacement2, html_content)
        changed = True
    
    return html_content, changed


def fix_game_index_html(index_path: Path) -> bool:
    """
    Fix paths in a single game's index.html file.
    
    Args:
        index_path: Path to the index.html file
    
    Returns:
        True if file was modified, False otherwise
    """
    # Get the game directory name (parent of index.html)
    game_dir_name = index_path.parent.name
    
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content, was_changed = fix_paths_in_html(content, game_dir_name)
        
        if was_changed:
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True
        
        return False
    
    except Exception as e:
        print(f"Error processing {index_path}: {e}")
        return False


def main():
    """Main function to fix all games."""
    if not GAMES_DIR.exists():
        print(f"Error: Games directory not found: {GAMES_DIR}")
        sys.exit(1)
    
    print(f"Scanning games in: {GAMES_DIR}")
    print("=" * 60)
    
    # Find all index.html files
    index_files = list(GAMES_DIR.rglob("index.html"))
    
    # Filter out backup directories
    index_files = [f for f in index_files if "_backup_" not in str(f)]
    
    print(f"Found {len(index_files)} game(s) to check\n")
    
    fixed_count = 0
    skipped_count = 0
    
    for index_path in sorted(index_files):
        game_name = index_path.parent.name
        relative_path = index_path.relative_to(PROJECT_ROOT)
        
        was_fixed = fix_game_index_html(index_path)
        
        if was_fixed:
            print(f"✓ Fixed: {relative_path}")
            fixed_count += 1
        else:
            print(f"  Skipped (no changes needed): {relative_path}")
            skipped_count += 1
    
    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  Fixed: {fixed_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total: {len(index_files)}")
    print("=" * 60)


if __name__ == "__main__":
    main()


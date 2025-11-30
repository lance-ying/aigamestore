"""
Game discovery and metadata extraction.

This module handles scanning directories for games, extracting metadata,
and getting timestamps for sorting.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Handle imports for both script execution and module import
try:
    from .config import SCRIPT_DIR
    from .utils import normalize_game_path
    from .backups import count_backups
    from .flags import load_flags
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import SCRIPT_DIR
    from scripts.utils.fix_game_gui_v2.utils import normalize_game_path
    from scripts.utils.fix_game_gui_v2.backups import count_backups
    from scripts.utils.fix_game_gui_v2.flags import load_flags


def list_games(games_dir: str = "games/games", sort_by: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Scan games directory and return list of games with metadata.
    Handles both flat structure (games/games/game_name/) and nested structure (games/single_prompt_with_testing/game_XXXX/sample_Y/).
    
    Args:
        games_dir: Directory to scan for games
        sort_by: Sort option - "alphabetical", "last_modified", "last_added", or None (defaults to alphabetical)
    
    Returns:
        List of dicts with 'title', 'dir_name', 'path', 'backup_count', and 'flag_color' keys
    """
    # Use absolute path from script directory to avoid issues with directory changes
    games_path = SCRIPT_DIR / games_dir
    
    if not games_path.exists():
        return []
    
    # Load flags once for all games
    flags = load_flags()
    
    games = []
    
    def find_games_recursive(directory: Path, base_path: Path, max_depth: int = 3, current_depth: int = 0):
        """Recursively find games with index.html"""
        if current_depth >= max_depth:
            return
        
        for item in directory.iterdir():
            if not item.is_dir():
                continue
            
            # Skip backup directories
            if '_backup_' in item.name:
                continue
            
            # Skip hidden directories
            if item.name.startswith('.'):
                continue
            
            # Check if this directory has index.html (it's a game)
            if (item / "index.html").exists():
                # This is a game directory
                # Try to get title from metadata
                title = item.name  # Default to directory name
                metadata_path = item / "metadata.json"
                
                if metadata_path.exists():
                    try:
                        with open(metadata_path, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                        
                        # Try to get title from game_info
                        if metadata.get('game_info', {}).get('title'):
                            title = metadata['game_info']['title']
                            if title == 'Untitled Game':
                                title = item.name
                    except Exception:
                        pass
                
                # For nested structures, include parent path in display name
                try:
                    relative_path = item.relative_to(base_path)
                    if len(relative_path.parts) > 1:
                        # Nested structure: include parent directories in title
                        parent_path = '/'.join(relative_path.parts[:-1])
                        display_title = f"{title} ({parent_path})"
                    else:
                        display_title = title
                except Exception:
                    display_title = title
                
                # Count backups for this game
                backup_count = count_backups(str(item))
                
                # Get flag color for this game
                normalized_path = normalize_game_path(str(item))
                flag_color = flags.get(normalized_path)
                
                games.append({
                    'title': display_title,
                    'dir_name': item.name,
                    'path': str(item),
                    'backup_count': backup_count,
                    'flag_color': flag_color
                })
            else:
                # No index.html here, recurse into subdirectories
                find_games_recursive(item, base_path, max_depth, current_depth + 1)
    
    # Start recursive search (max 3 levels deep: game_XXXX/sample_Y/ is 2 levels)
    find_games_recursive(games_path, games_path, max_depth=3)
    
    # Apply sorting based on sort_by parameter
    if sort_by == "last_modified":
        # Get timestamps for all games
        game_paths = [g['path'] for g in games]
        timestamps = get_game_timestamps(game_paths)
        # Sort by mtime (newest first)
        games.sort(key=lambda x: timestamps.get(x['path'], {}).get('mtime', 0), reverse=True)
    elif sort_by == "last_added":
        # Get timestamps for all games
        game_paths = [g['path'] for g in games]
        timestamps = get_game_timestamps(game_paths)
        # Sort by ctime (newest first)
        games.sort(key=lambda x: timestamps.get(x['path'], {}).get('ctime', 0), reverse=True)
    else:
        # Default: alphabetical sort by title
        games.sort(key=lambda x: x['title'].lower())
    
    return games


def get_game_timestamps(game_paths: List[str]) -> Dict[str, Dict[str, float]]:
    """
    Extract filesystem timestamps for game directories.
    
    Args:
        game_paths: List of game directory paths
        
    Returns:
        Dict mapping game paths to dict with 'mtime' (last-modified) and 'ctime' (last-added) keys
    """
    timestamps = {}
    
    for game_path in game_paths:
        game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
        
        if not game_dir.exists() or not game_dir.is_dir():
            continue
        
        # Get directory creation time (last-added)
        ctime = game_dir.stat().st_ctime
        
        # Get most recent file modification time in directory (last-modified)
        # Walk through all files in the directory to find the most recent mtime
        mtime = game_dir.stat().st_mtime  # Start with directory's own mtime
        
        try:
            for root, dirs, files in os.walk(game_dir):
                # Skip backup directories
                dirs[:] = [d for d in dirs if '_backup_' not in d]
                
                for file in files:
                    file_path = Path(root) / file
                    try:
                        file_mtime = file_path.stat().st_mtime
                        if file_mtime > mtime:
                            mtime = file_mtime
                    except (OSError, PermissionError):
                        # Skip files we can't access
                        continue
        except (OSError, PermissionError):
            # If we can't walk the directory, just use directory mtime
            pass
        
        timestamps[game_path] = {
            'mtime': mtime,
            'ctime': ctime
        }
    
    return timestamps


def get_game_metadata(game_path: str) -> Dict[str, str]:
    """
    Extract metadata from game directory.
    
    Returns:
        Dict with title, description, controls, path
    """
    # Ensure absolute path
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    metadata_path = game_dir / "metadata.json"
    
    result = {
        'title': game_dir.name,
        'description': '',
        'controls': '',
        'path': str(game_dir)
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
        print(f"Error reading metadata: {e}")
    
    return result


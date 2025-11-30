"""
Backup management for games.

This module handles creating, listing, and managing backups of game directories.
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

# Handle imports for both script execution and module import
try:
    from .config import SCRIPT_DIR
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import SCRIPT_DIR


def count_backups(game_path: str) -> int:
    """Count number of backups for a game."""
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    parent_dir = game_dir.parent
    backup_pattern = f"{game_dir.name}_backup_"
    
    count = 0
    for item in parent_dir.iterdir():
        if item.is_dir() and item.name.startswith(backup_pattern):
            count += 1
    
    return count


def list_backups(game_path: str) -> List[Tuple[str, str]]:
    """
    List all backups for a game.
    
    Returns:
        List of tuples (display_name, backup_path)
    """
    # Ensure absolute path
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    parent_dir = game_dir.parent
    backup_pattern = f"{game_dir.name}_backup_"
    
    backups = []
    
    for item in parent_dir.iterdir():
        if not item.is_dir():
            continue
        
        if not item.name.startswith(backup_pattern):
            continue
        
        # Extract timestamp from backup name
        try:
            timestamp_str = item.name.replace(backup_pattern, '')
            # Parse timestamp: YYYYMMDD_HHMMSS
            dt = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            display_name = dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            display_name = item.name
        
        backups.append((display_name, str(item)))
    
    # Sort by timestamp (newest first)
    backups.sort(reverse=True)
    
    return backups


def create_backup(game_dir: Path) -> Path:
    """Create a timestamped backup of the game directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = game_dir.parent / f"{game_dir.name}_backup_{timestamp}"
    
    shutil.copytree(game_dir, backup_path)
    return backup_path


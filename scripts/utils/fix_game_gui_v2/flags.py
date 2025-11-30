"""
Flag system for marking games with colors.

This module handles loading, saving, and managing flags that mark games
with different colors for organization purposes.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional
import gradio as gr

# Handle imports for both script execution and module import
try:
    from .config import FLAGS_FILE, FLAG_COLORS, COLOR_EMOJIS
    from .utils import normalize_game_path
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import FLAGS_FILE, FLAG_COLORS, COLOR_EMOJIS
    from scripts.utils.fix_game_gui_v2.utils import normalize_game_path


def load_flags() -> Dict[str, str]:
    """Load flags from flags.json, return dict mapping game paths to colors."""
    if not FLAGS_FILE.exists():
        return {}
    
    try:
        with open(FLAGS_FILE, 'r', encoding='utf-8') as f:
            flags = json.load(f)
        # Normalize all paths in loaded flags
        normalized_flags = {}
        for path, color in flags.items():
            try:
                normalized_path = normalize_game_path(path)
                normalized_flags[normalized_path] = color
            except Exception:
                # Skip invalid paths
                continue
        return normalized_flags
    except Exception as e:
        print(f"Error loading flags: {e}")
        return {}


def save_flags(flags_dict: Dict[str, str]) -> None:
    """Save flags dict to flags.json."""
    try:
        with open(FLAGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(flags_dict, f, indent=2)
    except Exception as e:
        print(f"Error saving flags: {e}")


def get_game_flag(game_path: str) -> Optional[str]:
    """Get flag color for a game (returns None if not flagged)."""
    flags = load_flags()
    normalized_path = normalize_game_path(game_path)
    return flags.get(normalized_path)


def set_game_flag(game_path: str, color: Optional[str]) -> None:
    """Set/update flag for a game. Pass None or empty string to remove flag."""
    flags = load_flags()
    normalized_path = normalize_game_path(game_path)
    
    if color and color.strip() and color.lower() != "none":
        flags[normalized_path] = color.lower()
    else:
        # Remove flag if color is None, empty, or "none"
        flags.pop(normalized_path, None)
    
    save_flags(flags)


def remove_game_flag(game_path: str) -> None:
    """Remove flag for a game."""
    set_game_flag(game_path, None)


def get_flag_counts(games_list: List[Dict[str, str]]) -> Dict[str, int]:
    """Count games per color, return dict with color counts."""
    counts = {color: 0 for color in FLAG_COLORS}
    flags = load_flags()
    
    for game in games_list:
        game_path = game.get('path', '')
        if not game_path:
            continue
        
        normalized_path = normalize_game_path(game_path)
        color = flags.get(normalized_path)
        if color and color in counts:
            counts[color] += 1
    
    return counts


def update_flag_counts(games_dir: str = "games/games") -> str:
    """
    Calculate and return HTML display of flag counts.
    
    Returns:
        HTML string showing counts per color
    """
    # Import here to avoid circular import
    from .games import list_games
    games = list_games(games_dir)
    counts = get_flag_counts(games)
    
    total_flagged = sum(counts.values())
    
    html_lines = [
        '<div style="background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 15px; font-family: monospace; color: #c9d1d9;">',
        '<h3 style="margin: 0 0 15px 0; color: #c9d1d9; font-size: 14px;">Flag Counts</h3>',
    ]
    
    for color in FLAG_COLORS:
        count = counts[color]
        emoji = COLOR_EMOJIS[color]
        color_name = color.capitalize()
        html_lines.append(
            f'<div style="margin-bottom: 8px; font-size: 12px;">'
            f'<span style="margin-right: 8px;">{emoji}</span>'
            f'<span style="color: #8b949e;">{color_name}:</span> '
            f'<span style="color: #c9d1d9; font-weight: bold;">{count}</span>'
            f'</div>'
        )
    
    html_lines.append('<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #30363d; font-size: 12px;">')
    html_lines.append(f'<span style="color: #8b949e;">Total Flagged:</span> ')
    html_lines.append(f'<span style="color: #c9d1d9; font-weight: bold;">{total_flagged}</span>')
    html_lines.append('</div>')
    html_lines.append('</div>')
    
    return '\n'.join(html_lines)


def set_flag_action(game_path: str, color: str, games_dir: str = "games/games", sort_by: str = "alphabetical") -> tuple:
    """
    Set flag for a game, return updated dropdown and counts.
    
    Returns:
        Tuple of (updated_game_dropdown, updated_flag_counts_html, status_message)
    """
    # Import here to avoid circular import
    from .games import list_games
    
    if not game_path:
        return gr.Dropdown(), "", "Error: No game selected"
    
    try:
        # Set the flag
        set_game_flag(game_path, color)
        
        # Get updated games list
        sort_param = None if sort_by == "alphabetical" else sort_by
        games = list_games(games_dir, sort_by=sort_param)
        choices = []
        for g in games:
            display_name = g['title']
            
            # Add color indicator if flagged
            flag_color = g.get('flag_color')
            if flag_color and flag_color in COLOR_EMOJIS:
                emoji = COLOR_EMOJIS[flag_color]
                display_name = f"{emoji} {display_name}"
            
            if g['backup_count'] > 0:
                display_name += f" ({g['backup_count']} backup{'s' if g['backup_count'] > 1 else ''})"
            choices.append((display_name, g['path']))
        
        if not choices:
            choices = [("No games found", "")]
        
        # Update counts
        counts_html = update_flag_counts(games_dir)
        
        # Status message
        if color and color.lower() != "none":
            color_name = color.capitalize()
            emoji = COLOR_EMOJIS.get(color.lower(), "🏷️")
            status = f"Flagged game with {emoji} {color_name}"
        else:
            status = "Removed flag from game"
        
        return gr.Dropdown(choices=choices, value=game_path), counts_html, status
    
    except Exception as e:
        return gr.Dropdown(), "", f"Error setting flag: {e}"


"""
Configuration constants for the Game Fix GUI.

This module contains all configuration constants including:
- Game directory mappings
- Flag system configuration
- Server configuration
- Path calculations
"""

from pathlib import Path

# Get project root (4 levels up from scripts/utils/fix_game_gui_v2/config.py)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.resolve()
SCRIPT_DIR = PROJECT_ROOT  # Use project root for path calculations

# Global HTTP server configuration
GAME_SERVER_PORT = 5141

# Configuration for multiple game directories
GAME_DIRECTORIES = {
    "Games": "games/games",
    "Single Prompt (nested)": "games/single_prompt_with_testing",
    "Single Prompt 1 (nested)": "games/single_prompt_with_testing_1",
    "Game Platform": "archive/games/games_platform",
    "Batch 103125": "archive/games/games_gen_halloween",
    "Batch 110325": "archive/games/new_batch_110325",
    "Batch 110425": "archive/games/batch_110425",
    "Games 111125": "archive/games/archive/games_111125",
    "old games": "archive/games/games_old",
}

# Flag system configuration
FLAGS_FILE = PROJECT_ROOT / "flags.json"
FLAG_COLORS = ["red", "yellow", "green", "blue", "purple"]
COLOR_EMOJIS = {
    "red": "🔴",
    "yellow": "🟡",
    "green": "🟢",
    "blue": "🔵",
    "purple": "🟣",
}
COLOR_HEX = {
    "red": "#ff4444",
    "yellow": "#ffaa00",
    "green": "#44ff44",
    "blue": "#4444ff",
    "purple": "#aa44ff",
}



"""
Utility functions for the Game Fix GUI.

This module contains:
- Environment file loading
- Desktop notifications
- Path normalization utilities
"""

import os
import subprocess
import platform
import sys
from pathlib import Path
from typing import Optional

# Handle imports for both script execution and module import
try:
    from .config import PROJECT_ROOT, SCRIPT_DIR
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import PROJECT_ROOT, SCRIPT_DIR


def load_env_file() -> None:
    """Load environment variables from .env file."""
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value


def send_notification(title: str, message: str, timeout: int = 5) -> None:
    """
    Send a desktop notification. Tries multiple methods:
    1. plyer (cross-platform, if installed)
    2. osascript (macOS)
    3. notify-send (Linux)
    4. Windows toast (Windows)
    
    Falls back silently if none are available.
    """
    try:
        # Try plyer first (cross-platform, clean API)
        try:
            from plyer import notification
            notification.notify(
                title=title,
                message=message,
                timeout=timeout,
                app_name="Game Fix Tool"
            )
            return
        except ImportError:
            pass
        
        # Platform-specific fallbacks
        system = platform.system()
        
        if system == "Darwin":  # macOS
            # Use osascript for native macOS notifications
            # Escape quotes and newlines in the message
            escaped_message = message.replace('"', '\\"').replace('\n', '\\n')
            escaped_title = title.replace('"', '\\"')
            script = f'display notification "{escaped_message}" with title "{escaped_title}"'
            subprocess.run(
                ["osascript", "-e", script],
                check=False,
                capture_output=True
            )
        elif system == "Linux":
            # Try notify-send (requires libnotify)
            subprocess.run(
                ["notify-send", title, message, "-t", str(timeout * 1000)],
                check=False,
                capture_output=True
            )
        elif system == "Windows":
            # Windows toast notification
            try:
                from win10toast import ToastNotifier
                toaster = ToastNotifier()
                toaster.show_toast(title, message, duration=timeout)
            except ImportError:
                pass
    except Exception:
        # Silently fail - notifications are optional
        pass


def normalize_game_path(game_path: str) -> str:
    """Normalize game path to absolute path string for consistent flag storage."""
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    return str(game_dir.resolve())


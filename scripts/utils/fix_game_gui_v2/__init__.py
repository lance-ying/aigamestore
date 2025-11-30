"""
Game Fix GUI v2 - Modular refactored version.

This package provides a web-based interface to:
- Browse games in various directories
- Preview games in an iframe
- Write feedback and apply fixes
- Manage backups
- Flag games with colors for organization

Usage:
    from scripts.utils.fix_game_gui_v2 import main
    main()
    
    Or run as module:
    python -m scripts.utils.fix_game_gui_v2
    
    Or run directly:
    uv run scripts/utils/fix_game_gui_v2/main.py
"""

# Lazy import to avoid circular imports
def _get_main():
    """Lazy import of main function."""
    try:
        from .main import main
        return main
    except ImportError:
        # If relative imports fail, use absolute imports
        import sys
        from pathlib import Path
        _package_dir = Path(__file__).parent
        _project_root = _package_dir.parent.parent.parent.resolve()
        if str(_project_root) not in sys.path:
            sys.path.insert(0, str(_project_root))
        from scripts.utils.fix_game_gui_v2.main import main
        return main

# Only import main when explicitly requested to avoid circular imports
__all__ = ['main']

def __getattr__(name):
    """Lazy loading of main function."""
    if name == 'main':
        return _get_main()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


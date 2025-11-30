#!/usr/bin/env python3
"""
Main entry point for the Game Fix GUI.

This module provides the CLI interface and launches the Gradio application.

Usage:
    uv run python scripts/utils/fix_game_gui_v2/main.py
    uv run python scripts/utils/fix_game_gui_v2/main.py --port 7860
    uv run python scripts/utils/fix_game_gui_v2/main.py --share
"""
# /// script
# dependencies = [
#   "gradio",
#   "anthropic",
#   "openai",
#   "pyyaml",
#   "google-generativeai",
# ]
# ///

import sys
from pathlib import Path

# Add project root to path for imports
_script_dir = Path(__file__).parent
_project_root = _script_dir.parent.parent.parent.resolve()
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# Import using absolute path to avoid relative import issues
import argparse
from scripts.utils.fix_game_gui_v2.config import GAME_SERVER_PORT
from scripts.utils.fix_game_gui_v2.utils import load_env_file
from scripts.utils.fix_game_gui_v2.ui import build_interface

# Load environment variables
load_env_file()


def main():
    """Main entry point for the Game Fix GUI."""
    parser = argparse.ArgumentParser(description="Game Fix GUI")
    parser.add_argument(
        "--port",
        type=int,
        default=7860,
        help="Port to run Gradio server (default: 7860)"
    )
    parser.add_argument(
        "--share",
        action="store_true",
        help="Create a public Gradio link"
    )
    
    args = parser.parse_args()
    
    app = build_interface()
    
    print("\n" + "="*60)
    print("Game Fix GUI")
    print("="*60)
    print(f"\nStarting Gradio interface on http://localhost:{args.port}")
    print(f"Game server running on http://localhost:{GAME_SERVER_PORT}")
    print("\nPress Ctrl+C to stop\n")
    
    app.launch(
        server_port=args.port,
        server_name="0.0.0.0",
        share=args.share,
        inbrowser=True
    )


if __name__ == "__main__":
    main()


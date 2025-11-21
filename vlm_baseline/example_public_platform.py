#!/usr/bin/env python3
"""
Example script for running VLM on public_platform games.

This script demonstrates how the VLM automatically captures only the game canvas
(without the controls/description sections) for public_platform games.

Usage:
    python example_public_platform.py
"""

import os
from pathlib import Path
from vlm import VLMGamePlayer

def main():
    # Get the absolute path to the public_platform directory
    project_root = Path(__file__).parent.parent
    public_platform_dir = project_root / "public_platform" / "games"
    
    # Example game: snake-io
    game_name = "snake-io"
    game_path = public_platform_dir / game_name / "index.html"
    
    # Convert to file:// URL
    game_url = f"file://{game_path}"
    
    print(f"Running VLM on public_platform game: {game_name}")
    print(f"Game URL: {game_url}")
    print("\nThe VLM will automatically:")
    print("  1. Detect that this is a public_platform game")
    print("  2. Capture ONLY the game canvas (not the controls/description)")
    print("  3. Save canvas-only screenshots to the screenshots directory\n")
    
    # Initialize VLM player
    player = VLMGamePlayer(
        model_name="openai:gpt-4o",  # or any other supported model
        game_url=game_url,
        allowed_keys=["ArrowLeft", "ArrowRight", "Space", "Enter"],
        headless=False,  # Set to True for headless mode
        max_turns=20,  # Reduced for demonstration
        turn_delay=1.0,
    )
    
    # Play the game
    stats = player.play(
        screenshot_dir="./screenshots",
        include_history=True,
        use_unique_dir=True
    )
    
    # Print results
    print("\n" + "="*60)
    print("Game Statistics:")
    print(f"  Total turns: {stats['turns']}")
    print(f"  Valid actions: {stats['valid_actions']}")
    print(f"  Invalid actions: {stats['invalid_actions']}")
    print(f"  Duration: {stats['duration']:.2f} seconds")
    print(f"  Screenshots saved to: {stats['screenshot_dir']}")
    print("="*60)
    print("\n✅ Canvas-only screenshots saved!")


if __name__ == "__main__":
    main()



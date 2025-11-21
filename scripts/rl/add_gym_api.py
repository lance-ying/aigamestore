#!/usr/bin/env python3
"""
CLI tool to add Gym API support to games for RL training.

This tool uses an LLM to analyze a game and automatically generate a gym_api.js
file that exposes a clean OpenAI Gym interface for reinforcement learning.

Usage:
    python add_gym_api.py <game_dir>
    python add_gym_api.py <game_dir> --observation-type pixels
    python add_gym_api.py <game_dir> --model anthropic:claude-opus-4

Examples:
    python add_gym_api.py public/games/snake-io
    python add_gym_api.py public/games/fling-feathers --debug-prompts
"""

import argparse
import os
import sys
from pathlib import Path

from iterators.gym_api_generator import GymAPIIterator

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    # Remove surrounding quotes if present
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


def main():
    parser = argparse.ArgumentParser(
        description="Add Gym API support to a game for RL training",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "game_dir",
        help="Path to the game directory (must contain index.html)"
    )

    parser.add_argument(
        "--observation-type",
        choices=["state", "pixels"],
        default="state",
        help="Observation type: 'state' for structured observations (default), 'pixels' for screenshots"
    )

    parser.add_argument(
        "--model",
        default="anthropic:claude-4.5-sonnet",
        help="Model to use (default: anthropic:claude-4.5-sonnet)"
    )

    parser.add_argument(
        "--debug-prompts",
        action="store_true",
        help="Save prompts to game_dir/evaluation/prompts/"
    )

    parser.add_argument(
        "--no-update-html",
        action="store_true",
        help="Don't automatically add gym_api.js to index.html"
    )

    parser.add_argument(
        "--no-modify-game-js",
        action="store_true",
        help="Don't modify game.js to add RL control hooks"
    )

    parser.add_argument(
        "--no-template",
        action="store_true",
        help="Don't use template-based generation (use legacy mode)"
    )

    args = parser.parse_args()

    # Validate game directory
    game_dir = Path(args.game_dir)
    if not game_dir.exists():
        print(f"❌ Error: Game directory not found: {game_dir}")
        sys.exit(1)

    if not (game_dir / "index.html").exists():
        print(f"❌ Error: No index.html found in {game_dir}")
        sys.exit(1)

    print(f"\n🎮 Gym API Generator")
    print(f"{'=' * 60}\n")
    print(f"Game: {game_dir.name}")
    print(f"Observation type: {args.observation_type}")
    print(f"Model: {args.model}\n")

    # Initialize iterator
    print(f"🔍 Analyzing game structure...")

    try:
        iterator = GymAPIIterator(
            model=args.model,
            temperature=0.7,
            thinking=True,
            thinking_budget=10000,
            use_template=not args.no_template,
        )
    except Exception as e:
        print(f"❌ Error initializing iterator: {e}")
        sys.exit(1)

    # Generate gym_api.js using 3-phase approach
    print(f"🤖 Starting 3-phase Gym API generation...")
    if args.no_template:
        print(f"   (using legacy mode without template)")
    print(f"   (this may take 1-2 minutes...)\n")

    try:
        result = iterator.iterate(
            game_dir=str(game_dir),
            observation_type=args.observation_type,
            debug_prompts=args.debug_prompts,
            update_html=not args.no_update_html,
            modify_game_js=not args.no_modify_game_js,
        )
    except Exception as e:
        print(f"\n❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Display config summary
    config = result.get("config")
    if config:
        print(f"\n📋 Generated Configuration:")
        print(f"   Game: {config.get('game_name', 'unknown')}")
        print(f"   Actions: {config['action_space']['n']} ({', '.join(config['action_space'].get('labels', []))})")
        print(f"   Observations: {config['observation_space']['shape'][0]} dimensions")
        print(f"   Max episode steps: {config.get('max_episode_steps', 10000)}")
        print()

    # Display results
    files_created = result.get("files_created", [])

    if files_created:
        print(f"✨ Created files:")
        for file in files_created:
            print(f"   • {file}")
        print()
    else:
        print(f"⚠️  No files were created. Check the LLM response.\n")

    # Next steps
    print(f"✅ Done!\n")
    print(f"{'=' * 60}")
    print(f"Next steps:")
    print(f"  1. Test the game in browser to ensure it still works")
    print(f"  2. Use gym_wrapper.py to create a Gym environment:")
    print(f"     from gym_wrapper import P5GameEnv")
    print(f'     env = P5GameEnv(game_name="{game_dir.name}")')
    print(f"  3. Train an RL agent using the environment\n")

    if args.debug_prompts:
        print(f"📁 Debug prompts saved to: {game_dir}/evaluation/prompts/\n")


if __name__ == "__main__":
    main()

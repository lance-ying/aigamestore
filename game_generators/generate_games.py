from typing import Optional, List, Dict, Any
import argparse
from pathlib import Path

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from game_generators.game_generator import GameGenerator
from game_generators.utils import GREEN, YELLOW, RED, BLUE, RESET


def generate_game(
    method: str,
    genre: str,
    num_players: int,
    model: str = "openai:gpt-4",
    narratives: Optional[str] = None,
    debug: bool = False,
) -> Path:
    """
    Generate a game using the specified method and model

    Args:
        method: Game generation method to use
        genre: Game genre
        num_players: Number of players
        model: AI model to use
        narratives: Optional narrative constraints
        debug: Whether to print debug information

    Returns:
        Path: Path to the generated game directory
    """
    try:
        # Initialize game generator
        generator = GameGenerator(method_name=method, model_name=model)

        # Generate the game
        html_code, js_files, title, description, _ = generator.generate_game(
            genre=genre, num_players=num_players, narratives=narratives, debug=debug
        )

        if debug:
            print(f"\n{GREEN}Successfully generated game:{RESET}")
            print(f"{BLUE}Title:{RESET} {title}")
            print(f"{BLUE}Description:{RESET} {description}")

        # Return the game directory path
        return (
            Path("games")
            / method
            / model.split(":")[1]
            / genre
            / title.lower().replace(" ", "_")
        )

    except Exception as e:
        print(f"{RED}Error generating game: {str(e)}{RESET}")
        raise


def main():
    """Command line interface for game generation"""
    parser = argparse.ArgumentParser(
        description="Generate games using various methods and models"
    )

    parser.add_argument(
        "--method",
        type=str,
        choices=[
            "conversation",
            "character_driven",
            "judge_conversation",
            "simple_prompt",
            "guide_complexity",
        ],
        default="simple_prompt",
        help="Game generation method to use",
    )

    parser.add_argument(
        "--genre",
        type=str,
        choices=[
            "action",
            "arcade",
            "platformer",
            "sports",
            "stealth",
            "strategy",
            "puzzle",
            "shooting",
            "racing",
            "adventure",
        ],
        default="arcade",
        help="Game genre",
    )

    parser.add_argument(
        "--players", type=int, default=2, help="Number of players (including AI agents)"
    )

    parser.add_argument(
        "--model",
        type=str,
        default="openai:gpt-4o",
        choices=[
            "openai:gpt-4",
            "openai:gpt-4o",
            "openai:o3-mini",
            "anthropic:claude-3.5-sonnet",
            "anthropic:claude-3.5-haiku",
            "anthropic:claude-3.7-sonnet",
            "gemini:1.5-pro",
            "gemini:1.5-flash",
        ],
        help="LLM to use",
    )

    parser.add_argument(
        "--narratives",
        type=str,
        help="Optional narrative constraints or story elements",
    )

    parser.add_argument("--debug", action="store_true", help="Enable debug output")

    args = parser.parse_args()

    try:
        game_path = generate_game(
            method=args.method,
            genre=args.genre,
            num_players=args.players,
            model=args.model,
            narratives=args.narratives,
            debug=args.debug,
        )
        print(f"\n{GREEN}Game generated successfully at: {game_path}{RESET}")

    except Exception as e:
        print(f"\n{RED}Failed to generate game: {str(e)}{RESET}")
        exit(1)


if __name__ == "__main__":
    main()

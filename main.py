from typing import Optional, List, Dict, Any
import argparse
from pathlib import Path

from game_generators.game_generator import GameGenerator
from game_generators.character_driven_game_generator import (
    CharacterDrivenGameGenerator,
)
import json
from game_generators.utils import GREEN, YELLOW, RED, BLUE, RESET
import random

ROOT_DIR = Path(__file__).parent


def get_narrative(narrative_path: Path) -> str:
    """
    Get narrative content from either existing_games or generative_games directories

    Args:
        narrative_path: Path to the narrative file. If just a filename is provided,
                       will check both existing_games and generative_games directories.

    Returns:
        str: Content of the narrative file
    """
    # If full path is provided and exists, use it directly
    if narrative_path.exists():
        if "existing_games" in str(narrative_path):
            with open(narrative_path, "r") as f:
                json_data = json.load(f)
                return json_data["description"]
        elif "generative_games" in str(narrative_path):
            with open(narrative_path, "r") as f:
                json_data = json.load(f)
                return json_data["concept"]

    # If path contains directory info but file doesn't exist
    raise FileNotFoundError(f"Narrative file not found at {narrative_path}")


def generate_game(
    method: str,
    model: str = "openai:gpt-4o",
    narrative: Optional[str] = None,
    narrative_path: Optional[str] = None,
    verbose: bool = False,
) -> Path:
    """
    Generate a game using the specified method and model

    Args:
        method: Game generation method to use
        genre: Game genre
        num_players: Number of players
        model: AI model to use
        narratives: Optional narrative constraints
        verbose: Whether to print verbose information

    Returns:
        Path: Path to the generated game directory
    """
    try:
        # Initialize game generator
        if method == "character_driven":
            generator = CharacterDrivenGameGenerator(
                method_name=method, model_name=model, verbose=verbose
            )
        else:
            generator = GameGenerator(
                method_name=method, model_name=model, verbose=verbose
            )

        # Generate the game
        title = generator.generate_game(
            narrative=narrative, narrative_path=narrative_path
        )

        if verbose:
            print(f"\n{GREEN}Successfully generated game:{RESET}")
            print(f"{BLUE}Title:{RESET} {title}")

        # Return the game directory path
        if narrative_path:
            return (
                Path("games")
                / method
                / model.split(":")[1]
                / narrative_path.split("/")[-1].replace(".json", "")
                / f"{title.lower().replace(' ', '_')}"
            )
        else:
            return (
                Path("games")
                / method
                / model.split(":")[1]
                / f"{title.lower().replace(' ', '_')}"
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
            # "conversation",
            # "character_driven",
            # "template",
            "judge",
            "simple_prompt",
            "instruction_simple_prompt",
            "complexity_guide",
        ],
        default="simple_prompt",
        help="Game generation method to use",
    )

    parser.add_argument(
        "--model",
        type=str,
        default="openai:o4-mini",
        choices=[
            "openai:gpt-4o",
            "openai:o3-mini",
            "openai:o4-mini",
            "anthropic:claude-3.5-sonnet",
            "anthropic:claude-3.7-sonnet",
            "google:gemini-2.0-flash",
        ],
        help="LLM to use",
    )

    parser.add_argument(
        "--narratives",
        type=str,
        default="generative_games/new_games/google_gemini-2.0-flash/game_0000.json",
        help="Optional narrative constraints or story elements",
    )

    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    try:
        narratives_text = get_narrative(
            Path(ROOT_DIR / "game_prompts" / args.narratives)
        )

        game_path = generate_game(
            method=args.method,
            model=args.model,
            narrative=narratives_text,
            narrative_path=args.narratives,
            verbose=args.verbose,
        )
        print(f"\n{GREEN}Game generated successfully at: {game_path}{RESET}")

        # TODO: Run the game to check if pressing Enter works
        

    except Exception as e:
        print(f"\n{RED}Failed to generate game: {str(e)}{RESET}")
        exit(1)


if __name__ == "__main__":
    main()

import os
import argparse
from pathlib import Path
from game_generators.conv_gamegen import ConversationGameGen

VALID_GENRES = [
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
]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate a game using conversational AI"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="openai:o3-mini",
        help="Model to use (format: provider:model, e.g. openai:gpt-4, claude:claude-3-haiku, gemini:gemini-1.5-flash)",
    )
    parser.add_argument(
        "--genre",
        type=str,
        default="arcade",
        choices=VALID_GENRES,
        help="Genre of the game",
    )
    parser.add_argument(
        "--num-players", type=int, default=1, help="Number of players/agents"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="generated_games",
        help="Output directory for generated games",
    )
    parser.add_argument(
        "--config-path",
        type=str,
        default="config/gamegen/base_prompt.yaml",
        help="Path to configuration YAML file",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Create output directory if it doesn't exist
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Initialize the generator
        generator = ConversationGameGen(
            config_path=args.config_path, model_name=args.model
        )

        print(f"\nGenerating {args.genre} game with {args.num_players} players...")
        print(f"Using model: {args.model}")
        print("\nStarting conversation phase...")

        # Generate the game
        html_code, js_files, title, description, full_response = (
            generator.generate_game(genre=args.genre, num_players=args.num_players)
        )
        print(f"\nGame generation complete!")
        print(f"Title: {title}")

    except Exception as e:
        print(f"\nError during game generation: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()

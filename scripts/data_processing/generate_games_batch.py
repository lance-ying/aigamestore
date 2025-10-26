"""
Script to generate games directly from games.csv descriptions without expansion.

This script:
1. Reads games from games.csv
2. Creates minimal concept files with just the original description
3. Generates games using either matter_gen.yaml or p5_gen.yaml based on the 'matter?' column
4. All games are generated under the same game_index as different samples

This allows comparison between expanded concepts vs. direct generation from descriptions.

Usage:
    uv run python generate_games_batch.py
"""
# /// script
# dependencies = ["pyyaml", "anthropic", "openai", "playwright"]
# ///

import csv
import json
import os
import subprocess
from pathlib import Path
from typing import Dict


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


def create_minimal_concept(game_name: str, genre: str, description: str) -> Dict:
    """Create a minimal concept file with just the original description."""
    return {
        "game_name": game_name,
        "genre": genre,
        "description": description
    }


def generate_game(concept_file: Path, config_file: str, game_index: int, sample_num: int) -> bool:
    """Generate a game using the generate_game.py script."""
    try:
        cmd = [
            "uv", "run", "python", "generate_game.py",
            "--config", config_file,
            "--concept", str(concept_file),
            "--no-testing",
            "--game_index", str(game_index),
            "--output_folder", f"sample_{sample_num}"
        ]

        print(f"  Running: {' '.join(cmd)}")
        # Don't capture output - let it stream to console in real-time
        result = subprocess.run(cmd, timeout=600)

        if result.returncode == 0:
            print(f"  ✓ Game generated successfully")
            return True
        else:
            print(f"  ✗ Game generation failed with exit code {result.returncode}")
            return False

    except subprocess.TimeoutExpired:
        print(f"  ✗ Game generation timed out after 10 minutes")
        return False
    except Exception as e:
        print(f"  ✗ Error running generate_game.py: {e}")
        return False


def main(
    input_csv: str = "games.csv",
    concepts_dir: str = "game_concepts/csv_games_direct",
    game_index: int = 1235,
    start_from: int = 0,
    max_games: int = None
):
    """
    Main function to generate games directly from descriptions.

    Args:
        input_csv: Path to input CSV file
        concepts_dir: Directory to save minimal concept files
        game_index: Game index to use for all games (they'll be different samples)
        start_from: Index to start from (for resuming)
        max_games: Maximum number of games to process (None for all)
    """
    print("=" * 60)
    print("Direct Game Generation Pipeline (No Expansion)")
    print("=" * 60)

    # Create concepts directory
    concepts_path = Path(concepts_dir)
    concepts_path.mkdir(parents=True, exist_ok=True)

    print(f"\nReading games from {input_csv}...")
    games = []

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            games.append(row)

    print(f"Found {len(games)} games")

    if start_from > 0:
        print(f"Starting from game {start_from}")

    if max_games is not None:
        games_to_process = games[start_from:start_from + max_games]
        print(f"Limiting to {max_games} games")
    else:
        games_to_process = games[start_from:]

    # Statistics
    stats = {
        'total': len(games_to_process),
        'generated': 0,
        'failed': 0
    }

    print(f"\nAll games will be generated under game_index {game_index} as different samples")
    print(f"Starting processing...\n")

    for i, game in enumerate(games_to_process, start=start_from):
        game_name = game.get('game name', 'Unknown')
        genre = game.get('genre', '')
        description = game.get('description', '')
        use_matter = game.get('matter?', 'no').lower().strip() == 'yes'

        print(f"\n{'=' * 60}")
        print(f"[{i + 1}/{len(games)}] Processing: {game_name}")
        print(f"  Genre: {genre}")
        print(f"  Physics Engine: {'Matter.js' if use_matter else 'p5.js only'}")
        print(f"{'=' * 60}")

        # Create minimal concept file (no expansion)
        print(f"\n  Creating minimal concept file...")
        minimal_concept = create_minimal_concept(game_name, genre, description)

        # Save minimal concept
        concept_file = concepts_path / f"game_{i:04d}_{game_name.replace(' ', '_').replace(':', '')[:30]}.json"
        with open(concept_file, 'w', encoding='utf-8') as f:
            json.dump(minimal_concept, f, indent=2)

        print(f"  ✓ Minimal concept saved to {concept_file}")

        # Generate game
        print(f"\n  Generating game...")
        config_file = "configs/generators/matter_gen.yaml" if use_matter else "configs/generators/p5_gen.yaml"
        sample_num = i

        success = generate_game(concept_file, config_file, game_index, sample_num)

        if success:
            stats['generated'] += 1
        else:
            stats['failed'] += 1

    # Final summary
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"\nStatistics:")
    print(f"  Total games: {stats['total']}")
    print(f"  Successfully generated: {stats['generated']}")
    print(f"  Failed generation: {stats['failed']}")
    print(f"\nAll games saved under game_index {game_index}")
    print(f"Minimal concepts saved to: {concepts_dir}/")
    print(f"Generated games saved to: games/single_prompt_with_testing/game_{game_index}/")


if __name__ == "__main__":
    import argparse

    print("Script starting...")  # Debug output

    parser = argparse.ArgumentParser(
        description="Generate games directly from descriptions without expansion"
    )
    parser.add_argument(
        '--input',
        default='games.csv',
        help='Input CSV file path'
    )
    parser.add_argument(
        '--concepts-dir',
        default='game_concepts/csv_games_direct',
        help='Directory to save minimal concept files'
    )
    parser.add_argument(
        '--game-index',
        type=int,
        default=1235,
        help='Game index to use for all games (default: 1235, different from expanded version)'
    )
    parser.add_argument(
        '--start-from',
        type=int,
        default=0,
        help='Index to start from (for resuming, default: 0)'
    )
    parser.add_argument(
        '--max-games',
        type=int,
        default=None,
        help='Maximum number of games to process (default: all)'
    )

    args = parser.parse_args()

    main(
        input_csv=args.input,
        concepts_dir=args.concepts_dir,
        game_index=args.game_index,
        start_from=args.start_from,
        max_games=args.max_games
    )

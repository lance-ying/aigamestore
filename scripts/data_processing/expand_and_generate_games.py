"""
Script to expand game descriptions using Gemini and generate games.

This script:
1. Reads games from games.csv
2. Uses Gemini Flash 2.5 to expand each game description into detailed implementation specs
3. Saves expanded concepts as JSON files
4. Generates games using either matter_gen.yaml or p5_gen.yaml based on the 'matter?' column
5. All games are generated under the same game_index (1234) as different samples

Usage:
    uv run python expand_and_generate_games.py
"""
# /// script
# dependencies = ["google-generativeai", "pyyaml", "anthropic", "openai", "playwright"]
# ///

import csv
import json
import os
import sys
import time
import subprocess
from pathlib import Path
from typing import Dict
import google.generativeai as genai

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

# Get Gemini API key from environment
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")


def configure_gemini(api_key: str):
    """Configure Gemini API with the provided key."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')


def create_expansion_prompt(game_name: str, genre: str, description: str) -> str:
    """Create the expansion prompt for Gemini to convert description into detailed implementation specs."""
    return f"""You are a game implementation specialist. Convert this mobile game description into a detailed implementation specification for an HTML5 game using p5.js and/or Matter.js.

Game Name: {game_name}
Genre: {genre}

Original Description: {description}

Your task is to expand this description into a detailed implementation concept that includes:

1. **Core Mechanics** - Break down the exact mechanics in implementation terms:
   - What are the specific player actions and how are they triggered?
   - What are the exact rules and systems that govern gameplay?
   - What state needs to be tracked?

2. **Visual Elements** - Describe what needs to be rendered:
   - What game objects exist (player, enemies, items, UI elements)?
   - What are their visual representations (shapes, colors, sizes)?
   - What animations or visual effects are needed?

3. **Control Scheme** - Map to keyboard controls:
   - Which of these keys should be used: ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Space, Shift, Z, W, A, S, D
   - What does each key do?
   - Are there any special key combinations?

4. **Game States** - Define the game flow:
   - What are the different states (menu, playing, paused, game over, win)?
   - How does the player transition between states?
   - What triggers each state change?

5. **Win/Lose Conditions** - Be specific:
   - What exactly causes the player to win?
   - What exactly causes the player to lose?
   - Are there score/point systems?

6. **Scoring System** - REQUIRED for every game:
   - What actions give points? (Be specific: e.g., +10 per enemy killed, +100 per level completed)
   - Are there bonus points or multipliers?
   - Is there a high score system?
   - How should the score be displayed on screen? (Position and format)
   - Does the score affect gameplay in any way?

7. **Level System** - REQUIRED for every game:
   - Define at least 3-5 levels with increasing difficulty
   - How does each level differ from the previous? (Be specific: more enemies, faster speed, more obstacles, etc.)
   - How does the player advance to the next level?
   - What is displayed when transitioning between levels?
   - Is there a level indicator shown on screen?

8. **Simplifications** - Note what to simplify from the original:
   - What complex features should be simplified for HTML5?
   - What multiplayer features should become single-player only?
   - What can be abstracted or made simpler?

IMPORTANT REQUIREMENTS:
- Every game MUST have a scoring system with points displayed on screen. Even puzzle games should award points for completion time, moves taken, or other metrics.
- Every game MUST have levels (NO endless games). The game should have at least 3-5 levels with progressively increasing difficulty.
- Levels should differ in meaningful ways (speed, enemy count, obstacle density, complexity, etc.) based on the game's design.

Respond with a JSON object in this exact format:
{{
    "game_name": "{game_name}",
    "genre": "{genre}",
    "core_mechanics": "Detailed explanation of core mechanics in implementation terms",
    "visual_elements": "Description of all visual elements and how they should be rendered",
    "control_scheme": "Specific keyboard mappings and what each key does",
    "game_states": "Description of all game states and transitions",
    "win_conditions": "Exact win conditions",
    "lose_conditions": "Exact lose conditions",
    "scoring_system": "Detailed scoring system with specific point values and display location",
    "level_system": "Description of at least 3-5 levels with specific difficulty progressions",
    "simplifications": "What was simplified from the original description",
    "implementation_notes": "Any additional important implementation details including score display and level progression requirements"
}}

Respond ONLY with the JSON object, no additional text."""


def expand_game_concept(model, game_name: str, genre: str, description: str, max_retries: int = 3) -> Dict:
    """Expand a game description into detailed implementation specs using Gemini."""
    prompt = create_expansion_prompt(game_name, genre, description)

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            expanded_concept = json.loads(response_text)
            return expanded_concept

        except json.JSONDecodeError as e:
            print(f"  Error parsing JSON for {game_name}: {e}")
            print(f"  Response was: {response_text[:200] if 'response_text' in locals() else 'N/A'}...")
            if attempt < max_retries - 1:
                print(f"  Retrying... ({attempt + 1}/{max_retries})")
                time.sleep(2)
                continue
            else:
                return None

        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                wait_time = (attempt + 1) * 30
                print(f"  Rate limit hit. Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            else:
                print(f"  Error expanding {game_name}: {e}")
                if attempt < max_retries - 1:
                    print(f"  Retrying... ({attempt + 1}/{max_retries})")
                    time.sleep(2)
                    continue
                else:
                    return None

    return None


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
        # This prevents hanging and lets you see progress
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
    concepts_dir: str = "game_concepts/csv_games",
    game_index: int = 1234,
    delay_seconds: float = 2.0,
    start_from: int = 0,
    max_games: int = None
):
    """
    Main function to expand and generate games.

    Args:
        input_csv: Path to input CSV file
        concepts_dir: Directory to save expanded concepts
        game_index: Game index to use for all games (they'll be different samples)
        delay_seconds: Delay between API calls to avoid rate limiting
        start_from: Index to start from (for resuming)
        max_games: Maximum number of games to process (None for all)
    """
    print("=" * 60)
    print("Game Expansion and Generation Pipeline")
    print("=" * 60)

    # Create concepts directory
    concepts_path = Path(concepts_dir)
    concepts_path.mkdir(parents=True, exist_ok=True)

    print(f"\nConfiguring Gemini API...")
    model = configure_gemini(GEMINI_API_KEY)

    print(f"Reading games from {input_csv}...")
    games = []

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            games.append(row)

    print(f"Found {len(games)} games")

    if start_from > 0:
        games = games[start_from:]
        print(f"Starting from game {start_from}")

    if max_games is not None:
        games = games[:max_games]
        print(f"Limiting to {max_games} games")

    # Statistics
    stats = {
        'total': len(games),
        'expanded': 0,
        'generated': 0,
        'failed_expansion': 0,
        'failed_generation': 0
    }

    print(f"\nAll games will be generated under game_index {game_index} as different samples")
    print(f"Starting processing...\n")

    for i, game in enumerate(games, start=start_from):
        game_name = game.get('game name', 'Unknown')
        genre = game.get('genre', '')
        description = game.get('description', '')
        use_matter = game.get('matter?', 'no').lower().strip() == 'yes'

        print(f"\n{'=' * 60}")
        print(f"[{i + 1}/{start_from + len(games)}] Processing: {game_name}")
        print(f"  Genre: {genre}")
        print(f"  Physics Engine: {'Matter.js' if use_matter else 'p5.js only'}")
        print(f"{'=' * 60}")

        # Step 1: Expand concept
        print(f"\n  Step 1: Expanding game concept with Gemini...")
        expanded_concept = expand_game_concept(model, game_name, genre, description)

        if expanded_concept is None:
            print(f"  ✗ Failed to expand concept, skipping game generation")
            stats['failed_expansion'] += 1
            continue

        stats['expanded'] += 1

        # Save expanded concept
        concept_file = concepts_path / f"game_{i:04d}_{game_name.replace(' ', '_').replace(':', '')[:30]}.json"
        with open(concept_file, 'w', encoding='utf-8') as f:
            json.dump(expanded_concept, f, indent=2)

        print(f"  ✓ Concept expanded and saved to {concept_file}")

        # Step 2: Generate game
        print(f"\n  Step 2: Generating game...")
        config_file = "configs/generators/matter_gen.yaml" if use_matter else "configs/generators/p5_gen.yaml"
        sample_num = i

        success = generate_game(concept_file, config_file, game_index, sample_num)

        if success:
            stats['generated'] += 1
        else:
            stats['failed_generation'] += 1

        # Rate limiting
        if i < start_from + len(games) - 1:
            print(f"\n  Waiting {delay_seconds} seconds before next game...")
            time.sleep(delay_seconds)

    # Final summary
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"\nStatistics:")
    print(f"  Total games: {stats['total']}")
    print(f"  Successfully expanded: {stats['expanded']}")
    print(f"  Successfully generated: {stats['generated']}")
    print(f"  Failed expansion: {stats['failed_expansion']}")
    print(f"  Failed generation: {stats['failed_generation']}")
    print(f"\nAll games saved under game_index {game_index}")
    print(f"Expanded concepts saved to: {concepts_dir}/")
    print(f"Generated games saved to: games/single_prompt_with_testing/game_{game_index}/")


if __name__ == "__main__":
    import argparse
    
    print("Script starting...")  # Debug output

    parser = argparse.ArgumentParser(
        description="Expand game descriptions and generate games"
    )
    parser.add_argument(
        '--input',
        default='games.csv',
        help='Input CSV file path'
    )
    parser.add_argument(
        '--concepts-dir',
        default='game_concepts/csv_games',
        help='Directory to save expanded concepts'
    )
    parser.add_argument(
        '--game-index',
        type=int,
        default=1234,
        help='Game index to use for all games (default: 1234)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=2.0,
        help='Delay in seconds between API calls (default: 2.0)'
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
        delay_seconds=args.delay,
        start_from=args.start_from,
        max_games=args.max_games
    )

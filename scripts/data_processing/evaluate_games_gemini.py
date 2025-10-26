"""
Script to evaluate games from CSV using Gemini Flash 2.5.

This script reads games from 'Crawled Games - US.csv' and uses Google's Gemini API
to determine if each game is a good candidate for the game generator prompt.

Criteria:
1. Does not require too complex simulation
2. Graphics can be simplified while keeping core mechanics intact

Usage:
    uv run evaluate_games_gemini.py
"""
# /// script
# dependencies = ["google-generativeai"]
# ///

import csv
import os
import time
from typing import Dict
import json
import google.generativeai as genai


def configure_gemini(api_key: str):
    """Configure Gemini API with the provided key."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')


def create_evaluation_prompt(game_name: str, genre: str, description: str) -> str:
    """Create the evaluation prompt for Gemini."""
    return f"""You are evaluating whether a mobile game is a good candidate for an HTML5 game generator.

Game Name: {game_name}
Genre: {genre}

Game Description: {description}

Evaluation Criteria:
1. The game should be reasonably implementable - Not trivially simple, but also not requiring months of development. A good middle ground.
2. Physics is ACCEPTABLE - We have access to Matter.js physics engine, so 2D physics-based games (gravity, collisions, rigid body dynamics) are fine. Only reject if it requires highly complex 3D physics or fluid dynamics.
3. The graphics CAN be simplified while keeping the core mechanics intact - 3D games can be converted to 2D (Minecraft → Terraria-style), complex graphics can use simple sprites/shapes
4. The core gameplay loop should be implementable with standard web technologies (HTML/CSS/JavaScript + Matter.js for physics)
5. For multiplayer games: Consider if the core gameplay is still viable as single-player, OR if opponent players can be replaced with simple rule-based AI bots, OR if minimal changes would make it work as single-player. DO NOT reject solely because multiplayer is mentioned.
6. Complex systems are OK if they can be simplified - Don't reject games just because they have progression, crafting, or multiple mechanics. Consider if a simplified version would still be fun.

Examples of GOOD candidates:
- Card games (Solitaire, UNO, poker) where opponents can be simple AI
- Puzzle games (match-3, tile matching, word search, block puzzles, brain teasers)
- Physics puzzles (Angry Birds-style, Cut the Rope-style)
- 2D platformers with various mechanics (Mario-style, Sonic-style)
- Rhythm games with tap timing
- Arcade games (Snake, Pac-Man-style, shooters like Space Invaders)
- Racing games (top-down or side-view)
- Turn-based strategy games
- Tower defense games
- Sandbox/crafting games if simplified to 2D (Minecraft → Terraria-style, simple crafting systems)
- Simple farming/management games (basic resource gathering and building)
- Endless runners

Examples of BAD candidates (truly too complex):
- Complex real-time multiplayer requiring server architecture and low-latency networking
- MMOs requiring persistent online world with many concurrent players
- Games requiring realistic 3D graphics that cannot be simplified to 2D
- Games entirely dependent on social features or player trading as the core mechanic
- Extremely complex simulations (like full city simulators with detailed economics, traffic, utilities)
- Games requiring large amounts of unique content (100+ unique levels with custom design)
- Games with extremely intricate mechanics that cannot be simplified (complex fighting games with frame-perfect combos)

Please evaluate this game and respond with a JSON object in the following format:
{{
    "is_good_candidate": true/false,
    "confidence": "high/medium/low",
    "reasoning": "Brief explanation of your decision"
}}

Respond ONLY with the JSON object, no additional text."""


def evaluate_game(model, game_name: str, genre: str, description: str, max_retries: int = 3) -> Dict:
    """Evaluate a single game using Gemini with retry logic."""
    prompt = create_evaluation_prompt(game_name, genre, description)

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)

            # Extract JSON from response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            evaluation = json.loads(response_text)
            return evaluation

        except json.JSONDecodeError as e:
            print(f"Error parsing JSON for {game_name}: {e}")
            print(f"Response was: {response.text}")
            return {
                "is_good_candidate": False,
                "confidence": "low",
                "reasoning": f"Error parsing response: {str(e)}"
            }
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                # Rate limit hit - wait longer
                wait_time = (attempt + 1) * 30  # 30, 60, 90 seconds
                print(f"  Rate limit hit. Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            else:
                print(f"Error evaluating {game_name}: {e}")
                return {
                    "is_good_candidate": False,
                    "confidence": "low",
                    "reasoning": f"Error during evaluation: {str(e)}"
                }

    # All retries failed
    return {
        "is_good_candidate": False,
        "confidence": "low",
        "reasoning": "Failed after multiple retries due to rate limiting"
    }


def main(
    api_key: str,
    input_csv: str = "Crawled Games - US.csv",
    output_csv: str = "evaluated_games.csv",
    max_games: int = None,
    delay_seconds: float = 1.0
):
    """
    Main function to evaluate games.

    Args:
        api_key: Gemini API key
        input_csv: Path to input CSV file
        output_csv: Path to output CSV file
        max_games: Maximum number of games to evaluate (None for all)
        delay_seconds: Delay between API calls to avoid rate limiting
    """
    print("Configuring Gemini API...")
    model = configure_gemini(api_key)

    print(f"Reading games from {input_csv}...")
    games = []

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            games.append(row)

    print(f"Found {len(games)} games")

    if max_games:
        games = games[:max_games]
        print(f"Limiting to {max_games} games")

    # Prepare output file - only gemini evaluation fields
    output_fields = [
        'rank', 'name', 'genre', 'description',
        'is_good_candidate', 'confidence', 'reasoning'
    ]

    print(f"Starting evaluation... (writing results to {output_csv})")

    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=output_fields)
        writer.writeheader()

        for i, game in enumerate(games, 1):
            game_name = game.get('name', 'Unknown')
            genre = game.get('genre', '')
            description = game.get('description', '')

            print(f"\n[{i}/{len(games)}] Evaluating: {game_name}")

            evaluation = evaluate_game(model, game_name, genre, description)

            # Combine game info with evaluation (only 3 output fields from Gemini)
            output_row = {
                'rank': game.get('rank', ''),
                'name': game_name,
                'genre': genre,
                'description': description,
                **evaluation
            }

            writer.writerow(output_row)
            f.flush()  # Ensure data is written immediately

            result = "✓ GOOD" if evaluation['is_good_candidate'] else "✗ NOT GOOD"
            print(f"  Result: {result} (confidence: {evaluation['confidence']})")
            print(f"  Reasoning: {evaluation['reasoning'][:100]}...")

            # Rate limiting
            if i < len(games):
                time.sleep(delay_seconds)

    print(f"\n{'='*60}")
    print(f"Evaluation complete! Results saved to {output_csv}")

    # Summary statistics
    with open(output_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        results = list(reader)

        total = len(results)
        good_candidates = sum(1 for r in results if r['is_good_candidate'] == 'True')

        print(f"\nSummary:")
        print(f"  Total games evaluated: {total}")
        print(f"  Good candidates: {good_candidates} ({good_candidates/total*100:.1f}%)")
        print(f"  Not suitable: {total - good_candidates} ({(total-good_candidates)/total*100:.1f}%)")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Evaluate games using Gemini Flash 2.5"
    )
    parser.add_argument(
        '--api-key',
        required=True,
        help='Gemini API key'
    )
    parser.add_argument(
        '--input',
        default='Crawled Games - US.csv',
        help='Input CSV file path'
    )
    parser.add_argument(
        '--output',
        default='evaluated_games.csv',
        help='Output CSV file path'
    )
    parser.add_argument(
        '--max-games',
        type=int,
        default=None,
        help='Maximum number of games to evaluate (default: all)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=4.0,
        help='Delay in seconds between API calls (default: 4.0 to avoid rate limits)'
    )

    args = parser.parse_args()

    main(
        api_key=args.api_key,
        input_csv=args.input,
        output_csv=args.output,
        max_games=args.max_games,
        delay_seconds=args.delay
    )

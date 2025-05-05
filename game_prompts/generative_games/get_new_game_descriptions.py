#!/usr/bin/env python3
"""
This script generates new game descriptions using different AI models.
The generated game descriptions are saved in JSON format in the 'new_games/' directory.
Unlike existing games, these are completely new game concepts without control mappings.
Supports OpenAI, Claude, and Gemini models through the ModelAPI interface.
"""

from doctest import Example
import os
import json
import argparse
import re
import time
import random
import sys
import glob
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add parent directory to path for imports
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# Import the ModelAPI from utils
from game_generators.utils import ModelAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Rate limiting constants
MIN_WAIT_TIME = 1  # Minimum wait time in seconds
MAX_WAIT_TIME = 3  # Maximum wait time in seconds
RATE_LIMIT_WAIT = 60  # Wait time in seconds when hitting rate limit
MAX_CONCEPTS_PER_BATCH = 100

# Game genres to generate
GENRES = [
    "Action",
    "Adventure",
    "Arcade",
    "Fighting",
    "Platformer",
    "Racing",
    "Shooter",
    "Survival",
]


def ensure_dir(directory: str) -> None:
    """Ensure that the directory exists."""
    Path(directory).mkdir(parents=True, exist_ok=True)


def load_existing_games(games_dir: str, max_games: int = -1) -> List[Dict[str, Any]]:
    """
    Load previously generated game descriptions.

    Args:
        games_dir: Directory containing game JSON files
        max_games: Maximum number of games to load

    Returns:
        List of game description dictionaries
    """
    game_files = glob.glob(os.path.join(games_dir, "*.json"))
    game_files.sort(
        key=lambda x: os.path.getmtime(x), reverse=True
    )  # Get most recent games first
    if max_games > len(game_files) or max_games < 0:
        max_games = len(game_files)

    game_archive = []
    for file_path in game_files[:max_games]:
        try:
            with open(file_path, "r") as f:
                game_data = json.load(f)
                game_archive.append(game_data)
        except Exception as e:
            print(f"Error loading game from {file_path}: {str(e)}")

    return game_archive


def generate_new_game_concept(
    api: ModelAPI,
    num_games: int = MAX_CONCEPTS_PER_BATCH,
    game_archive: List[Dict[str, Any]] = None,
    max_retries: int = 10,
    temperature: float = 0.7,
    # num_sentences: int = 3,
) -> List[Dict[str, Any]]:
    """
    Generate new game concepts using the specified model.

    Args:
        api: ModelAPI instance
        num_games: Number of game concepts to generate
        game_archive: List of previously generated games to avoid repeating
        max_retries: Maximum number of retries on rate limit or timeout errors
        temperature: Controls randomness in generation (0.0-1.0, higher = more creative)

    Returns:
        List[Dict]: A list of generated game descriptions as dictionaries
    """
    genre_list_str = ", ".join(GENRES)
    
    EXAMPLES = [
        "How about a game in space with amazing graphics showing planets, stars, and a spaceship.",
        "A game where winning means going as far as possible in a vertical platformer game evading clouds.",
        "Game with a player is stuck in a hotel and there might be a ghosts chasing. Turn the lights on and off to find the key to the door and save yourself from the ghosts.",
        "A frog jumps on lily pads and wooden logs, collecting all the flowers before reaching the end of the pond.",
        "Can you create a game with a plane that picks up packages and has to deliver them to the right place?",
        "A top-down view game where the player is a cat and has to catch the mice while avoiding the dogs.",
        "It would be interesting to play as a monkey leaping through a forest. The monkey has to collect bananas.",
        "Tanks are everywhere hiding in the bushes. The player controls a tank and has to shoot the other tanks while avoiding their fire.",
        "There are lasers in the room but you can spray fog to see them locally. The player has to navigate through to find the exit without getting caught by the lasers.",
        "What if there was a game where you shoot balloons moving up but you need to be careful not to shoot balloons which have a stone in it?",
        "Can we have a platformer game set in a space station with low gravity sections, asteroid fields, and airlock puzzles?",
        "Navigate through a prison avoiding the light towers trying to catch you. Beware of the guards!",
        "Control a helicopter through a city with tall buildings. Stay away from the birds.",
        "Make me a side-scrolling game controlling a ball. The ball can grow in size but beware of the spikes.",
        "I want to play a game driving a car on the wrong side of the road.",
    ]

    # Sample some examples to include in the prompt
    # example_sample = random.sample(EXAMPLES, min(20, len(EXAMPLES)))
    example_block = "\n".join(f'- "{e.strip()}"' for e in EXAMPLES)

    prompt = f"""
You are an extremely creative and imaginative game concept creator specializing in 2D JavaScript games using p5.js and p5.collide2d. Your strength is creating innovative game concepts that focus on a single distinctive element while leaving room for designers to expand upon.
You are going to create {num_games} original, innovative, and focused game concepts for single-player 2D games that most people will be able to play and enjoy when first played. Do not generate the entire game description but rather just a small slice of what the game should include, leave room for the game designer to expand upon the concept.

### Instructions:
- Generate truly original game concepts for which you can imagine a 2D game to be implemented in p5.js. 
- Each concept should highlight at least ONE unique aspect: a mechanic, environment, player ability, obstacle, goal, or rule
- You can vary the game elements, the game mechanics, the game setting, visual style or viewpoint - be creative
- Write in a way that inspires further creative development and expansion to a 2D game. DO NOT write in a way that it defines the entire game.

Here are examples of the style, format, and creativity level expected:
{example_block}

Please guide your game concepts keeping in mind the hard constraints the game developers will have while expanding on your game concept and implementing it in p5.js:
- No sound, music, or audio-related mechanics.
- No 3D graphics, rendering, or movement.
- No use of mouse, touch input, or complex UI. Only keyboard input.
- No sprites, images, external art, or visual effects beyond p5's shape drawing.
- No puzzle games, board-games, turn-based games, or any other genre outside of the ones listed.
- No complex animation systems, procedural world generation, or physics engines beyond p5 primitives.
- Use common game elements and objects in real life, make the game unique and interesting by combining them in a new way.
- Use commonly used terms and common nouns to describe the game concept. Feel free to use the tone and the style of the examples but do not plagiarize.

You should generate your interesting yet feasible game concepts for 2D JavaScript games in the following format:
```json
[
    {{
        "concept": "...",
        "genre": "...",
    }},
    {{
        "concept": "...",
        "genre": "...",
    }},
]
```
When creating your concepts:
- Choose 1-3 genres from: {genre_list_str}
- Write each concept in 1-3 concise sentences. Vary the number of sentences and the length of the sentences for each concept. There should be a third of the concepts in 1 sentence, a third in 2 sentences, and a third in 3 sentences.
- Keep changing your focus when writing each concept: theme, genre, mechanics, setting, character, rewards, obstacles, etc.
- Write with a unique personality for each concept varying your writing style across concepts (questions, suggestions, statements)
- Use casual, approachable language that sparks imagination. Use terms and nouns that most people are familiar with and can be easily understood by a wide audience.

"""

    retries = 0
    while retries <= max_retries:
        try:
            response = api.call(
                user_prompt=prompt,
                # system_prompt=system_prompt,
                # temperature=,
                verbose=True,  # Enable streaming to avoid timeouts for long requests
            )

            # Extract the JSON part from the response using regex
            match = re.search(r"```json\n(.*?)\n```", response, re.DOTALL)
            if not match:
                # Try without the newlines in case the model formats differently
                match = re.search(r"```json(.*?)```", response, re.DOTALL)

            if match:
                json_str = match.group(1).strip()
                game_descriptions = json.loads(json_str)

                # Return the list of games or wrap a single game in a list
                if isinstance(game_descriptions, list) and len(game_descriptions) > 0:
                    return game_descriptions
                elif isinstance(game_descriptions, dict):
                    # If the model returned a single game instead of a list
                    return [game_descriptions]
                else:
                    print(f"Unexpected response format from model")
                    return [
                        {
                            "concept": "Error: Unexpected response format from model",
                            "genre": "Genre of the game",
                        }
                    ]

        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error generating new game concepts: {error_msg}")
            retries += 1

            # Check if it's a rate limit error
            if any(
                term in error_msg for term in ["rate limit", "quota", "429", "too many"]
            ):
                wait_time = RATE_LIMIT_WAIT
                print(
                    f"Rate limit hit. Waiting {wait_time} seconds before retry {retries}/{max_retries}..."
                )
                time.sleep(wait_time)
            # Check if it's a timeout error
            elif any(term in error_msg for term in ["timeout", "deadline exceeded"]):
                wait_time = RATE_LIMIT_WAIT // 2
                print(
                    f"Timeout error. Waiting {wait_time} seconds before retry {retries}/{max_retries}..."
                )
                time.sleep(wait_time)
            # Other errors
            elif retries < max_retries:
                print(
                    f"Error generating game concept: {error_msg}. Retrying ({retries}/{max_retries})..."
                )
                time.sleep(MIN_WAIT_TIME)
            else:
                print(f"Failed after {max_retries} retries: {error_msg}")
                return [
                    {
                        "concept": f"Error generating game concept after {max_retries} retries: {error_msg}",
                        "genre": "Genre of the game",
                    }
                ]

    # If we've exhausted retries
    return [
        {
            "concept": f"Error: Maximum retries reached",
            "genre": "Genre of the game",
        }
    ]


def main(
    model_string: str,
    num_games: int = 5,
    temperature: float = 0.7,
    # num_sentences: int = 3,
):
    """
    Main function to generate new game concepts for each genre.
    The generated game concepts are saved in JSON format in the 'new_games/' directory.

    Args:
        model_string: Model specification in format "provider:model_name"
        num_games: Number of games to generate (will be generated in batches of 10)
        temperature: Controls randomness in generation (0.0-1.0, higher = more creative)
        num_sentences: Number of sentences for each game description
    """
    # Initialize model API
    try:
        api = ModelAPI(model_string)
        print(f"Using model: {model_string}")
    except Exception as e:
        print(f"Error initializing model: {str(e)}")
        print("Please make sure the required API keys are set in your .env file.")
        return
    MAX_CONCEPTS_PER_BATCH = 100
    # Extract model name for directory structure
    model_name = model_string.replace(":", "_")

    # Output directory structure
    base_dir = "./new_games"
    ensure_dir(base_dir)

    # Model-specific directory
    output_dir = os.path.join(base_dir, model_name)
    ensure_dir(output_dir)

    # Load existing games for context (to avoid repeating)
    # First try to load from the model-specific directory
    model_game_archive = load_existing_games(output_dir, max_games=200)
    print(f"Loaded {len(model_game_archive)} existing games from model-specific directory")

    # Then load from the base directory for backward compatibility
    base_game_archive = load_existing_games(base_dir, max_games=200)
    print(f"Loaded {len(base_game_archive)} existing games from base directory")
    
    # Combine the archives, prioritizing model-specific games
    game_archive = model_game_archive + [g for g in base_game_archive if g not in model_game_archive]
    print(f"Total unique games loaded for context: {len(game_archive)}")

    # Track total successful and failed generations
    total_success = 0
    total_failed = 0

    # Process each game
    generated_count = 0
    batch_count = 0
    if num_games < MAX_CONCEPTS_PER_BATCH:
        MAX_CONCEPTS_PER_BATCH = num_games

    while generated_count < num_games:
        batch_count += 1
        print(f"Generating batch #{batch_count} of {num_games} game concepts...")

        # Generate descriptions - now returns a list of games
        games_to_process = generate_new_game_concept(
            api,
            MAX_CONCEPTS_PER_BATCH,
            game_archive,
            temperature=temperature,
            # num_sentences=num_sentences,
        )

        for game_data in games_to_process:
            game_data["model"] = model_string
            # Check if generation was successful and if we still need more games
            if (
                "Error" not in game_data.get("concept", "")
                and generated_count < num_games
            ):
                total_success += 1
                generated_count += 1
                print(
                    f"  ✅ Generated game {generated_count}/{num_games}: {game_data['concept']}"
                )

                # Find the smallest unused game number and format with leading zeros
                existing_files = os.listdir(output_dir)
                existing_numbers = set()
                for filename in existing_files:
                    if filename.startswith("game_") and filename.endswith(".json"):
                        try:
                            num = int(
                                filename[5:-5]
                            )  # Extract number between "game_" and ".json"
                            existing_numbers.add(num)
                        except ValueError:
                            continue

                game_num = 0
                while game_num in existing_numbers:
                    game_num += 1

                output_file = os.path.join(output_dir, f"game_{game_num:04d}.json")

                with open(output_file, "w") as f:
                    json.dump(game_data, f, indent=2)

                print(
                    f"  Saved game concept to {model_name}/{os.path.basename(output_file)}"
                )

                # Add to archive for context in future generations
                game_archive.append(game_data)
                # if len(game_archive) > 50:
                #     game_archive = game_archive[1:]  # Keep only the most recent 50 games
            elif "Error" in game_data.get("concept", ""):
                total_failed += 1
                print(f"  ❌ Failed to generate game")

        # Add random wait time between requests to avoid rate limiting
        if generated_count < num_games:
            wait_time = random.uniform(MIN_WAIT_TIME, MAX_WAIT_TIME)
            print(f"  Waiting {wait_time:.2f} seconds before next request...")
            time.sleep(wait_time)

        print(
            f"Progress: {generated_count}/{num_games} - {total_success} successful, {total_failed} failed"
        )

    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate new game concepts using AI models"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="openai:o4-mini",
        help="Model to use in format 'provider:model_name' (e.g., 'openai:gpt-4o', 'anthropic:claude-3.7-sonnet', 'google:gemini-1.5-flash')",
    )
    parser.add_argument(
        "--num_games",
        type=int,
        default=100,
        help="Number of games to generate",
    )
    parser.add_argument(
        "--min_wait",
        type=float,
        default=2.0,
        help="Minimum wait time between requests in seconds",
    )
    parser.add_argument(
        "--max_wait",
        type=float,
        default=5.0,
        help="Maximum wait time between requests in seconds",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.0,
        help="Temperature for model generation (0.0-1.0, higher = more creative)",
    )
    # parser.add_argument(
    #     "--num_sentences",
    #     type=int,
    #     default=2,
    #     help="Number of sentences for each game description (2-5 recommended)",
    # )

    args = parser.parse_args()

    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait

    main(args.model, args.num_games, args.temperature)

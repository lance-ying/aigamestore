#!/usr/bin/env python3
"""
This script generates new game descriptions using different AI models.
The generated game descriptions are saved in JSON format in the 'new_games/' directory.
Unlike existing games, these are completely new game concepts without control mappings.
Supports OpenAI, Claude, and Gemini models through the ModelAPI interface.
"""

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
MAX_CONCEPTS_PER_BATCH = 50

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
        num_sentences: Number of sentences for each game description

    Returns:
        List[Dict]: A list of generated game descriptions as dictionaries
    """
    genre_list_str = ", ".join(GENRES)

    prompt = f"""
You are going to come up with {num_games} completely original and imaginative concepts for single-player 2D video games to be built in JavaScript using only the p5.js and p5.collide libraries.

Each concept must be:
- **Unique and creative**, clearly different from typical or existing game ideas. Avoid clichés or remixes of classic mazes, puzzles and board games.
- **Feasible to implement** with simple 2D shapes, bounding box collisions, and keyboard-only input. No sprites, audio, mouse, 3D, or puzzle logic.

When writing your concepts:
- Choose **1 to 3 genres** from this list: {genre_list_str}. Use a **varied and balanced mix** across the concepts.
- Imagine you are a **different person for each game idea** — someone with a distinct personality and taste in games. Let that voice come through in how the concept is described, but you don't necessarily need to introduce yourself.
- It is better to have common objects and elements in the game concepts, but make the game unique and interesting by combining them in a new way.
- You may focus on **any subset of gameplay elements**, such as movement mechanics, world rules, enemy behavior, reward systems, hazards, or player goals. You don’t need to describe all parts — highlight what matters and what makes the game unique.
- Vary the **level of abstraction**: some aspects should be described in concise but detailed way, while others can be described in a high-level way and leave room for interpretation.
- Keep each game concept short in 1-2 short sentences, and do **not include implementation details or visual styles** — leave those decisions to the engineer.
- 
"""

    EXAMPLES = [
        "How about developing a game where hidden dangers awaken only when motion occurs? The slightest movement should summon bats and spiders. The player has to navigate through the platform to reach the end.",
        "Make a game which is two rooms connected by a portal. The rooms are identical but have different colors. The player can switch between the rooms by passing through the portal.",
        "Think of a game where the character can switch between two different worlds. The worlds have different challenges and the player needs to navigate through both worlds to reach the end.",
        "Could you invent a game where color serves as a secret weapon? Switching hues should baffle relentless foes, turning combat into a vivid and strategic spectacle.",
        "Could you design a game where the power to rewrite physics is at the player's fingertips? Bend gravity, twist inertia, or warp time to overcome obstacles that defy conventional logic.",
        "How about a game where you balance on a unicycle and have to avoid obstacles and collect items?",
        "Can you generate a game related to a dog that needs to find its way home but lots of troubles and traps await?",
        "Could you build me a game where I swing between glowing jellyfish towers under a violet sea, sword in hand to rescue luminescent crabs? I imagine hidden currents that whisk me to secret reefs filled with ancient treasure.",
        "Game with a player is stuck in a hotel and there might be a ghost chasing and frightening the player. The player has to find a way to escape from the hotel.",
        "Enagage me with a game with 5 opponents trying to steal candies hidden in the garden. The player has to collect the most number of candies.",
        "A castle is under attack by a dragon spitting fire. The player has to save the castle by shooting the dragon.",
        "Can you create a game with a plane that picks up packages and has to deliver them to the right place?",
        "Can you think of a game where the player is playing as a venus fly trap and has to catch flies? You can multiply the number of mouths to catch more flies but beware of the flies that can sting you. Protect yourself from overeating the flies.",
        "Make a game as an elephant on mars searching for the rat friend who is lost in the desert. Collect food and water to survive and find your friend. Fight the aliens who can attack you.",
        "It would be interesting to play as a monkey leaping through in a forest. The monkey has to collect bananas and avoid the tigers.",
        "Tanks are everywhere hiding in the bushes. The player controls a tank and has to shoot the other tanks while avoiding their fire. Multiple battlefields to play before the win. Collect ammunition and repair the tank using the collected resources. Last tank standing wins.",
        "There are lasers in the room but you can spray fog to see them locally. The player has to navigate through to find the exit without getting caught by the lasers.",
        "What if there was a game where you shoot balloons moving up but you need to be careful not to shoot balloons which have a stone in it?",
        "Could you develop the game in a world in which the player moves in side a bubble which they can shrink and expand? Don't let the bubble pop.",
        "Can we have a platformer games set in a space station with low gravity sections, asteroid fields, and airlock puzzles",
        "I’ve been dreaming of a game where you’re the last lantern-keeper in a floating library, and every time your glowing orb illuminates hidden words, they materialize into new platforms and shifting obstacles.",
    ]

    # Sample a few examples to include in the prompt
    # example_sample = random.sample(EXAMPLES, 20)
    example_block = "\n".join(
        f'- "{e.strip()}"' for e in random.sample(EXAMPLES, len(EXAMPLES))
    )

    # Build the system prompt with additional guidance on what game elements can be altered.
    system_prompt = f"""
You are a practical but creative video game designer. Your job is to invent original, unique, and feasible game concepts for 2D JavaScript games using the p5.js library and p5.collide.

The games are strictly 2D, played in a web browser, and controlled only by keyboard input.
They must use no audio, no mouse, no sprites or external assets, and no 3D graphics or simulation.            

### Instructions:
- Create truly innovative game concepts that challenge conventional design.
- Produce completely original game concepts that are feasible enough to be built using only p5.js and p5.collide, yet interesting and engaging.
- Game concepts can focus on any subset of gameplay elements, such as player abilities, movement mechanics, enemy behavior, player goals or objectives, reward systems, environmental features, level progression, or unique world rules or constraints. You do not need to describe all elements—some concepts may focus on just one (e.g. a movement restriction or an unusual scoring mechanic), while others may touch on several. Aim to vary the level of specificity across concepts: some can be highly detailed, others more abstract, leaving room for interpretation and creative design. 
- You can be abstract or very specific and detailed in your game concepts about the desired aspect of the game.
- Do not specify implementation details like graphics or technical specifications. 
- To note that the complexity of the game is not just how sophisticated the names of the game elements are, but also how complex the game mechanics are.


You can use the following examples to inspire the content of the game concepts, but do not plagiarize ideas from the examples:
{example_block}

### Hard Constraints (Do Not Violate):
- No sound, music, or audio-related mechanics.
- No 3D graphics, rendering, or movement.
- No use of mouse, touch input, or complex UI. Only keyboard input.
- No sprites, images, external art, or visual effects beyond p5’s shape drawing.
- No puzzle games or board-game logic.
- No advanced AI behavior (no learning, planning, pathfinding; only basic rules like chase or patrol).
- No complex animation systems, procedural world generation, or physics engines beyond p5 primitives.
- To use common game elements and objects in real life, make the game unique and interesting by combining them in a new way.

You should generate your interesting yet feasible game concepts for 2D JavaScript games in the following format:
```json
[
    {{
        "concept": "...",
        "genre": "..."
    }},
    {{
        "concept": "...",
        "genre": "..."
    }},
]
```
        """

    # Add recent games to system prompt if available
    if game_archive and len(game_archive) > 0:
        # Get random sample of recent games
        recent_games = random.sample(game_archive, k=min(len(game_archive), 100))
        prior_games_str = "\n".join(
            [f"- {g['concept'][:100]}..." for g in recent_games]
        )

        prompt += f"""\n
        ### Previous Game Concepts:
        Here are some game concepts that were already generated:
        {prior_games_str}

        Do NOT repeat game concepts similar to the previous descriptions. Think creatively and create something different from existing game concepts which is interesting, fun, and engaging and not yet generated.
        Format your response exactly as requested paying attention to the number of sentences in each game concept.
        """

    retries = 0
    while retries <= max_retries:
        try:
            response = api.call(
                user_prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
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
    MAX_CONCEPTS_PER_BATCH = 50
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
    # model_game_archive = load_existing_games(output_dir, max_games=-1)

    # Then load from the base directory for backward compatibility
    game_archive = load_existing_games(base_dir, max_games=-1)

    if game_archive:
        print(f"Loaded {len(game_archive)} existing games for context")

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
        default=10,
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
        default=0.7,
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

#!/usr/bin/env python3
"""
This script generates new game descriptions using different AI models.
The generated game descriptions are saved in JSON format in the 'final_games/' directory.
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
MAX_CONCEPTS_PER_BATCH = 30  # Generate 30 ideas per batch

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


def format_previous_ideas(previous_ideas: List[Dict[str, Any]]) -> str:
    """
    Format previous ideas as a string to be included in the prompt.
    
    Args:
        previous_ideas: List of previously generated game ideas
        
    Returns:
        Formatted string of previous ideas
    """
    if not previous_ideas:
        return ""
    
    formatted_ideas = []
    for i, idea in enumerate(previous_ideas):
        formatted_ideas.append(f"#{i+1}: {idea['concept']}")
    
    return "\n".join(formatted_ideas)


def generate_new_game_concept(
    api: ModelAPI,
    batch_number: int = 1,
    num_games: int = MAX_CONCEPTS_PER_BATCH,
    previous_ideas: List[Dict[str, Any]] = None,
    max_retries: int = 10,
    temperature: float = 1.0,
) -> List[Dict[str, Any]]:
    """
    Generate new game concepts using the specified model.

    Args:
        api: ModelAPI instance
        batch_number: Current batch number (1, 2, or 3) to determine sentence count
        num_games: Number of game concepts to generate
        previous_ideas: List of previously generated ideas to avoid repeating
        max_retries: Maximum number of retries on rate limit or timeout errors
        temperature: Controls randomness in generation (0.0-1.0, higher = more creative)

    Returns:
        List[Dict]: A list of generated game descriptions as dictionaries
    """
    genre_list_str = ", ".join(GENRES)
    
    EXAMPLES = [
        "How about a game in space setting with animated graphics featuring planets, comets, stars, and a spaceship that you can control.",
        "A game where winning means going as far as possible in a vertical platformer game evading clouds.",
        "A frog jumps on lily pads and wooden logs, collecting all the flowers before reaching the end of the pond.",
        "A top-down view game the player attacks by shooting orbs towards enemies. If the orb of any character hits the other character, they join the player's side and attack the other enemies. Game ends if you get hit by an enemy or you convert all the enemies to your side.",
        "Player controls a monkey leaping through a forest. The monkey has to collect bananas. Side-scrolling game with amazing graphics.",
        "Tanks are everywhere hiding in the bushes. The player controls a tank and has to shoot the other tanks while avoiding their fire.",
        "There are lasers in the room but you can spray fog to see them locally. The player has to navigate through to find the exit without getting caught by the lasers.",
        "Shoot balloons in the sky but be careful not to shoot balloons which have a stone in it to avoid the stone falling on the ground? A vertical fixed environment game where the player can only move left and right.",
        "Navigate through a prison avoiding the light towers trying to catch you. Beware of the guards!",
        "Make me a side-scrolling game controlling a neon green character with a red cape.",
    ]

    # Sample some examples to include in the prompt
    example_block = "\n".join(f'- "{e.strip()}"' for e in EXAMPLES)

    # Determine number of sentences based on batch number
    num_sentences = batch_number
    
    # Format previous ideas if they exist
    previous_ideas_text = ""
    if previous_ideas and len(previous_ideas) > 0:
        previous_ideas_text = f"""
<previously_generated_ideas>
{format_previous_ideas(previous_ideas)}
</previously_generated_ideas>

Your new ideas must be significantly different from the previous ideas listed above. Avoid similar settings, mechanics, player characters, or core concepts.
"""

    system_prompt = """
You are a creative and imaginative game enthusiast who has met a creative professional JavaScript game developer. You are going to propose game ideas in 1-3 sentences using simple and commonly used language for the developer to implement.
When defining the idea, you can already see the full game description in your mind, but you only define a few of the game elements leaving room for the game designer to expand upon the idea to turn it into a complete game.
The game should be intuitive to play and not be too difficult to play for a first-time player making them bored or frustrated. It should be believable and fun for people with a wide range of interests and skill levels. 
Keep in mind that the game developer will implement the game in JavaScript using p5.js and p5.collide2d, so fancy physics and graphics are not possible.
"""
    prompt = f"""
<hard_constraints>
<!-- Game developer constraints -->
- Single-player 2D game
- No purely turn-based board/puzzle games; keep play real-time and 2D
- mechanics:
    - Game mechanics must be implementable with p5.js and p5.collide2d
- controls:
    - Only use keyboard input. Player control keys will be arrow keys, space, shift, and Z. Do not define the keys in the idea.
    - No use of mouse, touch input, or complex UI.
- graphics:
    - No sprites, images, external art, or visual effects beyond p5's shape drawing.
    - No complex animation systems, procedural world generation, or physics engines beyond p5 primitives.
    - No sound or music
    - Do not propose ideas with elements that have anything to do with audio or require audio-related implementations
    - No puzzle games, board games, turn-based games, or other non-2D games

Specify ideas that inspire further creative development and expansion by the game developer to turn the idea into a complete game which most people will fall in love with the moment they play it.
You can be very specific about some game element describing a specific sub-element with high detail leaving the rest for the game developer to expand upon.
For each idea, adopt a unique personality, style, and tone. Express as if you were talking to the game developer using sentence structure, vocabulary, and language used by people in casual natural conversations.
Use terms that are relatable and known by everyone. A 5-year-old should be able to understand the game idea. You can define the properties such as behavior, abilities, and visual appearance of the entities. If you define behavior or abilities or objectives, you would be defining the mechanics. If you define visual appearance, you would be defining the graphics.
Before proposing a game idea, make sure it is not too similar to the existing game ideas.
</hard_constraints>

<instructions>
When proposing a game idea, respect the hard constraints on the game developer when implementing a game based on your idea and unique writing constraints on how you write the ideas.

<!-- Elements of a game idea -->
A game requires defining the following elements [environment, entities, mechanics, graphics]. Here are the sub-elements for each for context with examples from existing games like Mario, Pacman, Snake, Breakout, etc. for inspiration:
- environment:
    - setting: the setting of the game (such as forest, space, underwater, etc.)
    - genre: a game can belong to one or more genres (such as a arcade, shooter, endless-runner, platformer, etc. No puzzle games, board-games, turn-based games, or other non-2D games.
    - viewpoint: the perspective from which the game is viewed on screen (can be one of the following: top-down, side-scrolling, vertical-scrolling, )
- entities:
   - characters: Use well-described nouns for the player character and NPCs which are easy to render and have behaviors implementable by the game developer using p5.js primitives.
        - player: the character controlled by the player (such as Mario, Pacman, snake, paddle, etc.). 
        - NPCs: the non-player characters in the game (such as Turtle, Goomba, Ghost, etc.).
    - objects in the game:
        - collectible objects: items that can be picked up by the player to impact the score (such as coins, food, etc.)
        - interactive objects: objects that respond to player actions (such as platforms, switches, levers, movable blocks, portals)
        - power-ups: items that give temporary or permanent abilities (such as mushrooms, speed boost, etc.)
        - destructible objects: objects that can be broken or destroyed (such as bricks, plants, blocks, etc.)
        - obstacles: objects that impede player progress (such as spikes, lava pits, moving platforms, laser beams, etc.)
- mechanics:
    - player abilities:
        - what the player character or other entities can do (such as move, jump, dash, shoot, kill, sword attack, climb, bounce, etc.)
        - Some abilities can be unlocked after a certain condition (such as collecting a certain object or defeating one of the enemies)
    - object interactions: what happens when the player interacts with another entity or object (Mario loses a life when hit by an enemy, Pacman eats dots to score points and dies when touching a ghost, etc.)
    - rewards: what the player gets when they achieve a certain subgoal (such as points, lives, etc.)
    - subgoals: the smaller goals in the game which when achieved contribute to the final goal or are just interesting side-quests on the journey to the final goal (such as collecting coins and mushrooms in Mario, collecting all the stars in Pacman, etc.)
    - final goal: the main goal of the game which when achieved ends the game (such as rescuing a princess in Mario, collecting all the coins without getting caught by the ghosts in Pacman, etc.)
- graphics:
    - visual appearance: the visual appearance of the game environment and game entities defined by adjectives (such as neon-lit platforms, bioluminescent creatures, etc.). Keep the visual appearance that can be implemented using p5.js primitives.
    - animations: the animations of the game entities defined by adjectives (such as a walking turtle, a jumping frog, etc.). Keep the animations that can be implemented using p5.js primitives.    
</instructions>

Here are some existing game which you should not repeat. DO NOT REPEAT ANY OF THESE IDEAS OR PROPOSE ANY IDEAS THAT ARE SIMILAR TO THESE IDEAS:
<previous_ideas>
{previous_ideas_text}
</previous_ideas>

<task>
Propose {num_games} innovative and original ideas. Each idea must use exactly {num_sentences} sentence(s). Follow the instructions and constraints of the game developer, do not propose any ideas that are not implementable with p5.js and p5.collide2d without additional libraries.
</task>

<output_format>
Output the game ideas in the following format with NO OTHER TEXT:
<game_ideas>
    <game_idea id="1">
        <personality>... (describe your personality in 1 sentence so that we know what kind of game you like as a person)</personality>
        <number_of_game_elements_defined>... (number of game elements you used to define the idea)</number_of_game_elements_defined>
        <chosen_game_elements>... (list of game elements you used to define the idea from the list of game elements: [environment, entities, mechanics, graphics] followed by the sub-elements of the game elements, like environment.setting, entities.player, mechanics.abilities, graphics.visual_appearance. Keep varying the game elements and sub-elements for each idea.)</chosen_game_elements>
        <number_of_sentences>{num_sentences}</number_of_sentences>
        <idea>... (the actual game idea which is consistent and believable to a first-time player playing this game)</idea>
    </game_idea>
    ...
</game_ideas>
</output_format>
"""

    
    retries = 0
    while retries <= max_retries:
        try:
            print(f"Generating batch #{batch_number} with {num_sentences} sentence(s) per idea...")
            # print(system_prompt + "\n\n" + prompt)
            response = api.call(
                user_prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.1,
                top_p=0.9,
                verbose=True,  # Enable streaming to avoid timeouts for long requests
            )

            # Extract the JSON part from the response using regex
            match = re.search(r"<game_ideas>\n(.*?)\n</game_ideas>", response, re.DOTALL)
            if not match:
                # Try without the newlines in case the model formats differently
                match = re.search(r"<game_ideas>(.*?)</game_ideas>", response, re.DOTALL)

            if match:
                xml_str = match.group(1).strip()
                # Parse XML to extract game concepts
                game_descriptions = []
                
                # Use regex to find all game_concept blocks
                game_ideas = re.finditer(r'<game_idea.*?>(.*?)</game_idea>', xml_str, re.DOTALL)
                
                for game in game_ideas:
                    game_content = game.group(1)
                    
                    # Extract all fields using regex
                    personality_match = re.search(r'<personality>(.*?)</personality>', game_content, re.DOTALL)
                    num_elements_match = re.search(r'<number_of_game_elements_defined>(.*?)</number_of_game_elements_defined>', game_content, re.DOTALL)
                    chosen_elements_match = re.search(r'<chosen_game_elements>(.*?)</chosen_game_elements>', game_content, re.DOTALL)
                    num_sentences_match = re.search(r'<number_of_sentences>(.*?)</number_of_sentences>', game_content, re.DOTALL)
                    idea_match = re.search(r'<idea>(.*?)</idea>', game_content, re.DOTALL)
                    
                    if idea_match:
                        game_data = {
                            "id": game.group(0).split('id=\"')[1].split('\"')[0] if 'id="' in game.group(0) else str(len(game_descriptions) + 1),
                            "personality": personality_match.group(1).strip() if personality_match else "No personality provided",
                            "number_of_game_elements_defined": int(num_elements_match.group(1).strip()) if num_elements_match else 0,
                            "chosen_game_elements": chosen_elements_match.group(1).strip() if chosen_elements_match else "None specified",
                            "number_of_sentences": int(num_sentences_match.group(1).strip()) if num_sentences_match else num_sentences,
                            "concept": idea_match.group(1).strip(),
                            "batch": batch_number
                        }
                        
                        game_descriptions.append(game_data)
                
                if len(game_descriptions) > 0:
                    return game_descriptions
                else:
                    print(f"No valid game ideas found in response")
                    return [{
                        "personality": "No personality provided",
                        "number_of_game_elements_defined": 0,
                        "chosen_game_elements": "None specified",
                        "number_of_sentences": num_sentences,
                        "concept": "Error: No valid game concepts found in response",
                        "batch": batch_number
                    }]

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
                        "personality": "No personality provided",
                        "number_of_game_elements_defined": 0,
                        "chosen_game_elements": "None specified",
                        "number_of_sentences": num_sentences,
                        "concept": f"Error generating game concept after {max_retries} retries: {error_msg}",
                        "batch": batch_number
                    }
                ]

    # If we've exhausted retries
    return [
        {
            "personality": "No personality provided",
            "number_of_game_elements_defined": 0,
            "chosen_game_elements": "None specified",
            "number_of_sentences": num_sentences,
            "concept": f"Error: Maximum retries reached",
            "batch": batch_number
        }
    ]


def main(
    model_string: str,
    num_games: int = 90,
    temperature: float = 0.7,
):
    """
    Main function to generate new game concepts in batches with different sentence counts.
    The generated game concepts are saved in JSON format in the 'final_games/' directory.

    Args:
        model_string: Model specification in format "provider:model_name"
        num_games: Number of games to generate (will be divided into 3 batches)
        temperature: Controls randomness in generation (0.0-1.0, higher = more creative)
    """
    # Initialize model API
    try:
        api = ModelAPI(model_string)
        print(f"Using model: {model_string}")
    except Exception as e:
        print(f"Error initializing model: {str(e)}")
        print("Please make sure the required API keys are set in your .env file.")
        return
    
    # Calculate number of games per batch
    games_per_batch = num_games // 3
    if games_per_batch > MAX_CONCEPTS_PER_BATCH:
        games_per_batch = MAX_CONCEPTS_PER_BATCH
    
    print(f"Will generate {3 * games_per_batch} games in 3 batches of {games_per_batch} each")
    
    # Extract model name for directory structure
    model_name = model_string.replace(":", "_")

    # Output directory structure
    base_dir = "./final_games"
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

    # Track all generated ideas to prevent duplicates across batches
    all_generated_ideas = []
    
    # Process each batch
    total_success = 0
    total_failed = 0
    
    for batch in range(1, 4):
        print(f"\n=== Generating Batch {batch} ({batch} sentence(s) per idea) ===")
        
        # Generate descriptions for this batch
        games_to_process = generate_new_game_concept(
            api,
            batch_number=batch,
            num_games=games_per_batch,
            previous_ideas=all_generated_ideas,
            temperature=0.7,
        )

        batch_success = 0
        for game_data in games_to_process:
            game_data["model"] = model_string
            
            # Check if generation was successful
            if "Error" not in game_data.get("concept", ""):
                total_success += 1
                batch_success += 1
                print(
                    f"  ✅ Generated game {batch_success}/{games_per_batch} (Batch {batch}): {game_data['concept']}"
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

                # Add to our tracking lists to prevent duplicates
                all_generated_ideas.append(game_data)
                game_archive.append(game_data)
                
            elif "Error" in game_data.get("concept", ""):
                total_failed += 1
                print(f"  ❌ Failed to generate game: {game_data['concept']}")

        # Add random wait time between batches to avoid rate limiting
        if batch < 3:
            wait_time = random.uniform(MIN_WAIT_TIME * 2, MAX_WAIT_TIME * 2)
            print(f"  Waiting {wait_time:.2f} seconds before next batch...")
            time.sleep(wait_time)

        print(
            f"Batch {batch} Progress: {batch_success}/{games_per_batch} successful"
        )

    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate new game concepts using AI models and save to final_games directory"
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
        default=90,
        help="Total number of games to generate (will be divided into 3 batches)",
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

    args = parser.parse_args()

    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait

    main(args.model, args.num_games, args.temperature)

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
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

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
    "Sports",
    "Survival",
    "Turn-based",
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
    game_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)  # Get most recent games first
    if max_games > len(game_files) or max_games < 0:
        max_games = len(game_files)
    
    game_archive = []
    for file_path in game_files[:max_games]:
        try:
            with open(file_path, 'r') as f:
                game_data = json.load(f)
                game_archive.append(game_data)
        except Exception as e:
            print(f"Error loading game from {file_path}: {str(e)}")
    
    return game_archive

def generate_new_game_concept(api: ModelAPI, num_games: int = MAX_CONCEPTS_PER_BATCH, game_archive: List[Dict[str, Any]] = None, max_retries: int = 10, temperature: float = 1.0, num_sentences: int = 3) -> List[Dict[str, Any]]:
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
    genre_list_str = ', '.join(GENRES)

    prompt = f"""
                Describe {num_games} completely original, interesting, and imaginative concepts for single-player video games each of which is {num_sentences} sentences long. Try to keep each sentence roughly 8 to 10 words long.
                - Think differently from the standard game ideas and create something unique and interesting. Each game concept must have a distinct description of the elements of the game.
                - Write in an enthusiastic and original tone with distinct vocabulary in each game concept to express your request. Do not use the same words in different game concepts.
                - For each game, pick one or more genres from this list: {genre_list_str}. Ensure equal distribution of genres in the response.

                Format your response like this:
                ```json
                [
                    {{
                        "concept":  ...
                        "genre": ...
                    }},
                    ... and so on for all {num_games} games.
                ]
                ```
                """
        

    EXAMPLES = ["Can you create a game where every platform is made of wobbly jelly? The player has to navigate through the platform to reach the end.",
                "Could you design a game where every a frog jumps on lily pads and wooden logs. The player has to collect all the flowers before reaching the end of the pond.",
                "How about developing a game where hidden dangers awaken only when motion occurs? The slightest movement should summon bats and spiders. The player has to navigate through the platform to reach the end.",
                "Make a game which is two rooms connected by a portal. The rooms are identical but have different colors. The player can switch between the rooms by passing through the portal.",
                "Can you build an adventure on a massive grid where each sector hides its own enigma? Let every clue become a fragment of a hidden map, combining subtle riddles with clever puzzles.",
                "Think of a game where the character can switch between two different worlds. The worlds have different challenges but character plays both worlds. The player can switch between the worlds.",
                "Could you invent a game where color serves as a secret weapon? Switching hues should baffle relentless foes, turning combat into a vivid and strategic spectacle.",
                "Would you develop a futuristic city defense game where rearranging skyscrapers is key? Every building move should transform the urban battleground into a dynamic tactical fortress.",
                "Could you design a game where the power to rewrite physics is at the player's fingertips? Bend gravity, twist inertia, or warp time to overcome obstacles that defy conventional logic.",
                "How about a game where you balance on a unicycle and have to avoid obstacles?",
                "Make me a game where the environment is a maze but the player can transform the maze by changing the color of the walls.",
                "Can you generate a game related to a dog that needs to find its way home but lots of troubles and traps await?",
                "What if there was a game where the player switches between two characters that have different abilities?",
                "Can you design a game where the enemies attack with laser beams?",
                "Think of a game with a bridge made of ice. The player has to navigate through the bridge without falling into the water below. Wait for the snow if the bridge breaks.",
                "Set a game in a mountain range where the player skis down the mountain and has to avoid the trees and rocks. It has multiple levels.",
                "Game with a player is stuck in a hotel. Some of the walls can be passed through but look opaque. There might be a ghost chasing you in the hotel.",
                "Enagage me with a game with 5 opponents trying to steal candies hidden in the garden. The player has to collect the most number of candies.",
                "Keys and locks are everywhere. The player has to unlock the keys to open the locks in the correct order to make progress. There might be rust in some locks requiring you to fix those using resources which are scarce.",
                "Would you create a game with rules that evolve unpredictably at every level? Introduce surprise twists on gameplay mechanics to continuously keep players on their toes.",
                "Navigate through a multi-layered environment avoiding the light towers trying to catch you.",
                "How about designing a multi-room game where each room has a different challenge.",
                "Could you make a game where the termites are eating your house?",
                "Would you create a game where you control a space ship across space to search for a new home planet?",
                "Can you build a game where the player has to get out of a dynamically changing maze?",
                "A castle is under attack by a dragon spitting fire. The player has to save the castle by shooting the dragon.",
                "I want to control a robot through a town on fire to rescue people and put out the fire.",
                "A race between turtles where there is both land and water terrain.",
                "Can you create a game with a plane that picks up packages and has to deliver them to the right place?",
                "How about setting a game in a jungle with a river?",
                "Make a game where cars are driving to drop off passengers at their destination. The player has to avoid crashing into other cars and obstacles to make it to the destination in time.",
                "Can you think of a game where the player is playing as a venus fly trap and has to catch flies? You can multiply the number of mouths to catch more flies but beware of the flies that can sting you. Protect yourself from overeating the flies.",
                "Make a game as an elephant on mars searching for the rat friend who is lost in the desert. Collect food and water to survive and find your friend. Fight the aliens who can attack you.",
                "It would be interesting to play as a monkey leaping through in a forest. The monkey has to collect bananas and avoid the tigers.",
                "Tanks are everywhere hiding in the bushes. The player controls a tank and has to shoot the other tanks while avoiding their fire. Multiple battlefields to play before the win. Collect ammunition and repair the tank using the collected resources. Last tank standing wins.",
                "There are lasers in the room but you can spray fog to see them locally. The player has to navigate through to find the exit without getting caught by the lasers.",
                "Control a helicopter through a city with tall buildings. The helicopter has to rescue people from the top of the buildings.",
                "Curate a game where the player can change the environment by collecting and rearranging blocks to make progress.",
                "What if there was a game where you shoot balloons moving up but you need to be careful not to shoot balloons which have a stone in it?"
                "Can you make me a game where the player throws a ball to dislodge a tower of blocks to rescue the pets? Have multiple levels in the game.",
                "Design a game with a player controlling a spaceship to race against other spaceships to collect the most asteroid fragments. The gravity of the planets can attract objects so avoid crashing into them.",
                "Could you develop the game in a world in which the player moves in side a bubble which they can shrink and expand? Don't let the bubble pop.",
    ]
            

    # Sample a few examples to include in the prompt
    # example_sample = random.sample(EXAMPLES, 20)
    example_block = "\n".join(f"- \"{e.strip()}\"" for e in random.sample(EXAMPLES, 10))

    # Build the system prompt with additional guidance on what game elements can be altered.
    system_prompt = f"""
            You are a creative video game enthusiast with the ability to invent unique, interesting, and imaginative game concepts.
            The game concept will used to make a 2D video game to be played in a web browser by a single human player with all other characters being AI controlled. Keep this in mind when coming up with the request.            

            ### Instructions:
            - Create truly innovative game concepts that challenge conventional design patterns, and introduce fresh mechanics or narrative approaches.
            - The game concepts should be exactly {num_sentences} sentences long.
            - Some elements that can be considered when defining the game concept are characters, reward structure, game mechanics, and world elements. Feel free to combine them or mention just one of them or even none of them and come up with something unique.
            - Avoid common existing game concepts exist. 
            - Do not specify implementation details like graphics or technical specifications. 
            - Avoid being too abstract. You can be very specific and detailed in your game concepts about the desired aspect of the game.            
            - You can use the following examples to inspire the structure and the content of the game concepts, but do not copy the examples exactly.
            - Avoid using game concepts that involve music or sound.
            
            ## Example game concepts:
                {example_block}

            ## Constraints on games that can be generated:
            - Do not have concepts that require sound, audio, or music.
            - Do not have concepts that require 3D graphics. The game will be strictly a 2D game.
            - The games will be played in a web browser using a keyboard.  
            
            ### Response Format:
            Your response must be a valid JSON array containing dictionaries, each with exactly two keys: "concept" and "genre". 
            Do not include any extra text, markdown formatting, or commentary outside of the JSON.

            Example format:
            ```json
            [
                {{
                    "concept": "Make me a game the player controls a rat evading cats ready to catch it. The rat can hide in holes and use cheese to lure the cats away.",
                    "genre": "Survival"
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
        
        system_prompt += f"""\n
        ### Previous Game Concepts:
        Here are some game concepts that were already generated:
        {prior_games_str}

        Do NOT repeat game concepts similar to the previous descriptions. Think creatively and create something different from existing game concepts which is interesting, fun, and engaging and not yet generated.
        Format your response exactly as requested.
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
            match = re.search(r'```json\n(.*?)\n```', response, re.DOTALL)
            if not match:
                # Try without the newlines in case the model formats differently
                match = re.search(r'```json(.*?)```', response, re.DOTALL)
                
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
                    return [{
                        "concept": "Error: Unexpected response format from model",
                        "genre": "Genre of the game",
                    }]
                
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error generating new game concepts: {error_msg}")
            retries += 1
            
            # Check if it's a rate limit error
            if any(term in error_msg for term in ["rate limit", "quota", "429", "too many"]):
                wait_time = RATE_LIMIT_WAIT
                print(f"Rate limit hit. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Check if it's a timeout error
            elif any(term in error_msg for term in ["timeout", "deadline exceeded"]):
                wait_time = RATE_LIMIT_WAIT // 2
                print(f"Timeout error. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Other errors
            elif retries < max_retries:
                print(f"Error generating game concept: {error_msg}. Retrying ({retries}/{max_retries})...")
                time.sleep(MIN_WAIT_TIME)
            else:
                print(f"Failed after {max_retries} retries: {error_msg}")
                return [{
                    "concept": f"Error generating game concept after {max_retries} retries: {error_msg}",
                    "genre": "Genre of the game",
                }]
    
    # If we've exhausted retries
    return [{
        "concept": f"Error: Maximum retries reached",
        "genre": "Genre of the game",
    }]

def main(model_string: str, num_games: int = 5, temperature: float = 0.7, num_sentences: int = 3):
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
        games_to_process = generate_new_game_concept(api, MAX_CONCEPTS_PER_BATCH, game_archive, temperature=temperature, num_sentences=num_sentences)
        
        for game_data in games_to_process:
            game_data["model"] = model_string
            # Check if generation was successful and if we still need more games
            if "Error" not in game_data.get("concept", "") and generated_count < num_games:
                total_success += 1
                generated_count += 1
                print(f"  ✅ Generated game {generated_count}/{num_games}: {game_data['concept']}")
                
                # Find the smallest unused game number and format with leading zeros
                existing_files = os.listdir(output_dir)
                existing_numbers = set()
                for filename in existing_files:
                    if filename.startswith("game_") and filename.endswith(".json"):
                        try:
                            num = int(filename[5:-5])  # Extract number between "game_" and ".json"
                            existing_numbers.add(num)
                        except ValueError:
                            continue
                
                game_num = 0
                while game_num in existing_numbers:
                    game_num += 1
                    
                output_file = os.path.join(output_dir, f"game_{game_num:04d}.json")
                    
                with open(output_file, "w") as f:
                    json.dump(game_data, f, indent=2)
                
                print(f"  Saved game concept to {model_name}/{os.path.basename(output_file)}")
                
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
        
        print(f"Progress: {generated_count}/{num_games} - {total_success} successful, {total_failed} failed")
    
    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate new game concepts using AI models")
    parser.add_argument(
        "--model", 
        type=str, 
        default="google:gemini-1.5-flash", 
        help="Model to use in format 'provider:model_name' (e.g., 'openai:gpt-4o', 'anthropic:claude-3.7-sonnet', 'google:gemini-1.5-flash')"
    )
    parser.add_argument(
        "--num_games", 
        type=int, 
        default=5, 
        help="Number of games to generate (will be generated in batches of 50)"
    )
    parser.add_argument(
        "--min_wait", 
        type=float, 
        default=2.0, 
        help="Minimum wait time between requests in seconds"
    )
    parser.add_argument(
        "--max_wait", 
        type=float, 
        default=5.0, 
        help="Maximum wait time between requests in seconds"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Temperature for model generation (0.0-1.0, higher = more creative)"
    )
    parser.add_argument(
        "--num_sentences",
        type=int,
        default=3,
        help="Number of sentences for each game description (2-5 recommended)"
    )
    
    args = parser.parse_args()
    
    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait
    
    main(args.model, args.num_games, args.temperature, args.num_sentences)

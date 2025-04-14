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

# Game genres to generate
GENRES = [
    "Action",
    "Adventure",
    "Arcade",
    "Fighting",
    "Platformer",
    "Puzzle",
    "Racing",
    "Shooter",
    "Sports",
    "Strategy",
]
    
def ensure_dir(directory: str) -> None:
    """Ensure that the directory exists."""
    Path(directory).mkdir(parents=True, exist_ok=True)

def load_existing_games(games_dir: str, max_games: int = 50) -> List[Dict[str, Any]]:
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

def generate_new_game_concept(api: ModelAPI, game_archive: List[Dict[str, Any]] = None, max_retries: int = 10, temperature: float = 0.7) -> Dict[str, Any]:
    """
    Generate a new game concept using the specified model.
    
    Args:
        api: ModelAPI instance
        game_archive: List of previously generated games to avoid repeating
        max_retries: Maximum number of retries on rate limit or timeout errors
        temperature: Controls randomness in generation (0.0-1.0, higher = more creative)
        
    Returns:
        Dict: The generated game description as a dictionary
    """
    genre_list_str = ', '.join(GENRES)

    prompt = f"""
                Describe a completely original, interesting, and imaginative concept for a single-player video game.

                Pick one or more genres from this list: {genre_list_str}.

                Format your response like this:
                ```json
                {{
                "concept": "What if there was a game where time only moves when you stand still?",
                "genre": "Puzzle, Platformer"  // Choose one or more from: {genre_list_str}
                }}
                ```
                """
        

    EXAMPLES = [
        "What if there was a game where ...", 
        "What if there was a game where platforms are made of jelly and you have to navigate them without falling off?",
        "Make me a game where your inventory affects gravity. Choose what to carry with you and travel light.",
        "Make me a game where ...",
        "Imagine a game where the enemies only be seen when you are moving. Multiple levels of the game have different visibility ranges.",
        "Imagine a game where ...",
        "I want a game where you explore a museum that reorganizes itself based on your choices.",
        "I want a game where ...",
        "Can you make a puzzle game where you solve multiple puzzles in different parts of a grid world in the correct order?",
        "How about a game where ...",
        "A game where time flows differently depending on ...",
        "A game where ...",
        "Could there be a game where you move evade enemies by changing your color and enemies can only see particular colors? Interesting part is that you can't know which color they see. You need to keep refilling the color supply to keep changing colors.",
        "Could there be a simulation game where we can change the location of the towers in the city to prevent the enemy from attacking?",
        "Think of a game where you are a glitch in a simulation, trying to avoid being deleted. You can go back and forth in time to fix your mistakes.",
        "Think of a game where ...",
        "Give me a game idea about a place that forgets you every time you leave a room. The room changes ",
        "Give me a game idea about ...",
        "What’s a game where the goal is to achieve the second highest score amoung 3 other AI players?",
        "What’s a game where ...",
    ]

    example_sample = random.sample(EXAMPLES, 10)
    example_block = "\n".join(f"- \"{e}\"" for e in example_sample)

    system_prompt = f"""You are a creative video game enthusiast who loves imagining original and fun single-player games.

    Your job is to come up with a cool **game concept** you’d love to see made — something you’d pitch to a game designer to bring to life. 
    These ideas should be **original**, **fun to imagine**, and can be **short and punchy or a little more detailed** — whatever fits the idea.

    Here are some different ways you might describe your idea:
    {example_block}

    Use your own tone and words — you can describe the idea in a sentence, a phrase, or a short paragraph. Be as brief or as rich as the idea needs.

    ### Instructions:
    - Focus on the core fantasy or idea: a twist, a challenge, or a narrative hook.
    - Avoid specific implementation details like graphics, sounds, control mappings, or exact character names.
    - Be bold: invent new narrative structures, remix unexpected ideas, or turn familiar game genres on their head.

    ### Format your response like this:
    ```json
    {{
    "concept": "What if there was a game where time only moves when you stand still?",
    "genre": "Puzzle, Platformer"  // Choose one or more from: {genre_list_str}
        }}
    """

    # Add recent games to system prompt if available
    if game_archive and len(game_archive) > 0:
        # Get random sample of recent games
        recent_games = random.sample(game_archive, k=min(len(game_archive), 10))
        prior_games_str = "\n".join(
            [f"- {g['concept'][:100]}..." for g in recent_games]
        )
        
        system_prompt += f"""\nHere are some game concepts that were already generated:
                            {prior_games_str}

                            Do NOT repeat game concepts similar to these descriptions. Think creatively and create something different which is interesting, fun, and engaging.
                            Format your response exactly as requested.
                            """
    
    retries = 0
    while retries <= max_retries:
        try:
            response = api.call(
                user_prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
            )
            
            # Extract the JSON part from the response using regex
            match = re.search(r'```json\n(.*?)\n```', response, re.DOTALL)
            if not match:
                # Try without the newlines in case the model formats differently
                match = re.search(r'```json(.*?)```', response, re.DOTALL)
                
            if match:
                json_str = match.group(1).strip()
                description_data = json.loads(json_str)
                genre = description_data.get("genre", "Genre of the game")
                return description_data
                
            else:
                print(f"Failed to extract JSON from model response, using default structure")
                return {
                    "concept": "Error: Could not extract game concept from model response",
                    "genre": "Genre of the game",
                }
                
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error generating new game concept: {error_msg}")
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
                return {
                    "concept": f"Error generating game concept after {max_retries} retries: {error_msg}",
                    "genre": "Genre of the game",
                }
    
    # If we've exhausted retries
    return {
        "concept": f"Error: Maximum retries reached",
        "genre": "Genre of the game",
    }

def main(model_string: str, num_games: int = 5, temperature: float = 0.7):
    """
    Main function to generate new game concepts for each genre.
    The generated game concepts are saved in JSON format in the 'new_games/' directory.
    
    Args:
        model_string: Model specification in format "provider:model_name"
        num_games: Number of games to generate
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
    model_game_archive = load_existing_games(output_dir, max_games=50)
    
    # Then load from the base directory for backward compatibility
    base_game_archive = load_existing_games(base_dir, max_games=50)
    
    # Combine both archives, prioritizing model-specific games
    game_archive = model_game_archive + [g for g in base_game_archive if g not in model_game_archive]
    if len(game_archive) > 50:
        game_archive = game_archive[:50]  # Keep only up to 50 games

    if game_archive:
        print(f"Loaded {len(game_archive)} existing games for context")
    
    # Track total successful and failed generations
    total_success = 0
    total_failed = 0
    
    # Process each game
    for i in range(num_games):
        print(f"Generating game #{i}...")

        # Generate description
        description_data = generate_new_game_concept(api, game_archive, temperature=temperature)
        
        # Check if generation was successful
        if "Error" in description_data.get("concept", ""):
            total_failed += 1
            print(f"  ❌ Failed to generate game #{i+1}")
        else:
            total_success += 1
            print(f"  ✅ Generated game: {description_data['concept']}")
            
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
                json.dump(description_data, f, indent=2)
            
            print(f"  Saved game concept to {model_name}/{os.path.basename(output_file)}")
            
            # Add to archive for context in future generations
            game_archive.append(description_data)
            if len(game_archive) > 50:
                game_archive = game_archive[1:]  # Keep only the most recent 50 games
            
            # Add random wait time between requests to avoid rate limiting
            wait_time = random.uniform(MIN_WAIT_TIME, MAX_WAIT_TIME)
            print(f"  Waiting {wait_time:.2f} seconds before next request...")
            time.sleep(wait_time)
        
        print(f"Progress: {i+1}/{num_games} - {total_success} successful, {total_failed} failed")
    
    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate new game concepts using AI models")
    parser.add_argument(
        "--model", 
        type=str, 
        default="gemini:gemini-1.5-pro", 
        help="Model to use in format 'provider:model_name' (e.g., 'openai:gpt-4o', 'anthropic:claude-3.5-sonnet', 'gemini:gemini-1.5-pro')"
    )
    parser.add_argument(
        "--num_games", 
        type=int, 
        default=5, 
        help="Number of games to generate"
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
    
    args = parser.parse_args()
    
    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait
    
    main(args.model, args.num_games, args.temperature)

#!/usr/bin/env python3
"""
This script reads the existing_game_names.json file, for each genre and game,
and uses Google's Gemini model to generate game descriptions.
The prompts are saved in the format "prompts/{genre}/{game_name}.json".
"""

import os
import json
import argparse
import re
import time
import random
from pathlib import Path
from typing import Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    print("Error: GOOGLE_API_KEY environment variable is not set.")
    exit(1)
    
genai.configure(api_key=API_KEY)

# Rate limiting constants
MIN_WAIT_TIME = 2  # Minimum wait time in seconds
MAX_WAIT_TIME = 5  # Maximum wait time in seconds
RATE_LIMIT_WAIT = 60  # Wait time in seconds when hitting rate limit

def ensure_dir(directory: str) -> None:
    """Ensure that the directory exists."""
    Path(directory).mkdir(parents=True, exist_ok=True)

def generate_game_description(game_info: Dict[str, str], genre: str, model, max_retries: int = 10) -> Dict[str, Any]:
    """
    Generate a game description using the Gemini model.
    
    Args:
        game_info: Dictionary containing game name and developer
        genre: Genre of the game
        model: Gemini model instance
        max_retries: Maximum number of retries on rate limit or timeout errors
        
    Returns:
        Dict: The generated description as a dictionary
    """
    game_name = game_info["name"]
    developer = game_info["developer"]
    allowed_keys = {
        "arrow_up": 38,
        "arrow_down": 40,
        "arrow_left": 37,
        "arrow_right": 39,
        "w": 87,
        "a": 65,
        "s": 83,
        "d": 68,
        "space": 32,
        "shift": 16,
        "q": 81,
        "e": 69,
        "z": 90,
        "x": 88,
        "c": 67,
    }
    
    prompt = f"""
    Generate a description for the "{game_name}" video game. Describe it as if you were describing it to a game developer who is responsible for implementing the game.
    Do not include any instructions for the developer, just describe the game. No sound effects or graphical representations are needed in the description.
    In addition, describe the controls for the game based on keyboard keys along with the action for each key.
    Choose the controls to be from the following allowed keys: {', '.join(allowed_keys.keys())}.
    Format your response in this structure:
    ```json
    {{
      "name": "{game_name}",
      "genre": "{genre}",
      "description": "Detailed description here...",
      "controls": {{
        "NO_OP": "No action",
        "KEY1": "Action for KEY1",
        "KEY2": "Action for KEY2",
        "KEY3": "Action for KEY3"
        // Add more key-action mappings as appropriate
      }}
    }}
    ```
    
    Make sure the controls section includes all the key actions available in the game, with NO_OP always included.
    """
    
    retries = 0
    while retries <= max_retries:
        try:
            response = model.generate_content(prompt)
            # Extract the JSON part from the response using regex
            match = re.search(r'```json\n(.*?)\n```', response.text, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
                description_data = json.loads(json_str)
                return description_data
            else:
                print(f"Failed to extract JSON for {game_name}, using default structure")
                return {
                    "name": game_name,
                    "developer": developer,
                    "genre": genre,
                    "description": "Error: Could not extract description from model response",
                    "controls": {"NO_OP": "No action"}
                }
                
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error generating description for {game_name}: {error_msg}")
            retries += 1
            
            # Check if it's a rate limit error
            if "rate limit" in error_msg or "quota" in error_msg or "429" in error_msg:
                wait_time = RATE_LIMIT_WAIT
                print(f"Rate limit hit for {game_name}. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Check if it's a timeout error
            elif "timeout" in error_msg or "deadline exceeded" in error_msg:
                wait_time = RATE_LIMIT_WAIT // 2
                print(f"Timeout error for {game_name}. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Other errors
            elif retries < max_retries:
                print(f"Error generating description for {game_name}: {error_msg}. Retrying ({retries}/{max_retries})...")
                time.sleep(MIN_WAIT_TIME)
            else:
                print(f"Failed after {max_retries} retries for {game_name}: {error_msg}")
                return {
                    "name": game_name,
                    "developer": developer,
                    "genre": genre,
                    "description": f"Error generating description after {max_retries} retries: {error_msg}",
                    "controls": {"NO_OP": "No action"}
                }
    
    # If we've exhausted retries
    return {
        "name": game_name,
        "developer": developer,
        "genre": genre,
        "description": f"Error: Maximum retries reached",
        "controls": {"NO_OP": "No action"}
    }

def main(model_name: str = "gemini-2.0-flash", limit_per_genre: int = None):
    """
    Main function to generate game descriptions for all games in the json file.
    
    Args:
        model_name: Name of the Gemini model to use
        limit_per_genre: Maximum number of games to process per genre (for testing)
    """
    # Initialize Gemini model
    model = genai.GenerativeModel(model_name)
    
    # Path to the JSON file
    json_file_path = "./existing_game_names.json"
    
    # Output directory
    output_dir = "./prompts"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Read the JSON file
    with open(json_file_path, "r") as f:
        genres_data = json.load(f)
    
    # Track total successful and failed generations
    total_success = 0
    total_failed = 0
    
    # Process each genre and game
    for genre, games in genres_data.items():
        print(f"Processing {genre} games...")
        genre_dir = os.path.join(output_dir, genre)
        ensure_dir(genre_dir)
        
        # Apply limit if specified
        games_to_process = games[:limit_per_genre] if limit_per_genre else games
        
        genre_success = 0
        genre_failed = 0
        
        for game_info in games_to_process:
            game_name = game_info["name"]
            output_file = os.path.join(genre_dir, f"{game_name.replace(' ', '_').replace(':', '').lower()}.json")
            
            # Skip if file already exists
            if os.path.exists(output_file):
                print(f"  Description for {game_name} already exists, skipping.")
                continue
            
            print(f"  Generating description for {game_name}...")
            
            # Generate description
            description_data = generate_game_description(game_info, genre, model)
            
            # Check if generation was successful
            if "Error" in description_data.get("description", ""):
                genre_failed += 1
                print(f"  ❌ Failed to generate description for {game_name}")
            else:
                genre_success += 1
                print(f"  ✅ Generated description for {game_name}")
            
            # Save to file
            with open(output_file, "w") as f:
                json.dump(description_data, f, indent=2)
            
            print(f"  Saved description for {game_name}.")
            
            # Add random wait time between requests to avoid rate limiting
            wait_time = random.uniform(MIN_WAIT_TIME, MAX_WAIT_TIME)
            print(f"  Waiting {wait_time:.2f} seconds before next request...")
            time.sleep(wait_time)
        
        total_success += genre_success
        total_failed += genre_failed
        print(f"Completed {genre}: {genre_success} successful, {genre_failed} failed")
    
    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate game descriptions using Google's Gemini model")
    parser.add_argument(
        "--model", 
        type=str, 
        default="gemini-2.0-flash", 
        help="Gemini model to use (e.g., gemini-2.0-flash)"
    )
    parser.add_argument(
        "--limit", 
        type=int, 
        default=None, 
        help="Limit the number of games to process per genre (for testing)"
    )
    parser.add_argument(
        "--min-wait", 
        type=float, 
        default=2.0, 
        help="Minimum wait time between requests in seconds"
    )
    parser.add_argument(
        "--max-wait", 
        type=float, 
        default=5.0, 
        help="Maximum wait time between requests in seconds"
    )
    
    args = parser.parse_args()
    
    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait
    
    main(args.model, args.limit)

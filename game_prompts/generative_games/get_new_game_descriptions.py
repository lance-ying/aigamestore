#!/usr/bin/env python3
"""
This script generates new game descriptions using Google's Gemini model.
The generated game descriptions are saved in JSON format in the 'new_games/{genre}/' directory.
Unlike existing games, these are completely new game concepts without control mappings.
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

def generate_new_game_description(model, max_retries: int = 10) -> Dict[str, Any]:
    """
    Generate a new game description using the Gemini model.
    
    Args:
        model: Gemini model instance
        max_retries: Maximum number of retries on rate limit or timeout errors
        
    Returns:
        Dict: The generated game description as a dictionary
    """
    prompt = f"""
    Generate a description for a completely new and original single-player video game concept.
    Describe the game as if you were describing it to a game developer who is responsible for implementing the game.
    Do not include any instructions for the developer, just describe the game. No sound effects or graphical representations are needed in the description.
    Create a concept that is fun to play and provides opportunities for skill expression or player creativity.
    Your game should be innovative, engaging, and feasible to implement. The game can have multiple levels or have a scrollable environment.
    Focus on creating a game with an interesting and compelling narrative and gameplay.

    You can choose any genre from the following: {', '.join(GENRES)}.    
    Include the following in your response:
    1. A catchy and original name for the game
    2. Genre of the game
    3. A detailed description of the game 
    
    Format your response in this structure:
    ```json
    {{
      "name": "Game Name",
      "genre": "Genre of the game",
      "description": "Detailed game description...",
    }}
    ```
    
    Be creative and original - create a game that hasn't been made before but would be appealing to players.
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
                genre = description_data.get("genre", "Genre of the game")
                return description_data
                
            else:
                print(f"Failed to extract JSON for {genre} game, using default structure")
                return {
                    "name": f"New Game",
                    "genre": "Genre of the game",
                    "description": "Error: Could not extract description from model response",
                }
                
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error generating new game description: {error_msg}")
            retries += 1
            
            # Check if it's a rate limit error
            if "rate limit" in error_msg or "quota" in error_msg or "429" in error_msg:
                wait_time = RATE_LIMIT_WAIT
                print(f"Rate limit hit for new game. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Check if it's a timeout error
            elif "timeout" in error_msg or "deadline exceeded" in error_msg:
                wait_time = RATE_LIMIT_WAIT // 2
                print(f"Timeout error for new game. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Other errors
            elif retries < max_retries:
                print(f"Error generating new game description: {error_msg}. Retrying ({retries}/{max_retries})...")
                time.sleep(MIN_WAIT_TIME)
            else:
                print(f"Failed after {max_retries} retries for new game: {error_msg}")
                return {
                    "name": f"New Game",
                    "genre": "Genre of the game",
                    "description": f"Error generating description after {max_retries} retries: {error_msg}",
                }
    
    # If we've exhausted retries
    return {
        "name": f"New Game",
        "genre": "Genre of the game",
        "description": f"Error: Maximum retries reached",
    }

def main(model_name: str = "gemini-2.0-flash", num_games: int = 5):
    """
    Main function to generate new game descriptions for each genre.
    
    Args:
        model_name: Name of the Gemini model to use
        num_games_per_genre: Number of games to generate per genre
    """
    # Initialize Gemini model
    model = genai.GenerativeModel(model_name)
    
    # Output directory
    output_dir = "./new_games"
    ensure_dir(output_dir)
    current_game_number = len(os.listdir(output_dir))
    # Track total successful and failed generations
    total_success = 0
    total_failed = 0
    
    # Process each genre
    for i in range(current_game_number, current_game_number + num_games):
        print(f"Generating game #{i+1}...")

        genre_success = 0
        genre_failed = 0
        
        # Generate description
        description_data = generate_new_game_description(model)
        
        # Check if generation was successful
        if "Error" in description_data.get("description", ""):
            genre_failed += 1
            print(f"  ❌ Failed to generate game #{i+1}")
        else:
            genre_success += 1
            game_name = description_data.get("name", f"NewGame{i+1}")
            print(f"  ✅ Generated game: {game_name}")
            
            # Save to file with sanitized game name
            output_file = os.path.join(output_dir, f"game_{i+1}.json")
                
            with open(output_file, "w") as f:
                json.dump(description_data, f, indent=2)
            
            print(f"  Saved description to {os.path.basename(output_file)}")
            
            # Add random wait time between requests to avoid rate limiting
            wait_time = random.uniform(MIN_WAIT_TIME, MAX_WAIT_TIME)
            print(f"  Waiting {wait_time:.2f} seconds before next request...")
            time.sleep(wait_time)
        
        total_success += genre_success
        total_failed += genre_failed
        print(f"Completed {i+1}: {genre_success} successful, {genre_failed} failed")
    
    print(f"\nAll done! Total: {total_success} successful, {total_failed} failed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate new game descriptions using Google's Gemini model")
    parser.add_argument(
        "--model", 
        type=str, 
        default="gemini-2.0-flash", 
        help="Gemini model to use (e.g., gemini-2.0-flash)"
    )
    parser.add_argument(
        "--num_games", 
        type=int, 
        default=5, 
        help="Number of games to generate per genre"
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
    
    args = parser.parse_args()
    
    # Update rate limiting constants if provided
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait
    
    main(args.model, args.num_games)

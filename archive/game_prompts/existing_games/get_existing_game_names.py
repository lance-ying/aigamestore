import os
import json
import re
import time
import random
import argparse
from typing import Dict, List
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

def get_game_names_for_genre(genre: str, model, max_retries: int = 3) -> List[Dict[str, str]]:
    """
    Generate game names for a specific genre with retry logic.
    
    Args:
        genre: The game genre
        model: Gemini model instance
        max_retries: Maximum number of retries on rate limit or timeout errors
        
    Returns:
        List of dictionaries containing name and developer for each game
    """
    prompt = f"""
    Generate names of 10 existing single human-player games from Atari, and other 2D video game consoles in the {genre} genre that 
    would be suitable for implementation in p5.js using no fancy graphics with at most 10 keys on the keyboard.
    Make sure the games exist already and are not made up. Also list where the game is from.
    The games should be:
    1. Playable using keyboard controls
    2. Feasible to implement in p5.js
    3. Belong in the {genre} genre
    
    Output the names of the games and their developer name with no other text in a list as a Markdown code block labeled with ```game_names.
    The output should be in the following format:
    ```game_names
    [
        "Game 1": "developer",
        "Game 2": "developer",
        "Game 3": "developer"
    ]
    """
    
    retries = 0
    while retries <= max_retries:
        try:
            response = model.generate_content(prompt)
            print(f"Generated content for {genre} genre.")
            
            # Extract the list from the response using regex
            match = re.search(r'```game_names\n(.*?)\n```', response.text, re.DOTALL)
            if match:
                # Parse the JSON-like string to extract game names with sources
                game_list = []
                game_data = match.group(1).strip()
                # Remove the outer brackets if they exist
                game_data = game_data.strip('[]')
                # Split by commas and newlines to get individual entries
                entries = re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', game_data)
                for game_name, source in entries:
                    # Store each game as a dictionary with name and developer
                    game_dict = {"name": game_name, "developer": source}
                    game_list.append(game_dict)
                    
                if game_list:
                    return game_list
                else:
                    print(f"No games found in response for {genre}, retrying...")
                    retries += 1
            else:
                print(f"Failed to extract list for {genre}, retrying...")
                retries += 1
                
        except Exception as e:
            error_msg = str(e).lower()
            retries += 1
            
            # Check if it's a rate limit error
            if "rate limit" in error_msg or "quota" in error_msg or "429" in error_msg:
                wait_time = RATE_LIMIT_WAIT
                print(f"Rate limit hit for {genre}. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Check if it's a timeout error
            elif "timeout" in error_msg or "deadline exceeded" in error_msg:
                wait_time = RATE_LIMIT_WAIT // 2
                print(f"Timeout error for {genre}. Waiting {wait_time} seconds before retry {retries}/{max_retries}...")
                time.sleep(wait_time)
            # Other errors
            elif retries < max_retries:
                print(f"Error generating games for {genre}: {error_msg}. Retrying ({retries}/{max_retries})...")
                time.sleep(MIN_WAIT_TIME)
            else:
                print(f"Failed after {max_retries} retries for {genre}: {error_msg}")
                return []
    
    # If we've exhausted retries without success
    print(f"Maximum retries reached for {genre}, returning empty list")
    return []

def get_game_names(model_name: str = "gemini-2.5-pro-exp-03-25") -> Dict[str, List[Dict[str, str]]]:
    """
    Uses Gemini API to generate game names across different genres that are suitable for
    p5.js implementation with keyboard controls.
    """
    model = genai.GenerativeModel(model_name)

    genres = [
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
    
    games = {}
    
    for genre in genres:
        print(f"Generating games for {genre} genre...")
        games[genre] = get_game_names_for_genre(genre, model)
        
        # Check if we got any games
        if games[genre]:
            print(f"✅ Successfully generated {len(games[genre])} games for {genre}")
        else:
            print(f"❌ Failed to generate games for {genre}")
        
        # Add random wait time between requests to avoid rate limiting
        wait_time = random.uniform(MIN_WAIT_TIME, MAX_WAIT_TIME)
        print(f"Waiting {wait_time:.2f} seconds before next genre...")
        time.sleep(wait_time)
    
    return games

def save_games_to_json(games: Dict[str, List[Dict[str, str]]], filename: str = "existing_game_names.json"):
    """Save the game names to a JSON file."""
    with open(filename, 'w') as f:
        json.dump(games, f, indent=4)
    print(f"Game names have been saved to {filename}")

def main():
    parser = argparse.ArgumentParser(description="Generate existing game names using Google's Gemini model")
    parser.add_argument(
        "--model", 
        type=str, 
        default="gemini-2.5-pro-exp-03-25", 
        help="Gemini model to use (e.g., gemini-2.5-pro-exp-03-25)"
    )
    parser.add_argument(
        "--output", 
        type=str, 
        default="existing_game_names.json", 
        help="Output JSON filename"
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
    global MIN_WAIT_TIME, MAX_WAIT_TIME
    MIN_WAIT_TIME = args.min_wait
    MAX_WAIT_TIME = args.max_wait
    
    games = get_game_names(args.model)
    save_games_to_json(games, args.output)
    
    print("\nTotal games by genre:")
    total_games = 0
    for genre, game_list in games.items():
        print(f"{genre}: {len(game_list)} games")
        total_games += len(game_list)
    print(f"Total: {total_games} games")

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
This script generates a playable JavaScript game embedded in a webpage.
It can use different AI models (OpenAI, Claude, or Gemini) to generate the game code.

Usage:
    python generate_game_simple_prompt.py --model [gpt4o|claude-3.7|gemini-2.0-flash-exp] [--genre GENRE] [--players N]

The script generates games with the following features:
- Clear start and end screens
- Instructions on how to play
- Keyboard controls (arrow keys, space, shift, w, a, s, d)
- Any JavaScript library can be used

The generated games are saved in the folder structure:
    games/MODEL_NAME/game_{i}/

Where i is the index of the game for that model.
"""

import os
import re
import json
import argparse
import random
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List

# Import API clients based on availability
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Valid game genres
VALID_GENRES = [
    "action",
    "arcade",
    "platformer", 
    "sports",
    "stealth",
    "strategy",
    "puzzle",
    "shooting",
    "racing",
    "adventure"
]

# Available models
AVAILABLE_MODELS = {
    "gpt4o": "gpt-4o",
    "claude-3.7": "claude-3-7-sonnet-20240307",
    "gemini-2.0": "gemini-2.0-flash-exp"
}

def setup_argparse() -> argparse.Namespace:
    """Set up command-line argument parsing."""
    parser = argparse.ArgumentParser(description="Generate a playable HTML/JavaScript game using AI models.")
    parser.add_argument("--model", type=str, choices=list(AVAILABLE_MODELS.keys()), required=True,
                        help="AI model to use for generation")
    parser.add_argument("--genre", type=str, choices=VALID_GENRES,
                        help="Game genre (if not specified, a random one will be chosen)")
    parser.add_argument("--players", type=int, default=None,
                        help="Number of players (if not specified, a random one will be chosen between [1, 5])")
    return parser.parse_args()

def check_api_keys(model: str) -> bool:
    """Check if the required API key for the selected model is available."""
    if model.startswith("gpt"):
        if not os.environ.get("OPENAI_API_KEY"):
            print("Error: OPENAI_API_KEY environment variable is not set.")
            return False
        if not OPENAI_AVAILABLE:
            print("Error: OpenAI Python package is not installed. Install with: pip install openai")
            return False
    elif model.startswith("claude"):
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("Error: ANTHROPIC_API_KEY environment variable is not set.")
            return False
        if not ANTHROPIC_AVAILABLE:
            print("Error: Anthropic Python package is not installed. Install with: pip install anthropic")
            return False
    elif model.startswith("gemini"):
        if not os.environ.get("GOOGLE_API_KEY"):
            print("Error: GOOGLE_API_KEY environment variable is not set.")
            return False
        if not GENAI_AVAILABLE:
            print("Error: Google GenerativeAI Python package is not installed. Install with: pip install google-generativeai")
            return False
    return True

def create_game_folder(model_name: str) -> Tuple[str, int]:
    """
    Create a new game folder under 'games/MODEL_NAME/game_{i}'.
    Returns the path to the created game folder and the game index.
    """
    base_path = Path("games") / model_name
    base_path.mkdir(parents=True, exist_ok=True)
    
    # Find the next game index
    existing_folders = [d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("game_")]
    next_index = 1
    
    if existing_folders:
        indices = []
        for folder in existing_folders:
            try:
                idx = int(folder.name.split('_')[1])
                indices.append(idx)
            except (ValueError, IndexError):
                continue
        if indices:
            next_index = max(indices) + 1
    
    game_folder = base_path / f"game_{next_index}"
    game_folder.mkdir(exist_ok=True)
    
    return str(game_folder), next_index

def generate_prompt(genre: str, num_players: int) -> str:
    """Generate the prompt for the AI model."""
    article = "an" if genre[0].lower() in ['a', 'e', 'i', 'o', 'u'] else "a"
    prompt = (
        f"Generate {article} {genre} game with {num_players} players. One player will be controlled by a human and the other players will be controlled by the AI. The game should be fun and engaging.\n\n"
        "Requirements:\n"
        "1. The game must be playable in a web browser.\n"
        "2. The game must have a clear start screen with start button and an end screen that shows the result (win/lose/score).\n"
        "3. Only keyboard controls are allowed like arrow keys, space, shift, w, a, s, d\n"
        "4. You can use any JavaScript library for the game, rendering, physics, etc. and import it accordingly.\n"
        "Please provide your response as two code blocks:\n"
        "1. The first code block should be labeled with ```html and contain the complete HTML code with instructions on how to play.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code.\n"
        "If you include the JavaScript directly in the HTML, just provide the HTML code block."
    )
    return prompt

def generate_game_with_openai(prompt: str, model_name: str) -> str:
    """Generate game code using OpenAI API."""
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=AVAILABLE_MODELS[model_name],
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4000
    )
    return response.choices[0].message.content

def generate_game_with_anthropic(prompt: str, model_name: str) -> str:
    """Generate game code using Anthropic API."""
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model=AVAILABLE_MODELS[model_name],
        max_tokens=4000,
        temperature=0.7,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response.content[0].text

def generate_game_with_gemini(prompt: str, model_name: str) -> str:
    """Generate game code using Google Gemini API."""
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel(AVAILABLE_MODELS[model_name])
    response = model.generate_content(prompt)
    return response.text

def generate_game_code(prompt: str, model_name: str) -> str:
    """Generate game code using the specified AI model."""
    if model_name == "gpt4o":
        return generate_game_with_openai(prompt, model_name)
    elif model_name == "claude-3.7":
        return generate_game_with_anthropic(prompt, model_name)
    elif model_name == "gemini-2.0-flash-exp":
        return generate_game_with_gemini(prompt, model_name)
    else:
        raise ValueError(f"Unsupported model: {model_name}")

def parse_code_blocks(response_text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract HTML and JavaScript code blocks from the API response text.
    Returns a tuple of (html_code, js_code).
    """
    html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
    js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)
    
    html_code = html_match.group(1).strip() if html_match else None
    js_code = js_match.group(1).strip() if js_match else None
    
    # If no separate JS block but JS is in the HTML
    if html_code and not js_code and "<script" in html_code:
        return html_code, None
    
    return html_code, js_code

def save_game_files(game_folder: str, html_code: str, js_code: Optional[str]) -> None:
    """Save the generated HTML and JavaScript code to files."""
    html_path = os.path.join(game_folder, "index.html")
    
    # If JavaScript is separate, update the HTML to reference it
    if js_code:
        # Check if HTML already references game.js
        if "game.js" not in html_code:
            # Add script tag before closing body tag
            html_code = html_code.replace("</body>", '<script src="game.js"></script>\n</body>')
        
        js_path = os.path.join(game_folder, "game.js")
        with open(js_path, "w", encoding="utf-8") as js_file:
            js_file.write(js_code)
    
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html_code)

def save_metadata(game_folder: str, prompt: str, response: str, genre: str, num_players: int, game_index: int) -> None:
    """Save metadata about the generated game."""
    metadata = {
        "prompt": prompt,
        "genre": genre,
        "num_players": num_players,
        "game_index": game_index,
        "timestamp": str(Path(game_folder).stat().st_mtime)
    }
    
    # Save full response separately as it can be large
    with open(os.path.join(game_folder, "full_response.txt"), "w", encoding="utf-8") as f:
        f.write(response)
    
    # Save metadata as JSON
    with open(os.path.join(game_folder, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

def update_master_index() -> None:
    """
    Update the master index HTML file that lists all games by model and genre.
    This allows filtering games by genre using a dropdown menu.
    """
    games_dir = Path("games")
    if not games_dir.exists():
        return
    
    # Collect all games and their metadata
    all_games = []
    for model_dir in games_dir.iterdir():
        if not model_dir.is_dir():
            continue
        
        model_name = model_dir.name
        for game_dir in model_dir.iterdir():
            if not (game_dir.is_dir() and game_dir.name.startswith("game_")):
                continue
            
            metadata_file = game_dir / "metadata.json"
            if metadata_file.exists():
                try:
                    with open(metadata_file, "r", encoding="utf-8") as f:
                        metadata = json.load(f)
                    
                    all_games.append({
                        "model": model_name,
                        "path": str(game_dir.relative_to(games_dir)),
                        "genre": metadata.get("genre", "unknown"),
                        "num_players": metadata.get("num_players", 0),
                        "game_index": metadata.get("game_index", 0)
                    })
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Error reading metadata from {metadata_file}: {e}")
    
    # Generate HTML for the master index
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Games Index</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .filters {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
        }
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .game-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            transition: transform 0.2s;
        }
        .game-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .game-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .game-info {
            color: #666;
            font-size: 0.9em;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <h1>AI Generated Games</h1>
    
    <div class="filters">
        <div>
            <label for="model-filter">Model:</label>
            <select id="model-filter">
                <option value="all">All Models</option>
"""
    
    # Add model options
    models = sorted(set(game["model"] for game in all_games))
    for model in models:
        html += f'                <option value="{model}">{model}</option>\n'
    
    html += """            </select>
        </div>
        <div>
            <label for="genre-filter">Genre:</label>
            <select id="genre-filter">
                <option value="all">All Genres</option>
"""
    
    # Add genre options
    genres = sorted(set(game["genre"] for game in all_games))
    for genre in genres:
        html += f'                <option value="{genre}">{genre}</option>\n'
    
    html += """            </select>
        </div>
    </div>
    
    <div class="game-grid" id="game-container">
"""
    
    # Add game cards
    for game in all_games:
        html += f"""        <div class="game-card" data-model="{game['model']}" data-genre="{game['genre']}">
            <div class="game-title">Game {game['game_index']}</div>
            <div class="game-info">
                <div>Model: {game['model']}</div>
                <div>Genre: {game['genre']}</div>
                <div>Players: {game['num_players']}</div>
            </div>
            <a href="{game['path']}/index.html" target="_blank">Play Game</a>
        </div>
"""
    
    html += """    </div>

    <script>
        document.getElementById('model-filter').addEventListener('change', filterGames);
        document.getElementById('genre-filter').addEventListener('change', filterGames);
        
        function filterGames() {
            const modelFilter = document.getElementById('model-filter').value;
            const genreFilter = document.getElementById('genre-filter').value;
            
            const gameCards = document.querySelectorAll('.game-card');
            
            gameCards.forEach(card => {
                const modelMatch = modelFilter === 'all' || card.dataset.model === modelFilter;
                const genreMatch = genreFilter === 'all' || card.dataset.genre === genreFilter;
                
                if (modelMatch && genreMatch) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    </script>
</body>
</html>
"""
    
    # Write the master index HTML file
    with open(games_dir / "index.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"Master index updated at {games_dir / 'index.html'}")

def main():
    """Main function to generate a game."""
    args = setup_argparse()
    
    # Check if the required API key is available
    if not check_api_keys(args.model):
        return
    
    # Choose a random genre if not specified
    genre = args.genre if args.genre else random.choice(VALID_GENRES)
    num_players = max(1, args.players) if args.players else random.randint(1, 5)
    
    # Create game folder
    game_folder, game_index = create_game_folder(args.model)
    print(f"Game will be saved in: {game_folder}")
    
    # Generate prompt
    prompt = generate_prompt(genre, num_players)
    print("\n--- Generated Prompt ---")
    print(prompt)
    print("--- End of Prompt ---\n")
    
    # Generate game code
    print(f"Generating game code using {args.model}...")
    try:
        response = generate_game_code(prompt, args.model)
        print("Received response from API.")
        
        # Parse code blocks
        html_code, js_code = parse_code_blocks(response)
        
        if html_code:
            # Save game files
            save_game_files(game_folder, html_code, js_code)
            
            # Save metadata
            save_metadata(game_folder, prompt, response, genre, num_players, game_index)
            
            # Update master index
            update_master_index()
            
            print(f"Game successfully generated and saved in {game_folder}")
            print(f"You can play the game by opening {os.path.join(game_folder, 'index.html')} in a web browser")
        else:
            print("Failed to parse code blocks from the API response.")
            with open(os.path.join(game_folder, "full_response.txt"), "w", encoding="utf-8") as f:
                f.write(response)
            print(f"Saved full API response to {os.path.join(game_folder, 'full_response.txt')}")
    
    except Exception as e:
        print(f"Error generating game: {e}")
        return

if __name__ == "__main__":
    main() 
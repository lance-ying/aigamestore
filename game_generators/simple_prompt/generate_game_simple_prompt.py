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
    games/MODEL_NAME/GENRE/game_{i}/

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
    "adventure",
]

# Available models
AVAILABLE_MODELS = {
    "o3-mini": "o3-mini",
    "gpt-4o": "gpt-4o",
    "claude-3.7": "claude-3-7-sonnet-20250219",
    "gemini-2.0": "gemini-2.0-flash-exp",
}


def setup_argparse() -> argparse.Namespace:
    """Set up command-line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Generate a playable HTML/JavaScript game using AI models."
    )
    parser.add_argument(
        "--model",
        type=str,
        choices=list(AVAILABLE_MODELS.keys()),
        required=True,
        help="AI model to use for generation",
    )
    parser.add_argument(
        "--genre",
        type=str,
        choices=VALID_GENRES,
        help="Game genre (if not specified, a random one will be chosen)",
    )
    parser.add_argument(
        "--players",
        type=int,
        default=None,
        help="Number of players (if not specified, a random one will be chosen between [1, 5])",
    )
    return parser.parse_args()


def check_api_keys(model: str) -> bool:
    """Check if the required API key for the selected model is available."""
    if model.startswith("gpt") or model.startswith("o3"):
        if not os.environ.get("OPENAI_API_KEY"):
            print("Error: OPENAI_API_KEY environment variable is not set.")
            return False
        if not OPENAI_AVAILABLE:
            print(
                "Error: OpenAI Python package is not installed. Install with: pip install openai"
            )
            return False
    elif model.startswith("claude"):
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("Error: ANTHROPIC_API_KEY environment variable is not set.")
            return False
        if not ANTHROPIC_AVAILABLE:
            print(
                "Error: Anthropic Python package is not installed. Install with: pip install anthropic"
            )
            return False
    elif model.startswith("gemini"):
        if not os.environ.get("GOOGLE_API_KEY"):
            print("Error: GOOGLE_API_KEY environment variable is not set.")
            return False
        if not GENAI_AVAILABLE:
            print(
                "Error: Google GenerativeAI Python package is not installed. Install with: pip install google-generativeai"
            )
            return False
    return True


def create_game_folder(model_name: str, genre: str) -> Tuple[str, int]:
    """
    Create a new game folder under 'games/MODEL_NAME/GENRE/game_{i}'.
    Returns the path to the created game folder and the game index.
    """
    base_path = Path("games") / model_name / genre
    base_path.mkdir(parents=True, exist_ok=True)

    # Find the next game index
    existing_folders = [
        d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("game_")
    ]
    next_index = 1

    if existing_folders:
        indices = []
        for folder in existing_folders:
            try:
                idx = int(folder.name.split("_")[1])
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
    prompt = (
        f"Generate an interesting and fun {genre} game with {num_players} characters. One character will be controlled by a human player and the rest will be controlled by AI.\n"
        "First, write the description of the game that is fun and engaging. You should label the description with ```description and ```.\n"
        "Requirements:\n"
        "- The game must be playable in a web browser using JavaScript key codes for controls: \n"
        "  * Arrow keys (keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN) \n"
        "  * Space bar (key === ' ') \n"
        "  * Shift key (keyCode === SHIFT or keyCode === 16) \n"
        "  * WASD keys (key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D') \n"
        "- No audio should be used in the game.\n"
        "- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.\n"
        "- Ensure that the game code has correctly implemented game mechanics to the game description.\n"
        "- There should be a start screen with instructions on how to play the game and a game over screen with the score. Display any other information you want on the screen.\n"
        "- Please provide a creative title for your game at the beginning of your response, prefixed with 'GAME TITLE: '.\n"
        "- Ensure proper key event handling with correct JavaScript key codes, not undefined constants\n"
        "Then, generate the game code as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and ```. Mention the game title and instructions above the game. Center all contents. Include a <script> tag in the <head> tag with the path to the game.js file and other javascript libraries.\n"
        "2. The second code block should be labeled with ```javascript and ```. It should contain the complete working JavaScript game code (game.js).\n"
        "Ensure that when the HTML file is opened in a browser, the game runs correctly."
    )
    return prompt


def generate_game_with_openai(prompt: str, model_name: str) -> str:
    """Generate game code using OpenAI API."""
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=AVAILABLE_MODELS[model_name],
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def generate_game_with_anthropic(prompt: str, model_name: str) -> str:
    """Generate game code using Anthropic API."""
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model=AVAILABLE_MODELS[model_name],
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def generate_game_with_gemini(prompt: str, model_name: str) -> str:
    """Generate game code using Google Gemini API."""
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    # gen_config = genai.GenerationConfig(
    #     temperature=0.7,
    # )
    model = genai.GenerativeModel(AVAILABLE_MODELS[model_name])
    response = model.generate_content(prompt)
    return response.text


def generate_game_code(prompt: str, model_name: str) -> str:
    """Generate game code using the specified AI model."""
    if model_name == "gpt-4o":
        return generate_game_with_openai(prompt, model_name)
    elif model_name == "o3-mini":
        return generate_game_with_openai(prompt, model_name)
    elif model_name == "claude-3.7":
        return generate_game_with_anthropic(prompt, model_name)
    elif model_name == "gemini-2.0":
        return generate_game_with_gemini(prompt, model_name)
    else:
        raise ValueError(f"Unsupported model: {model_name}")


def parse_code_blocks(response_text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract HTML and JavaScript code blocks from the API response text.
    Returns a tuple of (html_code, js_code).
    """
    description_match = re.search(
        r"```description\s*(.*?)```", response_text, re.DOTALL
    )
    html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
    js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

    html_code = html_match.group(1).strip() if html_match else None
    js_code = js_match.group(1).strip() if js_match else None
    description = description_match.group(1).strip() if description_match else None

    # If no separate JS block but JS is in the HTML
    if html_code and not js_code and "<script" in html_code:
        return html_code, None

    return html_code, js_code, description


def save_game_files(game_folder: str, html_code: str, js_code: Optional[str]) -> None:
    """Save the generated HTML and JavaScript code to files."""
    html_path = os.path.join(game_folder, "index.html")

    # If JavaScript is separate, update the HTML to reference it
    if js_code:
        # Check if HTML already references game.js
        if "game.js" not in html_code:
            # Add script tag before closing body tag
            html_code = html_code.replace(
                "</body>", '<script src="game.js"></script>\n</body>'
            )

        js_path = os.path.join(game_folder, "game.js")
        with open(js_path, "w", encoding="utf-8") as js_file:
            js_file.write(js_code)

    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html_code)


def save_metadata(
    game_folder: str,
    prompt: str,
    response: str,
    genre: str,
    num_players: int,
    game_index: int,
    game_title: str,
) -> None:
    """Save metadata about the generated game."""
    metadata = {
        "prompt": prompt,
        "genre": genre,
        "num_players": num_players,
        "game_index": game_index,
        "game_title": game_title,
        "timestamp": str(Path(game_folder).stat().st_mtime),
    }

    # Save full response separately as it can be large
    with open(
        os.path.join(game_folder, "full_response.txt"), "w", encoding="utf-8"
    ) as f:
        f.write(response)

    # Save metadata as JSON
    with open(os.path.join(game_folder, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def extract_game_title(response_text: str) -> str:
    """Extract the game title from the AI's response."""
    # Look for a line starting with "GAME TITLE: "
    title_match = re.search(
        r"GAME TITLE:\s*(.*?)(?:\n|$)", response_text, re.IGNORECASE
    )
    if title_match:
        return title_match.group(1).strip()

    # If not found, try to extract from HTML title tag
    html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
    if html_match:
        html_code = html_match.group(1)
        title_tag_match = re.search(r"<title>(.*?)</title>", html_code, re.IGNORECASE)
        if title_tag_match:
            return title_tag_match.group(1).strip()

    # Default title if nothing found
    return "Untitled Game"


def main():
    """Main function to generate a game."""
    args = setup_argparse()

    # Check if the required API key is available
    if not check_api_keys(args.model):
        return

    # Choose a random genre if not specified
    genre = args.genre if args.genre else random.choice(VALID_GENRES)
    num_players = args.players if args.players else random.randint(1, 5)
    # Create game folder with genre subfolder
    game_folder, game_index = create_game_folder(args.model, genre)
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

        # Extract game title
        game_title = extract_game_title(response)
        print(f"Game title: {game_title}")

        # Parse code blocks
        html_code, js_code, description = parse_code_blocks(response)

        if html_code:
            # Save game files
            save_game_files(game_folder, html_code, js_code)

            # Save metadata with game title
            save_metadata(
                game_folder,
                prompt,
                response,
                genre,
                num_players,
                game_index,
                game_title,
            )

            print(
                f"Game '{game_title}' successfully generated and saved in {game_folder}"
            )
            print(
                f"You can play the game by opening {os.path.join(game_folder, 'index.html')} in a web browser"
            )
        else:
            print("Failed to parse code blocks from the API response.")
            with open(
                os.path.join(game_folder, "full_response.txt"), "w", encoding="utf-8"
            ) as f:
                f.write(response)
            print(
                f"Saved full API response to {os.path.join(game_folder, 'full_response.txt')}"
            )

    except Exception as e:
        print(f"Error generating game: {e}")
        return


if __name__ == "__main__":
    main()

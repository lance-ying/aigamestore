import base64
from datetime import datetime
import os
import re
from pathlib import Path
import logging
import sys
import json

# Third-party imports
from dotenv import load_dotenv
import google.generativeai as genai
import anthropic

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
    
# Verify required API keys exist
if not os.environ.get("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found in environment variables")
if not os.environ.get("ANTHROPIC_API_KEY"):
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
    
# Configure Gemini API
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Create output directory with timestamp
def create_output_directory():
    """Create a sequentially numbered game directory to save results."""
    base_dir = Path(__file__).parent / "results"
    
    # Create the base results directory if it doesn't exist
    base_dir.mkdir(parents=True, exist_ok=True)
    
    # Find the next available game index
    i = 0
    while True:
        save_dir = base_dir / f"game_{i}"
        if not save_dir.exists():
            break
        i += 1
    
    # Create the directory
    save_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created output directory: {save_dir}")
    return save_dir

def save_binary_file(file_path, data):
    """Save binary data to a file."""
    try:
        with open(file_path, "wb") as f:
            f.write(data)
        logger.info(f"Saved file to: {file_path}")
    except Exception as e:
        logger.error(f"Error saving file {file_path}: {e}")
        raise

def save_text_file(file_path, content):
    """Save text content to a file."""
    try:
        with open(file_path, "w") as f:
            f.write(content)
        logger.info(f"Saved text to: {file_path}")
    except Exception as e:
        logger.error(f"Error saving file {file_path}: {e}")
        raise

def get_game_description(client, game_type, save_dir):
    """Get structured game description from Claude AI."""
    logger.info("Getting game description from Claude AI")
    
    prompt = f"""
    Design a {game_type} game with a structured description. Include:

    1. Game title
    2. Game overview (2-3 sentences)
    3. Game mechanics (how the game works)
    4. Success criteria (how to win)
    5. Failure criteria (how to lose)
    6. Reward function (how points are earned)
    7. Characters (for each character provide):
       - Name
       - Role in the game (explicitly mark which character is the player character)
       - Visual description (include dimensions like 32x32 pixels, color scheme, style)
       - Success criteria (specific to this character)
       - Failure criteria (specific to this character)
    8. Environment components (list at most 10 passive elements in the game world):
       - Name
       - Purpose
       - Visual description (include dimensions, color scheme, style)

    Format your response as a structured JSON object with these fields.
    Make sure the visual descriptions are detailed enough for pixel art generation.
    Ensure you clearly identify which character is the player character.
    """
    
    try:
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        
        answer = message.content[0].text
        save_text_file(save_dir / "game_description.txt", answer)
        
        # Extract JSON from the response
        json_match = re.search(r"```json\s*(.*?)\s*```", answer, re.DOTALL)
        if json_match:
            game_json = json_match.group(1).strip()
        else:
            # Try to find JSON without code block markers
            json_match = re.search(r"(\{.*\})", answer, re.DOTALL)
            if json_match:
                game_json = json_match.group(1).strip()
            else:
                logger.error("Could not extract JSON from Claude's response")
                game_json = answer  # Use the full response as fallback
        
        # Save the structured JSON
        save_text_file(save_dir / "game_description.json", game_json)
        
        try:
            # Parse JSON to validate it
            game_data = json.loads(game_json)
            return game_data
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON from Claude's response")
            # Return the text as is, we'll handle it later
            return {"raw_description": answer}
        
    except Exception as e:
        logger.error(f"Error during Claude API call for game description: {e}")
        raise

def generate_sprite(model, character_info, save_dir, index):
    """Generate a single sprite using Gemini AI."""
    logger.info(f"Generating sprite for {character_info.get('name', f'item_{index}')}")
    
    prompt = f"""
    Generate a pixel art sprite with these specifications:
    
    Name: {character_info.get('name', 'Character')}
    Role: {character_info.get('role', 'Unknown')}
    
    Visual description: {character_info.get('visual_description', 'A pixel art character')}
    
    Generate ONLY the image with a solid white background. No text or explanation needed.
    The output should be a PNG image with a white background.
    """
    
    generation_config = {
        "temperature": 1.0,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 4096,
    }
    
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    ]
    
    sprite_paths = []
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings,
            stream=True
        )
        
        for chunk in response:
            try:
                # Handle different response formats
                if hasattr(chunk, 'parts') and chunk.parts:
                    for part in chunk.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            # Create a filename based on character name or index
                            name = character_info.get('name', f'item_{index}').lower().replace(' ', '_')
                            file_name = save_dir / f"{name}.png"
                            
                            # Extract image data based on response format
                            image_data = None
                            if hasattr(part.inline_data, 'data'):
                                image_data = part.inline_data.data
                            elif isinstance(part.inline_data, dict) and 'data' in part.inline_data:
                                image_data = base64.b64decode(part.inline_data['data'])
                            
                            if image_data:
                                save_binary_file(file_name, image_data)
                                logger.info(f"Sprite saved to: {file_name}")
                                sprite_paths.append(str(file_name.relative_to(save_dir)))
                            else:
                                logger.warning("Received inline data but couldn't extract image")
            except Exception as chunk_error:
                logger.warning(f"Error processing chunk: {chunk_error}")
                continue
        
        return sprite_paths
        
    except Exception as e:
        logger.error(f"Error during Gemini API call for sprite generation: {e}")
        raise

def generate_sprites(model, game_data, save_dir):
    """Generate all sprites for the game using Gemini AI."""
    logger.info("Generating all game sprites with Gemini AI")
    
    sprite_info = {}
    
    # Generate character sprites
    if "characters" in game_data and isinstance(game_data["characters"], list):
        for i, character in enumerate(game_data["characters"]):
            sprite_paths = generate_sprite(model, character, save_dir, i)
            if sprite_paths:
                sprite_info[character.get("name", f"character_{i}")] = {
                    "paths": sprite_paths,
                    "info": character
                }
    
    # Generate environment component sprites
    if "environment_components" in game_data and isinstance(game_data["environment_components"], list):
        for i, component in enumerate(game_data["environment_components"]):
            sprite_paths = generate_sprite(model, component, save_dir, i + 100)  # Offset index to avoid conflicts
            if sprite_paths:
                sprite_info[component.get("name", f"environment_{i}")] = {
                    "paths": sprite_paths,
                    "info": component
                }
    
    # Save sprite info
    save_text_file(save_dir / "sprite_info.json", json.dumps(sprite_info, indent=2))
    
    return sprite_info

def generate_game_code(client, game_data, sprite_info, save_dir):
    """Generate game code using Claude AI."""
    logger.info("Generating game code with Claude AI")
    
    # Create a formatted list of sprites with their paths
    sprite_list = ""
    for name, data in sprite_info.items():
        paths_str = ", ".join([f'"{path}"' for path in data["paths"]])
        sprite_list += f"- {name}: {paths_str}\n"
    
    prompt = f"""
    Create a complete browser game based on this game description:
    
    {json.dumps(game_data, indent=2)}
    
    Use these sprite assets (filenames relative to the HTML file):
    {sprite_list}
    
    Requirements:
    1. Create a complete, playable game using p5.js with no sound
    2. Implement all game mechanics described
    3. Use the sprites provided
    4. Make the game responsive
    5. Include clear instructions for the player
    6. Implement the success, failure, and reward functions for each character
    
    Return TWO separate code blocks:
    1. An HTML file (index.html) that includes the p5.js library and links to the game.js file
    2. A JavaScript file (game.js) with all the game logic
    
    Format your answer with these exact code block markers:
    ```html
    // HTML code here
    ```
    
    ```javascript
    // JavaScript code here
    ```
    """
    
    try:
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}]
        )
        
        answer = message.content[0].text
        save_text_file(save_dir / "game_code_response.txt", answer)
        
        # Extract HTML code
        html_match = re.search(r"```html\s*(.*?)\s*```", answer, re.DOTALL)
        if html_match:
            html_code = html_match.group(1).strip()
            save_text_file(save_dir / "index.html", html_code)
            logger.info("Saved index.html")
        else:
            logger.error("Could not extract HTML code from Claude's response")
        
        # Extract JavaScript code - try different patterns
        js_match = re.search(r"```javascript\s*(.*?)\s*```", answer, re.DOTALL)
        if not js_match:
            js_match = re.search(r"```js\s*(.*?)\s*```", answer, re.DOTALL)
        if not js_match:
            js_match = re.search(r"```\s*(let|const|var|function|class|import|\/\/|\/\*|window|document).*?```", answer, re.DOTALL)
            
        if js_match:
            js_code = js_match.group(1).strip()
            save_text_file(save_dir / "game.js", js_code)
            logger.info("Saved game.js")
        else:
            logger.error("Could not extract JavaScript code from Claude's response")
            # Try to extract any code block after the HTML block as a fallback
            remaining_text = answer
            if html_match:
                html_end_pos = html_match.end()
                if html_end_pos < len(answer):
                    remaining_text = answer[html_end_pos:]
            
            js_fallback_match = re.search(r"```\s*(.*?)\s*```", remaining_text, re.DOTALL)
            if js_fallback_match:
                js_code = js_fallback_match.group(1).strip()
                save_text_file(save_dir / "game.js", js_code)
                logger.info("Saved game.js using fallback extraction")
        
        # Return the extracted code
        return {
            "html": html_match.group(1).strip() if html_match else "",
            "js": js_match.group(1).strip() if js_match else (js_fallback_match.group(1).strip() if 'js_fallback_match' in locals() and js_fallback_match else "")
        }
        
    except Exception as e:
        logger.error(f"Error during Claude API call for game code: {e}")
        raise

def main():
    """Main function to orchestrate the game generation process."""
    game_type = "platformer"
    
    try:
        # Setup
        save_dir = create_output_directory()
        
        # Step 1: Get structured game description from Claude
        try:
            claude_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            game_data = get_game_description(claude_client, game_type, save_dir)
        except Exception as e:
            logger.error(f"Error with Claude API for game description: {e}")
            logger.info("Make sure you have the latest anthropic package installed.")
            logger.info("Run: pip install -U anthropic")
            raise
        
        # Step 2: Generate sprites with Gemini based on the game description
        try:
            gemini_model = genai.GenerativeModel(model_name="gemini-2.0-flash-exp")
            sprite_info = generate_sprites(gemini_model, game_data, save_dir)
        except Exception as e:
            logger.error(f"Error initializing Gemini model or generating sprites: {e}")
            logger.info("Make sure you have the latest google-generativeai package installed.")
            logger.info("Run: pip install -U google-generativeai")
            raise
        
        # Step 3: Generate game code with Claude using the game description and sprites
        try:
            game_code = generate_game_code(claude_client, game_data, sprite_info, save_dir)
            
        except Exception as e:
            logger.error(f"Error with Claude API for game code: {e}")
            raise
        
        logger.info(f"Game generation complete. Files saved to {save_dir}")
        logger.info(f"Open {save_dir}/index.html in a browser to play the game")
        
    except Exception as e:
        logger.error(f"Error in main process: {e}")
        raise

if __name__ == "__main__":
    main()

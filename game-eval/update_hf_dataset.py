from pathlib import Path
import json
from datasets import Dataset, load_dataset
import os
import uuid
import re


GAMES_DIR = Path(__file__).parent / "games"
HF_DATASET_REPO = "generative-games/gen-games-v2"

def load_file_content(file_path):
    """Helper function to load file content, returns empty string if file doesn't exist"""
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def get_game_key(method, model, genre, game_name):
    """Create a unique key for a game based on its identifiers"""
    return f"{method}_{model}_{genre}_{game_name}"

def extract_external_dependencies(html_content):
    """Extract external JavaScript dependencies from HTML content"""
    dependencies = []
    # Look for script tags with src attributes
    script_pattern = r'<script\s+src="([^"]+)"'
    matches = re.findall(script_pattern, html_content)
    for match in matches:
        if not match.startswith('http'):
            # Local file, skip it as we'll handle it separately
            continue
        dependencies.append({
            "url": match,
            "type": "script"
        })
    return dependencies

def collect_js_files(game_dir):
    """Collect all JavaScript files in the game directory"""
    js_files = {}
    for file in game_dir.glob("*.js"):
        js_files[file.name] = load_file_content(file)
    return js_files

def collect_samples(existing_games=None):
    """
    Collect all samples from the games directory.
    
    Args:
        existing_games (dict): Dictionary mapping game keys to their existing IDs
    """
    existing_games = existing_games or {}
    samples = []
    
    # Iterate through method directories (e.g., 'conversation', 'judge_conversation')
    for method_dir in GAMES_DIR.iterdir():
        if not method_dir.is_dir():
            continue
            
        # Iterate through model directories under each method
        for model_dir in method_dir.iterdir():
            if not model_dir.is_dir():
                continue
                
            # Get full model name (e.g., 'o3-mini')
            model_name = model_dir.name
            
            # Iterate through genre directories
            for genre_dir in model_dir.iterdir():
                if not genre_dir.is_dir():
                    continue
                    
                genre = genre_dir.name
                
                # Iterate through game directories
                for game_dir in genre_dir.iterdir():
                    if not game_dir.is_dir():
                        continue
                        
                    game_name = game_dir.name
                    
                    # Create a key for this game
                    game_key = get_game_key(method_dir.name, model_name, genre, game_name)
                    
                    if game_key in existing_games:
                        print(f"Found existing game: {game_key}")
                    else:
                        print(f"New game: {game_key}")

                    # Use existing ID if available, otherwise generate new one
                    game_id = existing_games.get(game_key, str(uuid.uuid4()))
                    
                    # Load metadata
                    metadata_path = game_dir / "metadata.json"
                    metadata = {}
                    if metadata_path.exists():
                        with open(metadata_path, "r", encoding="utf-8") as f:
                            metadata = json.load(f)
                    
                    # Load description
                    description_path = game_dir / "description.txt"
                    description = load_file_content(description_path)
                    
                    # Load conversation log
                    conversation_path = game_dir / "conversation_log.txt"
                    conversation_log = load_file_content(conversation_path)
                    
                    # Load HTML
                    html_path = game_dir / "index.html"
                    html = load_file_content(html_path)
                    
                    # Extract external dependencies from HTML
                    dependencies = extract_external_dependencies(html)
                    
                    # Collect all JavaScript files
                    js_files = collect_js_files(game_dir)
                    
                    # Create sample with all available data
                    sample = {
                        "id": game_id,
                        "method": method_dir.name,
                        "model": model_name,
                        "genre": genre,
                        "game_name": game_name,
                        "metadata": metadata,
                        "description": description,
                        "conversation_log": conversation_log,
                        "html": html,
                        "dependencies": dependencies,
                        "js_files": js_files,
                    }
                    
                    samples.append(sample)
    
    return samples

def update_dataset():
    """Update the Huggingface dataset by preserving existing IDs and adding new data"""
    # Load existing dataset
    try:
        existing_dataset = load_dataset(HF_DATASET_REPO, split="train")
        print(f"\nLoaded existing dataset with {len(existing_dataset)} samples")
        
        # Create mapping of existing games to their IDs
        existing_games = {
            get_game_key(row["method"], row["model"], row["genre"], row["game_name"]): row["id"]
            for row in existing_dataset
        }
    except Exception as e:
        print(f"Could not load existing dataset: {e}")
        print("Creating new dataset from scratch")
        existing_games = {}
    
    # Collect all samples, preserving existing IDs
    samples = collect_samples(existing_games)
    
    # Create new dataset
    dataset = Dataset.from_list(samples)
    
    # Print dataset info
    print("\nDataset updated successfully!")
    print(f"Number of samples: {len(dataset)}")
    print("\nDataset features:")
    print(dataset.features)
    
    return dataset

if __name__ == "__main__":
    dataset = update_dataset()
    breakpoint()
    # Push to Hugging Face Hub
    dataset.push_to_hub(
        HF_DATASET_REPO,
        private=True  # Set to False for public dataset
    ) 
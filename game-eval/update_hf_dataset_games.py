import hashlib
from pathlib import Path
import json
from datasets import Dataset, load_dataset
import os
import uuid
import re

import numpy as np


# GAMES_DIR = Path(__file__).parent / "results" / "gen_game_topdown" / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"
GAMES_DIR = Path(__file__).parent / "results" / "gen_game_topdown"
HF_DATASET_REPO = "generative-games/gen-games-v7"

method_name = "simple_prompt_with_resampling"
model_name = "claude-3-7-sonnet-20250219"


def get_game_key(game_genre, method, model, concept_id, sample_id):
    return f"{game_genre}_{method}_{model}_{concept_id}_{sample_id}"


def collect_samples(existing_games=None):
    """
    Collect all samples from the games directory.
    
    Args:
        existing_games (dict): Dictionary mapping game keys to their existing IDs
    """
    existing_games = existing_games or {}
    samples = []
    
    for genre_dir in GAMES_DIR.iterdir():
        genre_name = genre_dir.name
        genre_dir = genre_dir / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"
        for theme_dir in genre_dir.iterdir():
            theme_name = theme_dir.name
            for sample_dir in theme_dir.iterdir():
                if not sample_dir.is_dir():
                    continue
                sample_id = sample_dir.name

                # if no consistency_check.json, skip (encountered run issues)
                if not (sample_dir / "consistency_check.json").exists():
                    continue
                    
                consistency_check = json.load(open(sample_dir / "consistency_check.json", "r", encoding="utf-8"))
                if "error" in consistency_check:
                    continue

                consistency_check_rdm_policy = json.load(open(sample_dir / "consistency_check_rdm_policy.json", "r", encoding="utf-8"))
                assert set(consistency_check["mechanics_implemented"]) == set(consistency_check_rdm_policy["mechanics_implemented"])

                # Create a key for this game
                game_key = get_game_key(genre_name, method_name, model_name, theme_name, sample_id)
                
                if game_key in existing_games:
                    print(f"Found existing game: {game_key}")
                else:
                    print(f"New game: {game_key}")

                # game id = hash of game key
                game_id = hashlib.sha256(game_key.encode()).hexdigest()

                # recursively find all html and js file (except if in folder "code")
                code_dir = sample_dir / "code_with_logs"
                game_file_paths = []
                game_file_contents = []
                for file_path in code_dir.rglob("*.html"):
                    game_file_paths.append(str(file_path.relative_to(code_dir)))
                    with open(file_path, "r", encoding="utf-8") as f:
                        game_file_contents.append(f.read())
                for file_path in code_dir.rglob("*.js"):
                    game_file_paths.append(str(file_path.relative_to(code_dir)))
                    with open(file_path, "r", encoding="utf-8") as f:
                        game_file_contents.append(f.read())

                sample = {
                    "id": game_id,
                    "method": method_name,
                    "model": model_name,
                    "game_concept_id": theme_name,
                    "game_sample_id": sample_id,
                    "game_file_paths": game_file_paths,
                    "game_file_contents": game_file_contents,
                    "game_genre": genre_name,

                    "consistency_score_llm_policy": consistency_check["score"],
                    "mechanics_implemented": consistency_check["mechanics_implemented"],
                    "mechanics_logged_llm_policy": consistency_check["mechanics_logged"],

                    "consistency_score_rdm_policy": consistency_check_rdm_policy["score_rdm_policy"],
                    "mechanics_logged_rdm_policy": consistency_check_rdm_policy["mechanics_logged_rdm_policy"],
                }
                
                samples.append(sample)
            
    return samples

def update_dataset():
    """Update the Huggingface dataset by preserving existing IDs and adding new data"""
    # Load existing dataset
    # try:
    #     existing_dataset = load_dataset(HF_DATASET_REPO, split="train")
    #     print(f"\nLoaded existing dataset with {len(existing_dataset)} samples")
        
    #     # Create mapping of existing games to their IDs
    #     existing_games = {
    #         get_game_key(row["method"], row["model"], row["game_narrative_id"], row["game_title"]): row["id"]
    #         for row in existing_dataset
    #     }
    # except Exception as e:
    #     print(f"Could not load existing dataset: {e}")
    #     print("Creating new dataset from scratch")
    #     existing_games = {}
    
    # TODO: changed the method, use hash of game key as game id
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

    for game_genre in np.unique(dataset["game_genre"]):
        for game_theme in np.unique(dataset["game_concept_id"]):
            samples = dataset.filter(lambda x: x["game_genre"] == game_genre and x["game_concept_id"] == game_theme)
            print(f"Game genre: {game_genre} | Game theme: {game_theme} | Samples: {len(samples)}")
    
    return dataset

if __name__ == "__main__":
    dataset = update_dataset()

    # print number of games per method
    for method in np.unique(dataset["method"]):
        dataset_method = dataset.filter(lambda x: x["method"] == method)
        print(f"{method}: {len(dataset_method)}")


    breakpoint()
    # Push to Hugging Face Hub
    dataset.push_to_hub(
        HF_DATASET_REPO,
        private=True  # Set to False for public dataset
    ) 
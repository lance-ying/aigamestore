import hashlib
from pathlib import Path
import json
from datasets import Dataset, load_dataset
import os
import uuid
import re

import numpy as np


GAMES_DIR = Path(__file__).parent / "results" / "gen_game_vibecoding_batch" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"
HF_DATASET_REPO = "generative-games/gen-games-v8"

model_name = "claude-3-7-sonnet-20250219"


def get_game_key(game_genre, method, model, concept_id, sample_id):
    return f"{game_genre}_{method}_{model}_{concept_id}_{sample_id}"


def collect_samples():
    samples = []

    num_themes = 10
    
    for genre_dir in GAMES_DIR.iterdir():
        genre_name = genre_dir.name
        
        theme_dirs = sorted(genre_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
        theme_dirs = theme_dirs[:num_themes]
        for theme_dir in theme_dirs:
            theme_name = theme_dir.name

            sample_dirs = sorted((theme_dir / "improve_iter1").glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
            best_sample_dir = sample_dirs[-1]
            best_sample_idx = int(best_sample_dir.name.split("_")[-1])

            original_sample_dir = theme_dir / "code_original"
            with open(theme_dir / "info.json", "r") as f:
                info = json.load(f)
            original_sample_idx = info["original_sample_idx"]


            def _add_sample(sample_dir, sample_id, method_name):
                # Create a key for this game
                game_key = get_game_key(genre_name, method_name, model_name, theme_name, sample_id)
                # game id = hash of game key
                game_id = hashlib.sha256(game_key.encode()).hexdigest()

                # recursively find all html and js file (except if in folder "code")
                code_dir = sample_dir
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
                }                
                samples.append(sample)

            _add_sample(original_sample_dir, original_sample_idx, "simple_prompt_with_resampling")
            _add_sample(best_sample_dir, best_sample_idx, "simple_prompt_with_resampling_then_improve")
            
    return samples

def update_dataset():
    samples = collect_samples()
    
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
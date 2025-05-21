import hashlib
from pathlib import Path
import json
from datasets import Dataset, load_dataset
import os
import uuid
import re

import numpy as np


GAMES_DIR1 = Path(__file__).parent / "results" / "gen_game_vibecoding_batch" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"
GAMES_DIR2 = Path(__file__).parent / "results" / "gen_minigame_audio_batch" / "run3" / "claude-3-7-sonnet-20250219" / "no_thinking"

HF_DATASET_REPO = "generative-games/gen-games-v10"

model_name = "claude-3.7-sonnet"

GAMES_DIR = Path(__file__).parent / "games" / "games_v10"


def get_game_key(method, model, concept_id, sample_id):
    return f"{method}_{model}_{concept_id}_{sample_id}"


def collect_samples():
    samples = []

    for method_dir in GAMES_DIR.iterdir(): 
        if not method_dir.is_dir():
            continue
        method_name = method_dir.name
        for concept_dir in method_dir.iterdir():
            if not concept_dir.is_dir():
                continue
            assert len(
                [d for d in concept_dir.iterdir() if d.is_dir()]
            ) == 1, f"Expected 1 game in {concept_dir}; found {len(list(concept_dir.iterdir()))}"
            
            sample_id = "sample_0"
            sample_dir = concept_dir / sample_id
            concept_id = concept_dir.name

            print(method_name, model_name, concept_id, sample_id)
            game_key = get_game_key(method_name, model_name, concept_id, sample_id)

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
                "game_concept_id": concept_id,
                "prompt_id": concept_id,
                "game_sample_id": sample_id,
                "game_file_paths": game_file_paths,
                "game_file_contents": game_file_contents,
            }                
            samples.append(sample)


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

    # for game_genre in np.unique(dataset["game_genre"]):
    #     for game_theme in np.unique(dataset["game_concept_id"]):
    #         samples = dataset.filter(lambda x: x["game_genre"] == game_genre and x["game_concept_id"] == game_theme)
    #         print(f"Game genre: {game_genre} | Game theme: {game_theme} | Samples: {len(samples)}")
    
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
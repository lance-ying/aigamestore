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


HF_DATASET_REPO = "generative-games/gen-games-v9"

model_name = "claude-3-7-sonnet-20250219"


def get_game_key(game_genre, method, model, concept_id, sample_id):
    return f"{game_genre}_{method}_{model}_{concept_id}_{sample_id}"


def collect_samples():
    samples = []
    
    for genre_dir in GAMES_DIR1.iterdir():
        genre_name = genre_dir.name
        
        theme_dirs = sorted(genre_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
        for theme_dir in theme_dirs:
            theme_name = theme_dir.name


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

                # example bad game used for calibration
                if theme_name == "theme_10" and genre_name == "side-scrolling" and method_name == "simple_prompt_with_resampling":
                    print("bad game", game_id)
                    breakpoint()

                # example good game used for calibration
                if theme_name == "theme_0" and genre_name == "side-scrolling" and method_name == "simple_prompt_with_resampling":
                    print("good game", game_id)
                    breakpoint()

                prompt_id = f"{genre_name}_{theme_name}"

                sample = {
                    "id": game_id,
                    "prompt_id": prompt_id,
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
            # _add_sample(best_sample_dir, best_sample_idx, "simple_prompt_with_resampling_then_improve")
            

    for genre_dir in GAMES_DIR2.iterdir():
        genre_name = genre_dir.name

        theme_dirs = sorted(genre_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
        for theme_dir in theme_dirs:
            theme_name = theme_dir.name

            sample_dirs = sorted((theme_dir / "code_with_audio").glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
            best_sample_dir = sample_dirs[-1]
            best_sample_idx = int(best_sample_dir.name.split("_")[-1])

            sample_id = best_sample_idx

            if not (best_sample_dir / "run_check.json").exists():
                print(f"Game {theme_name} in genre {genre_name} doesn't have run_check.json")
                breakpoint()
                continue

            with open(best_sample_dir / "run_check.json", "r") as f:
                run_check = json.load(f)
            
            assert run_check["status"] == "passed", f"Game {theme_name} in genre {genre_name} failed to run"

            method_name = "minigame"

            # Create a key for this game
            game_key = get_game_key(genre_name, method_name, model_name, theme_name, sample_id)
            # game id = hash of game key
            game_id = hashlib.sha256(game_key.encode()).hexdigest()

            # recursively find all html and js file (except if in folder "code")
            code_dir = best_sample_dir
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

            prompt_id = f"{genre_name}_{theme_name}"

            sample = {
                "id": game_id,
                "prompt_id": prompt_id,
                "method": method_name,
                "model": model_name,
                "game_concept_id": theme_name,
                "game_sample_id": sample_id,
                "game_file_paths": game_file_paths,
                "game_file_contents": game_file_contents,
                "game_genre": genre_name,
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
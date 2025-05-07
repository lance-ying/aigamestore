# import hashlib
# from pathlib import Path
# import json
# from datasets import Dataset, load_dataset
# import os
# import uuid
# import re

# import numpy as np


# GAMES_DIR = Path(__file__).parent / "games/games_v4"
# HF_DATASET_REPO = "generative-games/gen-games-v4"


# def get_game_key(method, model, narrative_id, game_name):
#     return f"{method}_{model}_{narrative_id}_{game_name}"

# def collect_samples(existing_games=None):
#     """
#     Collect all samples from the games directory.
    
#     Args:
#         existing_games (dict): Dictionary mapping game keys to their existing IDs
#     """
#     existing_games = existing_games or {}
#     samples = []
    

#     for model_dir in GAMES_DIR.iterdir():
#         if not model_dir.is_dir():
#             continue
#         model_name = model_dir.name
#         for method_dir in model_dir.iterdir(): 
#             if not method_dir.is_dir():
#                 continue
#             for concept_dir in method_dir.iterdir():
#                 if not concept_dir.is_dir():
#                     continue
#                 concept_name = concept_dir.name
#                 for game_dir in concept_dir.iterdir():                       
#                     if not game_dir.is_dir():
#                         continue
#                     game_name = game_dir.name
                    
#                     # Create a key for this game
#                     game_key = get_game_key(method_dir.name, model_name, concept_name, game_name)
                    
#                     if game_key in existing_games:
#                         print(f"Found existing game: {game_key}")
#                     else:
#                         print(f"New game: {game_key}")

#                     # Use existing ID if available, otherwise generate new one
#                     # game_id = existing_games.get(game_key, str(uuid.uuid4()))

#                     # game id = hash of game key
#                     game_id = hashlib.sha256(game_key.encode()).hexdigest()

#                     # Load metadata
#                     metadata_path = game_dir / "metadata.json"
#                     metadata = {}
#                     if metadata_path.exists():
#                         with open(metadata_path, "r", encoding="utf-8") as f:
#                             metadata = json.load(f)

#                     game_file_paths = []
#                     # TODO: if use a dict for game_files, the HF dataset will aggregate the keys for all the games (and fill them with None)
#                     game_file_contents = []
#                     for file_type, file_paths in metadata["game_files"].items():
#                         if not isinstance(file_paths, list):
#                             file_paths = [file_paths]

#                         for file_path in file_paths:
#                             with open(game_dir / file_path, "r", encoding="utf-8") as f:
#                                 file_content = f.read()
#                             game_file_contents.append(file_content)
#                             game_file_paths.append(file_path)

#                     # e.g. concept id = "0001" extract from folder name "game_0001"
#                     concept_id = concept_name.split("_")[1]

#                     sample_id = game_name

#                     sample = {
#                         "id": game_id,
#                         "method": metadata["generation_info"]["method"],
#                         "model": metadata["generation_info"]["model"],
#                         "game_concept_id": concept_id,
#                         "game_concept": metadata["game_info"]["narrative"],
#                         "game_title": metadata["game_info"]["title"],
#                         "game_sample_id": sample_id,
#                         "game_file_paths": game_file_paths,
#                         "game_file_contents": game_file_contents,
#                     }
                    
#                     samples.append(sample)
    
#     return samples

# def update_dataset():
#     """Update the Huggingface dataset by preserving existing IDs and adding new data"""
#     # Load existing dataset
#     # try:
#     #     existing_dataset = load_dataset(HF_DATASET_REPO, split="train")
#     #     print(f"\nLoaded existing dataset with {len(existing_dataset)} samples")
        
#     #     # Create mapping of existing games to their IDs
#     #     existing_games = {
#     #         get_game_key(row["method"], row["model"], row["game_narrative_id"], row["game_title"]): row["id"]
#     #         for row in existing_dataset
#     #     }
#     # except Exception as e:
#     #     print(f"Could not load existing dataset: {e}")
#     #     print("Creating new dataset from scratch")
#     #     existing_games = {}
    
#     # TODO: changed the method, use hash of game key as game id
#     existing_games = {}
#     # Collect all samples, preserving existing IDs
#     samples = collect_samples(existing_games)
    
#     # Create new dataset
#     dataset = Dataset.from_list(samples)
    
#     # Print dataset info
#     print("\nDataset updated successfully!")
#     print(f"Number of samples: {len(dataset)}")
#     print("\nDataset features:")
#     print(dataset.features)
    
#     return dataset

# if __name__ == "__main__":
#     dataset = update_dataset()

#     # print number of games per method
#     for method in np.unique(dataset["method"]):
#         dataset_method = dataset.filter(lambda x: x["method"] == method)
#         print(f"{method}: {len(dataset_method)}")


#     breakpoint()
#     # Push to Hugging Face Hub
#     dataset.push_to_hub(
#         HF_DATASET_REPO,
#         private=True  # Set to False for public dataset
#     ) 
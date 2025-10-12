import os
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--game_dir", type=str, default="./games/baseline_concept_game/")
parser.add_argument("--concept_dir", type=str, default="./game_prompts/generative_games/concepts_baseline/")
args = parser.parse_args()

if not os.path.exists(args.concept_dir):
    os.makedirs(args.concept_dir)

game_dirs = sorted(os.listdir(args.game_dir))
for game_dir in game_dirs:
    game_dir_path = os.path.join(args.game_dir, game_dir)
    sample_dirs = os.listdir(game_dir_path)
    if "metadata.json" in sample_dirs:
        with open(os.path.join(game_dir_path, "metadata.json"), "r") as f:
            metadata = json.load(f)
            concept = metadata["game_info"]["concept"]
            with open(os.path.join(args.concept_dir, f"{game_dir}.json"), "w") as f:
                json.dump({"concept": concept}, f)
    else:
        print(f"No metadata.json file found in {game_dir_path}")
        for sample_dir in sample_dirs:
            sample_dir_path = os.path.join(game_dir_path, sample_dir)
            metadata_path = os.path.join(sample_dir_path, "metadata.json")
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
                concept = metadata["game_info"]["concept"] 
                with open(os.path.join(args.concept_dir, f"{game_dir}_{sample_dir}.json"), "w") as f:
                    json.dump({"concept": concept}, f)
                    
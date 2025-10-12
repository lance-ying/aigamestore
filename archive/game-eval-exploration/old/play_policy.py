# import json
# from pathlib import Path
# import datasets
# import torch
# import numpy as np
# from typing import Dict, Tuple, Union
# import gymnasium as gym
# from gymnasium import spaces
# from PIL import Image
# import tempfile

# from train_policy import create_policy_network


# games_version = "v5"

# GAMES_DATASET = f"generative-games/gen-games-{games_version}"

# checkpoint_dir = Path(__file__).parent / "results" / "train_policy" / "models"

# if __name__ == "__main__":
#     game_dataset = datasets.load_dataset(GAMES_DATASET, split="train")
#     print(game_dataset)

#     checkpoint_path = checkpoint_dir / "policy_model.pth"

#     device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
#     model = create_policy_network().to(device)
#     model.load_state_dict(torch.load(checkpoint_path, map_location=device))


#     metadata = json.load(open(checkpoint_dir / "metadata.json"))

#     game_id = metadata["game_id"]
#     game_data = game_dataset.filter(lambda x: x["id"] == game_id)
#     assert len(game_data) == 1
#     game_data = game_data[0]

#     game_code = {
#         path: content 
#         for path, content in zip(game_data["game_file_paths"], game_data["game_file_contents"])
#     }
    
#     env = P5jsEnv(
#         game_code=game_code,
#         headless=False,
#         obs_size=(96, 96)
#     )

#     obs = env.reset()
#     print(obs.shape)
#     breakpoint()
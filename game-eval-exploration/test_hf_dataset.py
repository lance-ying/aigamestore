import os
from datasets import load_dataset
import uuid
from scheduler import ParquetScheduler
import re
from huggingface_hub import HfApi


# Hugging Face configuration
HF_TOKEN = os.environ.get("HF_TOKEN")
GAMES_DATASET = "generative-games/gen-games-v4"
PREFERENCES_DATASET = "generative-games/gen-games-v4-absolute-rating-test"  # Dataset to save ratings
VIDEO_DATASET = "generative-games/gen-games-v4-video-test"  # Dataset to save videos


if __name__ == "__main__":
    # Load the dataset
    preferences_dataset = load_dataset(PREFERENCES_DATASET, split="train")
    print(preferences_dataset)

    video_dataset = load_dataset(VIDEO_DATASET, split="train")
    breakpoint()
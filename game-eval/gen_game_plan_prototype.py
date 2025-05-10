from pathlib import Path
from datetime import datetime
import shutil
import tempfile
import os
import re
import json
import base64
import cv2
import io
import numpy as np
from typing import Dict, Tuple, Union
from PIL import Image

import gymnasium as gym
from gymnasium import spaces
from playwright.sync_api import sync_playwright

import openai
import anthropic
from google import genai
from google.genai import types

from utils import generate, run_game, code_from_dir


# TODO: ask the leave the index.html as is (otherwise can add a fake loading screen and the game might not even load)
# TODO: let it use audio? increases the change of errors but could increase rating
# Don't use external assets (No images, no audio, etc.).
# Increase the canvas size to 1200x800.
prompt_improve_game = """Improve this computer game based on the following game plan.
Don't include any other content in the index.html file than the p5.js and p5.collide2D imports and the game scripts.
Don't change the keys to start and reset the game.
Don't change the canvas size (must be 600x400).

<game_plan>
{game_plan}
</game_plan>

<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""

# TODO: if refactor the code too much, breaks the game (e.g. stuck and can't move)
# thinking = True
# TODO: seems to work well without thinking (maybe slightly increase in errors)
thinking = False

model = "claude-3-7-sonnet-20250219"

SAVE_DIR = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 5

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}/{'thinking' if thinking else 'no_thinking'}"

SAVE_DIR = SAVE_DIR / run_name


if thinking:
    prompt_improve_game = prompt_improve_game + """
<thinking_instructions>
Think thoroughly about how to improve and refactor the game implementation based on the game design plan.
</thinking_instructions>
"""

# Note: takes around 10 min to improve 16 games

if __name__ == "__main__":
    # genre = "side-scrolling"
    genre = "top-down"

    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / genre / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"
    game_plans_dir = Path(__file__).parent / "results" / "gen_game_plan_batch" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking" / genre

    prompts = []
    save_dirs = []

    theme_dirs = sorted(games_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    theme_dirs = theme_dirs[:10]

    for theme_dir in theme_dirs:
        sample_dirs = sorted(theme_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))

        # get the consistency scores
        sample_indices = []
        scores = []
        for sample_idx, sample_dir in enumerate(sample_dirs):
            if not (sample_dir / "consistency_check.json").exists():
                continue

            with open(sample_dir / "consistency_check.json", "r") as f:
                consistency_check = json.load(f)

            score = consistency_check["score"]
            scores.append(score)
            sample_indices.append(sample_idx)

        # find the sample with the highest score
        best_sample_idx = sample_indices[np.argmax(scores)]
        best_score = np.max(scores)
        sample_dir = sample_dirs[best_sample_idx]
    
        # save info about original sample
        info_dir = SAVE_DIR / genre / theme_dir.name
        info_dir.mkdir(parents=True, exist_ok=True)
        with open(info_dir / "info.json", "w") as f:
            json.dump({
                "original_game_path": str(sample_dir),
                "original_sample_idx": best_sample_idx,
                "original_consistency_score": best_score,
                "all_themes_original_samples": sample_indices,
                "all_themes_original_scores": scores
            }, f, indent=4)
        shutil.copytree(sample_dir / "code_original", info_dir / "code_original", dirs_exist_ok=True)

        # get game plan
        game_plan_path = game_plans_dir / theme_dir.name / "game_plan" / "answer.txt"
        with open(game_plan_path, "r") as f:
            game_plan_str = f.read()
        game_plan = re.findall(r"<game_plan>(.*?)</game_plan>", game_plan_str, re.DOTALL)[0]

        # save game plan
        with open(info_dir / "game_plan.txt", "w") as f:
            f.write(game_plan)

        _, game_code_str = code_from_dir(sample_dir / "code_original", return_str=True)

        _save_dir = SAVE_DIR / genre / theme_dir.name / f"improve_iter1" / "sample_0"
        _prompt = prompt_improve_game.format(
            game_plan=game_plan,
            game_code=game_code_str
        )

        prompts.append(_prompt)
        save_dirs.append(_save_dir)

    print("Number of prompts:", len(prompts))

    generate(model, prompts, save_dirs, thinking=thinking)
    # generate(model, prompts[0], save_dirs[0], thinking=thinking)


    # test the games
    for _ in range(max_samples-1):
        resample_prompts = []
        resample_save_dirs = []
        for i, _save_dir in enumerate(save_dirs):
            if not (_save_dir / "run_check.json").exists():
                errors = run_game(code_from_dir(_save_dir))

                run_check = {"status": "success"}
                if errors:
                    run_check["status"] = "error"
                    run_check["errors"] = errors

                with open(_save_dir / "run_check.json", "w") as f:
                    json.dump(run_check, f, indent=4)
            else:
                with open(_save_dir / "run_check.json", "r") as f:
                    run_check = json.load(f)

            if run_check["status"] == "error":
                # resample
                current_sample_idx = int(_save_dir.name.split("_")[-1])
                new_save_dir = _save_dir.parent / f"sample_{current_sample_idx + 1}"
                resample_prompts.append(prompts[i])
                resample_save_dirs.append(new_save_dir)

        if len(resample_prompts) == 0:
            break

        print(f"Resampling {len(resample_prompts)} games")
        generate(model, resample_prompts, resample_save_dirs, thinking=thinking)

        prompts = resample_prompts
        save_dirs = resample_save_dirs



    # iteration 2
    prompts = []
    save_dirs = []

    theme_dirs = sorted((SAVE_DIR / genre).glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    for theme_dir in theme_dirs:
        iter1_dir = theme_dir / "improve_iter1"
        sample_dirs = sorted(iter1_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
        iter1_best_sample_dir = sample_dirs[-1]
        print("Theme: {}, Iter 1 best sample: {}".format(theme_dir.name, iter1_best_sample_dir.name))

        _, game_code_str = code_from_dir(iter1_best_sample_dir, return_str=True)

        _save_dir = SAVE_DIR / genre / theme_dir.name / f"improve_iter2" / "sample_0"
        _prompt = prompt_improve_game.format(
            game_code=game_code_str
        )
        prompts.append(_prompt)
        save_dirs.append(_save_dir)

    print("Number of prompts:", len(prompts))

    generate(model, prompts, save_dirs, thinking=thinking)

    # test the games
    for _ in range(max_samples-1):
        resample_prompts = []
        resample_save_dirs = []
        for i, _save_dir in enumerate(save_dirs):
            if not (_save_dir / "run_check.json").exists():
                errors = run_game(code_from_dir(_save_dir))

                run_check = {"status": "success"}
                if errors:
                    run_check["status"] = "error"
                    run_check["errors"] = errors

                with open(_save_dir / "run_check.json", "w") as f:
                    json.dump(run_check, f, indent=4)
            else:
                with open(_save_dir / "run_check.json", "r") as f:
                    run_check = json.load(f)

            if run_check["status"] == "error":
                # resample
                current_sample_idx = int(_save_dir.name.split("_")[-1])
                new_save_dir = _save_dir.parent / f"sample_{current_sample_idx + 1}"
                resample_prompts.append(prompts[i])
                resample_save_dirs.append(new_save_dir)

        if len(resample_prompts) == 0:
            break

        print(f"Resampling {len(resample_prompts)} games")
        generate(model, resample_prompts, resample_save_dirs, thinking=thinking)

        prompts = resample_prompts
        save_dirs = resample_save_dirs



from pathlib import Path
from datetime import datetime
import re
import json
import shutil

from utils import generate, code_from_dir

from gen_minigame_batch_new_prompts import run_game


prompt_improve_game = """Task: Make this minigame even more fun by making sure it has a crystal clear goal that is easily understandable by anyone.
<instructions>
* IMPORTANT: Don't make the game any more difficult. Make sure the game starts EXTREMELY simple and easy, and then slightly more difficult. Much better make a game too easy than too difficult.
* Make sure the game still starts right away when the player presses 'Enter' (the player should be able to move after pressing 'Enter'). Don't implement any tutorial. This is a minigame.
* Double check that the controls are correctly implemented. Make sure the player moves correctly when the player presses the control keys. There is nothing more frustrating then a game with broken mechanics.
* Make sure the game is not overwhelming/confusing.
* Make sure it's clear the game can ALWAYS be reset with the 'R' key.
* Make sure the controls are clear to the player at all times.
* Make sure there is no flickering in the graphics. IMPORTANT: Do NOT randomly generate visual properties (colors, sizes, positions) inside draw functions that run every frame. Instead:
    - Generate random visual properties only ONCE during initialization/setup
    - Store these properties as object attributes
    - Use the stored properties when drawing, don't regenerate them each frame
* Make sure to double check all the collision boxes:
    - ALL the positions of the collision boxes should match the positions of the graphics.
    - The collission boxes should ALWAYS be slightly smaller than the actual graphics to avoid fustrating the player.
* Don't include any other content in the index.html file than the p5.js and p5.collide2D imports and the game scripts.

Think thoroughly and in great detail about the following:
1. First, review the game code in <game_code> in detail.
2. Identify any major issues or problems with the game.
3. Think about how to update the game based on the instructions in <instructions>.
4. Write the specific changes you plan to make to the game code.
5. Keep in mind that simplicity is key for a minigame.
</instructions>


<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""


thinking = True
thinking_tokens = 20000

model = "claude-3-7-sonnet-20250219"

SAVE_DIR = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 15

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}/{'thinking' if thinking else 'no_thinking'}"

SAVE_DIR = SAVE_DIR / run_name



if __name__ == "__main__":
    num_themes = 50

    games_dir = Path(__file__).parent / "results" / "gen_minigame_batch_new_prompts" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"


    prompts = []
    save_dirs = []

    theme_dirs = sorted(games_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    theme_dirs = theme_dirs[:num_themes]

    for theme_dir in theme_dirs:
        sample_dirs = sorted(theme_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
        sample_dir = sample_dirs[-1]

        with open(sample_dir / "run_check.json", "r") as f:
            run_check = json.load(f)

        assert run_check["status"] == "passed"
    
        new_dir = SAVE_DIR / theme_dir.name
        new_dir.mkdir(parents=True, exist_ok=True)

        with open(new_dir / "info.json", "w") as f:
            json.dump({
                "selected_sample_path": str(sample_dir),
                "selected_sample_idx": len(sample_dirs) - 1,
                "original_sample_indices": [s.name for s in sample_dirs],
            }, f, indent=4)

        shutil.copytree(sample_dir, new_dir / "code_original", dirs_exist_ok=True)

        game_code, game_code_str = code_from_dir(new_dir / "code_original", return_str=True)

        _save_dir = new_dir / f"improve_iter1" / "sample_0"
        _save_dir.mkdir(parents=True, exist_ok=True)

        # copy original game code to improve_iter1
        for file_path, file_content in game_code.items():
            (_save_dir / file_path).write_text(file_content, encoding="utf-8")

        _prompt = prompt_improve_game.format(
            game_code=game_code_str
        )

        prompts.append(_prompt)
        save_dirs.append(_save_dir)

    print("Number of prompts:", len(prompts))

    # generate(model, prompts, save_dirs, thinking=thinking)
    for i in range(len(prompts)):
        generate(model, prompts[i], save_dirs[i], thinking=thinking, thinking_tokens=thinking_tokens)

    total_test_time = 60000

    # test the games
    for _ in range(max_samples-1):
        resample_prompts = []
        resample_save_dirs = []
        for i, _save_dir in enumerate(save_dirs):
            if not (_save_dir / "run_check.json").exists():
                errors, issues = run_game(code_from_dir(_save_dir), headless=True, total_test_time=total_test_time)

                run_check = {"status": "passed", "errors": [], "issues": []}
                if errors:
                    run_check["status"] = "failed"
                    run_check["errors"] = errors
                if issues:
                    run_check["status"] = "failed"
                    run_check["issues"] = issues

                with open(_save_dir / "run_check.json", "w") as f:
                    json.dump(run_check, f, indent=4)
            else:
                with open(_save_dir / "run_check.json", "r") as f:
                    run_check = json.load(f)

            if run_check["status"] == "failed":
                # resample
                current_sample_idx = int(_save_dir.name.split("_")[-1])
                new_save_dir = _save_dir.parent / f"sample_{current_sample_idx + 1}"
                resample_prompts.append(prompts[i])
                resample_save_dirs.append(new_save_dir)

        if len(resample_prompts) == 0:
            break

        print(f"Resampling {len(resample_prompts)} games")
        # generate(model, resample_prompts, resample_save_dirs, thinking=thinking)
        for i in range(len(resample_prompts)):
            generate(model, resample_prompts[i], resample_save_dirs[i], thinking=thinking, thinking_tokens=thinking_tokens)

        prompts = resample_prompts
        save_dirs = resample_save_dirs

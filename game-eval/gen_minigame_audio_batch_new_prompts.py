from pathlib import Path
from datetime import datetime
import re
import json
import shutil

from utils import generate, code_from_dir

from gen_minigame_batch_new_prompts import run_game


prompt_improve_game = """Task: Make this minigame even more fun and addictive by adding audio

<instructions>
* Create synthesizers. Don't use external audio files or URLs.
* Important: Only add audio. Don't change anything else.
* Make sure the background music is simple and not too prominent.
* Don't use p5.js to synthesize audio.
</instructions>

<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""


thinking = False
thinking_tokens = 20000

model = "claude-3-7-sonnet-20250219"

SAVE_DIR = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 10

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}/{'thinking' if thinking else 'no_thinking'}"

SAVE_DIR = SAVE_DIR / run_name



if __name__ == "__main__":
    num_themes = 10

    games_dir = Path(__file__).parent / "results" / "gen_minigame_improve_batch_new_prompts" / "run1" / "claude-3-7-sonnet-20250219" / "thinking"


    prompts = []
    save_dirs = []

    theme_dirs = sorted(games_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    theme_dirs = theme_dirs[:num_themes]

    for theme_dir in theme_dirs:
        theme_code_dir = theme_dir / "improve_iter1"
        sample_dirs = sorted(theme_code_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
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

        _save_dir = new_dir / f"code_with_audio" / "sample_0"
        _save_dir.mkdir(parents=True, exist_ok=True)

        # copy original game code
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

        # copy original code
        for i, _save_dir in enumerate(resample_save_dirs):
            _save_dir.mkdir(parents=True, exist_ok=True)
            print("copying original code to", _save_dir)
            game_code = code_from_dir(_save_dir.parent.parent / "code_original")
            # copy original game code to improve_iter1
            for file_path, file_content in game_code.items():
                (_save_dir / file_path).write_text(file_content, encoding="utf-8")

        print(f"Resampling {len(resample_prompts)} games")
        # generate(model, resample_prompts, resample_save_dirs, thinking=thinking)
        for i in range(len(resample_prompts)):
            generate(model, resample_prompts[i], resample_save_dirs[i], thinking=thinking, thinking_tokens=thinking_tokens)

        prompts = resample_prompts
        save_dirs = resample_save_dirs


    GAME_CONCEPTS_DIR = Path(__file__).parent.parent / "game_prompts" / "generative_games" / "final_concepts"

    final_games_dir = SAVE_DIR.parent / "final_games" / ('thinking' if thinking else 'no_thinking')
    final_games_dir.mkdir(parents=True, exist_ok=True)

    theme_dirs = sorted(SAVE_DIR.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    for theme_dir in theme_dirs:
        code_dir = theme_dir / "code_with_audio"
        sample_dirs = sorted(code_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
        sample_dir = sample_dirs[-1]

        # convert theme_1 to game_0001
        theme_num = int(theme_dir.name.split("_")[-1])
        game_name = f"game_{theme_num:04d}"

        code = code_from_dir(sample_dir)
        initial_game_concept = json.load(open(GAME_CONCEPTS_DIR / (game_name + ".json")))

        (final_games_dir / game_name).mkdir(parents=True, exist_ok=True)

        for file_path, file_content in code.items():
            (final_games_dir / game_name / file_path).write_text(file_content, encoding="utf-8")

        with open(final_games_dir / game_name / "game_concept.json", "w") as f:
            json.dump(initial_game_concept, f, indent=4)

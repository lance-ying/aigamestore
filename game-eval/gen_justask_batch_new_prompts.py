from pathlib import Path
from datetime import datetime
import re
import json

from utils import generate, code_from_dir

from utils import run_game

# TODO: fix issue collision with the ground (makes jumping really hard and it's annoying)
# TODO: fix restart button not working sometimes
# TODO: still have some flickering so might be good to improve game twice


thinking = False

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 15

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}/{'thinking' if thinking else 'no_thinking'}"

save_dir = save_dir / run_name


prompt_game_code = """
Task: Implement a 2D game (600x400 pixels) based on the following description:
<description>
{description}
</description>

{prompt_format}
"""

prompt_format = """
Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
where {{extension}} is either "js" or "html" (make sure to include a index.html file).
Don't include any other content in the index.html file than the game.
"""

prompt_format_gemini = """
Use the following format to write your final code:
```{block_type} filename="{{name}}.{{extension}}"
...
```
"""



if __name__ == "__main__":
    theme_path = Path(__file__).parent.parent / "game_prompts" / "generative_games" / "final_concepts"
    themes = {}
    game_concepts = sorted(list(theme_path.glob("*.json")))
    for path in game_concepts:
        with open(path, "r", encoding="utf-8") as f:
            game_concept = json.load(f)
        themes[path.stem] = game_concept["concept"]
    themes = list(themes.values())

    prompts = []
    save_dirs = []

    num_themes = 50
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        _save_dir = save_dir / f"theme_{idx}" / "sample_0"
        _prompt = prompt_game_code.format(
            description=theme,
            prompt_format=prompt_format
        )
        prompts.append(_prompt)
        save_dirs.append(_save_dir)


    print("Number of prompts:", len(prompts))
    for i in range(len(prompts)):
        generate(model, prompts[i], save_dirs[i], thinking=thinking)

    # generate(model, prompts, save_dirs, thinking=thinking)


    # test the games and resample if necessary
    for _ in range(max_samples-1):
        resample_prompts = []
        resample_save_dirs = []
        for i, save_dir in enumerate(save_dirs):
            if not (save_dir / "run_check.json").exists():
                errors = run_game(code_from_dir(save_dir), headless=True, total_test_time=60000)

                run_check = {"status": "passed", "errors": [], "issues": []}
                if errors:
                    run_check["status"] = "failed"

                with open(save_dir / "run_check.json", "w") as f:
                    json.dump(run_check, f, indent=4)
            else:
                with open(save_dir / "run_check.json", "r") as f:
                    run_check = json.load(f)

            if run_check["status"] == "failed":
                # resample
                current_sample_idx = int(save_dir.name.split("_")[-1])
                new_save_dir = save_dir.parent / f"sample_{current_sample_idx + 1}"
                resample_prompts.append(prompts[i])
                resample_save_dirs.append(new_save_dir)

        if len(resample_prompts) == 0:
            break

        print(f"Resampling {len(resample_prompts)} games")
        # generate(model, resample_prompts, resample_save_dirs, thinking=thinking)

        for i in range(len(resample_prompts)):
            generate(model, resample_prompts[i], resample_save_dirs[i], thinking=thinking)

        prompts = resample_prompts
        save_dirs = resample_save_dirs


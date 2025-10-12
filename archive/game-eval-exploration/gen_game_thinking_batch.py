from pathlib import Path
from datetime import datetime
import re
import json

from utils import generate, run_game, code_from_dir


perspective = "top-down"
# perspective = "side-scrolling"

thinking = True

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 5

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run2/{model}/{'thinking' if thinking else 'no_thinking'}"

save_dir = save_dir / run_name

prompt_themes = """Task: list 100 themes for 2D game level ideas with a """ + perspective + """ perspective.

Structure your answer as follows:
<theme>
category: ...
description: ...
</theme>
"""


prompt_game_code = """
Task: Implement a 2D game level with a """ + perspective + """ perspective in p5.js based on the following description:
<description>
{description}
</description>

<p5js_guidelines>
{p5js_guidelines}
</p5js_guidelines>

{prompt_format}
"""

prompt_format = """
Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
"""

prompt_format_gemini = """
Use the following format to write your final code:
```{block_type} filename="{{name}}.{{extension}}"
...
```
"""


p5js_guidelines = """* Don't use any external assets.
* Include a index.html to run the game (don't include any other content in the index.html file except for the p5.js and p5.collide2D imports and the game scripts).
* Include the p5.js and p5.collide2D libraries in the index.html file.
    ```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/bmoren/p5.collide2D/p5.collide2d.min.js"></script>
    ```
* Use ES6 modules (import/export) for all JavaScript files - do not use Node.js require() statements.
* Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Make the game variables accessible with a getState() function (but don't use it in your game implementation). Expose the game instance globally as follows:
    ```javascript
    ...
    const p5 = window.p5
    let gameInstance = new p5(p => {
        // Initialize variables
        ...
        // Expose all the variables (before defining the functions). Don't use getState() in your game implementation.
        p.getState = () => {
            ...
        }
        // Functions
        ...
    });
    // Expose the game instance globally
    window.gameInstance = gameInstance;
    ```
* IMPORTANT: Make sure to properly pass the object `p` in the game code to access p5js functions. Otherwise you will get a "ReferenceError: p is not defined" error.
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. These functions are accessible through the `p` object. Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
* IMPORTANT: The specific order of the words in the p5.collide2D function names matter. For example, 'collideRectCircle' is a function, but 'collideCircleRect' is not available.
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
* Set the canvas size to 600x400 pixels.
* Ensure full reproducibility by setting the random seed to a fixed value.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Make sure the game has a clear goal and win state.
* Implement professional-looking and polished graphics.
* IMPORTANT: Don't draw elements that are randomly sampled at every frame as this causes flickering.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
* Make sure the player can restart the game at any time by pressing 'R'."""


if __name__ == "__main__":
    # TODO: make sure reuse exactly same prompt as no_thinking in gen_game_topdown
    # theme_path = Path(__file__).parent / "results" / "gen_game_topdown" / genre / "run1_claude-3-7-sonnet-20250219" / "themes" / "answer.txt"
    # with open(theme_path, "r", encoding="utf-8") as f:
    #     answer_themes = f.read()
    # themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)

    # prompts = []
    # save_dirs = []

    # for idx, theme in enumerate(themes):
    #     _save_dir = save_dir / genre / f"theme_{idx}" / "sample_0"
    #     _prompt = prompt_game_code.format(
    #         description=theme,
    #         p5js_guidelines=p5js_guidelines,
    #         prompt_format=prompt_format
    #     )
    #     prompts.append(_prompt)
    #     save_dirs.append(_save_dir)

    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / perspective / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"


    prompts = []
    save_dirs = []

    theme_dirs = sorted(games_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    for theme_dir in theme_dirs:
        sample_dirs = sorted(theme_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))

        _prompt_path = sample_dirs[0] / "code_original" / "prompt.txt"
        with open(_prompt_path, "r", encoding="utf-8") as f:
            _prompt = f.read()
        _save_dir = save_dir / perspective / theme_dir.name / "sample_0" / "code_original"

        # Add reasoning instructions to the prompt
        _prompt = _prompt + "\n\n" + "<thinking_instructions>Think thoroughly about how to implement a professional-grade, large-scale game. Write a game design plan. To give you an idea of the scale of the game, the implementation will take a couple of months for a whole team. You are allowed to add features that are not part of the original prompt. Don't write any code during the planning phase! Implement the game after the planning phase and stick to the game design plan as closely as possible.</thinking_instructions>"

        prompts.append(_prompt)
        save_dirs.append(_save_dir)

    prompts = prompts[:3]
    save_dirs = save_dirs[:3]
    print("Number of prompts:", len(prompts))
    
    generate(model, prompts, save_dirs, thinking=thinking)

    # test the games and resample if necessary
    for _ in range(max_samples-1):
        resample_prompts = []
        resample_save_dirs = []
        for i, save_dir in enumerate(save_dirs):
            if not (save_dir / "run_check.json").exists():
                errors = run_game(code_from_dir(save_dir))

                run_check = {"status": "success"}
                if errors:
                    run_check["status"] = "error"
                    run_check["errors"] = errors

                with open(save_dir / "run_check.json", "w") as f:
                    json.dump(run_check, f, indent=4)
            else:
                with open(save_dir / "run_check.json", "r") as f:
                    run_check = json.load(f)

            if run_check["status"] == "error":
                # resample
                current_sample_idx = int(save_dir.parent.name.split("_")[-1])
                new_save_dir = save_dir.parent.parent / f"sample_{current_sample_idx + 1}" / "code_original"
                resample_prompts.append(prompts[i])
                resample_save_dirs.append(new_save_dir)

        if len(resample_prompts) == 0:
            break

        print(f"Resampling {len(resample_prompts)} games")
        generate(model, resample_prompts, resample_save_dirs, thinking=thinking)

        prompts = resample_prompts
        save_dirs = resample_save_dirs


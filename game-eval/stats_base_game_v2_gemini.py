from pathlib import Path
from datetime import datetime
import json
import shutil
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from utils import generate, code_from_dir

from gen_minigame_batch_new_prompts import run_game


thinking = False
thinking_tokens = 5000

model = "claude-3-7-sonnet-20250219"
# model = "claude-sonnet-4-20250514"


save_dir = Path(__file__).parent / "results" / Path(__file__).stem


run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}"

save_dir = save_dir / run_name



prompt_game_code_v0 = """Implement a fun game winnable by anyone (even unexperienced players) playing it for less than 1 minute.

<game_description>
{description}
</game_description>

<technical_instructions>
{technical_instructions}
</technical_instructions>

Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
"""


prompt_game_code_v1 = """Implement a fun game.

<game_description>
{description}
</game_description>

<technical_instructions>
{technical_instructions}
</technical_instructions>

Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
"""


p5js_guidelines = """* Don't use any external assets.
* Include a index.html to run the game
    * Don't include any other content in the index.html file except for the p5.js and p5.collide2D imports and the game scripts.
    * No css styling in the index.html file.
* Include the p5.js and p5.collide2D libraries in the index.html file.
    ```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/bmoren/p5.collide2D/p5.collide2d.min.js"></script>
    ```
* Use ES6 modules (import/export) for all JavaScript files - do not use Node.js require() statements.
* Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Expose the game instance globally as follows:
    ```javascript
    ...
    const p5 = window.p5
    let gameInstance = new p5(p => {
        // Initialize the logs. Important: do not reset the logs at any point in the code! These logs are considered write-only!
        p.logs = {{
            // store player position
            "player_positions": [],
            // store the game status
            "game_status": []
        }};
        ...
        // Expose all the game variables (before defining the functions). Don't use getState() in your game implementation.
        p.getState = () => {
            ...
        }
        ...
    });
    // Expose the game instance globally
    window.gameInstance = gameInstance;
    ```
* Log the player position at every frame. Store both the screen position (position on the canvas) and the game position (position in the game world). Use the following format:
    * "screen_x": The x position of the player on the screen
    * "screen_y": The y position of the player on the screen
    * "game_x": The x position of the player in the game world
    * "game_y": The y position of the player in the game world
    * "framecount": The framecount of the event accessed via `p.frameCount`
* Log the game status using the following format:
    * "game_status": "start", "reset", "win", or "fail"
    * "timestamp": The timestamp of the event
    * "framecount": The framecount of the event accessed via `p.frameCount`
    * "data": Additional data specific to the game status. For example, the player's score when win the game. Leave empty if not applicable.
* Make ALL the game variables accessible with the `getState()` function (don't use it in your game implementation).
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. 
    * These functions are accessible through the `p` object. 
    * IMPORTANT: the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available!
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
* Set the canvas size to 600x400 pixels.
* Ensure full reproducibility by setting the random seed to a fixed value.
* Make sure the game is playable only with the keyboard. Use the arrow keys for player movement.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
* Make sure the player can restart the game at any time by pressing 'R'.
* Implement professional-looking and polished graphics.
* Make sure the game has a clear goal and win state.

IMPORTANT: Common pitfalls to avoid
* The specific order of the words in the p5.collide2D function names matter. For example, 'collideRectCircle' is a function, but 'collideCircleRect' is not available.
* Make sure to properly pass the object `p` in the game code to access p5js functions. Otherwise you will get a "ReferenceError: p is not defined" error.
* Make sure there is no flickering in the graphics. IMPORTANT: Do NOT randomly generate visual properties (colors, sizes, positions) inside draw functions that run every frame. Instead:
    * Generate random visual properties only ONCE during initialization/setup
    * Store these properties as object attributes
    * Use the stored properties when drawing, don't regenerate them each frame

Docs audio (optional):
* Create synthesizers. Don't use external audio files or URLs.
* Important: Only add audio. Don't change anything else.
* Make sure the background music is simple and not too prominent.
* Don't use p5.js to synthesize audio.

Docs p5.collide2d:
* collidePointPoint(x, y, x2, y2, [buffer])
    Point to point collision with an optional buffer zone.    

* collidePointCircle(pointX, pointY, circleX, circleY, diameter)
    Point to circle collision in 2D. Assumes ellipseMode(CENTER);    

* collidePointEllipse(pointX, pointY, ellipseX, ellipseY, ellipseWidth, ellipseHeight)
    Point to ellipse collision. Takes the point coordinates and the center, width and height of the ellipse.

* collidePointRect(pointX, pointY, x, y, width, height)
    Point to rectangle collision in 2D. Assumes rectMode(CORNER).

* collidePointLine(pointX, pointY, x1, y1, x2, y2, [buffer])
    Point to line collision in 2D. Includes an optional buffer which expands the hit zone on the line (default buffer is 0.1).

* collidePointArc(pointX, pointY, arcCenterX, arcCenterY, arcRadius, arcRotationAngle, arcAngle, [buffer])
    Point to arc collision in 2D. Takes point coordinates, arc center, radius, rotation angle, arc angle and optional buffer.

* collideRectRect(x1, y1, width1, height1, x2, y2, width2, height2)
    Rectangle to rectangle collision in 2D. Assumes rectMode(CORNER).

* collideCircleCircle(circleX1, circleY1, circleDiameter1, circleX2, circleY2, circleDiameter2)
    Circle to circle collision in 2D. Assumes ellipseMode(CENTER).

* collideRectCircle(x1, y1, width1, height1, cx, cy, diameter)
    Rectangle to circle collision in 2D. Assumes rectMode(CORNER) and ellipseMode(CENTER).

* collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4, [calcIntersection])
    Line to line collision in 2D. Optional calcIntersection parameter returns intersection point coordinates.

* collideLineCircle(x1, y1, x2, y2, cx, cy, diameter)
    Line to circle collision in 2D. Has debug mode for visualization.

* collideLineRect(x1, y1, x2, y2, rx, ry, rw, rh, [calcIntersection])
    Line to rectangle collision in 2D. Optional calcIntersection returns intersection points.

* collidePointPoly(pointX, pointY, vectorArray)
    Point to polygon collision in 2D. Takes point coordinates and array of p5.Vector points defining polygon.

* collideCirclePoly(x, y, diameter, vectorArray, [interiorCollision])
    Circle to polygon collision in 2D. Optional interiorCollision parameter enables detection when circle is inside polygon.

* collideRectPoly(x, y, width, height, vectorArray, [interiorCollision])
    Rectangle to polygon collision in 2D. Optional interiorCollision parameter enables detection when rectangle is inside polygon.

* collideLinePoly(x1, y1, x2, y2, vertices)
    Line to polygon collision in 2D. Takes line endpoints and array of p5.Vector points defining polygon.

* collidePolyPoly(polygon1, polygon2, [interiorCollision])
    Polygon to polygon collision in 2D. Takes two arrays of p5.Vector points. Optional interiorCollision parameter.

* collidePointTriangle(px, py, x1, y1, x2, y2, x3, y3)
    Point to triangle collision in 2D. More efficient than using collidePointPoly for triangles.
"""


# TODO: try with and without behavior tree
prompt_policy = """Implement an agent that plays to win the game.

<technical_instructions>
* Implement the agent in a separate file called "agent.js"
* Create an Agent class with a getAction method that returns an array of keys to press:
  ```javascript
  class Agent {{
    ...
    getAction() {{
      // Return array of keys to press
      // e.g., ["ArrowUp"] or ["ArrowLeft", "Space"] or []
    }}
  }}
  ```
* Use standard DOM KeyboardEvent.key values (e.g., "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Space")
* Make sure to instantiate the Agent and expose getAction function via `window.agent.getAction`
* Make sure to access the game state via the window.gameInstance.getState() function
* Make sure to start the game by pressing the 'Enter' key
* ALWAYS reset the game when the game is over
    * Check the game state to see if the game is over and make sure the game starts again
    * Wait a few steps before restarting to let the win screen appear
* Use a behavior tree to implement the agent.
</technical_instructions>

You are only allowed to modify the `index.html` file and create the `agent.js` file.
Format your answer in the following format for the files that need to be updated:
filename="index.html"
```html
...
```

filename="agent.js"
```javascript
...
```

<game_code>
{game_code}
</game_code>

Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
"""


def run_game_with_agent(game_code: dict[str, str], headless: bool = True, run_agent: bool = True, num_steps: int = 10000) -> tuple[list, dict]:
    """Test a p5.js game by manually controlling the rendering loop and return raw coverage results.

    Args:
        game_code: Dictionary mapping file paths (relative to game root) to their content.
                   Must contain at least "index.html".
        headless: Whether to run the browser in headless mode (default: True)
        run_agent: Whether to run the agent (default: True)
        num_steps: Number of steps to run the game for (default: 100)

    Returns:
        tuple: (errors, raw_coverage_data)
            - errors: List of error messages encountered during execution.
            - logs: Dictionary with game logs.
    """
    import tempfile
    from playwright.sync_api import sync_playwright

    errors = []
    logs = {}

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        
        # Inject code to stop animation loop
        noloop_js = """
<script>
window.addEventListener('load', function() {
    (function() {
        const inst = window.gameInstance;
        console.log("monkey patching setup after load");
        const originalSetup = inst.setup;
        inst.setup = function() {
            originalSetup.apply(this, arguments);
            inst.noLoop();
            console.log("noLoop() called after setup");
        };
    })();
});
</script>"""
        
        html_content = game_code.get("index.html", "")
        if "</body>" in html_content:
            html_content = html_content.replace("</body>", noloop_js + "</body>")
        else:
            html_content += noloop_js
        
        # Write game files to temp directory
        for file_path_str, file_content in game_code.items():
            full_path = temp_dir_path / file_path_str
            full_path.parent.mkdir(parents=True, exist_ok=True)
            content_to_write = html_content if file_path_str == "index.html" else file_content
            full_path.write_text(str(content_to_write), encoding='utf-8')
        
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    headless=headless,
                    args=[
                        '--disable-gpu',
                        '--disable-gpu-compositing',
                        '--disable-gpu-rasterization',
                        '--disable-gpu-sandbox',
                        '--disable-software-rasterizer',
                        '--force-cpu-draw',
                        '--disable-web-security',
                        '--disable-site-isolation-trials'
                    ]
                )
                context = browser.new_context(viewport={'width': 600, 'height': 400})
                page = context.new_page()
                
                # Add error collector
                page.add_init_script("""
                window.jsErrors = [];
                window.onerror = function(message, source, lineno, colno, error) {
                    window.jsErrors.push({
                        message: message,
                        source: source,
                        lineno: lineno,
                        colno: colno,
                        stack: error ? error.stack : null
                    });
                    return true;
                };
                window.addEventListener('unhandledrejection', function(event) {
                    window.jsErrors.push({
                        message: 'Unhandled Promise Rejection: ' + event.reason,
                        source: 'promise',
                        lineno: 0,
                        colno: 0,
                        stack: event.reason && event.reason.stack ? event.reason.stack : null
                    });
                });
                """)
                
                # Load the game
                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")
                
                # Wait for canvas
                try:
                    page.wait_for_selector("canvas", timeout=5000)
                except Exception as e:
                    errors.append(f"Canvas not found: {str(e)}")
                    return errors, logs
                
                # Prevent default scrolling behavior for arrow keys and spacebar
                prevent_scroll_js = """
                document.addEventListener('keydown', (e) => {
                    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                        e.preventDefault();
                    }
                }, false);
                
                // Also disable scrolling on the body
                document.body.style.overflow = 'hidden';
                """
                page.evaluate(prevent_scroll_js)

                # TODO: temp for maze env
                # make a call to getGrid so that it gets executed
                try:
                    page.evaluate("window.gameInstance.getGrid();")
                except Exception as e:
                    pass

                if run_agent:
                    # Track key states
                    key_states = {}
                    
                    for step_idx in range(num_steps):
                        # Get keys to press from agent
                        keys_to_press = page.evaluate("window.agent.getAction();")

                        # Update key states and trigger keyboard events
                        if isinstance(keys_to_press, list):
                            # First handle key releases for keys no longer in list
                            keys_to_release = [k for k in key_states if k not in keys_to_press and key_states[k]]
                            for key in keys_to_release:
                                print(f"Releasing key: {key}")
                                page.keyboard.up(key)
                                key_states[key] = False
                            
                            # Then handle key presses for new keys
                            for key in keys_to_press:
                                if key not in key_states or not key_states[key]:
                                    print(f"Pressing key: {key}")
                                    page.keyboard.down(key)
                                    key_states[key] = True
                        
                        page.evaluate("window.gameInstance.redraw();")
                        if step_idx % 100 == 0:
                            print(f"Step {step_idx}/{num_steps}")

                        # import time
                        # time.sleep(0.01)

                    # Release any keys still pressed at the end
                    for key, pressed in key_states.items():
                        if pressed:
                            page.keyboard.up(key)
                else:
                    # press enter to start the game
                    page.keyboard.down("Enter")
                    page.evaluate("window.gameInstance.redraw();")
                    page.keyboard.up("Enter")
                    page.evaluate("window.gameInstance.redraw();")

                    for step_idx in range(num_steps):
                        page.evaluate("window.gameInstance.redraw();")

                print("Retrieving logs")
                logs = page.evaluate("window.gameInstance.logs")
                print("Logs retrieved")

                # Check for errors
                js_errors = page.evaluate("window.jsErrors")
                for error in js_errors:
                    errors.append(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}")
                
                browser.close()
                
                return errors, logs
        
        except Exception as e:
            errors.append(f"Execution error: {str(e)}")
            return errors, {}



def code_to_str(code):
    code_str = ""
    for relative_path, code in code.items():
        code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"
    return code_str


def eval_game(code, save_dir, headless=True, total_test_time=60000):
    if not (save_dir / "run_check.json").exists():
        errors, issues = run_game(code, headless=headless, total_test_time=total_test_time)

        run_check = {"status": "passed", "errors": [], "issues": []}
        if errors:
            run_check["status"] = "failed"
            run_check["errors"] = errors
        if issues:
            run_check["status"] = "failed"
            run_check["issues"] = issues

        with open(save_dir / "run_check.json", "w") as f:
            json.dump(run_check, f, indent=4)
    else:
        with open(save_dir / "run_check.json", "r") as f:
            run_check = json.load(f)

    return run_check


def categorize_issue(issue):
    if "Player appears to be stuck" in issue or "Player doesn't move with any of the arrow keys" in issue:
        return "stuck"
    if "Player dies without any player input" in issue or "Player dies shortly after game reset without any input" in issue:
        return "die_immediately"
    raise ValueError(f"Unknown issue: {issue}")


def generate_agent(game_code, save_dir):
    game_code_str = code_to_str(game_code)

    # copy game code to agent save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    prompt = prompt_policy.format(
        game_code=game_code_str
    )
    # TODO: error running the agent
    print("Generating agent...")
    generate("gemini-2.5-pro-preview-05-06", prompt, save_dir)

    return code_from_dir(save_dir)


def generate_games(model, themes, prompt_gen_game, save_dir, num_samples=1, num_agent_samples=3, num_agent_tries=3):
    agent_results = []
    results = []
    for idx, theme in enumerate(themes):
        game_check_passed = False
        for sample_idx in range(num_samples):
            _save_dir = save_dir / "games" / f"theme_{idx}" / f"sample_{sample_idx}" / "code"
            prompt = prompt_gen_game.format(
                description=theme,
                technical_instructions=p5js_guidelines,
            )

            if thinking:
                prompt = prompt + "\n\nPlease think thoroughly about how to design the game based on the provided instructions. Don't include any code during the thinking phase."

            generate(model, prompt, _save_dir, thinking=thinking, thinking_tokens=thinking_tokens)
            game_code, game_code_str = code_from_dir(_save_dir, return_str=True)
            run_check = eval_game(game_code, _save_dir, headless=True)

            issue_counts = {
                "stuck": 0,
                "die_immediately": 0,
            }
            for issue in run_check["issues"]:
                category = categorize_issue(issue)
                assert "at time " in issue, f"Unknown issue: {issue}"
                timestamp = int(issue.split("at time ")[-1].split("ms")[0])
                print(f"Category: {category}, Timestamp: {timestamp}")

                issue_counts[category] += 1

            results.append({
                "theme_idx": idx,
                "sample_idx": sample_idx,
                "prompt": prompt,
                "no_errors": len(run_check["errors"]) == 0,
                "no_issues": len(run_check["issues"]) == 0,
                **issue_counts,
            })

            if run_check["status"] != "passed":
                # generate new game sample
                continue

            win_at_least_once = False
            # use the last game_code sample
            for sampled_idx in range(num_agent_samples):
                agent_dir = _save_dir.parent / "code_with_agent" / f"sample_{sampled_idx}"

                # try generating an agent without errors
                for try_idx in range(num_agent_tries):
                    try_dir = agent_dir / f"try_{try_idx}"
                    code_with_agent = generate_agent(game_code, try_dir)
                
                    if not (try_dir / "logs.json").exists():
                        errors, logs = run_game_with_agent(code_with_agent, headless=True, num_steps=3600)

                        with open(try_dir / "logs.json", "w") as f:
                            json.dump(logs, f, indent=4)
                        with open(try_dir / "errors.json", "w") as f:
                            json.dump(errors, f, indent=4)
                    else:
                        with open(try_dir / "logs.json", "r") as f:
                            logs = json.load(f)
                        with open(try_dir / "errors.json", "r") as f:
                            errors = json.load(f)

                    if len(errors) == 0:
                        break
            
                # TODO: check how many tries and how many were successful
                # check if won the game at least once
                num_wins = 0
                num_fails = 0
                for log in logs["game_status"]:
                    if log["game_status"] == "win":
                        num_wins += 1
                    elif log["game_status"] == "fail":
                        num_fails += 1
                print(f"Num wins: {num_wins}, Num fails: {num_fails}")

                agent_results.append({
                    "theme_idx": idx,
                    "sample_idx": sample_idx,
                    "agent_sample_idx": sample_idx,
                    "prompt": prompt,
                    "num_wins": num_wins,
                    "num_fails": num_fails,
                })

                if num_wins > 0:
                    win_at_least_once = True
                    break
            
            if win_at_least_once:
                break


    return results, agent_results


if __name__ == "__main__":
    theme_path = Path(__file__).parent.parent / "game_prompts" / "generative_games" / "final_concepts"
    themes = {}
    game_concepts = sorted(list(theme_path.glob("*.json")))
    for path in game_concepts:
        with open(path, "r", encoding="utf-8") as f:
            game_concept = json.load(f)
        themes[path.stem] = game_concept["concept"]
    themes = list(themes.values())

    # theme_path = save_dir / "themes" / "answer.txt"
    # answer_themes = theme_path.read_text()
    # themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)

    num_samples = 10  # 15 is too much
    num_agent_samples = 3
    num_themes = 20
    themes = themes[:num_themes]


    save_dir = save_dir / "no_thinking" / "prompt_v1"
    results, agent_results = generate_games(model, themes, prompt_game_code_v1, save_dir, num_samples=num_samples, num_agent_samples=num_agent_samples)

    results = [{"prompt_version": "v1", **r} for r in results]
    agent_results = [{"prompt_version": "v1", **r} for r in agent_results]

    results = pd.DataFrame(results)
    agent_results = pd.DataFrame(agent_results)
    results.to_csv(save_dir / "results.csv", index=False)
    agent_results.to_csv(save_dir / "agent_results.csv", index=False)

    agent_results["num_tries"] = agent_results["num_wins"] + agent_results["num_fails"]


    first_pass_games = save_dir / "first_pass_games"
    first_win_games = save_dir / "first_win_games"
    first_pass_games.mkdir(parents=True, exist_ok=True)
    first_win_games.mkdir(parents=True, exist_ok=True)

    for idx, theme in enumerate(themes):
        game_check_passed = False
        samples_dir = sorted(list((save_dir / "games" / f"theme_{idx}").glob("sample_*")), key=lambda x: int(x.stem.split("_")[-1]))
        first_win_dir = samples_dir[min(num_samples - 1, len(samples_dir) - 1)]
        first_win_sample_name = first_win_dir.name

        first_pass_dir = None
        for sample_dir in samples_dir:
            with open(sample_dir / "code" / "run_check.json", "r") as f:
                run_check = json.load(f)
            if run_check["status"] == "passed":
                first_pass_dir = sample_dir
                break
        assert first_pass_dir is not None, f"No sample passed the game check for theme {idx}"
        print(f"Theme {idx}: First pass sample: {first_pass_dir.name}, First win sample: {first_win_dir.name}")
        first_pass_sample_name = first_pass_dir.name


        # check if win
        num_wins = 0
        for agent_dir in first_win_dir.glob("code_with_agent/sample_*"):
            try_dirs = sorted(list(agent_dir.glob("try_*")), key=lambda x: int(x.stem.split("_")[-1]))
            logs = json.load(open(try_dirs[-1] / "logs.json", "r"))
            for log in logs["game_status"]:
                if log["game_status"] == "win":
                    num_wins += 1
                    break
        if num_wins == 0:
            # if no win, just use first_pass_dir
            first_win_dir = first_pass_dir
            first_win_sample_name = first_pass_sample_name
            print(f"Theme {idx}: No win, using first pass sample")


        # copy game code to first pass and first win dirs
        shutil.copytree(first_pass_dir / "code", first_pass_games / f"theme_{idx}" / first_pass_sample_name, dirs_exist_ok=True)
        shutil.copytree(first_win_dir / "code", first_win_games / f"theme_{idx}" / first_win_sample_name, dirs_exist_ok=True)
            
   

    # results_first_sample = results[results["sample_idx"] == 0]
    
    # # number of themes that have more than 1 sample
    # themes_sample_counts = results.groupby("theme_idx")["sample_idx"].nunique()
    # num_themes_more_than_one_sample = (themes_sample_counts > 1).sum()
    # num_themes_more_than_one_sample_ratio = num_themes_more_than_one_sample / len(themes_sample_counts)
    # print(f"Number of themes with more than 1 sample: {num_themes_more_than_one_sample} / {len(themes_sample_counts)} ({num_themes_more_than_one_sample_ratio:.2%})")

    fig_dir = save_dir / "figures"
    fig_dir.mkdir(parents=True, exist_ok=True)

    # # Plot p(does run) as a bar plot
    # plt.figure(figsize=(4, 4), dpi=150)
    
    # # Calculate error rates by prompt version
    # error_rates_by_prompt = []
    # for prompt_version in results_first_sample["prompt_version"].unique():
    #     subset = results_first_sample[results_first_sample["prompt_version"] == prompt_version]
    #     p_runtime_error = 1 - np.mean(subset["no_errors"])
    #     p_stuck = np.mean(subset["stuck"] > 0)
    #     p_die_immediately = np.mean(subset["die_immediately"] > 0)
        
    #     error_rates_by_prompt.extend([
    #         {"prompt_version": prompt_version, "error_type": "P(runtime error)", "probability": p_runtime_error},
    #         {"prompt_version": prompt_version, "error_type": "P(stuck)", "probability": p_stuck},
    #         {"prompt_version": prompt_version, "error_type": "P(die immediately)", "probability": p_die_immediately}
    #     ])

    # error_df = pd.DataFrame(error_rates_by_prompt)

    # # Sort error types by overall probability (across all prompt versions)
    # overall_error_rates = error_df.groupby("error_type")["probability"].mean().sort_values(ascending=False)
    # error_type_order = overall_error_rates.index.tolist()

    # sns.barplot(data=error_df, x="error_type", y="probability", hue="sample_idx", order=error_type_order)
    # plt.xlabel("")
    # plt.ylim(0, 1)
    # plt.ylabel("Probability")
    # plt.xticks(rotation=35, ha='right')
    # plt.legend(title="Prompt Version")
    
    # # Add value labels on bars
    # ax = plt.gca()
    # # for container in ax.containers:
    # #     ax.bar_label(container, fmt='%.2f', padding=3, fontsize=8)
    
    # ax.spines['top'].set_visible(False)
    # ax.spines['right'].set_visible(False)
    # plt.tight_layout()
    # plt.savefig(fig_dir / "p_issues.png", dpi=300)

    # plot total number of wins (summed over all agent samples) for each prompt version
    for theme_idx in agent_results["theme_idx"].unique():
        _res = agent_results[agent_results["theme_idx"] == theme_idx]

        plt.figure(figsize=(4, 4), dpi=150)
        sns.barplot(data=_res, x="sample_idx", y="num_wins", estimator=sum, errorbar=None)
        plt.xlabel("")
        plt.ylabel("Total Number of Wins")
        plt.xticks(rotation=35, ha='right')
        plt.tight_layout()
        plt.savefig(fig_dir / f"num_wins_theme_{theme_idx}.png", dpi=300)

        plt.figure(figsize=(4, 4), dpi=150)
        sns.barplot(data=_res, x="sample_idx", y="num_fails", estimator=sum, errorbar=None)
        plt.xlabel("")
        plt.ylabel("Total Number of Fails")
        plt.xticks(rotation=35, ha='right')
        plt.tight_layout()
        plt.savefig(fig_dir / f"num_fails_theme_{theme_idx}.png", dpi=300)

        plt.figure(figsize=(4, 4), dpi=150)
        sns.barplot(data=_res, x="sample_idx", y="num_wins")
        plt.xlabel("")
        plt.ylabel("Average Number of Wins")
        plt.xticks(rotation=35, ha='right')
        plt.tight_layout()
        plt.savefig(fig_dir / f"avg_num_wins_theme_{theme_idx}.png", dpi=300)

    plt.figure(figsize=(3, 3), dpi=150)
    sns.barplot(data=agent_results, x="sample_idx", y="num_wins", hue="sample_idx")
    plt.xlabel("")
    plt.ylabel("Number of wins")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"avg_num_wins.png", dpi=300)


    plt.figure(figsize=(3, 3), dpi=150)
    sns.barplot(data=agent_results, x="sample_idx", y="num_wins", errorbar="se", hue="sample_idx")
    plt.xlabel("")
    plt.ylabel("Number of wins")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"avg_num_wins_std_error.png", dpi=300)


    plt.figure(figsize=(3, 3), dpi=150)
    sns.barplot(
        data=agent_results,
        x="sample_idx",
        y="num_fails",
        errorbar="se",  # show standard error
        hue="sample_idx",
    )
    plt.xlabel("")
    plt.ylabel("Number of fails")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"avg_num_fails_std_error.png", dpi=300)


    plt.figure(figsize=(3, 3), dpi=150)
    sns.barplot(
        data=agent_results,
        x="sample_idx",
        y="num_tries",
        errorbar="se",  # show standard error
        hue="sample_idx",
    )
    plt.xlabel("")
    plt.ylabel("Number of tries")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"avg_num_tries_std_error.png", dpi=300)


    plt.figure(figsize=(3, 3), dpi=150)
    sns.stripplot(data=agent_results, x="sample_idx", y="num_wins", hue="sample_idx")
    plt.xlabel("")
    plt.ylabel("Number of wins")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"num_wins_stripplot.png", dpi=300)


    plt.figure(figsize=(3, 3), dpi=150)
    sns.boxplot(data=agent_results, x="sample_idx", y="num_wins", hue="sample_idx")
    plt.xlabel("")
    plt.ylabel("Number of wins")
    plt.xticks(rotation=35, ha='right')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(fig_dir / f"num_wins_boxplot.png", dpi=300)


    
    # Calculate percentage of games where at least one agent won at least once
    win_success_rates = []
    for (sample_idx, theme_idx), group in agent_results.groupby(["sample_idx", "theme_idx"]):
        won_at_least_once = (group["num_wins"] > 0).any()
        win_success_rates.append({
            "sample_idx": sample_idx,
            "theme_idx": theme_idx,
            "won_at_least_once": won_at_least_once
        })
    
    win_success_df = pd.DataFrame(win_success_rates)
    won_counts_per_prompt = win_success_df.groupby("sample_idx")["won_at_least_once"].sum()
    print("Number of themes with at least one agent win per sample_idx:")
    print(won_counts_per_prompt)

    # Bar plot of number of themes with at least one agent win per prompt_version
    plt.figure(figsize=(4, 3), dpi=150)
    sns.barplot(
        x=won_counts_per_prompt.index,
        y=won_counts_per_prompt.values,
        palette="muted"
    )
    plt.xlabel("Sample Index")
    plt.ylabel("Number of Themes with ≥1 Agent Win")
    plt.title("Agent Win Success by Sample Index")
    plt.tight_layout()
    plt.savefig(fig_dir / "themes_with_agent_win_barplot.png", dpi=300)
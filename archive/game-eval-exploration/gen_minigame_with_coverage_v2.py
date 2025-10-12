from pathlib import Path
from datetime import datetime
import re
import json

import numpy as np

from utils import generate, code_from_dir



# TODO: fix issue collision with the ground (makes jumping really hard and it's annoying)
# TODO: fix restart button not working sometimes
# TODO: still have some flickering so might be good to improve game twice


thinking = False

# agent_thinking = False
agent_thinking = True
agent_thinking_tokens = 5000

revise_thinking = True
revise_thinking_tokens = 5000

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1_all/{model}/{'thinking' if thinking else 'no_thinking'}"

save_dir = save_dir / run_name


prompt_game_code = """
Task: Implement a fun 2D minigame in p5.js based on the following description:
<description>
{description}
</description>

<design_guidelines>
* Make sure the minigame has a crystal clear goal that is easily understandable by anyone
* Make sure it starts EXTREMELY simple and easy, and then slightly more difficult. Much better make a game too easy than too difficult.
* Make sure the game is not overwhelming/confusing.
* Make sure it's clear the game can ALWAYS be reset with the 'R' key.
* Make sure the controls are clear to the player at all times.
* Implement professional-looking and polished graphics.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
</design_guidelines>

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
* Make ALL the game variables accessible with the `getState()` function (don't use it in your game implementation!).
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. These functions are accessible through the `p` object. Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
    * Careful with the coordinate system convention of the arguments of the functions.
* Set the canvas size to 600x400 pixels.
* Ensure full reproducibility by setting the random seed to a fixed value.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Only use keyboard keys for the controls. Use the arrow keys for player movement.

IMPORTANT: Common pitfalls to avoid
* The specific order of the words in the p5.collide2D function names matter. For example, 'collideRectCircle' is a function, but 'collideCircleRect' is not available.
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
* Make sure to properly pass the object `p` in the game code to access p5js functions. Otherwise you will get a "ReferenceError: p is not defined" error.
* Make sure there is no flickering in the graphics. IMPORTANT: Do NOT randomly generate visual properties (colors, sizes, positions) inside draw functions that run every frame. Instead:
    * Generate random visual properties only ONCE during initialization/setup
    * Store these properties as object attributes
    * Use the stored properties when drawing, don't regenerate them each frame
"""

# TODO: not sure this is needed (sometimes don't reset the game because the game is broken)
# * Make sure it is robust and never gets stuck in an infinite loop (e.g. always restart when game over)

prompt_policy = """Task: Implement an agent that plays the game.

<instructions>
Objectives:
* Primary goal: WIN the game
* Secondary goal: trigger ALL the game mechanics
    * this include LOSING the game
    * the goal is to make sure every single line of the game code is executed at least once

Implementation:
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
* Make sure to access the game state via the window.gameInstance object
* Make sure to wait a few frames before restarting (otherwise never win screen never appears)

""" + ("""
<thinking_instructions>
Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
</thinking_instructions>
""" if agent_thinking else "") + """
</instructions>

You are only allowed to modify the `index.html` file and create the `agent.js` file.
Format your answer in the following format for the files that need to be updated:
<code filename="index.html">
...
</code>

<code filename="agent.js">
...
</code>

<game_code>
{game_code}
</game_code>
"""

# TODO: have to ask to wait a few frames before restarting (otherwise never win screen never appears)
# prompt_policy = """Task: Implement an agent that plays the game to WIN.

# <instructions>
# * Implement the agent in a separate file called "agent.js"
# * Create an Agent class with a getAction method that returns an array of keys to press:
#   ```javascript
#   class Agent {{
#     ...
#     getAction() {{
#       // Return array of keys to press
#       // e.g., ["ArrowUp"] or ["ArrowLeft", "Space"] or []
#     }}
#   }}
#   ```
# * Use standard DOM KeyboardEvent.key values (e.g., "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Space")
# * Make sure to instantiate the Agent and expose getAction function via `window.agent.getAction`
# * Make sure to access the game state via the window.gameInstance object
# * Make sure to wait a few frames before restarting (otherwise never win screen never appears)
# """ + ("""
# <thinking_instructions>
# Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
# </thinking_instructions>
# """ if agent_thinking else "") + """
# </instructions>

# You are only allowed to modify the `index.html` file and create the `agent.js` file.
# Format your answer in the following format for the files that need to be updated:
# <code filename="index.html">
# ...
# </code>

# <code filename="agent.js">
# ...
# </code>

# <game_code>
# {game_code}
# </game_code>
# """

# TODO: sometimes add buttons that manually trigger the game mechanics
# TODO: ask to revise the game, which could mean making it easier or harder to win (easier to lose). Need to be balanced.
# prompt_revise_game = """Task: Revise this game implementation

# <instructions>
# * The coverage data in <code_coverage> shows that there are issues with the current game implementation.
#     * It shows which lines of code were executed when a player tried their best to play the game and tried to trigger all the game mechanics.
#     * A check mark means the line is executed, and a cross means it is not.
# * Your goal is to revise the game to make it easier to cover ALL the game mechanics (i.e. make sure every single line of the game code is executed at least once).
#     * There can be different reasons for the low coverage.
#     * The game could be too hard or too easy to win.
#     * Some of the mechanics could be broken.
# * Keeping a clean and minimal code is a good way to make 100% coverage easier.

# Think thoroughly about how to revise the game. Don't include any code during the thinking phase.
# </instructions>

# <code_coverage>
# {code_coverage}
# </code_coverage>

# After your detailed analysis of the game code and coverage feedback, decide which files need to be updated. When updating a file, make sure to rewrite the entire code for that file.
# Format your answer in the following format for the files that need to be updated:
# <code filename="{{name}}.{{extension}}">
# ...
# </code>

# Current version of the game code:
# <game_code>
# {game_code}
# </game_code>
# """

prompt_revise_game = """Task: Revise this game implementation

<instructions>
* The coverage data in <code_coverage> shows that there are issues with the current game implementation.
    * It shows which lines of code were executed when a player tried their best to play the game and tried to trigger all the game mechanics.
    * A check mark means the line is executed, and a cross means it is not.
* Your goal is to revise the game to make it easier to play.
    * The game could be too hard or too easy to win.
    * Some of the mechanics could be broken.
* Making the code cleaner and more minimal is a good way to make the game easier to play.

Think thoroughly about how to revise the game. Don't include any code during the thinking phase.
</instructions>

<code_coverage>
{code_coverage}
</code_coverage>

After your detailed analysis of the game code and coverage feedback, decide which files need to be updated. When updating a file, make sure to rewrite the entire code for that file.
Format your answer in the following format for the files that need to be updated:
<code filename="{{name}}.{{extension}}">
...
</code>

Current version of the game code:
<game_code>
{game_code}
</game_code>
"""



# TODO: run test in separate process in case browser freezes
def run_game_coverage(game_code: dict[str, str], headless: bool = True, num_steps: int = 10000) -> tuple[list, dict]:
    """Test a p5.js game by manually controlling the rendering loop and return raw coverage results.

    Args:
        game_code: Dictionary mapping file paths (relative to game root) to their content.
                   Must contain at least "index.html".
        headless: Whether to run the browser in headless mode (default: True)
        num_steps: Number of steps to run the game for (default: 100)

    Returns:
        tuple: (errors, raw_coverage_data)
            - errors: List of error messages encountered during execution.
            - raw_coverage_data: Dictionary with coverage data.
    """
    import tempfile
    from playwright.sync_api import sync_playwright

    errors = []
    raw_coverage_data = {}
    
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
                
                # Start coverage collection
                client = page.context.new_cdp_session(page)
                client.send("Profiler.enable")
                client.send("Profiler.startPreciseCoverage", {
                    "callCount": True,
                    "detailed": True
                })
                
                # Load the game
                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")
                
                # Wait for canvas
                try:
                    page.wait_for_selector("canvas", timeout=5000)
                except Exception as e:
                    errors.append(f"Canvas not found: {str(e)}")
                    return errors, raw_coverage_data
                
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

                
                # Release any keys still pressed at the end
                for key, pressed in key_states.items():
                    if pressed:
                        page.keyboard.up(key)

                # Collect coverage data
                coverage_result = client.send("Profiler.takePreciseCoverage")
                client.send("Profiler.stopPreciseCoverage")
                
                # Check for errors
                js_errors = page.evaluate("window.jsErrors")
                for error in js_errors:
                    errors.append(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}")
                
                browser.close()
                
                return errors, coverage_result
        
        except Exception as e:
            errors.append(f"Execution error: {str(e)}")
            return errors, raw_coverage_data


def analyze_coverage(coverage_data: dict, game_code, verbose: bool = True) -> None:
    scripts = [entry for entry in coverage_data['result'] if entry["url"].startswith("file://")]

    executed_lines_by_file = {}
    for script in scripts:    
        url = script["url"]
        # example url: 'file:///tmp/tmprp_570fe/game.js'
        # get the path after the fifth slash
        file_name = url.split("/")[5]
        assert file_name in game_code
        code = game_code[file_name]
        lines = code.split('\n')
                
        # Calculate line start positions (character offsets)
        line_starts = [0]
        current_pos = 0
        for line in lines:
            current_pos += len(line) + 1  # +1 for newline
            line_starts.append(current_pos)
        
        executed_characters = np.full(len(code), False)
        # add characters for count > 0
        for func in script["functions"]:
            for range_info in func.get("ranges", []):
                if range_info.get("count", 0) > 0:
                    executed_characters[range_info["startOffset"]:range_info["endOffset"]] = True

        # remove characters for count == 0
        for func in script["functions"]:
            for range_info in func.get("ranges", []):
                if range_info.get("count", 0) == 0:
                    executed_characters[range_info["startOffset"]:range_info["endOffset"]] = False

        # Determine which lines are executed using the executed_characters array
        executed_lines = []
        for i in range(len(lines)):
            # Get character range for this line
            start_pos = line_starts[i]
            end_pos = line_starts[i+1] - 1 if i < len(lines) - 1 else len(code)
            
            # Check if any character in this line is executed
            if start_pos < len(executed_characters) and np.any(executed_characters[start_pos:end_pos]):
                executed_lines.append(i)
        
        executed_lines_by_file[file_name] = executed_lines
        
        # if verbose:
        #     # Print the source code with highlighting
        #     print("\nSource Code (executed lines in green, unexecuted in red):")
        #     print("─" * 80)
        #     non_empty_lines = 0
        #     executed_count = 0
            
        #     for i, line in enumerate(lines):
        #         # # Skip empty lines and single comment lines from line execution count
        #         # stripped = line.strip()
        #         # is_significant = stripped and not (stripped.startswith('//') and len(stripped.split()) <= 3)
                
        #         # if is_significant:
        #         #     non_empty_lines += 1
        #         non_empty_lines += 1
                
        #         is_executed = i in executed_lines
        #         # if is_executed and is_significant:
        #         #     executed_count += 1
                    
        #         color = 'green' if is_executed else 'red'
        #         marker = '✓' if is_executed else '✗'
        #         line_num = f"{i+1:4d}"
        #         print(f"{colored(f'{line_num} {marker}', color)} {colored(line.rstrip(), color)}")
            
        #     if non_empty_lines > 0:
        #         coverage_percent = (executed_count / non_empty_lines) * 100
        #         print("─" * 80)
        #         print(f"Code Coverage: {executed_count}/{non_empty_lines} lines ({coverage_percent:.1f}%)")
        #     else:
        #         print("No significant code lines found")

    return executed_lines_by_file


def generate_game(description, save_dir):
    prompt = prompt_game_code.format(
        description=description,
        p5js_guidelines=p5js_guidelines,
        prompt_format=prompt_format
    )
    generate(model, prompt, save_dir, thinking=thinking)
    return code_from_dir(save_dir)


def revise_game(game_code, code_coverage, save_dir):
    game_code_str = ""
    for relative_path, code in game_code.items():
        game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

    # copy game code to save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    prompt = prompt_revise_game.format(
        game_code=game_code_str,
        code_coverage=code_coverage
    )
    generate(model, prompt, save_dir, thinking=revise_thinking, thinking_tokens=revise_thinking_tokens)
    return code_from_dir(save_dir)


def generate_agent(game_code, save_dir):
    game_code_str = ""
    for relative_path, code in game_code.items():
        game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

    # copy game code to agent save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    prompt = prompt_policy.format(
        game_code=game_code_str, num_eval_steps=num_eval_steps
    )
    generate(model, prompt, save_dir, thinking=agent_thinking, thinking_tokens=agent_thinking_tokens)

    return code_from_dir(save_dir)


def eval_game(code_with_agent, save_dir):
    if not (save_dir / "run_check.json").exists():

        errors, coverage_data = run_game_coverage(code_with_agent, headless=False, num_steps=num_eval_steps)

        run_check = {"status": "passed", "errors": []}
        if errors:
            run_check["status"] = "failed"
            run_check["errors"] = errors
        save_dir.mkdir(parents=True, exist_ok=True)

        if not errors:
            executed_lines = analyze_coverage(coverage_data, code_with_agent, verbose=True)
        else:
            executed_lines = {}

        with open(save_dir / "run_check.json", "w") as f:
            json.dump(run_check, f, indent=4)

        with open(save_dir / "executed_lines.json", "w") as f:
            json.dump(executed_lines, f, indent=4)

    else:
        with open(save_dir / "run_check.json", "r") as f:
            run_check = json.load(f)
        with open(save_dir / "executed_lines.json", "r") as f:
            executed_lines = json.load(f)

    return run_check, executed_lines


def eval_coverage(code_with_agent, executed_lines, save_dir):
    highlighted_code = ""
    executed_game_lines = 0
    total_game_lines = 0
    for file_name, line_numbers in executed_lines.items():
        # TODO: might help to include coverage feedback for agent too?
        if not file_name.endswith(".js"):
            continue

        highlighted_code += f"\n===== LINE-BY-LINE COVERAGE FOR: {file_name} =====\n"
        code_lines = code_with_agent[file_name].split('\n')
        for i, line in enumerate(code_lines):
            marker = '✓' if i in line_numbers else '✗'
            if line.strip() == "":
                marker = ' '
            highlighted_code += f"{i+1:4d} {marker} {line}\n"
        
        if file_name != "agent.js":
            # remove empty lines
            executed_game_lines += len([line_nb for line_nb in line_numbers if code_lines[line_nb].strip() != ""])
            total_game_lines += len([line for line in code_lines if line.strip() != ""])
    coverage_score = executed_game_lines / total_game_lines
    coverage_score_percent = coverage_score * 100

    highlighted_code += f"\n===== TOTAL GAME CODE COVERAGE: {executed_game_lines}/{total_game_lines} ({coverage_score_percent:.2f}%) =====\n"

    (save_dir / "code_coverage.txt").write_text(highlighted_code)
    with open(save_dir / "coverage_score.json", "w") as f:
        json.dump({
            "executed_game_lines": executed_game_lines,
            "total_game_lines": total_game_lines,
            "coverage_score": coverage_score,
        }, f, indent=4)

    return highlighted_code, coverage_score


def text2game(text, save_dir):
    for sample_idx in range(max_samples):
        revision_iter = 0

        game_dir = save_dir / f"sample{sample_idx}_iter{revision_iter}"             
        # generate game (no agent)
        game_code = generate_game(text, game_dir / "no_agent")
        
        # game_code is updated at each iteration
        while revision_iter <= max_iterations:

            # evaluate game by sampling agents
            accept_game = False
            eval_results = []

            for agent_idx in range(max_agent_samples):
                # generate agent
                agent_dir = game_dir / f"with_agent{agent_idx}"
                code_with_agent = generate_agent(game_code, agent_dir)

                # eval game with agent
                print("eval", agent_dir)
                run_check, executed_lines = eval_game(code_with_agent, agent_dir / "eval")

                # resample if error
                if run_check["status"] == "failed":
                    continue

                # evaluate coverage
                code_coverage, coverage_score = eval_coverage(code_with_agent, executed_lines, agent_dir / "eval")

                eval_results.append({
                    "run_check": run_check,
                    "code_coverage": code_coverage,
                    "coverage_score": coverage_score
                })

                # stop everything if reached 100% coverage
                if coverage_score == 1.0:
                    return

            # revise the game
            revision_iter += 1

            if revision_iter == max_iterations:
                break

            # pick best coverage result (highest coverage score)
            best_agent_res = max(eval_results, key=lambda x: x["coverage_score"])
            best_code_coverage = best_agent_res["code_coverage"]

            # update game dir for next iteration
            game_dir = save_dir / f"sample{sample_idx}_iter{revision_iter}"         
            game_code = revise_game(game_code, best_code_coverage, game_dir / "no_agent")


if __name__ == "__main__":
    theme_path = Path(__file__).parent.parent / "game_prompts" / "generative_games" / "final_concepts"
    themes = {}
    game_concepts = sorted(list(theme_path.glob("*.json")))
    for path in game_concepts:
        with open(path, "r", encoding="utf-8") as f:
            game_concept = json.load(f)
        themes[path.stem] = game_concept["concept"]
    themes = list(themes.values())


    max_samples = 3
    max_agent_samples = 3
    max_iterations = 3
    # num_eval_steps = 10000
    num_eval_steps = 5000

    num_themes = 2
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        text2game(theme, save_dir / f"theme_{idx}")

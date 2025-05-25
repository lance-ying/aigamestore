from itertools import tee
from pathlib import Path
from datetime import datetime
import re
import json

from utils import generate, code_from_dir


thinking = True

model = "claude-3-7-sonnet-20250219"
# model = "claude-sonnet-4-20250514"


save_dir = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 15

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}"

save_dir = save_dir / run_name



def run_game(game_code: dict[str, str], headless: bool = True, run_agent: bool = True, num_steps: int = 10000) -> tuple[list, dict]:
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
            - raw_coverage_data: Dictionary with coverage data.
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




# Implement a fun game winnable by anyone (even unexperienced players) playing it for less than 1 minute.
# Make this game even more fun and make sure it's winnable by anyone (even unexperienced players) playing it for less than 1 minute.
# List all the features implemented in this game.


# TODO: better if don't say less than 1 minute here but do it in the improve prompt?
# TODO: could ask instruction to make graphics more appealing
prompt_game_code = """Implement a fun game winnable by anyone (even unexperienced players) playing it for less than 1 minute.

<game_description>
{description}
</game_description>

<technical_instructions>
{technical_instructions}
</technical_instructions>

Think thoroughly about how to design the game based on the provided instructions. Don't include any code during the thinking phase.

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
* Make ALL the game variables accessible with the `getState()` function (don't use it in your game implementation).
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. These functions are accessible through the `p` object. Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
* Set the canvas size to 600x400 pixels.
* Ensure full reproducibility by setting the random seed to a fixed value.
* Make sure the game is playable only with the keyboard. Use the arrow keys for player movement.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
* Make sure the player can restart the game at any time by pressing 'R'.

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



prompt_game_features = """List all the features implemented in this code.
Indicate where in the code each feature is implemented.

<code>
{game_code}
</code>

Use the following format to write your final answer:
<features>
<feature>
...
</feature>
...
</features>
"""


# TODO: errors with the modified code (claude 3.7)
prompt_logs = """Write a python function that takes the provided code as input and insert log statements to record when each feature is triggered.
```javascript
...
let gameInstance = new p5(p => {{
    // Initialize the logs. Important: do not reset the logs at any point in the code. These logs are considered write-only.
    p.logs = {{
        ...
    }};
    ...
}});
```

<features>
{features}
</features>

Format your answer as follows:
<add_logs_code>
def add_logs(code: dict[str, str]) -> dict[str, str]:
    '''
    Args:
        code: Dictionary mapping file paths to their content
        
    Returns:
        Updated code with the log statements inserted
    '''
    ...
</add_logs_code>

<code>
{code}
</code>
"""




prompt_policy = """Implement an agent that explores the game.

<instructions>
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

<thinking_instructions>
Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
</thinking_instructions>
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


prompt_improve = """Make this game even more fun and make sure it's winnable by anyone (even unexperienced players) playing it for less than 1 minute.

<game_description>
{description}
</game_description>

<technical_instructions>
{technical_instructions}
</technical_instructions>

<game_code>
{game_code}
</game_code>

Think thoroughly about how to improve the game based on the provided instructions. Don't include any code during the thinking phase.

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""


prompt_improve_with_feedback = """Improve this computer game.
Don't include any other content in the index.html file than the p5.js and p5.collide2D imports and the game scripts.
Don't change the canvas size (must be 600x400).
Don't change the keys to start and reset the game.

Think thoroughly about how to improve the game based on the following guidelines and the feedback. Don't include any code during the planning phase.
Check if each of these features are present in the game.
<design_guidelines>
{design_guidelines}
</design_guidelines>

<technical_instructions>
{technical_instructions}
</technical_instructions>

<feedback>
{feedback}
</feedback>

<game_description>
{game_description}
</game_description>

<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""

def code_to_str(code):
    code_str = ""
    for relative_path, code in code.items():
        code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"
    return code_str

def generate_agent(game_code, save_dir):
    game_code_str = code_to_str(game_code)

    # copy game code to agent save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    prompt = prompt_policy.format(
        game_code=game_code_str
    )
    model = "claude-sonnet-4-20250514"
    generate(model, prompt, save_dir, thinking=True, thinking_tokens=2000)

    return code_from_dir(save_dir)


def eval_game(code, save_dir, headless=True, run_agent=True, num_eval_steps=10000):
    if not (save_dir / "run_check.json").exists():

        errors, logs = run_game(code, headless=headless, run_agent=run_agent, num_steps=num_eval_steps)

        run_check = {"status": "passed", "errors": []}
        if errors:
            run_check["status"] = "failed"
            run_check["errors"] = errors
        save_dir.mkdir(parents=True, exist_ok=True)

        with open(save_dir / "run_check.json", "w") as f:
            json.dump(run_check, f, indent=4)

        with open(save_dir / "logs.json", "w") as f:
            json.dump(logs, f, indent=4)

    else:
        with open(save_dir / "run_check.json", "r") as f:
            run_check = json.load(f)
        with open(save_dir / "logs.json", "r") as f:
            logs = json.load(f)

    return run_check, logs


def add_logs(code, feature, save_dir):
    code_str = code_to_str(code)

    prompt = prompt_logs.format(
        code=code_str,
        features=feature
    )
    model = "claude-sonnet-4-20250514"
    answer = generate(model, prompt, save_dir, thinking=True, thinking_tokens=2000)

    add_logs_code = answer.split("<add_logs_code>")[1].split("</add_logs_code>")[0]
    (save_dir / "add_logs.py").write_text(add_logs_code)

    local_vars = {}
    exec(add_logs_code, globals(), local_vars)
    code_with_logs = local_vars['add_logs'](code)

    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, file_content in code_with_logs.items():
        (save_dir / file_path).write_text(file_content)

    return code_with_logs


def improve_game(code, game_description, save_dir):
    prompt = prompt_improve.format(
        description=game_description,
        technical_instructions=p5js_guidelines,
        game_code=code_to_str(code)
    )
    generate(model, prompt, save_dir, thinking=True, thinking_tokens=2000)

    return code_from_dir(save_dir)


if __name__ == "__main__":
    # TODO is logs too big when run for 1000 steps?
    total_test_steps = 300


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


    prompts = []
    save_dirs = []

    num_samples = 2
    num_themes = 10
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        for sample_idx in range(num_samples):
            _save_dir = save_dir / "games" / f"theme_{idx}" / f"sample_{sample_idx}" / "code_original"
            prompt = prompt_game_code.format(
                description=theme,
                technical_instructions=p5js_guidelines,
            )
            generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
            game_code, game_code_str = code_from_dir(_save_dir, return_str=True)
            run_check, logs = eval_game(game_code, _save_dir, headless=False, num_eval_steps=1000, run_agent=False)

            if len(run_check["errors"]) > 0:
                continue

            # game features
            prompt = prompt_game_features.format(
                game_code=game_code_str
            )
            answer = generate(model, prompt, _save_dir / "features", thinking=True, thinking_tokens=2000)
            game_features = answer.split("<features>")[1].split("</features>")[0]
            (_save_dir / "features" / "features.txt").write_text(game_features)

            code_with_logs = add_logs(game_code, game_features, _save_dir.parent / "code_with_logs")
            run_check, logs = eval_game(code_with_logs, _save_dir.parent / "code_with_logs", headless=False, num_eval_steps=1000, run_agent=False)

            if len(run_check["errors"]) > 0:
                continue

            agent_dir = _save_dir.parent / "code_with_agent"
            code_with_agent = generate_agent(code_with_logs, agent_dir)
            run_check, logs = eval_game(code_with_agent, agent_dir, headless=False)
            
            if len(run_check["errors"]) > 0:
                continue
            
            logs_counts = {k: len(v) for k, v in logs.items()}

            improve_dir = _save_dir.parent / "improve_iter1"
            code_improved = improve_game(code_with_logs, theme, improve_dir / "code")

            agent_dir = improve_dir / "code_with_agent"
            code_with_agent = generate_agent(code_improved, agent_dir)
            run_check, logs = eval_game(code_with_agent, agent_dir, headless=False)

            if len(run_check["errors"]) > 0:
                continue

            break
            # breakpoint()
            


            # prompt = prompt_improve_with_feedback.format(
            #     technical_instructions=p5js_guidelines,
            #     feedback=logs_counts,
            #     game_description=theme,
            #     game_code=game_code_str
            # )
            # generate(model, prompt, _save_dir.parent / "improve_code_with_feedback_iter1", thinking=True, thinking_tokens=2000)


            # TODO: not really useful, just say that everything is amazing
            # prompt = prompt_manifest.format(
            #     features=features,
            #     game_code=game_code_str
            # )
            # generate(model, prompt, _save_dir / "manifest", thinking=True, thinking_tokens=2000)

    # breakpoint()
    # for idx, theme in enumerate(themes):
    #     code_dir = save_dir / "games" / f"theme_{idx}" / "sample_0" / "code_original"
    #     _save_dir = save_dir / "games" / f"theme_{idx}" / "sample_0" / "features"

    #     game_code, game_code_str = code_from_dir(code_dir, return_str=True)

    #     prompt = prompt_logs.format(
    #         design_guidelines=design_guidelines,
    #         game_code=game_code_str,
    #     )
    #     answer = generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
    #     # answer = generate(model, prompt, _save_dir, thinking=False)
    #     add_logs_code = answer.split("<add_logs_code>")[1].split("</add_logs_code>")[0]
    #     score_game_code = answer.split("<score_game_code>")[1].split("</score_game_code>")[0]

    #     # save add_logs.py and score_game.py
    #     (_save_dir / "add_logs.py").write_text(add_logs_code)
    #     (_save_dir / "score_game.py").write_text(score_game_code)
        
    #     # Execute the extracted Python code to get mechanics
    #     local_vars = {}
    #     exec(add_logs_code, globals(), local_vars)
    #     code_with_logs = local_vars['add_logs'](game_code)

    #     _updated_save_dir = _save_dir / "code_with_logs"
    #     _updated_save_dir.mkdir(parents=True, exist_ok=True)
    #     for file_path, file_content in code_with_logs.items():
    #         (_updated_save_dir / file_path).write_text(file_content)

    #     if not (_updated_save_dir / "logs" / "logs.json").exists():
    #         errors, issues, logs = run_game(code_with_logs, headless=False, total_test_time=total_test_steps * 60)

    #         (_updated_save_dir / "logs").mkdir(parents=True, exist_ok=True)
    #         (_updated_save_dir / "logs" / "logs.json").write_text(json.dumps(logs))
    #     else:
    #         with open(_updated_save_dir / "logs" / "logs.json", "r", encoding="utf-8") as f:
    #             logs = json.load(f)

    #     local_vars = {}
    #     exec(score_game_code, globals(), local_vars)
    #     score, feedback = local_vars['score_game'](logs)
    #     print("Score:", score)

    #     with open(_save_dir / "score.json", "w", encoding="utf-8") as f:
    #         json.dump({"score": score, "feedback": feedback}, f, indent=4)
    #     # breakpoint()


    # for idx, theme in enumerate(themes):
    #     code_dir = save_dir / "games" / f"theme_{idx}" / "sample_0" / "code_original"
    #     _save_dir = save_dir / "games" / f"theme_{idx}" / "sample_0" / "code_improved"

    #     game_code, game_code_str = code_from_dir(code_dir, return_str=True)


    #     prompt = prompt_improve.format(
    #         design_guidelines=design_guidelines,
    #         technical_instructions=p5js_guidelines,
    #         game_code=game_code_str,
    #     )
    #     generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
        

    # for idx, theme in enumerate(themes):
    #     code_dir = save_dir / f"theme_{idx}" / "sample_0" / "code_original"
    #     _save_dir = save_dir / f"theme_{idx}" / "sample_0" / "code_improved_with_feedback"

    #     game_code, game_code_str = code_from_dir(code_dir, return_str=True)

    #     feedback_dir = save_dir / f"theme_{idx}" / "sample_0" / "features" / "score.json"
    #     with open(feedback_dir, "r", encoding="utf-8") as f:
    #         feedback = json.load(f)["feedback"]
    #     feedback = "\n ".join(feedback)
    #     breakpoint()

    #     prompt = prompt_improve_with_feedback.format(
    #         design_guidelines=design_guidelines,
    #         technical_instructions=p5js_guidelines,
    #         game_code=game_code_str,
    #         feedback=feedback
    #     )
    #     generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
        
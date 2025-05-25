from pathlib import Path
from datetime import datetime
import re
import json

from matplotlib import pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from utils import generate, code_from_dir, check_game



# TODO: fix issue collision with the ground (makes jumping really hard and it's annoying)
# TODO: fix restart button not working sometimes
# TODO: still have some flickering so might be good to improve game twice

# generate base game
thinking = True

# improve game (before generating the agent)
improve_thinking = True
improve_thinking_tokens = 20000

# agent_thinking = False
agent_thinking = True
# agent_thinking_tokens = 5000
agent_thinking_tokens = 20000

revise_thinking = True
revise_thinking_tokens = 5000

# headless = True
headless = False

# model = "claude-3-7-sonnet-20250219"
model = "claude-sonnet-4-20250514"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run3/{model}/{'thinking' if thinking else 'no_thinking'}"

save_dir = save_dir / run_name


prompt_game_code = """
Task: Implement a fun 2D minigame in p5.js based on the following description:
<description>
{description}
</description>

<p5js_guidelines>
* Don't use any external assets.
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
    let gameInstance = new p5(p => {{
        // Initialize the logs. Important: do not reset the logs at any point in the code! These logs are considered write-only!
        p.logs = {{
            // store player position
            "player_positions": [],
            // store the game status
            "game_status": []
        }};
        ...
        // Expose all the game variables (before defining the functions). Don't use getState() in your game implementation.
        p.getState = () => {{
            ...
        }}
        ...
    }});
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
* Make sure the game has a clear goal and win state.
* Make sure the game is playable only with the keyboard. Use the arrow keys for player movement.
* Implement professional-looking and polished graphics.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
* Make sure the player can restart the game at any time by pressing 'R'.

IMPORTANT: Common pitfalls to avoid
* The specific order of the words in the p5.collide2D function names matter. For example, 'collideRectCircle' is a function, but 'collideCircleRect' is not available.
* Make sure to properly pass the object `p` in the game code to access p5js functions. Otherwise you will get a "ReferenceError: p is not defined" error.
* Make sure there is no flickering in the graphics. IMPORTANT: Do NOT randomly generate visual properties (colors, sizes, positions) inside draw functions that run every frame. Instead:
    * Generate random visual properties only ONCE during initialization/setup
    * Store these properties as object attributes
    * Use the stored properties when drawing, don't regenerate them each frame
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!

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
</p5js_guidelines>

Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
"""

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


prompt_simplify_game = """Task: Extremely simplify the mechanics of this minigame to make it easier to play.

Don't change this structure:
```javascript
...
const p5 = window.p5
let gameInstance = new p5(p => {{
    // Initialize the logs. Important: do not reset the logs at any point in the code! These logs are considered write-only!
    p.logs = {{
        // store player position
        "player_positions": [],
        // store the game status
        "game_status": []
    }};
    ...
    // Expose all the game variables (before defining the functions). Don't use getState() in your game implementation.
    p.getState = () => {{
        ...
    }}
    ...
}});
// Expose the game instance globally
window.gameInstance = gameInstance;
    ```


<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""


# TODO: not sure this is needed (sometimes don't reset the game because the game is broken)
# * Make sure it is robust and never gets stuck in an infinite loop (e.g. always restart when game over)

# TODO: might be better to first ask to win the game.
# prompt_policy = """Task: Implement an agent that plays the game.

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
# * If needed, p5js functions can be accessed via `window.gameInstance`
# * Make sure to access the game state via the window.gameInstance object
# * The goal of the agent is to try to trigger ALL the game mechanics (including mechanics like losing the game)
# * Use a behavior tree to implement the agent
# * Make sure it is robust and never gets stuck in an infinite loop (e.g. always restart when game over)
# * Your agent will be run for {num_eval_steps} steps (each step is a call to p5.js draw function)
# * Make sure to wait a few frames before restarting (otherwise never win screen never appears)

# <thinking_instructions>
# Think thoroughly about how to implement the agent using a behavior tree. Don't include any code during the thinking phase.
# </thinking_instructions>
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


# prompt_policy = """Task: Implement an agent that plays the game.

# <instructions>
# Objectives:
# * Primary goal: WIN the game
# * Secondary goal: trigger ALL the game mechanics
#     * this include LOSING the game
#     * the goal is to make sure every single line of the game code is executed at least once

# Implementation:
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


policy_descriptions = [
    # "Play the game to WIN. Use a behavior tree.",
    "Play the game to WIN. Use a MCTS.",
    "Thoroughly explore ALL the mechanics of the game. Don't try to win. Try all the controls and try all the possible interactions with the game objects.",
]
# * Make sure it is robust and never gets stuck in an infinite loop (e.g. always restart when game over)


prompt_policy = """Task: Implement an agent for the game based on the following description:
<description>
{description}
</description>

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
* Make sure to access the game state via the window.gameInstance object
* Make sure to start the game by pressing the 'Enter' key
* ALWAYS reset the game when the game is over
    * Check the game state to see if the game is over and make sure the game starts again
    * Wait a few steps before restarting to let the win screen appear
* Your agent will be run for {num_eval_steps} steps (each step is a call to p5.js draw function)

<thinking_instructions>
Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
Path planning is a crucial component for the agent to successfully navigate the game.
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


prompt_visuals = """Task: Improve the visuals of this game to make it more professional.

Role: you are a professional graphics designer and someone asked you to rethink the visuals for a game. You have total creative freedom.

<instructions>
* Create your own color palette and visual style for this game.
* Make the game more visually coherent and appealing.
* Make the visuals more polished and professional.
* Keep the design minimal and clean.

Check that:
* object parts are connected correctly
* objects are properly positioned and oriented
* text doesn't overlap or overflow

* Make sure there is no flickering in the graphics. IMPORTANT: Do NOT randomly generate visual properties (colors, sizes, positions) inside draw functions that run every frame. Instead:
    * Generate random visual properties only ONCE during initialization/setup
    * Store these properties as object attributes
    * Use the stored properties when drawing, don't regenerate them each frame
<game_code>
{game_code}
</game_code>

Format your answer in the following format for the files that need to be updated:
<code filename="{{name}}.{{extension}}">
...
</code>
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

                    # import time
                    # time.sleep(0.01)

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


# def generate_game(description, save_dir):
#     prompt = prompt_game_code.format(
#         description=description,
#     )
#     generate(model, prompt, save_dir, thinking=thinking)
#     return code_from_dir(save_dir)


def generate_game(description, save_dir):
    for sample_idx in range(max_samples):
        base_game_dir = save_dir / f"base_game_sample{sample_idx}"
        prompt = prompt_game_code.format(
            description=description,
        )
        generate(model, prompt, base_game_dir, thinking=thinking)
        game_code, game_code_str = code_from_dir(base_game_dir, return_str=True)

        if not (base_game_dir / "run_check.json").exists():
            errors, issues = check_game(game_code, headless=headless, total_test_time=60000)
            run_check = {"status": "passed" if not errors and not issues else "failed", "errors": errors, "issues": issues}

            with open(base_game_dir / "run_check.json", "w") as f:
                json.dump(run_check, f, indent=4)
        else:
            with open(base_game_dir / "run_check.json", "r") as f:
                run_check = json.load(f)

        if run_check["status"] == "passed":
            break

    return game_code

    for sample_idx in range(max_samples):
        improve_game_dir = save_dir / f"improve_game_sample{sample_idx}"
        prompt = prompt_improve_game.format(
            game_code=game_code_str
        )
        generate(model, prompt, improve_game_dir, thinking=improve_thinking, thinking_tokens=improve_thinking_tokens)
        improve_game_code, improve_game_code_str = code_from_dir(improve_game_dir, return_str=True)

        if not (improve_game_dir / "run_check.json").exists():
            errors, issues = check_game(improve_game_code, headless=headless, total_test_time=60000)
            run_check = {"status": "passed" if not errors and not issues else "failed", "errors": errors, "issues": issues}

            with open(improve_game_dir / "run_check.json", "w") as f:
                json.dump(run_check, f, indent=4)
        else:
            with open(improve_game_dir / "run_check.json", "r") as f:
                run_check = json.load(f)

        if run_check["status"] == "passed":
            break

    # for sample_idx in range(max_samples):
    #     improve_game_dir = save_dir / f"improve_game_sample{sample_idx}_iter1"
    #     # prompt = prompt_improve_game.format(
    #     #     game_code=game_code_str
    #     # )
    #     prompt = prompt_simplify_game.format(
    #         game_code=improve_game_code_str
    #     )
    #     generate(model, prompt, improve_game_dir, thinking=improve_thinking, thinking_tokens=improve_thinking_tokens)
    #     improve_game_code, improve_game_code_str = code_from_dir(improve_game_dir, return_str=True)

    #     if not (improve_game_dir / "run_check.json").exists():
    #         errors, issues = check_game(improve_game_code, headless=False, total_test_time=60000)
    #         run_check = {"status": "passed" if not errors and not issues else "failed", "errors": errors, "issues": issues}

    #         with open(improve_game_dir / "run_check.json", "w") as f:
    #             json.dump(run_check, f, indent=4)
    #     else:
    #         with open(improve_game_dir / "run_check.json", "r") as f:
    #             run_check = json.load(f)

    #     if run_check["status"] == "passed":
    #         break


    # for sample_idx in range(max_samples):
    #     improve_game_dir = save_dir / f"improve_game_sample{sample_idx}_iter2"
    #     # prompt = prompt_improve_game.format(
    #     #     game_code=game_code_str
    #     # )
    #     prompt = prompt_simplify_game.format(
    #         game_code=improve_game_code_str
    #     )
    #     generate(model, prompt, improve_game_dir, thinking=improve_thinking, thinking_tokens=improve_thinking_tokens)
    #     improve_game_code, improve_game_code_str = code_from_dir(improve_game_dir, return_str=True)

    #     if not (improve_game_dir / "run_check.json").exists():
    #         errors, issues = check_game(improve_game_code, headless=False, total_test_time=60000)
    #         run_check = {"status": "passed" if not errors and not issues else "failed", "errors": errors, "issues": issues}

    #         with open(improve_game_dir / "run_check.json", "w") as f:
    #             json.dump(run_check, f, indent=4)
    #     else:
    #         with open(improve_game_dir / "run_check.json", "r") as f:
    #             run_check = json.load(f)

    #     if run_check["status"] == "passed":
    #         break

    # for sample_idx in range(max_samples):
    #     improve_game_dir = save_dir / f"improve_game_sample{sample_idx}_iter3"
    #     # prompt = prompt_improve_game.format(
    #     #     game_code=game_code_str
    #     # )
    #     prompt = prompt_simplify_game.format(
    #         game_code=improve_game_code_str
    #     )
    #     # generate(model, prompt, improve_game_dir, thinking=improve_thinking, thinking_tokens=improve_thinking_tokens)
    #     generate(model, prompt, improve_game_dir, thinking=False, thinking_tokens=improve_thinking_tokens)
    #     improve_game_code, improve_game_code_str = code_from_dir(improve_game_dir, return_str=True)

    #     if not (improve_game_dir / "run_check.json").exists():
    #         errors, issues = check_game(improve_game_code, headless=False, total_test_time=60000)
    #         run_check = {"status": "passed" if not errors and not issues else "failed", "errors": errors, "issues": issues}

    #         with open(improve_game_dir / "run_check.json", "w") as f:
    #             json.dump(run_check, f, indent=4)
    #     else:
    #         with open(improve_game_dir / "run_check.json", "r") as f:
    #             run_check = json.load(f)

    #     if run_check["status"] == "passed":
    #         break



    # copy code to save_dir
    for file_path, code in improve_game_code.items():
        (save_dir / file_path).write_text(code)

    return improve_game_code

def revise_game(game_code, code_coverage, save_dir):
    game_code_str = ""
    for relative_path, code in game_code.items():
        game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

    # copy game code to save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    # prompt = prompt_revise_game.format(
    #     game_code=game_code_str,
    #     code_coverage=code_coverage
    # )

    prompt = prompt_simplify_game.format(
        game_code=game_code_str
    )
    # prompt = prompt_improve_game.format(
    #     game_code=game_code_str
    # )

    generate(model, prompt, save_dir, thinking=revise_thinking, thinking_tokens=revise_thinking_tokens)
    return code_from_dir(save_dir)


def generate_agent(game_code, description, save_dir):
    game_code_str = ""
    for relative_path, code in game_code.items():
        game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

    # copy game code to agent save dir
    save_dir.mkdir(parents=True, exist_ok=True)
    for file_path, code in game_code.items():
        (save_dir / file_path).write_text(code)

    prompt = prompt_policy.format(
        game_code=game_code_str, num_eval_steps=num_eval_steps, description=description
    )
    generate(model, prompt, save_dir, thinking=agent_thinking, thinking_tokens=agent_thinking_tokens)

    return code_from_dir(save_dir)


def eval_game(code_with_agent, save_dir):
    if not (save_dir / "run_check.json").exists():

        errors, coverage_data = run_game_coverage(code_with_agent, headless=headless, num_steps=num_eval_steps)

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
    save_dir.mkdir(parents=True, exist_ok=True)

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
    res = []

    for sample_idx in range(max_samples):
        revision_iter = 0

        game_dir = save_dir / f"sample{sample_idx}_iter{revision_iter}"             
        # generate game (no agent)
        game_code = generate_game(text, game_dir / "no_agent")

        # # copy game code to agent save dir
        # (game_dir / "visuals").mkdir(parents=True, exist_ok=True)
        # for file_path, code in game_code.items():
        #     (game_dir / "visuals" / file_path).write_text(code)
        # prompt = prompt_visuals.format(
        #     game_code=code_from_dir(game_dir / "no_agent", return_str=True)[1]
        # )
        # generate(model, prompt, game_dir / "visuals", thinking=True, thinking_tokens=5000)
        # breakpoint()
        
        # game_code is updated at each iteration
        while revision_iter <= max_iterations:

            # evaluate game by sampling agents
            accept_game = False
            eval_results = []
            all_executed_lines = {}  # Combined executed lines across all agents

            for agent_idx in range(max_agent_samples):
                description = policy_descriptions[agent_idx % len(policy_descriptions)]

                # generate agent
                agent_dir = game_dir / f"with_agent{agent_idx}"
                code_with_agent = generate_agent(game_code, description, agent_dir)

                # eval game with agent
                print("eval", agent_dir)
                run_check, executed_lines = eval_game(code_with_agent, agent_dir / "eval")

                # resample if error
                if run_check["status"] == "failed":
                    continue

                # evaluate coverage
                code_coverage, coverage_score = eval_coverage(code_with_agent, executed_lines, agent_dir / "eval")

                # combine executed lines
                for file_name, lines in executed_lines.items():
                    if file_name not in all_executed_lines:
                        all_executed_lines[file_name] = set(lines)
                    else:
                        all_executed_lines[file_name].update(lines)

                eval_results.append({
                    "run_check": run_check,
                    "code_coverage": code_coverage,
                    "coverage_score": coverage_score
                })

                res.append({
                    "coverage_score": coverage_score,
                    "sample_idx": sample_idx,
                    "revision_iter": revision_iter,
                    "agent_idx": agent_idx,
                    "save_dir": save_dir
                })
                breakpoint()

            # Calculate combined coverage
            # Convert sets back to lists for compatibility
            combined_executed_lines = {file: list(lines) for file, lines in all_executed_lines.items()}
            combined_coverage, combined_score = eval_coverage(code_with_agent, combined_executed_lines, game_dir / "combined_eval")
            
            # stop everything if combined coverage reaches 100%
            if combined_score == 1.0:
                return res

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


    max_samples = 5
    max_agent_samples = 1
    max_iterations = 1
    num_eval_steps = 10000
    # num_eval_steps = 5000

    num_themes = 5
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        if idx != 1:
            continue
        res = text2game(theme, save_dir / f"theme_{idx}")

        # plot coverage scores
        res = pd.DataFrame(res)

        # create a new column with both sample_idx and revision_iter
        res["sample_revision"] = res.apply(lambda row: f"sample{row['sample_idx']}_iter{row['revision_iter']}", axis=1)
        plt.figure(figsize=(4, 3), dpi=150)
        # sns.scatterplot(data=res, x="sample_revision", y="coverage_score", hue="agent_idx")
        sns.stripplot(data=res, x="sample_revision", y="coverage_score", hue="sample_idx", legend=False)
        plt.xticks(rotation=45, ha="right", fontsize=8)
        
        ax = plt.gca()
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        # Add horizontal line at y=1 (100% coverage)
        plt.axhline(y=1, color='grey', linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.savefig(save_dir / f"theme_{idx}_coverage_scores.png", dpi=300)
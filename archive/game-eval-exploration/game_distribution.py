from pathlib import Path
from datetime import datetime
import json
import shutil
import time
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import base64
import os
from google import genai
from google.genai import types

from utils import generate, code_from_dir


thinking = True
thinking_tokens = 5000

model = "gemini-2.5-flash-preview-05-20"


save_dir = Path(__file__).parent / "results" / Path(__file__).stem


run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}"

save_dir = save_dir / run_name


prompt_game_code = """Implement a fun game.

<game_description>
{description}
</game_description>

<technical_instructions>
{technical_instructions}
</technical_instructions>

Use the following format to write your final code:
filename="{{name}}.{{extension}}"
```{{block_type}}
...
```	

For example, for html:
filename="index.html"
```html
...
```
"""
# <code filename="{{name}}.{{extension}}">
# ...
# </code>
# """


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
<code filename="index.html">
...
</code>

<code filename="agent.js">
...
</code>

<game_code>
{game_code}
</game_code>

Think thoroughly about how to implement the agent. Don't include any code during the thinking phase.
"""

prompt_fix_policy = """This agent wasn't able to win the game. Fix it based on the provided gameplay analysis.

<gameplay_analysis>
{gameplay_analysis}
</gameplay_analysis>

<game_code>
{game_code}
</game_code>

Original instructions for the agent code:
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


You are only allowed to modify the `agent.js` file.
Format your answer in the following format:
<code filename="agent.js">
...
</code>

Think thoroughly about how to fix the agent. Don't include any code during the thinking phase.
"""


prompt_game_comparison = """List ALL the differences between the provided game implementations.
"""


prompt_gen_code_reviewer = """Write instructions for a code reviewer to identify the type of errors illustrated in the following example.
The code reviewer will only have access to the code, not the errors.
Do not include information about the example in your response!

Example of code and errors:
<code>
{code}
</code>

<errors>
{errors}
</errors>
"""

prompt_review_code = """Thoroughly review the code based on the provided instructions.

<instructions>
{instructions}
</instructions>

<code>
{code}
</code>
"""



# copied from gen_minigame_batch_new_prompts.py
# TODO: fixed an issue with error catching when canvas is not found
def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 60000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 180000) -> list:
    """Test if a p5.js game can run without errors using Playwright.

    Args:
        game_code: Dictionary mapping file paths (relative to game root) to their content.
                   Must contain at least "index.html".
        headless: Whether to run the browser in headless mode (default: True)
        initial_wait: Initial wait time in ms before starting interactions (default: 2000)
        sticky_prob: Probability an action will continue on next frame (default: 0.7)
        action_duration: How long to wait between action decisions in ms (default: 150)
        total_test_time: Total time to test inputs in ms (default: 10000)
        viewport_width: Browser viewport width (default: 600)
        viewport_height: Browser viewport height (default: 400)
        sticky_actions: Tuple of keys to use for sticky actions. If None, uses default set of keys.
        max_execution_time: Maximum execution time in ms (default: 60000)

    Returns:
        tuple: A tuple containing (list of error messages, list of gameplay issues).
               Empty lists if no errors or issues.
    """
    import tempfile
    import time
    import signal
    import multiprocessing
    from multiprocessing import Queue
    from playwright.sync_api import sync_playwright
    from pathlib import Path

    assert isinstance(game_code, dict), "game_code must be a dictionary"

    # Define default sticky actions if none provided - only use arrow keys
    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space")

    # Function to run in a separate process
    def run_test(game_code_copy, result_queue, headless, initial_wait, sticky_prob, 
                action_duration, total_test_time, viewport_width, viewport_height, 
                sticky_actions_copy):
        errors = []
        issues = []
        current_time = 0  # Initialize current_time at the beginning of the function
        
        if "index.html" not in game_code_copy:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            result_queue.put((errors, issues))
            return
        
        # Helper function to add issue and stop testing if needed
        def add_issue(message):
            print(message)
            issues.append(message)
            # Signal to stop testing by returning issues and errors
            result_queue.put((errors, issues))
            return True  # Return True to indicate we should stop

        # Helper function to add error and stop testing
        def add_error(message):
            print(message)
            errors.append(message)
            # Signal to stop testing by returning issues and errors
            result_queue.put((errors, issues))
            return True  # Return True to indicate we should stop

        # Use TemporaryDirectory for automatic cleanup of game files
        with tempfile.TemporaryDirectory() as temp_dir_str:
            temp_dir_path = Path(temp_dir_str)
            
            # Write game files to the temporary directory
            for file_path_str, file_content in game_code_copy.items():
                full_path = temp_dir_path / file_path_str
                full_path.parent.mkdir(parents=True, exist_ok=True)
                full_path.write_text(str(file_content), encoding='utf-8')
            
            playwright_instance = None
            browser = None
            context = None
            try:
                playwright_instance = sync_playwright().start()
                browser = playwright_instance.firefox.launch(headless=headless)
                context = browser.new_context(
                    viewport={'width': viewport_width, 'height': viewport_height}
                )
                page = context.new_page()

                # JavaScript to capture errors and unhandled rejections in the page context
                error_collector_js = """
                window.jsErrors = [];
                window.onerror = function(message, source, lineno, colno, error) {
                    console.error('Caught error:', message, source, lineno);
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
                    console.error('Unhandled rejection:', event.reason);
                    window.jsErrors.push({
                        message: 'Unhandled Promise Rejection: ' + event.reason,
                        source: 'promise',
                        lineno: 0,
                        colno: 0,
                        stack: event.reason && event.reason.stack ? event.reason.stack : null
                    });
                });
                """
                page.add_init_script(error_collector_js)

                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")

                # Wait for canvas to appear
                try:
                    page.wait_for_selector("canvas", timeout=10000)
                except Exception as e:
                    # Retrieve any JavaScript errors collected by the injected script
                    js_errors = page.evaluate("window.jsErrors")
                    if js_errors:
                        for error in js_errors:
                            if add_error(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}"):
                                return

                    else:

                        if add_error(f"Canvas not found within timeout: {str(e)}"):
                            return
                
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
                
                # Check 1: Start the game and check if player dies when no actions are taken
                page.wait_for_timeout(initial_wait)  # Initial wait for game to settle
        
                # Start the game by pressing Enter
                page.keyboard.down("Enter")
                page.wait_for_timeout(100)
                page.keyboard.up("Enter")
                
                # Wait to see if player dies without any input
                page.wait_for_timeout(2000)

                # Check game status and player position
                game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                
                # Check if player died during idle period
                if game_status["game_status"] == "fail":
                    message = f"Player dies without any player input at time {current_time}ms"
                    if add_issue(message):
                        return
                    
                # Restart the game and check again
                page.keyboard.down("r")
                page.wait_for_timeout(100)
                page.keyboard.up("r")
                page.wait_for_timeout(100)
                page.keyboard.down("Enter")
                page.wait_for_timeout(100)
                page.keyboard.up("Enter")
                # Wait to see if player dies without any input
                page.wait_for_timeout(2000)

                # Check game status and player position
                game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                
                # Check if player died during idle period
                if game_status["game_status"] == "fail":
                    message = f"Player dies without any player input at time {current_time}ms"
                    if add_issue(message):
                        return


                # Check 2: Test if arrow keys change player position
                
                # Get initial player position
                initial_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                
                # Test each arrow key
                arrow_keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]
                position_changed = False
                
                print(initial_pos)
                for key in arrow_keys:
                    # Press the key for a moment
                    page.keyboard.down(key)
                    page.wait_for_timeout(500)
                    page.keyboard.up(key)
                    page.wait_for_timeout(100)
                    
                    # Get new positions after key press
                    latest_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                    print("latest_pos", latest_pos)
                    
                    # TODO: sometimes screen position should be fixed (e.g. camera following the player) but not world position
                    # Check if position actually changed
                    # epsilon = 5  # TODO: what should epsilon be for game position (don't know what the units are)
                    epsilon = 1
                    if (abs(latest_pos.get("game_x") - initial_pos.get("game_x")) > epsilon or
                        abs(latest_pos.get("game_y") - initial_pos.get("game_y")) > epsilon):
                        position_changed = True
                
                print(position_changed)
                if not position_changed:
                    message = f"Player doesn't move with any of the arrow keys at time {current_time}ms"
                    if add_issue(message):
                        return
                
                import random
                
                # Perform random actions with stickiness and reset every 15 seconds
                current_time = 0
                current_action = None
                last_reset_time = 0
                reset_interval = 15000  # 15 seconds in ms
                
                while current_time < total_test_time:
                    print("Time left:", total_test_time - current_time)
                    
                    # Check if it's time to reset the game
                    if current_time - last_reset_time >= reset_interval:
                        # Release any current action
                        if current_action:
                            page.keyboard.up(current_action)
                            current_action = None
                        
                        game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                        print("Game status:", game_status)
                        # If not in fail state, test if player is stuck before reset
                        if game_status["game_status"] != "fail":
                            print("Checking if player is stuck before reset...")

                            # Quick check to see if player can still move before reset
                            reset_initial_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                            reset_position_changed = False
                            
                            # Test movement in each direction before reset
                            for key in arrow_keys:
                                page.keyboard.down(key)
                                page.wait_for_timeout(300)
                                page.keyboard.up(key)
                                page.wait_for_timeout(50)
                                
                                reset_latest_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                                print("reset_latest_pos", reset_latest_pos)
                                # Check if position changed with epsilon threshold
                                # epsilon = 5
                                epsilon = 1
                                if (abs(reset_latest_pos.get("game_x") - reset_initial_pos.get("game_x")) > epsilon or
                                    abs(reset_latest_pos.get("game_y") - reset_initial_pos.get("game_y")) > epsilon):
                                    reset_position_changed = True
                                    break  # Found movement, no need to check other keys
                            
                            if not reset_position_changed:
                                message = f"Player appears to be stuck at time {current_time}ms"
                                if add_issue(message):
                                    return
                        
                        print("Resetting game...")
                        # Reset sequence: press R to reset
                        page.keyboard.down("r")
                        page.wait_for_timeout(100)
                        page.keyboard.up("r")
                        page.wait_for_timeout(100)
                        
                        # Press Enter to start again
                        page.keyboard.down("Enter")
                        page.wait_for_timeout(100)
                        page.keyboard.up("Enter")
                        
                        last_reset_time = current_time
                        page.wait_for_timeout(100)  # Additional wait for game to restart
                        
                        # Check if player dies shortly after reset (within 2s)
                        page.wait_for_timeout(2000)
                        post_reset_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                        
                        # Check for any fail status since the reset
                        if post_reset_status["game_status"] == "fail":
                            message = f"Player dies shortly after game reset without any input at time {current_time}ms"
                            if add_issue(message):
                                return
                        
                        # Update game status for next check
                        game_status = post_reset_status
                        
                        current_time += 2200  # Account for the reset time + wait time
                        continue
                    
                    # Decide whether to keep current action or choose a new one
                    if current_action is None or random.random() > sticky_prob:
                        # Release previous key if one is pressed
                        if current_action:
                            print("Releasing key:", current_action)
                            page.keyboard.up(current_action)
                        
                        # Choose a new random action from arrow keys only
                        current_action = random.choice(sticky_actions_copy)
                        print("Pressing key:", current_action)
                        page.keyboard.down(current_action)
                    
                    # Wait for a frame
                    page.wait_for_timeout(action_duration)
                    current_time += action_duration
                
                # Release any key that might still be pressed
                if current_action:
                    page.keyboard.up(current_action)
                
                # Wait for game to process final inputs
                page.wait_for_timeout(100)

                # Retrieve any JavaScript errors collected by the injected script
                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        if add_error(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}"):
                            return

            except Exception as e:
                add_error(f"Playwright execution error: {str(e)}")
                return
            
            finally:
                if context:
                    try:
                        context.close()
                    except Exception as e:
                        errors.append(f"Error closing Playwright context: {str(e)}")
                if browser:
                    try:
                        browser.close()
                    except Exception as e:
                        errors.append(f"Error closing Playwright browser: {str(e)}")
                if playwright_instance:
                    try:
                        playwright_instance.stop()
                    except Exception as e:
                        errors.append(f"Error stopping Playwright: {str(e)}")
                
                # TemporaryDirectory is cleaned up automatically upon exiting the 'with' block

        # Send back results
        result_queue.put((errors, issues))

    # Run test in a separate process because it's rare but some games can completely freeze the browser

    # Create a queue for results
    result_queue = Queue()
    
    # Start the test process
    test_process = multiprocessing.Process(
        target=run_test, 
        args=(game_code, result_queue, headless, initial_wait, sticky_prob, 
              action_duration, total_test_time, viewport_width, viewport_height, 
              sticky_actions)
    )
    test_process.start()
    
    # Wait for process to complete with timeout
    start_time = time.time()
    while test_process.is_alive():
        if time.time() - start_time > max_execution_time / 1000:
            print(f"Execution exceeded maximum time limit of {max_execution_time/1000} s.")
            # Force terminate the process
            test_process.terminate()
            # Give it a moment to terminate
            time.sleep(1)
            # If it's still alive, kill it more forcefully
            if test_process.is_alive():
                print("Process did not terminate gracefully, killing it.")
                try:
                    test_process.kill()
                except:
                    pass
            test_process.join(2)  # Wait up to 2 seconds for it to finish
            return (["Browser execution timed out after " + str(max_execution_time/1000) + " s"], [])
        time.sleep(0.5)  # Check every half second
    
    # Process finished - get results if available
    if not result_queue.empty():
        errors, issues = result_queue.get()
    else:
        errors = ["Test completed but no results were returned"]
        issues = []
    
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
    
    if issues:
        print("Issues detected during run_game:")
        for issue in issues:
            print(f"- {issue}")
            
    return (errors, issues)



def run_game_with_agent(game_code: dict[str, str], headless: bool = True, run_agent: bool = True, num_steps: int = 10000, video_path: Path = None) -> tuple[list, dict]:
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
    import re
    import base64

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
        
        # Inject p5.capture and video recording scripts
        p5capture_injection = '''
<script src="https://cdn.jsdelivr.net/npm/p5.capture@1.5.0/dist/p5.capture.umd.min.js"></script>
<script>
    window.P5Capture.setDefaultOptions({ disableUi: true });
</script>
'''
        
        # Use regex to find any p5.js script tag and inject p5.capture after it
        p5_script_pattern = r'<script[^>]*src=[^>]*p5[^>]*\.js[^>]*></script>'
        html_content = re.sub(p5_script_pattern, lambda m: m.group(0) + p5capture_injection, html_content, count=1)
        
        video_recording_js = """
<script>
// Video recording monkey-patch
(function() {
    function patch() {
        const inst = window.gameInstance;
        if (inst && inst.draw && !inst._capturePatched) {
            const origDraw = inst.draw;
            let started = false;
            let capture;

            // Video parameters
            let fps = 60;
            let quality = 0.4;
            let width = 300;
            let height = 200;

            inst.draw = function() {
                if (!started) {
                    console.log('starting video recording at frame', inst.frameCount);
                    capture = window.P5Capture.getInstance();
                    capture.start({
                        format: 'mp4',
                        verbose: true,
                        framerate: fps,
                        quality: quality,
                        width: width,
                        height: height,
                        beforeDownload(blob, ctx, next) {
                            // Store the video blob for later retrieval
                            window._recordedVideoBlob = blob;
                            window._videoRecordingComplete = true;
                            console.log('Video recording complete, blob stored');
                        }
                    });
                    window._videoRecordingStarted = true;
                    started = true;
                }
                return origDraw.apply(this, arguments);
            };
            inst._capturePatched = true;
            
            // Stop recording when requested
            window.stopVideoRecording = function() {
                if (capture && capture.state === 'capturing') {
                    capture.stop();
                }
            };
        } else {
            setTimeout(patch, 100);
        }
    }
    patch();
})();
</script>"""
        
        if "</body>" in html_content:
            html_content = html_content.replace("</body>", noloop_js + video_recording_js + "</body>")
        else:
            html_content += noloop_js + video_recording_js
        
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

                # Stop video recording and save if recording was started
                try:
                    video_started = page.evaluate("window._videoRecordingStarted || false")
                    if video_started:
                        print("Stopping video recording...")
                        page.evaluate("window.stopVideoRecording();")
                        page.evaluate("window.gameInstance.redraw();")
                        
                        # Wait for video processing to complete
                        page.wait_for_function("window._videoRecordingComplete === true", timeout=60000)
                        
                        # Save the video blob to save_dir
                        video_blob_js = """
                        new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(window._recordedVideoBlob);
                        });
                        """
                        video_base64 = page.evaluate(video_blob_js)
                        
                        video_data = base64.b64decode(video_base64)
                        video_path.write_bytes(video_data)
                        print(f"Video saved to {video_path}")
                        
                except Exception as e:
                    print(f"Video recording error: {e}")

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
    generate(model, prompt, save_dir, thinking=True, thinking_tokens=thinking_tokens)

    return code_from_dir(save_dir)


def generate_games(model, themes, prompt_gen_game, save_dir, num_samples=1, num_agent_samples=3, num_agent_tries=3):
    agent_results = []
    results = []
    for idx, theme in enumerate(themes):
        # if idx != 18:
        #     continue

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

            if run_check["errors"]:
                prompt = prompt_gen_code_reviewer.format(
                    code=game_code_str,
                    errors=run_check["errors"]
                )
                answer = generate(model, prompt, _save_dir.parent / "code_reviewer_instructions", thinking=thinking, thinking_tokens=thinking_tokens)

                prompt = prompt_review_code.format(
                    instructions=answer,
                    code=game_code_str
                )
                generate(model, prompt, _save_dir.parent / "code_review", thinking=thinking, thinking_tokens=thinking_tokens)
                breakpoint()





        prompt = prompt_game_comparison
        for sample_idx in range(num_samples):
            _save_dir = save_dir / "games" / f"theme_{idx}" / f"sample_{sample_idx}" / "code"
            prompt += f"\n\n<game_code_{sample_idx}>\n"
            game_code, game_code_str = code_from_dir(_save_dir, return_str=True)
            prompt += game_code_str
            prompt += f"</game_code_{sample_idx}>"

        _save_dir = save_dir / "games" / f"theme_{idx}" / "comparison"
        generate(model, prompt, _save_dir, thinking=thinking, thinking_tokens=thinking_tokens)

        continue

            # game_code, game_code_str = code_from_dir(_save_dir, return_str=True)
            # run_check = eval_game(game_code, _save_dir, headless=True)

            # issue_counts = {
            #     "stuck": 0,
            #     "die_immediately": 0,
            # }
            # for issue in run_check["issues"]:
            #     category = categorize_issue(issue)
            #     assert "at time " in issue, f"Unknown issue: {issue}"
            #     timestamp = int(issue.split("at time ")[-1].split("ms")[0])
            #     print(f"Category: {category}, Timestamp: {timestamp}")

            #     issue_counts[category] += 1

            # results.append({
            #     "theme_idx": idx,
            #     "sample_idx": sample_idx,
            #     "prompt": prompt,
            #     "no_errors": len(run_check["errors"]) == 0,
            #     "no_issues": len(run_check["issues"]) == 0,
            #     **issue_counts,
            # })

            # if run_check["status"] != "passed":
            #     # generate new game sample
            #     continue

            # win_at_least_once = False
            # # use the last game_code sample
            # for sampled_idx in range(num_agent_samples):
            #     agent_dir = _save_dir.parent / "code_with_agent" / f"sample_{sampled_idx}"

            #     # try generating an agent without errors
            #     for try_idx in range(num_agent_tries):
            #         try_dir = agent_dir / f"try_{try_idx}"
            #         code_with_agent = generate_agent(game_code, try_dir)
                
            #         # if not (try_dir / "logs.json").exists():
            #         if not (try_dir / "video.mp4").exists():
            #             errors, logs = run_game_with_agent(code_with_agent, headless=False, num_steps=3600, video_path=try_dir / "video.mp4")

            #             with open(try_dir / "logs.json", "w") as f:
            #                 json.dump(logs, f, indent=4)
            #             with open(try_dir / "errors.json", "w") as f:
            #                 json.dump(errors, f, indent=4)
            #         else:
            #             with open(try_dir / "logs.json", "r") as f:
            #                 logs = json.load(f)
            #             with open(try_dir / "errors.json", "r") as f:
            #                 errors = json.load(f)

            #         if len(errors) == 0:
            #             break
            
            #     # TODO: check how many tries and how many were successful
            #     # check if won the game at least once
            #     num_wins = 0
            #     num_fails = 0
            #     for log in logs["game_status"]:
            #         if log["game_status"] == "win":
            #             num_wins += 1
            #         elif log["game_status"] == "fail":
            #             num_fails += 1
            #     print(f"Num wins: {num_wins}, Num fails: {num_fails}")

            #     agent_results.append({
            #         "theme_idx": idx,
            #         "sample_idx": sample_idx,
            #         "agent_sample_idx": sample_idx,
            #         "prompt": prompt,
            #         "num_wins": num_wins,
            #         "num_fails": num_fails,
            #     })

            #     if num_wins > 0:
            #         win_at_least_once = True
            #         break
                
            #     if not (try_dir / "video_analysis.txt").exists():
            #         assert try_dir / "video.mp4"
            #         video_path = try_dir / "video.mp4"
            #         print("Analyzing video with Gemini...")
            #         print(video_path)
            #         video_analysis = analyze_video(str(video_path))
            #         if video_analysis is None:
            #             breakpoint()
            #         print("\nGemini Analysis:")
            #         print(video_analysis)
            #         # Save analysis to file
            #         with open(try_dir / "video_analysis.txt", "w") as f:
            #             f.write(video_analysis)
            #     else:
            #         with open(try_dir / "video_analysis.txt", "r") as f:
            #             video_analysis = f.read()
                

            #     # ask to fix agent based on the video analysis
            #     fix_dir = try_dir.parent / (try_dir.name + "_fix_0")
            #     prompt = prompt_fix_policy.format(
            #         gameplay_analysis=video_analysis,
            #         game_code=code_to_str(code_with_agent)
            #     )
            #     fix_dir.mkdir(parents=True, exist_ok=True)
            #     for file_path, code in code_with_agent.items():
            #         (fix_dir / file_path).write_text(code)

            #     generate(model, prompt, fix_dir, thinking=thinking, thinking_tokens=thinking_tokens)
            #     fix_code = code_from_dir(fix_dir)

            #     if not (fix_dir / "video.mp4").exists():
            #         errors, logs = run_game_with_agent(fix_code, headless=False, num_steps=3600, video_path=fix_dir / "video.mp4")
            #         with open(fix_dir / "logs.json", "w") as f:
            #             json.dump(logs, f, indent=4)
            #         with open(fix_dir / "errors.json", "w") as f:
            #             json.dump(errors, f, indent=4)
            #     else:
            #         with open(fix_dir / "logs.json", "r") as f:
            #             logs = json.load(f)
            #         with open(fix_dir / "errors.json", "r") as f:
            #             errors = json.load(f)


            # if win_at_least_once:
            #     break


    return results, agent_results


def analyze_video(video_path: str, num_tries=10) -> str:
    for _ in range(num_tries):
        try:
            # # Create prompt for Gemini
            prompt = """Describe this video. Why is the player not winning? Answer ONLY based on what you observe in the video."""
            print("Uploading video to Gemini...")
            file = client.files.upload(file=video_path)

            # wait for file to be uploaded
            while file.state != "ACTIVE":
                print(f"File {file.name} is {file.state}")
                time.sleep(1)
                file = client.files.get(name=file.name)

            response = client.models.generate_content(
                model="gemini-2.5-pro-preview-05-06",
                contents=[file, prompt]
            )

            return response.text
            
        except Exception as e:
            print(f"Error analyzing video with Gemini: {e}")

        time.sleep(0.5)
    return None


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

    num_samples = 3  # 15 is too much
    num_agent_samples = 3
    num_themes = 3
    themes = themes[:num_themes]


    results, agent_results = generate_games(model, themes, prompt_game_code, save_dir, num_samples=num_samples, num_agent_samples=num_agent_samples)

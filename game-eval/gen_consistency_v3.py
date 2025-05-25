from itertools import tee
from pathlib import Path
from datetime import datetime
import re
import json

from utils import generate, code_from_dir


thinking = True

# model = "claude-3-7-sonnet-20250219"
model = "claude-sonnet-4-20250514"


save_dir = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 15

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run4/{model}"

save_dir = save_dir / run_name


# Implement a fun game winnable by anyone (even unexperienced players) playing it for less than 1 minute.
# Make this game even more fun and make sure it's winnable by anyone (even unexperienced players) playing it for less than 1 minute.
# List all the features implemented in this game.


prompt_game_code = """Implement a fun game for anyone playing it less than 1 minute.

<game_description>
{description}
</game_description>

<features>
{features}
</features>

<technical_guidelines>
{technical_guidelines}
</technical_guidelines>

{prompt_format}

Think thoroughly about how to design the game based on the provided instructions. Don't include any code during the thinking phase.
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
    });
    // Expose the game instance globally
    window.gameInstance = gameInstance;
    ```
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
    def run_test(game_code_copy, headless, initial_wait, sticky_prob, 
                action_duration, total_test_time, viewport_width, viewport_height, 
                sticky_actions_copy):
        errors = []
        issues = []
        current_time = 0  # Initialize current_time at the beginning of the function
        
        if "index.html" not in game_code_copy:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            return (errors, issues, [])
        
        # Helper function to add issue and stop testing if needed
        def add_issue(message):
            print(message)
            issues.append(message)
            # Signal to stop testing by returning issues and errors
            return (errors, issues, [])

        # Helper function to add error and stop testing
        def add_error(message):
            print(message)
            errors.append(message)
            # Signal to stop testing by returning issues and errors
            return (errors, issues, [])

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
                    if add_error(f"Canvas not found within timeout: {str(e)}"):
                        return (errors, issues, [])
                
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
                
                # # Wait to see if player dies without any input
                # page.wait_for_timeout(2000)

                # # Check game status and player position
                # game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                
                # # Check if player died during idle period
                # if game_status["game_status"] == "fail":
                #     message = f"Player dies without any player input at time {current_time}ms"
                #     if add_issue(message):
                #         return
                    
                # # Restart the game and check again
                # page.keyboard.down("r")
                # page.wait_for_timeout(100)
                # page.keyboard.up("r")
                # page.wait_for_timeout(100)
                # page.keyboard.down("Enter")
                # page.wait_for_timeout(100)
                # page.keyboard.up("Enter")
                # # Wait to see if player dies without any input
                # page.wait_for_timeout(2000)

                # # Check game status and player position
                # game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                
                # # Check if player died during idle period
                # if game_status["game_status"] == "fail":
                #     message = f"Player dies without any player input at time {current_time}ms"
                #     if add_issue(message):
                #         return


                # # Check 2: Test if arrow keys change player position
                
                # # Get initial player position
                # initial_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                
                # # Test each arrow key
                # arrow_keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]
                # position_changed = False
                
                # print(initial_pos)
                # for key in arrow_keys:
                #     # Press the key for a moment
                #     page.keyboard.down(key)
                #     page.wait_for_timeout(500)
                #     page.keyboard.up(key)
                #     page.wait_for_timeout(100)
                    
                #     # Get new positions after key press
                #     latest_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                #     print("latest_pos", latest_pos)
                    
                #     # TODO: sometimes screen position should be fixed (e.g. camera following the player) but not world position
                #     # Check if position actually changed
                #     # epsilon = 5  # TODO: what should epsilon be for game position (don't know what the units are)
                #     epsilon = 1
                #     if (abs(latest_pos.get("game_x") - initial_pos.get("game_x")) > epsilon or
                #         abs(latest_pos.get("game_y") - initial_pos.get("game_y")) > epsilon):
                #         position_changed = True
                
                # print(position_changed)
                # if not position_changed:
                #     message = f"Player doesn't move with any of the arrow keys at time {current_time}ms"
                #     if add_issue(message):
                #         return
                
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
                        
                        # game_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                        # print("Game status:", game_status)
                        # If not in fail state, test if player is stuck before reset
                        # if game_status["game_status"] != "fail":
                        #     print("Checking if player is stuck before reset...")

                        #     # Quick check to see if player can still move before reset
                        #     reset_initial_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                        #     reset_position_changed = False
                            
                        #     # Test movement in each direction before reset
                        #     for key in arrow_keys:
                        #         page.keyboard.down(key)
                        #         page.wait_for_timeout(300)
                        #         page.keyboard.up(key)
                        #         page.wait_for_timeout(50)
                                
                        #         reset_latest_pos = page.evaluate("window.gameInstance.logs.player_positions")[-1]
                        #         print("reset_latest_pos", reset_latest_pos)
                        #         # Check if position changed with epsilon threshold
                        #         # epsilon = 5
                        #         epsilon = 1
                        #         if (abs(reset_latest_pos.get("game_x") - reset_initial_pos.get("game_x")) > epsilon or
                        #             abs(reset_latest_pos.get("game_y") - reset_initial_pos.get("game_y")) > epsilon):
                        #             reset_position_changed = True
                        #             break  # Found movement, no need to check other keys
                            
                        #     if not reset_position_changed:
                        #         message = f"Player appears to be stuck at time {current_time}ms"
                        #         if add_issue(message):
                        #             return
                        
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
                        
                        # # Check if player dies shortly after reset (within 2s)
                        # page.wait_for_timeout(2000)
                        # post_reset_status = page.evaluate("window.gameInstance.logs.game_status")[-1]
                        
                        # # Check for any fail status since the reset
                        # if post_reset_status["game_status"] == "fail":
                        #     message = f"Player dies shortly after game reset without any input at time {current_time}ms"
                        #     if add_issue(message):
                        #         return
                        
                        # Update game status for next check
                        # game_status = post_reset_status
                        
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

                # Retrieve logs
                print("Retrieving logs...")
                logs = page.evaluate("window.gameInstance.logs")
                print("Logs retrieved")

                # Retrieve any JavaScript errors collected by the injected script
                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        if add_error(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}"):
                            return (errors, issues, [])

            except Exception as e:
                add_error(f"Playwright execution error: {str(e)}")
                return (errors, issues, [])
            
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
        return (errors, issues, logs)

    return run_test(game_code, headless, initial_wait, sticky_prob, 
              action_duration, total_test_time, viewport_width, viewport_height, 
              sticky_actions)

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
            return (["Browser execution timed out after " + str(max_execution_time/1000) + " s"], [], [])
        time.sleep(0.5)  # Check every half second
    
    # Process finished - get results if available
    if not result_queue.empty():
        errors, issues, logs = result_queue.get()
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
    
    return (errors, issues, logs)


# prompt_features = """
# We formalize our objective as finding a game generator $g_\theta$ that maximizes:
# $$J(\theta) = \mathbb{E}[r(y, x)] = \int r_{human}(y, x)g_\theta(y | x) p(x) dy dx$$
# where $y$ is a game sampled from $g_\theta$ conditioned on a game description $x$, and $r(y, x)$ is a reward function that captures how good the game is on average when judged by humans.

# Issue: $r_{human}$ is costly to evaluate.

# We define a reward function to approximate $r_{human}$ based on the idea of code-simulation consistency.
# $$F_1(y) = F_2(\text{simulate}(y))$$

# where
# $$\text{simulate}(y) = \mathbb{E}[\text{simulate}(y, \pi)] = \int h(\pi| y) d\pi$$

# The projections $F_1$ and $F_2$ define a mapping to a common feature space where discrepancy can be measured.
# \begin{align}
# F_1&: y \mapsto (f^{(1)}_1, \ldots, f^{(1)}_K) \notag \\
# F_2&: \text{simulate}(y) \mapsto (f^{(2)}_{1}, \ldots, f^{(2)}_{K}) \label{eq:F_2}
# \end{align}

# We define our proxy reward function by measuring the discrepancy $d$ between to two feature vectors:
# $$r(y) = 1 - d\left(F_1(y), F_2(\text{simulate}(y))\right)$$

# Propose features f_1, ..., f_k such that r approximates r_human when humans are asked to evaluate the level of fun and playability of the games after playing for at least 30s.
# """


# TODO: even simpler: "What makes a 1-minute game fun?"
prompt_list = "What makes a game fun for anyone playing it less than a minute?"
# prompt_list = """What are the features that make a game fun for anyone playing it for less than 1 minute?"""
# TODO: add: the game is going to be played for less than a minute. Should be fun for anyone, even unexperienced players.

prompt_manifest = """How do tee following features manifest themselves in this game?

<features>
{features}
</features>

<game_code>
{game_code}
</game_code>
"""

prompt_features = r"""
We formalize our objective as finding a game generator $g_\theta$ that maximizes:
$$J(\theta) = \mathbb{E}[r_{human}(y)] = \int r_{human}(y)g_\theta(y | x) p(x) dy dx$$
where $y$ is a game sampled from $g_\theta$ conditioned on a game description $x$, and $r(y, x)$ is a reward function that captures how good the game is on average when judged by humans.

Since $r_{human}$ is expensive to evaluate, we aim to substitute it with a computable proxy reward function.

We define a reward function to approximate $r_{human}$ based on the idea of code-simulation consistency.
$$F_1(y) = F_2(\text{simulate}(y))$$

where
$$\text{simulate}(y) = \text{aggregate}_{\pi \sim h_\phi} [\text{simulate}(y, \pi)]$$
$\text{simulate}(y, \pi)$ outputs gameplay traces when playing the game $y$ with policy $\pi$.

The projections $F_1$ and $F_2$ define a mapping to a common feature space where discrepancy can be measured.
\begin{align}
F_1&: y \mapsto (f^{(1)}_1, \ldots, f^{(1)}_K) \notag \\
F_2&: \text{simulate}(y) \mapsto (f^{(2)}_{1}, \ldots, f^{(2)}_{K}) \label{eq:F_2}
\end{align}

We define our proxy reward function by measuring the discrepancy $d$ between to two feature vectors:
$$r(y) = 1 - d\left(F_1(y), F_2(\text{simulate}(y))\right)$$

We aim to find a feature space $\mathcal{F}$ such that:
$$\text{min}_{\mathcal{F}} \ \mathbb{E}[(r_{human}(y) - r(y))^2]$$

Note that $r$ needs to be computable without a human in the loop. It relies on automated policies $\pi$ to generate the gameplay traces (e.g. random actions).
Propose binary features $f_1, ..., f_k$ such that $r$ approximates $r_{human}$, which corresponds to the average fun and playability score humans would give to the games when playing for 30s - 60s.


"""

prompt_game_features = """List all the features implemented in this game. Indicate where in the code each feature is implemented.

<game_code>
{game_code}
</game_code>

Use the following format to write your game features:
<game_features>
<game_feature>
...
</game_feature>
...
</game_features>
"""


prompt_logs = """Write a python function that takes the provided game code as input and insert log statements to record when each game feature is triggered.
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

<game_features>
{game_features}
</game_features>

Format your answer as follows:
<add_logs_code>
def add_logs(game_code: dict[str, str]) -> list[dict]:
    '''
    Args:
        game_code: Dictionary mapping file paths to their content
        
    Returns:
        Updated game code with the log statements inserted
    '''
    ...
</add_logs_code>

<game_code>
{game_code}
</game_code>
"""

prompt_improve = """Improve this computer game based on the following criteria:
<criteria>
{criteria}
</criteria>

<technical_guidelines>
{technical_guidelines}
</technical_guidelines>

<game_code>
{game_code}
</game_code>

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

<technical_guidelines>
{technical_guidelines}
</technical_guidelines>

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


if __name__ == "__main__":
    # TODO is logs too big when run for 1000 steps?
    total_test_steps = 300

    prompt = prompt_features
    features = generate(model, prompt_list, save_dir / "features", thinking=False)

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

    num_samples = 1
    num_themes = 15
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        for sample_idx in range(num_samples):
            _save_dir = save_dir / "games" / f"theme_{idx}" / f"sample_{sample_idx}" / "code_original"
            prompt = prompt_game_code.format(
                description=theme,
                features=features,
                technical_guidelines=p5js_guidelines,
                prompt_format=prompt_format
            )
            generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
            game_code, game_code_str = code_from_dir(_save_dir, return_str=True)

            # game features
            prompt = prompt_game_features.format(
                game_code=game_code_str
            )
            answer = generate(model, prompt, _save_dir / "game_features", thinking=True, thinking_tokens=2000)
            game_features = answer.split("<game_features>")[1].split("</game_features>")[0]
            (_save_dir / "game_features" / "game_features.txt").write_text(game_features)


            # add logs
            prompt = prompt_logs.format(
                game_code=game_code_str,
                game_features=game_features
            )
            answer = generate(model, prompt, _save_dir / "add_logs", thinking=True, thinking_tokens=2000)

            add_logs_code = answer.split("<add_logs_code>")[1].split("</add_logs_code>")[0]
            (_save_dir / "add_logs" / "add_logs.py").write_text(add_logs_code)

            local_vars = {}
            exec(add_logs_code, globals(), local_vars)
            code_with_logs = local_vars['add_logs'](game_code)

            _updated_save_dir = _save_dir.parent / "code_original_with_logs"
            _updated_save_dir.mkdir(parents=True, exist_ok=True)
            for file_path, file_content in code_with_logs.items():
                (_updated_save_dir / file_path).write_text(file_content)

            if not (_updated_save_dir / "logs" / "logs.json").exists():
                errors, issues, logs = run_game(code_with_logs, headless=False)

                (_updated_save_dir / "logs").mkdir(parents=True, exist_ok=True)
                (_updated_save_dir / "logs" / "logs.json").write_text(json.dumps(logs, indent=4))

                with open(_updated_save_dir / "run_check.json", "w", encoding="utf-8") as f:
                    json.dump({"errors": errors, "issues": issues}, f, indent=4)
            else:
                with open(_updated_save_dir / "logs" / "logs.json", "r", encoding="utf-8") as f:
                    logs = json.load(f)

                with open(_updated_save_dir / "run_check.json", "r", encoding="utf-8") as f:
                    run_check = json.load(f)

            errors = run_check["errors"]
            if len(errors) > 0:
                break
            
            print(run_check)
            logs_counts = {k: len(v) for k, v in logs.items()}



            # prompt = prompt_improve.format(
            #     criteria=features,
            #     technical_guidelines=p5js_guidelines,
            #     game_code=game_code_str
            # )
            # generate(model, prompt, _save_dir.parent / "improve_code_iter1", thinking=True, thinking_tokens=2000)

            prompt = prompt_improve_with_feedback.format(
                design_guidelines=features,
                technical_guidelines=p5js_guidelines,
                feedback=logs_counts,
                game_description=theme,
                game_code=game_code_str
            )
            generate(model, prompt, _save_dir.parent / "improve_code_iter1", thinking=True, thinking_tokens=2000)


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
    #         technical_guidelines=p5js_guidelines,
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
    #         technical_guidelines=p5js_guidelines,
    #         game_code=game_code_str,
    #         feedback=feedback
    #     )
    #     generate(model, prompt, _save_dir, thinking=True, thinking_tokens=2000)
        
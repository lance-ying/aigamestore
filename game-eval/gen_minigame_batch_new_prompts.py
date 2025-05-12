from pathlib import Path
from datetime import datetime
import re
import json

from utils import generate, code_from_dir



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
Task: Implement a fun and addictive 2D minigame in p5.js based on the following description:
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
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. These functions are accessible through the `p` object. Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
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


if __name__ == "__main__":
    # TODO: make sure reuse exactly same prompt as no_thinking in gen_game_topdown
    # theme_path = Path(__file__).parent / "results" / "gen_game_topdown" / perspective / "run1_claude-3-7-sonnet-20250219" / "themes" / "answer.txt"
    # with open(theme_path, "r", encoding="utf-8") as f:
    #     answer_themes = f.read()
    # themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)

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

    num_themes = 20
    themes = themes[:num_themes]

    for idx, theme in enumerate(themes):
        _save_dir = save_dir / f"theme_{idx}" / "sample_0"
        _prompt = prompt_game_code.format(
            description=theme,
            p5js_guidelines=p5js_guidelines,
            prompt_format=prompt_format
        )
        prompts.append(_prompt)
        save_dirs.append(_save_dir)

    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"

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
                errors, issues = run_game(code_from_dir(save_dir), headless=True, total_test_time=60000)

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


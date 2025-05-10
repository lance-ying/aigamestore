from pathlib import Path
import warnings


def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 10000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 60000,
             collect_coverage: bool = False) -> list | tuple[list, dict]:
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
        collect_coverage: Whether to collect code coverage data (default: False)

    Returns:
        list: A list of error messages. Empty if no errors.
        tuple: If collect_coverage=True, returns (errors, coverage_data)
    """
    import tempfile
    import time
    import signal
    import multiprocessing
    from multiprocessing import Queue
    from playwright.sync_api import sync_playwright

    assert isinstance(game_code, dict), "game_code must be a dictionary"

    # Define default sticky actions if none provided
    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "Enter", "r")

    # Function to run in a separate process
    def run_test(game_code_copy, result_queue, headless, initial_wait, sticky_prob, 
                 action_duration, total_test_time, viewport_width, viewport_height, 
                 sticky_actions_copy, collect_coverage):
        errors = []
        coverage_data = {}
        
        if "index.html" not in game_code_copy:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            result_queue.put((errors, coverage_data) if collect_coverage else errors)
            return

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
                # For coverage collection, we need to use Chromium
                # browser_type = playwright_instance.chromium if collect_coverage else playwright_instance.firefox
                browser_type = playwright_instance.chromium
                # browser = browser_type.launch(headless=headless)
                # TODO: doesn't work on arm?
                browser = browser_type.launch(
                    headless=headless,
                    args=[
                        # Core WebGL rendering improvements - but less aggressive
                        '--use-gl=egl',              # Use EGL instead of ANGLE (may help with transparency)
                        '--ignore-gpu-blocklist',    # Ignore GPU blocklist
                        
                        # Remove problematic flags that might cause transparency
                        # '--disable-gpu-vsync',
                        # '--disable-accelerated-2d-canvas',
                        # '--disable-gpu-memory-buffer-compositor-resources',
                        
                        # Keep GPU process separate to avoid transparency issues
                        # '--in-process-gpu',
                        
                        # Security sandbox modifications (careful in production)
                        '--no-sandbox',              # Disable sandbox (only for testing)
                        
                        # Remove other potentially problematic flags
                        # '--disable-web-security',
                        # '--disable-features=UseOzonePlatform',
                        
                        # Keep essential WebGL flags
                        '--enable-webgl',            # Explicitly enable WebGL
                        
                        # Remove experimental features that might cause issues
                        # '--enable-unsafe-webgpu',
                        
                        # Memory limits - keep these at moderate values
                        '--gpu-program-cache-size-kb=512',
                        '--force-gpu-mem-available-mb=512',
                        
                        # Basic logging
                        '--enable-logging'
                    ]
                )
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
                    errors.append(f"Canvas not found within timeout: {str(e)}")
                    # Depending on strictness, one might choose to return early here

                # Start code coverage collection if requested
                if collect_coverage:
                    # This uses Chrome DevTools Protocol to start coverage collection
                    client = page.context.new_cdp_session(page)
                    client.send("Profiler.enable")
                    # Start precise coverage with detailed source info
                    client.send("Profiler.startPreciseCoverage", {
                        "callCount": True,
                        "detailed": True
                    })

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
                
                # Perform some basic interactions
                page.wait_for_timeout(initial_wait)  # Initial wait for game to settle
        
                # it seems that sometimes press doesn't start the game (might be because key is not down for long enough)
                page.keyboard.down("Enter")
                page.wait_for_timeout(100)
                page.keyboard.up("Enter")

                import random
                
                # Perform random actions with stickiness
                current_time = 0
                current_action = None
                
                while current_time < total_test_time:
                    print("Time left:", total_test_time - current_time)
                    # Decide whether to keep current action or choose a new one
                    if current_action is None or random.random() > sticky_prob:
                        # Release previous key if one is pressed
                        if current_action:
                            print("Releasing key:", current_action)
                            page.keyboard.up(current_action)
                        
                        # Choose a new random action
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

                # Collect code coverage data if requested
                if collect_coverage:
                    coverage_result = client.send("Profiler.takePreciseCoverage")
                    client.send("Profiler.stopPreciseCoverage")
                    client.send("Profiler.disable")
                    
                    # Process the coverage data into a more usable format
                    for script in coverage_result["result"]:
                        url = script.get("url", "")
                        if url and not url.startswith("http") and not url.startswith("file://"):
                            # This is likely one of our game scripts
                            script_name = url.split("/")[-1]
                            functions_coverage = []
                            
                            for func in script.get("functions", []):
                                # Extract function info and the lines that were executed
                                function_name = func.get("functionName", "<anonymous>")
                                executed_ranges = []
                                
                                for range_info in func.get("ranges", []):
                                    if range_info.get("count", 0) > 0:  # This line was executed
                                        start_line = range_info.get("startLineNumber", 0)
                                        start_col = range_info.get("startColumnNumber", 0)
                                        end_line = range_info.get("endLineNumber", 0)
                                        end_col = range_info.get("endColumnNumber", 0)
                                        
                                        executed_ranges.append({
                                            "startLine": start_line,
                                            "startColumn": start_col,
                                            "endLine": end_line,
                                            "endColumn": end_col,
                                            "executionCount": range_info.get("count", 0)
                                        })
                                
                                if executed_ranges:  # Only include functions that were executed
                                    functions_coverage.append({
                                        "name": function_name,
                                        "ranges": executed_ranges
                                    })
                            
                            coverage_data[script_name] = functions_coverage

                # Retrieve any JavaScript errors collected by the injected script
                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        errors.append(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}")

            except Exception as e:
                errors.append(f"Playwright execution error: {str(e)}")
            
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
        result_queue.put((errors, coverage_data) if collect_coverage else errors)

    # Run test in a separate process because it's rare but some games can completely freeze the browser

    # Raise warning if total_test_time is greater than max_execution_time
    if total_test_time > max_execution_time:
        warnings.warn(f"Total test time ({total_test_time/1000} s) is greater than max execution time ({max_execution_time/1000} s).")

    # Create a queue for results
    result_queue = Queue()
    
    # Start the test process
    test_process = multiprocessing.Process(
        target=run_test, 
        args=(game_code, result_queue, headless, initial_wait, sticky_prob, 
              action_duration, total_test_time, viewport_width, viewport_height, 
              sticky_actions, collect_coverage)
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
            return ["Browser execution timed out after " + str(max_execution_time/1000) + " s"]
        time.sleep(0.5)  # Check every half second
    
    # Process finished - get results if available
    if not result_queue.empty():
        result = result_queue.get()
    else:
        result = ["Test completed but no results were returned"]
    
    # Handle the results based on whether coverage was collected
    if collect_coverage:
        errors, coverage_data = result
    else:
        errors = result
        coverage_data = {}
    
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
    
    if collect_coverage:
        return errors, coverage_data
    else:
        return errors


if __name__ == "__main__":
    from utils import code_from_dir

    perspective = "top-down"
    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / perspective / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games" / "theme_0" / "sample_0" / "code_original"

    code_dict = code_from_dir(games_dir)
    errors, coverage_data = run_game(code_dict, collect_coverage=True, headless=False)
    print(errors)
    print(coverage_data)


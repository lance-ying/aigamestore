from pathlib import Path
import warnings
import json
import re
import os
from termcolor import colored  # Add this for colored output


def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 10000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 60000) -> tuple[list, dict]:
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
        tuple: (errors, coverage_data)
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
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space")

    # Function to run in a separate process
    def run_test():
        errors = []
        coverage_data = {}
        
        if "index.html" not in game_code:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            return (errors, coverage_data)

        # Use TemporaryDirectory for automatic cleanup of game files
        with tempfile.TemporaryDirectory() as temp_dir_str:
            temp_dir_path = Path(temp_dir_str)
            
            # Write game files to the temporary directory
            for file_path_str, file_content in game_code.items():
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
                # browser = browser_type.launch(
                #     headless=headless,
                #     args=[
                #         # Core WebGL rendering improvements - but less aggressive
                #         '--use-gl=egl',              # Use EGL instead of ANGLE (may help with transparency)
                #         '--ignore-gpu-blocklist',    # Ignore GPU blocklist
                        
                #         # Remove problematic flags that might cause transparency
                #         # '--disable-gpu-vsync',
                #         # '--disable-accelerated-2d-canvas',
                #         # '--disable-gpu-memory-buffer-compositor-resources',
                        
                #         # Keep GPU process separate to avoid transparency issues
                #         # '--in-process-gpu',
                        
                #         # Security sandbox modifications (careful in production)
                #         '--no-sandbox',              # Disable sandbox (only for testing)
                        
                #         # Remove other potentially problematic flags
                #         # '--disable-web-security',
                #         # '--disable-features=UseOzonePlatform',
                        
                #         # Keep essential WebGL flags
                #         '--enable-webgl',            # Explicitly enable WebGL
                        
                #         # Remove experimental features that might cause issues
                #         # '--enable-unsafe-webgpu',
                        
                #         # Memory limits - keep these at moderate values
                #         '--gpu-program-cache-size-kb=512',
                #         '--force-gpu-mem-available-mb=512',
                        
                #         # Basic logging
                #         '--enable-logging'
                #     ]
                # )

                # browser = playwright_instance.chromium.launch(
                #     headless=headless,
                #     args=[
                #         '--disable-web-security',
                #         '--disable-site-isolation-trials'
                #     ]
                # )
                browser = playwright_instance.chromium.launch(
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

                # Start coverage collection
                print("Starting coverage collection")
                # Use Chrome DevTools Protocol
                client = page.context.new_cdp_session(page)
                
                # Enable Profiler for coverage
                client.send("Profiler.enable")
                
                # Start collecting precise coverage
                client.send("Profiler.startPreciseCoverage", {
                    "callCount": True,
                    "detailed": True
                })
                
                # Add JavaScript helper to get source content
                page.evaluate("""
                window.__sourceCache = {};
                window.__getScriptContent = function(url) {
                    if (window.__sourceCache[url]) {
                        return window.__sourceCache[url];
                    }
                    
                    try {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);  // Synchronous request
                        xhr.send(null);
                        
                        if (xhr.status === 200) {
                            window.__sourceCache[url] = xhr.responseText;
                            return xhr.responseText;
                        }
                    } catch (e) {
                        console.error('Error fetching source:', e);
                    }
                    
                    return null;
                };
                """)

                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")

                # Wait for canvas to appear
                try:
                    page.wait_for_selector("canvas", timeout=10000)
                except Exception as e:
                    errors.append(f"Canvas not found within timeout: {str(e)}")
                    # Depending on strictness, one might choose to return early here

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
                        current_action = random.choice(sticky_actions)
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

                # Collect coverage data
                print("Collecting coverage")
                
                # Print raw coverage result for inspection
                coverage_result = client.send("Profiler.takePreciseCoverage")
                client.send("Profiler.stopPreciseCoverage")
                client.send("Profiler.disable")
                
                print("\n===== RAW COVERAGE DATA =====")
                for script in coverage_result.get("result", [])[:3]:  # Limit to first 3 scripts for brevity
                    url = script.get("url", "")
                    if url and url.startswith("file://"):
                        script_name = url.split("/")[-1]
                        print(f"\nScript: {script_name}")
                        
                        # Print sample of functions and their ranges
                        for i, func in enumerate(script.get("functions", [])[:3]):  # Limit to first 3 functions
                            function_name = func.get("functionName", "<anonymous>")
                            print(f"  Function: {function_name}")
                            
                            for j, range_info in enumerate(func.get("ranges", [])[:3]):  # Limit to first 3 ranges per function
                                if range_info.get("count", 0) > 0:
                                    print(f"    Range {j}: startOffset={range_info.get('startOffset')}, endOffset={range_info.get('endOffset')}, count={range_info.get('count')}")
                
                # Process the coverage data
                for script in coverage_result.get("result", []):
                    url = script.get("url", "")
                    
                    # Skip non-file URLs (external libraries, etc.)
                    if not url or not url.startswith("file://"):
                        continue
                    
                    # Extract the script name 
                    script_name = url.split("/")[-1]
                    print(f"Processing coverage for: {script_name}")
                    
                    # Try to get source content using JavaScript
                    try:
                        source_content = page.evaluate(f"window.__getScriptContent('{url}')")
                        
                        # Calculate line start positions for mapping character offsets to lines
                        if source_content:
                            lines = source_content.split('\n')
                            line_starts = [0]  # Character position where each line starts
                            current_pos = 0
                            
                            for line in lines:
                                current_pos += len(line) + 1  # +1 for the newline
                                line_starts.append(current_pos)
                            
                            print(f"Identified {len(line_starts)-1} lines in the source file")
                    except Exception as e:
                        print(f"Error getting source for {url}: {e}")
                        source_content = None
                        line_starts = None
                    
                    # Initialize coverage data structure
                    covered_lines = set()
                    
                    # Function to convert offset to line number
                    def offset_to_line(offset, line_starts):
                        if not line_starts:
                            return 0
                            
                        # Binary search to find the line number
                        low, high = 0, len(line_starts) - 1
                        while low <= high:
                            mid = (low + high) // 2
                            if line_starts[mid] <= offset and (mid + 1 >= len(line_starts) or line_starts[mid + 1] > offset):
                                return mid + 1
                            elif offset < line_starts[mid]:
                                high = mid - 1
                            else:
                                low = mid + 1
                        return 1  # Default to first line if not found
                    
                    # Process functions and ranges
                    for func in script.get("functions", []):
                        for range_info in func.get("ranges", []):
                            if range_info.get("count", 0) > 0:
                                start_offset = range_info.get("startOffset", 0)
                                end_offset = range_info.get("endOffset", 0)
                                
                                # If we have source content, map offsets to lines
                                if source_content and line_starts:
                                    start_line = offset_to_line(start_offset, line_starts)
                                    end_line = offset_to_line(end_offset, line_starts)
                                    
                                    # Add lines to coverage
                                    for line in range(start_line, end_line + 1):
                                        covered_lines.add(line)
                    
                    # Create coverage ranges
                    if covered_lines:
                        # Group consecutive lines into ranges
                        sorted_lines = sorted(covered_lines)
                        ranges = []
                        
                        if sorted_lines:
                            current_range = {"startLine": sorted_lines[0], "endLine": sorted_lines[0]}
                            
                            for line in sorted_lines[1:]:
                                if line == current_range["endLine"] + 1:
                                    # Extend current range
                                    current_range["endLine"] = line
                                else:
                                    # Start a new range
                                    ranges.append(current_range.copy())
                                    current_range = {"startLine": line, "endLine": line}
                            
                            # Add the last range
                            ranges.append(current_range)
                        
                        # Add coverage data
                        functions_coverage = [{
                            "name": script_name,
                            "ranges": ranges,
                            "exact_lines": sorted_lines  # Include exact line numbers
                        }]
                        
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

        return errors, coverage_data

    # Run test in a separate process because it's rare but some games can completely freeze the browser

    # Raise warning if total_test_time is greater than max_execution_time
    if total_test_time > max_execution_time:
        warnings.warn(f"Total test time ({total_test_time/1000} s) is greater than max execution time ({max_execution_time/1000} s).")

    result = run_test()

    # Handle the results based on whether coverage was collected
    errors, coverage_data = result
    
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
    
    return errors, coverage_data


def format_coverage_report(coverage_data, source_dir=None):
    """
    Format and print coverage results, highlighting executed lines.
    
    Args:
        coverage_data: Dictionary of coverage data
        source_dir: Directory to look for source files. If None, won't print source code.
    """
    if not coverage_data:
        print("No coverage data collected.")
        return
    
    print("\n===== COVERAGE REPORT =====\n")
    
    for file_name, file_coverage in coverage_data.items():
        print(f"\n📄 File: {colored(file_name, 'cyan', attrs=['bold'])}")
        
        # Extract the executed lines
        executed_lines = set()
        for func_coverage in file_coverage:
            if "exact_lines" in func_coverage:
                executed_lines.update(func_coverage["exact_lines"])
            else:
                # Fall back to ranges if exact_lines not available
                for range_info in func_coverage.get("ranges", []):
                    start = range_info.get("startLine", 0)
                    end = range_info.get("endLine", 0)
                    executed_lines.update(range(start, end + 1))
        
        print(f"• Executed {len(executed_lines)} lines")
        
        # If we have source_dir, try to find and print the source with highlighting
        if source_dir:
            source_path = os.path.join(source_dir, file_name)
            if os.path.exists(source_path):
                print("\n" + "─" * 60)
                print(f"SOURCE CODE (highlighting executed lines in green):")
                print("─" * 60)
                
                with open(source_path, 'r', encoding='utf-8') as src_file:
                    for i, line in enumerate(src_file, 1):
                        # Strip trailing newline for display
                        line = line.rstrip('\n')
                        
                        # Decide if this line is executed
                        is_executed = i in executed_lines
                        
                        # Format line number with consistent width and optional marker
                        line_num = f"{i:4d}"
                        
                        # Print with appropriate highlighting
                        if is_executed:
                            print(f"{colored(line_num, 'green')} ✓ {colored(line, 'green')}")
                        else:
                            print(f"{line_num}   {line}")
                
                print("─" * 60)
            else:
                print(f"Source file not found at {source_path}")
        
        # Print summary of executed ranges
        if file_coverage and "ranges" in file_coverage[0]:
            print("\nExecuted ranges:")
            for i, range_info in enumerate(file_coverage[0]["ranges"], 1):
                start = range_info.get("startLine", 0)
                end = range_info.get("endLine", 0)
                print(f"  {i}. Lines {start}-{end} ({end-start+1} lines)")


def run_original_game_test():
    """Run the original game test from the main function."""
    from utils import code_from_dir

    perspective = "top-down"
    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / perspective / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games" / "theme_0" / "sample_0" / "code_original"

    code_dict = code_from_dir(games_dir)
    errors, coverage_data = run_game(code_dict, headless=False, total_test_time=4000)
    print(errors)
    
    # Use the new function to format and print the coverage report
    format_coverage_report(coverage_data, source_dir=games_dir)


def test_with_sample_file():
    """Test the coverage formatter with a simple sample file."""
    # Create a temp directory for our test
    import tempfile
    import shutil
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    try:
        # Create a simple JavaScript file
        test_js_content = """// Simple test JavaScript file
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

// Main code
const x = 10;
const y = 5;
console.log("Addition:", add(x, y));
console.log("Subtraction:", subtract(x, y));
// Multiplication not used
// Division not used
"""
        test_js_file = os.path.join(temp_dir, "test.js")
        with open(test_js_file, 'w') as f:
            f.write(test_js_content)
        
        # Let's manually calculate character ranges and corresponding line numbers
        lines = test_js_content.split('\n')
        line_starts = [0]  # Character position where each line starts
        current_pos = 0
        
        for line in lines:
            current_pos += len(line) + 1  # +1 for the newline
            line_starts.append(current_pos)
        
        # Create ranges for the executed parts
        # We'll say the add function (lines 1-3) and the main code (lines 19-22) were executed
        ranges = [
            # add function - lines 1-3
            {"start": line_starts[1], "end": line_starts[4]},
            # main code - lines 19-22
            {"start": line_starts[19], "end": line_starts[23]}
        ]
        
        # Convert these ranges to our expected format
        formatted_ranges = []
        exact_lines = set()
        
        for range_info in ranges:
            start_offset = range_info["start"]
            end_offset = range_info["end"]
            
            # Find the line numbers
            start_line = 1
            end_line = 1
            
            for i, pos in enumerate(line_starts):
                if pos <= start_offset and (i+1 >= len(line_starts) or line_starts[i+1] > start_offset):
                    start_line = i + 1
                if pos <= end_offset and (i+1 >= len(line_starts) or line_starts[i+1] > end_offset):
                    end_line = i
            
            formatted_ranges.append({
                "startLine": start_line,
                "endLine": end_line
            })
            
            # Add each line in the range to exact_lines
            for line in range(start_line, end_line + 1):
                exact_lines.add(line)
        
        # Print detailed debug info
        print("\nDebug information:")
        print("Line starts:", line_starts)
        print("Ranges:", ranges)
        print("Formatted ranges:", formatted_ranges)
        print("Exact lines:", sorted(exact_lines))
        
        # Create mock coverage data
        coverage_data = {
            "test.js": [{
                "name": "test.js",
                "ranges": formatted_ranges,
                "exact_lines": sorted(list(exact_lines))
            }]
        }
        
        # Format and print the coverage report
        print("\nTesting with sample file:")
        format_coverage_report(coverage_data, source_dir=temp_dir)
        
    finally:
        # Clean up the temporary directory
        shutil.rmtree(temp_dir)


if __name__ == "__main__":
    # Uncomment one of these to run the desired test
    # test_with_sample_file()
    run_original_game_test()


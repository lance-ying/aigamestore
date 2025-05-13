# import asyncio
# import urllib.parse
# import json
# from collections import defaultdict
# from playwright.async_api import async_playwright

# # HTML content to test coverage against
# HTML_CONTENT = """
# <!DOCTYPE html>
# <html>
# <head>
#     <title>Coverage Test</title>
#     <script>
#         function runTest() {
#             const x = 10;
#             if (x > 5) {
#                 console.log('x is greater than 5');
#             } else {
#                 console.log('x is 5 or less');
#             }

#             for (let i = 0; i < 3; i++) {
#                 console.log('Loop iteration', i);
#             }
#         }

#         window.onload = runTest;
#     </script>
# </head>
# <body>
#     <h1>JavaScript Coverage Test</h1>
# </body>
# </html>
# """

# def get_line_number_offsets(source: str):
#     """
#     Build a list of tuples mapping byte offsets to line numbers.
#     Returns: List[(offset: int, line_number: int)]
#     """
#     lines = source.splitlines(keepends=True)
#     offsets = []
#     offset = 0
#     for idx, line in enumerate(lines):
#         offsets.append((offset, idx + 1))
#         offset += len(line.encode('utf-8'))
#     return offsets


# def offset_to_line(offsets, byte_offset: int) -> int:
#     """Find the line number corresponding to a byte offset."""
#     for i in range(len(offsets) - 1):
#         if offsets[i][0] <= byte_offset < offsets[i + 1][0]:
#             return offsets[i][1]
#     return offsets[-1][1]

# async def run_coverage_from_string(html: str):
#     """
#     Runs coverage on the given HTML string and returns per-line execution counts.
#     """
#     encoded = urllib.parse.quote(html)
#     data_url = f"data:text/html,{encoded}"

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context()
#         page = await context.new_page()

#         # Start JS coverage via CDP
#         client = await context.new_cdp_session(page)
#         await client.send("Profiler.enable")
#         await client.send("Profiler.startPreciseCoverage", {"callCount": True, "detailed": True})

#         await page.goto(data_url)
#         await page.wait_for_timeout(1000)

#         result = await client.send("Profiler.takePreciseCoverage")
#         await client.send("Profiler.stopPreciseCoverage")
#         await client.send("Profiler.disable")
#         await browser.close()

#     # Map byte ranges to lines and aggregate counts
#     offsets = get_line_number_offsets(html)
#     line_counts = defaultdict(int)
#     for entry in result.get("result", []):
#         for func in entry.get("functions", []):
#             for r in func.get("ranges", []):
#                 count = r.get("count", 0)
#                 if count > 0:
#                     start_line = offset_to_line(offsets, r["startOffset"])
#                     end_line = offset_to_line(offsets, r["endOffset"])
#                     for ln in range(start_line, end_line + 1):
#                         line_counts[ln] += count

#     # Prepare report sorted by line number
#     report = [{"line": ln, "count": line_counts[ln]} for ln in sorted(line_counts)]
#     return report

# async def main_test():
#     report = await run_coverage_from_string(HTML_CONTENT)
#     print(json.dumps(report, indent=2))

#     # Ensure key lines executed
#     executed_lines = [e["line"] for e in report]
#     assert 6 in executed_lines, "runTest function start line not executed"
#     assert any(e for e in report if e["count"] >= 3 and e["line"] >= 11), "Loop lines not counted correctly"
#     print("Line-level coverage test passed!")

# if __name__ == '__main__':
#     asyncio.run(main_test())





from pathlib import Path
import tempfile
import time
import signal
import multiprocessing
import json
import os
from multiprocessing import Queue
from playwright.sync_api import sync_playwright
import warnings

def run_game_with_coverage(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 60000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 180000) -> tuple[list, dict]:
    """Test if a p5.js game can run without errors using Playwright and collect code coverage.

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
        coverage_output_dir: Directory to save coverage reports (default: "./coverage")

    Returns:
        tuple: (list of error messages, coverage data dictionary)
    """
    assert isinstance(game_code, dict), "game_code must be a dictionary"

    # Define default sticky actions if none provided
    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "Enter", "r")


    # Function to run in a separate process
    def run_test(game_code_copy, result_queue, headless, initial_wait, sticky_prob, 
                 action_duration, total_test_time, viewport_width, viewport_height, 
                 sticky_actions_copy):
        errors = []
        coverage_data = {}
        
        if "index.html" not in game_code_copy:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            result_queue.put((errors, coverage_data))
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
                
                # Important: For Firefox, we need to enable JavaScript coverage
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

                # Start coverage collection
                page.coverage.start_js_coverage()

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

                page.keyboard.down("Space")
                page.wait_for_timeout(100)
                page.keyboard.up("Space")
                page.wait_for_timeout(100)

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

                # Stop coverage and collect data
                coverage = page.coverage.stop_js_coverage()
                
                # Process coverage data
                for entry in coverage:
                    url = entry["url"]
                    # Extract filename from URL
                    filename = url.split('/')[-1]
                    if "file://" in url:  # Only process local files
                        coverage_data[filename] = {
                            "url": url,
                            "functions": entry["functions"],
                            "ranges": entry["ranges"],
                            "text": entry["text"]
                        }
                print(coverage_data)

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
        result_queue.put((errors, coverage_data))

    # Generate a simple HTML coverage report
    def generate_html_report(coverage_data, output_dir):
        # Create HTML report directory
        html_dir = os.path.join(output_dir, "html")
        os.makedirs(html_dir, exist_ok=True)
        
        # Create index.html
        with open(os.path.join(html_dir, "index.html"), "w") as f:
            f.write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Code Coverage Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    tr:hover { background-color: #f1f1f1; }
                    .file-link { color: #0066cc; text-decoration: none; }
                    .file-link:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <h1>Code Coverage Report</h1>
                <table>
                    <tr>
                        <th>Filename</th>
                        <th>Coverage %</th>
                    </tr>
            """)
            
            # Add a row for each file
            for filename, data in coverage_data.items():
                if "ranges" in data:
                    # Calculate coverage percentage based on covered ranges
                    total_length = len(data["text"])
                    covered_length = sum(r["end"] - r["start"] for r in data["ranges"])
                    
                    if total_length > 0:
                        coverage_pct = (covered_length / total_length) * 100
                    else:
                        coverage_pct = 0
                    
                    # Create file-specific report
                    create_file_report(filename, data, html_dir)
                    
                    f.write(f"""
                    <tr>
                        <td><a class="file-link" href="{filename}.html">{filename}</a></td>
                        <td>{coverage_pct:.2f}%</td>
                    </tr>
                    """)
            
            f.write("""
                </table>
            </body>
            </html>
            """)
    
    # Create a report for a specific file
    def create_file_report(filename, data, html_dir):
        with open(os.path.join(html_dir, f"{filename}.html"), "w") as f:
            f.write(f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Coverage: {filename}</title>
                <style>
                    body {{ font-family: monospace; margin: 20px; }}
                    h1 {{ color: #333; font-family: Arial, sans-serif; }}
                    pre {{ background-color: #f5f5f5; padding: 10px; overflow: auto; }}
                    .covered {{ background-color: #dfd; }}
                    .not-covered {{ background-color: #fdd; }}
                    .line-number {{ color: #999; display: inline-block; width: 40px; text-align: right; margin-right: 10px; }}
                </style>
            </head>
            <body>
                <h1>Coverage: {filename}</h1>
                <pre>
            """)
            
            # Process the file content with coverage highlighting
            if "text" in data and "ranges" in data:
                text = data["text"]
                ranges = data["ranges"]
                
                # Create a map of covered positions
                covered_positions = [False] * len(text)
                for r in ranges:
                    for i in range(r["start"], r["end"]):
                        if i < len(covered_positions):
                            covered_positions[i] = True
                
                # Split the text into lines and add line numbers
                lines = text.split("\n")
                for i, line in enumerate(lines):
                    line_num = i + 1
                    line_start = sum(len(l) + 1 for l in lines[:i])
                    
                    # Check if this line is covered or not
                    line_covered = any(covered_positions[line_start:line_start + len(line)])
                    
                    css_class = "covered" if line_covered else "not-covered"
                    f.write(f'<div class="{css_class}"><span class="line-number">{line_num}</span>{line}</div>')
            
            f.write("""
                </pre>
            </body>
            </html>
            """)

    # Run test in a separate process
    if total_test_time > max_execution_time:
        warnings.warn(f"Total test time ({total_test_time/1000} s) is greater than max execution time ({max_execution_time/1000} s).")

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
            return (["Browser execution timed out after " + str(max_execution_time/1000) + " s"], {})
        time.sleep(0.5)  # Check every half second
    
    # Process finished - get results if available
    if not result_queue.empty():
        errors, coverage_data = result_queue.get()
    else:
        errors = ["Test completed but no results were returned"]
        coverage_data = {}
    
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
            
    return (errors, coverage_data)


if __name__ == "__main__":
    from utils import code_from_dir

    games_dir = Path(__file__).parent / "results" / "gen_minigame_improve_batch" / "run1" / "claude-3-7-sonnet-20250219" / "thinking" / "top-down"

    themes_dir = sorted(games_dir.glob("theme_*"), key=lambda x: int(x.stem.split("_")[-1]))
    for theme_dir in themes_dir:
        if theme_dir.stem != "theme_4":
            continue
        code_original = code_from_dir(theme_dir / "code_original")

        improved_sample_dirs = sorted((theme_dir / "improve_iter1").glob("sample_*"), key=lambda x: int(x.stem.split("_")[-1]))
        print(improved_sample_dirs)
        code_improved = code_from_dir(improved_sample_dirs[-1])

        run_game_with_coverage(code_original, headless=False)
        # run_game_with_coverage(code_improved, headless=False)

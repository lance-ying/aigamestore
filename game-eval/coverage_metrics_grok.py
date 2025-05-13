from pathlib import Path
import warnings
import json
import re
import os
import urllib.parse
import numpy as np
from termcolor import colored

def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 10000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 60000) -> tuple[list, dict]:
    """Test if a p5.js game can run without errors using Playwright and return raw coverage results.

    Args:
        game_code: Dictionary mapping file paths (relative to game root) to their content.
                   Must contain at least "index.html".
        headless: Whether to run the browser in headless mode (default: True)
        initial_wait: Initial wait time in ms before starting interactions (default: 500)
        sticky_prob: Probability an action will continue on next frame (default: 0.7)
        action_duration: How long to wait between action decisions in ms (default: 150)
        total_test_time: Total time to test inputs in ms (default: 10000)
        viewport_width: Browser viewport width (default: 600)
        viewport_height: Browser viewport height (default: 400)
        sticky_actions: Tuple of keys to use for sticky actions. If None, uses default set.
        max_execution_time: Maximum execution time in ms (default: 60000)

    Returns:
        tuple: (errors, raw_coverage_data)
            - errors: List of error messages encountered during execution.
            - raw_coverage_data: Dictionary where keys are script names and values are
              dictionaries containing 'url', 'source', and 'functions' (raw coverage data).
    """
    import tempfile
    import time
    import signal
    import multiprocessing
    from multiprocessing import Queue
    from playwright.sync_api import sync_playwright

    assert isinstance(game_code, dict), "game_code must be a dictionary"

    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space")

    def run_test():
        errors = []
        raw_coverage_data = {}
        
        if "index.html" not in game_code:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            return (errors, raw_coverage_data)

        with tempfile.TemporaryDirectory() as temp_dir_str:
            temp_dir_path = Path(temp_dir_str)
            
            for file_path_str, file_content in game_code.items():
                full_path = temp_dir_path / file_path_str
                full_path.parent.mkdir(parents=True, exist_ok=True)
                full_path.write_text(str(file_content), encoding='utf-8')
            
            playwright_instance = None
            browser = None
            context = None
            try:
                playwright_instance = sync_playwright().start()
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

                print("Starting coverage collection")
                client = page.context.new_cdp_session(page)
                client.send("Profiler.enable")
                client.send("Profiler.startPreciseCoverage", {
                    "callCount": True,
                    "detailed": True
                })

                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")

                try:
                    page.wait_for_selector("canvas", timeout=10000)
                except Exception as e:
                    errors.append(f"Canvas not found within timeout: {str(e)}")

                page.evaluate("""
                document.addEventListener('keydown', (e) => {
                    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                        e.preventDefault();
                    }
                }, false);
                document.body.style.overflow = 'hidden';
                """)
                
                page.wait_for_timeout(initial_wait)
                page.keyboard.down("Enter")
                page.wait_for_timeout(100)
                page.keyboard.up("Enter")

                import random
                current_time = 0
                current_action = None
                while current_time < total_test_time:
                    if current_action is None or random.random() > sticky_prob:
                        if current_action:
                            page.keyboard.up(current_action)
                        current_action = random.choice(sticky_actions)
                        page.keyboard.down(current_action)
                    page.wait_for_timeout(action_duration)
                    current_time += action_duration
                if current_action:
                    page.keyboard.up(current_action)
                page.wait_for_timeout(100)

                print("Collecting coverage")
                coverage_result = client.send("Profiler.takePreciseCoverage")
                client.send("Profiler.stopPreciseCoverage")
                client.send("Profiler.disable")


                # for script in coverage_result.get("result", []):
                #     url = script.get("url", "")
                #     if url and url.startswith("file://"):
                #         # Parse the file URL to get the local filesystem path
                #         parsed_url = urllib.parse.urlparse(url)
                #         local_path = parsed_url.path
                        
                #         # Ensure the path is within the temporary directory
                #         if local_path.startswith(str(temp_dir_path)):
                #             # Get the relative path (e.g., "game.js")
                #             relative_path = os.path.relpath(local_path, str(temp_dir_path))
                #             source_file = temp_dir_path / relative_path
                            
                #             # Read the source file if it exists
                #             if source_file.exists():
                #                 source_content = source_file.read_text(encoding='utf-8')
                #                 raw_coverage_data[relative_path] = {
                #                     "url": url,
                #                     "source": source_content,
                #                     "functions": script["functions"]
                #                 }
                #             else:
                #                 print(f"Source file not found: {source_file}")
                #         else:
                #             print(f"URL not in temp directory: {url}")

                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        errors.append(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}")

            except Exception as e:
                errors.append(f"Playwright execution error: {str(e)}")
            
            finally:
                if context:
                    context.close()
                if browser:
                    browser.close()
                if playwright_instance:
                    playwright_instance.stop()

        return errors, coverage_result

    result = run_test()
    errors, coverage_result = result
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
    return errors, coverage_result


def highlight_coverage_ranges(coverage_data: dict, game_code: dict = None) -> None:
    scripts = [entry for entry in coverage_data['result'] if entry["url"].startswith("file://")]

    for script in scripts:    
        url = script["url"]
        # example url: 'file:///tmp/tmprp_570fe/game.js'
        # get the path after the fifth slash
        file_name = url.split("/")[5]
        assert file_name in game_code
        code = game_code[file_name]
        lines = code.split('\n')
        
        print(f"\n===== LINE-BY-LINE COVERAGE FOR: {colored(file_name, 'cyan', attrs=['bold'])} =====")
        
        # Calculate line start positions (character offsets)
        line_starts = [0]
        current_pos = 0
        for line in lines:
            current_pos += len(line) + 1  # +1 for newline
            line_starts.append(current_pos)
        
        executed_characters = np.full(len(code), False)
        # add characters for count > 0
        for func in script["functions"]:
            # func_name = func["functionName"]
            # ranges = func["ranges"]
            # is_block_coverage = func["isBlockCoverage"]
            # print(f"Function: {func_name}, isBlockCoverage: {is_block_coverage}, numRanges: {len(ranges)}")

            # if func_name == "updatePlayer":
            #     breakpoint()
            # if is_block_coverage:
            #     continue

            # breakpoint()
            
            for range_info in func.get("ranges", []):
                if range_info.get("count", 0) > 0:
                    executed_characters[range_info["startOffset"]:range_info["endOffset"]] = True

        # remove characters for count == 0
        for func in script["functions"]:
            for range_info in func.get("ranges", []):
                if range_info.get("count", 0) == 0:
                    executed_characters[range_info["startOffset"]:range_info["endOffset"]] = False

        # Determine which lines are executed using the executed_characters array
        executed_lines = set()
        for i in range(len(lines)):
            # Get character range for this line
            start_pos = line_starts[i]
            end_pos = line_starts[i+1] - 1 if i < len(lines) - 1 else len(code)
            
            # Check if any character in this line is executed
            if start_pos < len(executed_characters) and np.any(executed_characters[start_pos:end_pos]):
                executed_lines.add(i)
        
        # Print the source code with highlighting
        print("\nSource Code (executed lines in green, unexecuted in red):")
        print("─" * 80)
        non_empty_lines = 0
        executed_count = 0
        
        for i, line in enumerate(lines):
            # Skip empty lines and single comment lines from line execution count
            stripped = line.strip()
            is_significant = stripped and not (stripped.startswith('//') and len(stripped.split()) <= 3)
            
            if is_significant:
                non_empty_lines += 1
            
            is_executed = i in executed_lines
            if is_executed and is_significant:
                executed_count += 1
                
            color = 'green' if is_executed else 'red'
            marker = '✓' if is_executed else '✗'
            line_num = f"{i+1:4d}"
            print(f"{colored(f'{line_num} {marker}', color)} {colored(line.rstrip(), color)}")
        
        if non_empty_lines > 0:
            coverage_percent = (executed_count / non_empty_lines) * 100
            print("─" * 80)
            print(f"Code Coverage: {executed_count}/{non_empty_lines} lines ({coverage_percent:.1f}%)")
        else:
            print("No significant code lines found")


if __name__ == "__main__":
    """Run the original game test from the main function."""
    from utils import code_from_dir

    perspective = "top-down"
    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / perspective / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games" / "theme_0" / "sample_0" / "code_original"

    code_dict = code_from_dir(games_dir)
    errors, coverage_data = run_game(code_dict, headless=False, total_test_time=3000)
    print("Coverage data structure:")
    print(f"Keys: {list(coverage_data.keys() if isinstance(coverage_data, dict) else [])}")
    highlight_coverage_ranges(coverage_data, code_dict)

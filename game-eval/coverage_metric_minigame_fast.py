import json
from pathlib import Path
import numpy as np
from termcolor import colored

from utils import code_from_dir, generate
import re



# TODO: setting a higher framerate than 60fps in p5js setup doesn't change anyting (might be limited by the browser)
def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 10000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 60000,
             target_framerate: int = 60) -> tuple[list, dict]:
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
        target_framerate: Target framerate to set for the p5.js sketch (default: 60)

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
                
                # Monkey-patch the setup function to increase framerate
                page.evaluate(f"""
                (function() {{
                    if (window.gameInstance) {{
                        const origSetup = window.gameInstance._setup;
                        if (origSetup) {{
                            window.gameInstance._setup = function() {{
                                const result = origSetup.apply(this, arguments);
                                this.frameRate({target_framerate});
                                console.log('Updated framerate to {target_framerate}');
                                return result;
                            }};
                        }}
                    }}
                }})();
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
        executed_lines = set()
        for i in range(len(lines)):
            # Get character range for this line
            start_pos = line_starts[i]
            end_pos = line_starts[i+1] - 1 if i < len(lines) - 1 else len(code)
            
            # Check if any character in this line is executed
            if start_pos < len(executed_characters) and np.any(executed_characters[start_pos:end_pos]):
                executed_lines.add(i)
        
        executed_lines_by_file[file_name] = executed_lines
        
        if verbose:
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

    return executed_lines_by_file


prompt_mechanics = """Your task is to identify where each individual game mechanic is implemented in the code.

Consider only the following types of mechanics:
* Player movement mechanics: How the player moves (up, down, left, right, jump, etc.)
* Interaction mechanics: How the player interacts with other entities (collecting items, hitting enemies, reaching goal, etc.)
* State change mechanics: How the game state changes (winning, losing, scoring points, etc.)

For each mechanic:
1. Write python code that searches the game code for the line number that implements the mechanic
2. Only include the main line that is executed when the mechanic occurs, NOT the conditions that check if it should occur
3. Make sure it uniquely identifies the correct line number (starts at 1)

Format your answer as a python code block:
```python
def get_mechanics(game_code: dict[str, str]) -> list[dict]:
    '''
    Args:
        game_code: Dictionary mapping file paths to their content
        
    Returns:
        List of dictionaries with the following keys:
        - name: Descriptive name of the mechanic (snake_case)
        - type: Type of mechanic ("movement" or "interaction") 
        - file: File path where the mechanic is implemented
        - line: Main line number implementing the mechanic (starts at 1)
        - code: The actual code line implementing the mechanic
        - description: Brief description of what the mechanic does
    '''
    # for each mechanic, search for the line number in game_code based on context
    ...
    return [
        {{
            "name": "move_up",
            "type": "movement",
            "file": "game.js", 
            "line": 142,
            "code": "player.y -= speed;",
            "description": "Moves the player upward by subtracting speed from y position"
        }},
        # ... more mechanics
    ]
```

<game_code>
{game_code}
</game_code>
"""



thinking = True
thinking_tokens = 1024

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

run_name = "run1"
save_dir = save_dir / run_name / model / ("thinking" if thinking else "no_thinking")


def analyze_mechanics(game_code: dict[str, str], save_dir: Path):
    code_str = ""
    for relative_path, code in game_code.items():
        code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

    prompt = prompt_mechanics.format(game_code=code_str)
    answer = generate(model, prompt, save_dir, thinking=thinking, thinking_tokens=thinking_tokens)

    python_code = answer.split("```python")[1].split("```")[0]
    
    # Execute the extracted Python code to get mechanics
    local_vars = {}
    exec(python_code, globals(), local_vars)
    mechanics = local_vars['get_mechanics'](game_code)
    
    # double check that line number and code are consistent
    for mechanic in mechanics:
        line_nb = mechanic["line"]
        line_code = mechanic["code"].strip()
        line_game_code = game_code[mechanic["file"]].split("\n")[line_nb-1].strip()

        assert line_game_code == line_code, f"Line number {line_nb} in {mechanic['file']} does not match code: {line_code}, found: {line_game_code}"

    # Save mechanics to JSON
    with open(save_dir / "mechanics.json", "w") as f:
        json.dump(mechanics, f, indent=4)

    # Run the game and get coverage
    errors, coverage_data = run_game(game_code, headless=False, sticky_prob=0.8, total_test_time=60000, target_framerate=120)
    print("Coverage data structure:")
    print(f"Keys: {list(coverage_data.keys() if isinstance(coverage_data, dict) else [])}")
    executed_lines = analyze_coverage(coverage_data, game_code, verbose=True)

    # Save highlighted code to a file
    with open(save_dir / "highlighted_code.txt", "w") as f:
        for file_name, lines in executed_lines.items():
            f.write(f"\n===== LINE-BY-LINE COVERAGE FOR: {file_name} =====\n")
            code_lines = game_code[file_name].split('\n')
            for i, line in enumerate(code_lines):
                marker = '✓' if i in lines else '✗'
                f.write(f"{i+1:4d} {marker} {line}\n")

    # Analyze which mechanics were executed
    executed_mechanics = []
    for mechanic in mechanics:
        file_name = mechanic["file"]
        line_nb = mechanic["line"] - 1  # Convert to 0-based index
        if line_nb in executed_lines.get(file_name, set()):
            executed_mechanics.append(mechanic)

    # Save executed mechanics analysis
    with open(save_dir / "executed_mechanics.json", "w") as f:
        json.dump({
            "total_mechanics": len(mechanics),
            "executed_mechanics": len(executed_mechanics),
            "coverage": len(executed_mechanics) / len(mechanics),
            "executed_mechanics_names": [mechanic["name"] for mechanic in executed_mechanics],
            "mechanics_names": [mechanic["name"] for mechanic in mechanics],
            "executed_mechanics_list": executed_mechanics,
            "mechanics_list": mechanics,
        }, f, indent=4)





if __name__ == "__main__":
    games_dir = Path(__file__).parent / "results" / "gen_minigame_improve_batch" / "run1" / "claude-3-7-sonnet-20250219" / "thinking" / "top-down"

    themes_dir = sorted(games_dir.glob("theme_*"), key=lambda x: int(x.stem.split("_")[-1]))
    for theme_dir in themes_dir:
        code_original = code_from_dir(theme_dir / "code_original")

        improved_sample_dirs = sorted((theme_dir / "improve_iter1").glob("sample_*"), key=lambda x: int(x.stem.split("_")[-1]))
        print(improved_sample_dirs)
        code_improved = code_from_dir(improved_sample_dirs[-1])

        _save_dir_original = save_dir / theme_dir.stem / "original"
        _save_dir_improved = save_dir / theme_dir.stem / "improved"

        # copy code
        for file_path, code in code_original.items():
            (_save_dir_original / "game_code").mkdir(parents=True, exist_ok=True)
            (_save_dir_original / "game_code" / file_path).write_text(code)

        for file_path, code in code_improved.items():
            (_save_dir_improved / "game_code").mkdir(parents=True, exist_ok=True)
            (_save_dir_improved / "game_code" / file_path).write_text(code)

        if not (_save_dir_original / "executed_mechanics.json").exists():
            analyze_mechanics(code_original, _save_dir_original)

        if not (_save_dir_improved / "executed_mechanics.json").exists():
            analyze_mechanics(code_improved, _save_dir_improved)

        breakpoint()
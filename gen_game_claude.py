from pathlib import Path
from datetime import datetime
import os
import re
import anthropic


prompt_themes = """Task: list 100 themes for platformer game level ideas

Structure your answer as follows:
<theme>
category: ...
description: ...
</theme>
"""


prompt_game_code = """
Task: Implement a platformer game level in p5.js based on the following description:
<description>
{description}
</description>

<p5js_guidelines>
{p5js_guidelines}
</p5js_guidelines>

Use the following format to write your final code:
<code filename="{{name}}.{{extension}}">
...
</code>
"""

prompt_debug = """
Task: Debug the following p5.js code.

After your detailed analysis, decide which files need to be updated. When updating a file, make sure to rewrite the entire code for that file.
Format your answer in the following format for the files that need to be updated:
<code filename="{{name}}.{{extension}}">
...
</code>

<errors>
{errors}
</errors>

<implementation>
{implementation}
</implementation>
"""


p5js_guidelines = """* Don't use any external assets.
* Include a index.html to run the game (don't include anything in the index.html file except for the game).
* Use ES6 modules (import/export) for all JavaScript files - do not use Node.js require() statements.
* Use p5.js in instance mode. When using ES6 modules, access p5 from the global scope with `const p5 = window.p5;` rather than trying to import it directly.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Make sure the game has a clear goal and win state.
* Implement professional-looking and polished graphics. Careful with flickering.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game)."""

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

# thinking = True
thinking = False

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = "run1"

save_dir = save_dir / run_name


if thinking:
    prompt_game_code += "\nThink thoroughly about the game level and in great detail. Don't write code during the planning phase."


SYSTEM_PROMPT = "You are a professional game developper."

# Initialize Anthropic client
anthropic_client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)


def get_completion(model, prompt, thinking=False):
    if "claude" in model:
        if thinking:
            thinking_content = ""
            answer = ""

            with anthropic_client.messages.stream(
                model=model,
                max_tokens=40000,
                thinking={
                    "type": "enabled",
                    "budget_tokens": 10000
                },
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for event in stream:
                    if event.type == "content_block_start":
                        print(f"\nStarting {event.content_block.type} block...")

                    elif event.type == "content_block_delta":
                        if event.delta.type == "thinking_delta":
                            thinking_content += event.delta.thinking
                            print(f"{event.delta.thinking}", end="", flush=True)

                        elif event.delta.type == "text_delta":
                            answer += event.delta.text
                            print(f"{event.delta.text}", end="", flush=True)

                    elif event.type == "content_block_stop":
                        print("\nBlock complete.")

            return thinking_content, answer

        else:
            answer = ""
            with anthropic_client.messages.stream(
                max_tokens=40000,
                messages=[{"role": "user", "content": prompt}],
                model=model,
                system=SYSTEM_PROMPT,
            ) as stream:
                for text in stream.text_stream:
                    answer += text
                    print(text, end="", flush=True)
            return answer
    else:
        raise ValueError(f"Model {model} not supported")


def generate(model, prompt, save_dir, code_dir=None, thinking=False):
    """
    Generate code for a given prompt.

    Args:
        model: The model to use for generation
        prompt: The prompt to generate code for
        save_dir: The directory to save the generated code
        code_dir: The directory to save the generated code, if None, the code will be saved in the save_dir
    """
    save_dir.mkdir(parents=True, exist_ok=True)
    
    if not (save_dir / "answer.txt").exists():
        # Save prompt
        with open(save_dir / "prompt.txt", "w") as f:
            f.write(prompt)

        # save model
        with open(save_dir / "model.txt", "w") as f:
            f.write(model)

        if thinking:
            thinking_content, answer = get_completion(model, prompt, thinking=thinking)

            with open(save_dir / "thinking.txt", "w") as f:
                f.write(thinking_content)
        else:
            answer = get_completion(model, prompt, thinking=False)

        # Save answer
        with open(save_dir / "answer.txt", "w") as f:
            f.write(answer)
    else:
        print(f"Loading answer from {save_dir / 'answer.txt'}")
        with open(save_dir / "answer.txt", "r") as f:
            answer = f.read()

    if code_dir is None:
        code_dir = save_dir

    extract_code_blocks(answer, code_dir)
    return answer


def extract_code_blocks(answer: str, code_dir: Path):
    # Extract code blocks and save in respective files
    code_blocks = re.findall(r"<code filename=\"(.*?)\">(.*?)</code>", answer, re.DOTALL)

    for filename, code in code_blocks:
        file_path = code_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # remove any ```python or ``` tags
        code = re.sub("```python", "", code)
        code = re.sub("```javascript", "", code)
        code = re.sub("```html", "", code)
        code = re.sub("```xml", "", code)
        code = re.sub("```", "", code)

        with open(file_path, "w") as f:
            f.write(code)
    
    return code_blocks


def run_game(game_dir: Path) -> bool:
    """Test if a p5.js game can run without errors.
    
    Args:
        game_dir: Path to the directory containing the game files
        
    Returns:
        bool: True if game runs without errors, False otherwise
    """
    import http.server
    import socketserver
    import threading
    import socket
    from playwright.sync_api import sync_playwright
    
    def find_available_port():
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = s.getsockname()[1]
            return port
    
    # Find an available port
    PORT = find_available_port()
    handler = http.server.SimpleHTTPRequestHandler
    httpd = None
    
    try:
        httpd = socketserver.TCPServer(("", PORT), handler)
        # Start server in a separate thread
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        
        # Change to game directory
        original_dir = os.getcwd()
        os.chdir(game_dir)
                        
        # Monitor for errors
        errors = []

        try:
            with sync_playwright() as p:
                # Launch browser with additional options for better error reporting
                browser = p.chromium.launch(
                    headless=True,
                    args=['--enable-logging', '--v=1']
                )
                context = browser.new_context(
                    viewport={'width': 800, 'height': 600}
                )
                page = context.new_page()
                
                # Add error collector script
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
                        stack: event.reason.stack
                    });
                });
                """
                
                # Inject error collector
                page.add_init_script(error_collector_js)
                
                # Monitor console and page errors
                page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
                page.on("pageerror", lambda err: errors.append(str(err)))
                
                # Load game
                page.goto(f"http://localhost:{PORT}/index.html")
                
                # Wait for canvas to appear
                try:
                    page.wait_for_selector("canvas", timeout=10000)
                except Exception as e:
                    errors.append(f"Canvas not found: {str(e)}")
                
                # Press Enter to start the game
                page.wait_for_timeout(1000)
                page.keyboard.press("Enter")
                
                # Wait for game to initialize
                page.wait_for_timeout(2000)
                
                # Check for any JS errors captured by our script
                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        errors.append(f"JS Error: {error.get('message')} at {error.get('source')}:{error.get('lineno')}")
                
                # Close browser
                context.close()
                browser.close()
                
                # Print errors if any
                if errors:
                    print("Errors detected:")
                    for error in errors:
                        print(f"- {error}")

        finally:
            # Restore original directory
            os.chdir(original_dir)
            
    finally:
        # Ensure server is properly shut down
        if httpd:
            httpd.shutdown()
            httpd.server_close()
            # Wait for server thread to finish
            server_thread.join(timeout=1.0)

    return errors


def debug_game(model, prompt_template, code, save_dir, max_debug_steps=3, thinking=False):
    max_debug_steps = 3
    
    for i in range(max_debug_steps):
        print(f"Debug step {i+1}")
        if not (save_dir / f"debug_step{i+1}" / "errors.txt").exists():
            print(f"Running game {i+1}")
            errors = run_game(save_dir)

            (save_dir / f"debug_step{i+1}").mkdir(parents=True, exist_ok=True)
            # save errors
            with open(save_dir / f"debug_step{i+1}" / "errors.txt", "w") as f:
                errors_str = "\n".join(errors)
                f.write(errors_str)
        else:
            print(f"Loading debug step {i+1} from {save_dir / f'debug_step{i+1}' / 'errors.txt'}")
            with open(save_dir / f"debug_step{i+1}" / "errors.txt", "r") as f:
                errors = f.read()

        if len(errors) == 0:
            break

        _prompt_debug = prompt_template.format(
            implementation=code,
            errors=errors
        )
        answer_debug = generate(model, _prompt_debug, save_dir / f"debug_step{i+1}", code_dir=save_dir, thinking=thinking)

        code += f"\n\nError in step {i+1}:\n<error>{errors}</error>"
        code += f"\n\nDebug step {i+1}:\n<debug>{answer_debug}</debug>"


if __name__ == "__main__":
    answer_themes = generate(model, prompt_themes, save_dir / "themes", thinking=thinking)

    if thinking:
        game_dir_name = "thinking"
    else:
        game_dir_name = "no_thinking"

    # directly implement games from themes
    # extract theme blocks
    themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)
    for idx, theme in enumerate(themes):
        _save_dir = save_dir / game_dir_name / f"theme_{idx}"
        print(f"Theme {idx}: {theme}")

        description = theme
        prompt = prompt_game_code.format(description=description, p5js_guidelines=p5js_guidelines)
        answer_game_code = generate(model, prompt, _save_dir, thinking=thinking)

        debug_game(model, prompt_debug, answer_game_code, _save_dir, thinking=thinking)

        # stop after 10 themes for now
        if idx == 9:
            break

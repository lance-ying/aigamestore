from pathlib import Path
from datetime import datetime
import shutil
import tempfile
import os
import re
import json
import base64
import cv2
import io
import numpy as np
from typing import Dict, Tuple, Union
from PIL import Image

import gymnasium as gym
from gymnasium import spaces
from playwright.sync_api import sync_playwright

import openai
import anthropic
from google import genai
from google.genai import types



# TODO: ask the leave the index.html as is (otherwise can add a fake loading screen and the game might not even load)
prompt_improve_game = """Improve this computer game.
Don't use external assets.
Don't include any other content in the index.html file than the p5.js and p5.collide2D imports and the game scripts.

<game_code>
{game_code}
</game_code>

Use the following format to write your improved game code (only html and javascript):
<code filename="{{name}}.{{extension}}">
...
</code>
"""

thinking = False

model = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem

max_samples = 5

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1/{model}/{'thinking' if thinking else 'no_thinking'}"

save_dir = save_dir / run_name


if "claude" in model:
    anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
elif "gemini" in model:
    gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
elif "gpt" in model:
    openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


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
            # answer = ""
            # with anthropic_client.messages.stream(
            #     # max_tokens=40000,
            #     max_tokens=64000,  # not enough for code_improved_iter2
            #     messages=[{"role": "user", "content": prompt}],
            #     model=model,
            # ) as stream:
            #     for text in stream.text_stream:
            #         answer += text
            #         print(text, end="", flush=True)
            # return answer

            answer = ""
            with anthropic_client.beta.messages.stream(
                max_tokens=128000,  # TODO not enough for code_improved_iter3
                messages=[{"role": "user", "content": prompt}],
                model=model,
                betas=["output-128k-2025-02-19"],
            ) as stream:
                for text in stream.text_stream:
                    answer += text
                    print(text, end="", flush=True)
            return answer
    
    elif "gemini" in model:
        response = gemini_client.models.generate_content(
            model=model,
            contents=prompt,
        )

        answer = response.text
        if thinking:
            return "", answer
        return answer


def generate(model, prompt, save_dir, code_dir=None, thinking=False, max_tries=3):
    """
    Generate code for a given prompt.

    Args:
        model: The model to use for generation
        prompt: The prompt to generate code for
        save_dir: The directory to save the generated code
        code_dir: The directory to save the generated code, if None, the code will be saved in the save_dir
        max_tries: The maximum number of tries to generate the code
    """
    save_dir.mkdir(parents=True, exist_ok=True)

    if not (save_dir / "answer.txt").exists():
        # Save prompt
        with open(save_dir / "prompt.txt", "w") as f:
            f.write(prompt)

        # save model
        with open(save_dir / "model.txt", "w") as f:
            f.write(model)

        try_idx = 0
        while try_idx < max_tries:
            try:
                if thinking:
                    thinking_content, answer = get_completion(model, prompt, thinking=thinking)

                    with open(save_dir / "thinking.txt", "w") as f:
                        f.write(thinking_content)
                else:
                    answer = get_completion(model, prompt, thinking=False)

            except Exception as e:
                print(f"Error: {e}")
                try_idx += 1
                continue
            break

        if try_idx == max_tries:
            raise ValueError(f"Failed to generate code after {max_tries} tries")

        # Save answer
        with open(save_dir / "answer.txt", "w") as f:
            f.write(answer)
    else:
        print(f"Loading answer from {save_dir / 'answer.txt'}")
        with open(save_dir / "answer.txt", "r") as f:
            answer = f.read()

    if code_dir is None:
        code_dir = save_dir

    extract_code_blocks(model, answer, code_dir)
    return answer


def extract_code_blocks(model, answer: str, code_dir: Path):
    if "gemini" in model:
        # Gemini format: ```<block_type> filename="..."
        # ...
        # ```
        code_blocks = []
        # Regex to match: ```blocktype filename="..."
        # ...
        # ```
        pattern = r'```([a-zA-Z0-9_+-]+) filename="([^"]+)"\n(.*?)```'
        matches = re.findall(pattern, answer, re.DOTALL)
        for block_type, filename, code in matches:
            code_blocks.append((filename, code))
    else:
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


def code_from_dir(code_dir: Path) -> dict:
    code = {}
    for file_path in code_dir.rglob("*.html"):
        with open(file_path, "r", encoding="utf-8") as f:
            code[str(file_path.relative_to(code_dir))] = f.read()
    for file_path in code_dir.rglob("*.js"):
        with open(file_path, "r", encoding="utf-8") as f:
            code[str(file_path.relative_to(code_dir))] = f.read()
    return code


def run_game(game_dir: Path, headless: bool = True) -> bool:
    """Test if a p5.js game can run without errors.

    Args:
        game_dir: Path to the directory containing the game files
        headless: Whether to run the browser in headless mode (default: True)

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
                    headless=headless,
                    args=['--enable-logging', '--v=1']
                )
                context = browser.new_context(
                    viewport={'width': 600, 'height': 400}
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
                        stack: event.reason && event.reason.stack ? event.reason.stack : null
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

                # Wait for game to initialize
                page.wait_for_timeout(1000)

                page.keyboard.press("Enter")

                # Wait for game to initialize
                page.wait_for_timeout(1000)

                # Press a few keys
                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(100)
                page.keyboard.press("ArrowUp")
                page.wait_for_timeout(100)
                page.keyboard.press("ArrowLeft")
                page.wait_for_timeout(100)
                page.keyboard.press("ArrowDown")
                page.wait_for_timeout(100)
                page.keyboard.press("Space")
                page.wait_for_timeout(100)

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



# TODO: handle style css files!!


if __name__ == "__main__":
    # genre = "side-scrolling"
    genre = "top-down"

    games_dir = Path(__file__).parent / "results" / "gen_game_topdown" / genre / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"

    theme_dirs = sorted(games_dir.glob("theme_*"), key=lambda d: int(d.name.split("_")[-1]))
    for theme_dir in theme_dirs:
        sample_dirs = sorted(theme_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))

        # get the consistency scores
        sample_indices = []
        scores = []
        for sample_idx, sample_dir in enumerate(sample_dirs):
            if not (sample_dir / "consistency_check.json").exists():
                continue

            with open(sample_dir / "consistency_check.json", "r") as f:
                consistency_check = json.load(f)

            score = consistency_check["score"]
            scores.append(score)
            sample_indices.append(sample_idx)

        # find the sample with the highest score
        best_sample_idx = sample_indices[np.argmax(scores)]
        best_score = np.max(scores)
        sample_dir = sample_dirs[best_sample_idx]
    
        # save info about original sample
        info_dir = save_dir / genre / theme_dir.name
        info_dir.mkdir(parents=True, exist_ok=True)
        with open(info_dir / "info.json", "w") as f:
            json.dump({
                "original_game_path": str(sample_dir),
                "original_sample_idx": best_sample_idx,
                "original_consistency_score": best_score,
                "all_themes_original_samples": sample_indices,
                "all_themes_original_scores": scores
            }, f, indent=4)

        idx = 0
        max_tries = 5
        game_valid = False
        while not game_valid and idx < max_tries:
            _save_dir = save_dir / genre /theme_dir.name / f"sample_{idx}"
            _save_dir.mkdir(parents=True, exist_ok=True)


            # TODO: code original or with logs? (maybe yes if find that games break too much)
            game_code = code_from_dir(sample_dir / "code_original")
            game_code_str = ""
            for relative_path, code in game_code.items():
                game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

            prompt = prompt_improve_game.format(
                game_code=game_code_str
            )
            answer_game_code = generate(model, prompt, _save_dir / "code_improved", thinking=thinking)


            game_code = code_from_dir(_save_dir / "code_improved")
            game_code_str = ""
            for relative_path, code in game_code.items():
                game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

            prompt = prompt_improve_game.format(
                game_code=game_code_str
            )
            answer_game_code = generate(model, prompt, _save_dir / "code_improved_iter2", thinking=thinking)


            game_code = code_from_dir(_save_dir / "code_improved_iter2")
            game_code_str = ""
            for relative_path, code in game_code.items():
                game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

            prompt = prompt_improve_game.format(
                game_code=game_code_str
            )
            answer_game_code = generate(model, prompt, _save_dir / "code_improved_iter3", thinking=thinking)

            breakpoint()
            # TODO: handle multiple samples for improved games if encounter errors



            errors = run_game(_save_dir / "code_improved")

            if not errors:
                game_valid = True
            idx += 1
            

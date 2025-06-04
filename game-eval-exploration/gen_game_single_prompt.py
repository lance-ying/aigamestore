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


perspective = "top-down"
# perspective = "side-scrolling"

prompt_themes = """Task: list 100 themes for 2D game level ideas with a """ + perspective + """ perspective.

Structure your answer as follows:
<theme>
category: ...
description: ...
</theme>
"""

prompt_combined = """Follow ALL these instructions:
<game_implementation_instructions>
{game_implementation_task}
</game_implementation_instructions>

<ai_player_instructions>
{ai_player_task}
</ai_player_instructions>

<list_mechanics_instructions>
{list_mechanics_task}
</list_mechanics_instructions>

<logging_instructions>
{logging_task}
</logging_instructions>

{prompt_format}
"""

prompt_game_code = """
Task: Implement a 2D game level with a """ + perspective + """ perspective in p5.js based on the following description:
<description>
{description}
</description>

<p5js_guidelines>
{p5js_guidelines}
</p5js_guidelines>
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
* Use p5.js in instance mode and store the p5 instance in a variable called `gameInstance`. Make the game variables accessible with a getState() function (but don't use it in your game implementation). Expose the game instance globally as follows:
    ```javascript
    ...
    const p5 = window.p5
    let gameInstance = new p5(p => {
        // Initialize variables
        ...
        // Expose all the variables (before defining the functions). Don't use getState() in your game implementation.
        p.getState = () => {
            ...
        }
        // Functions
        ...
    });
    // Expose the game instance globally
    window.gameInstance = gameInstance;
    ```
* IMPORTANT: Make sure to properly pass the object `p` in the game code to access p5js functions. Otherwise you will get a "ReferenceError: p is not defined" error.
* Use p5.collide2D for ALL collision detection. Available functions: collidePointPoint, collidePointCircle, collidePointEllipse, collidePointRect, collidePointLine, collidePointArc, collideRectRect, collideCircleCircle, collideRectCircle, collideLineLine, collideLineCircle, collideLineRect, collidePointPoly, collideCirclePoly, collideRectPoly, collideLinePoly, collidePolyPoly, collidePointTriangle. These functions are accessible through the `p` object. Note that the specific order of the words in the function name matters. For example, 'collideCircleRect' is not available.
* IMPORTANT: The specific order of the words in the p5.collide2D function names matter. For example, 'collideRectCircle' is a function, but 'collideCircleRect' is not available.
* Make sure variables are ALWAYS properly defined and accessible from the scope they are used!
* Set the canvas size to 600x400 pixels.
* Ensure full reproducibility by setting the random seed to a fixed value.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Make sure the game has a clear goal and win state.
* Implement professional-looking and polished graphics.
* IMPORTANT: Don't draw elements that are randomly sampled at every frame as this causes flickering.
* Start the game with clear instructions on how to play (the player has to press Enter to start the game).
* Make sure the player can restart the game at any time by pressing 'R'."""


# prompt_policy = """Task: Implement an AI that can play and fully explore the game.

# <instructions>
# * implement the ai player in a separate file called "ai_player.js"
# * make sure to access the game state via the window.gameInstance object
# * use document.dispatchEvent to simulate actions
# * add `bubbles: true` to the keyboard events
# * make sure the exploration policy is robust and never gets stuck in an infinite loop
# * try multiple exploration strategies and switch between them
# * make sure to include strategies with randomness
# </instructions>

# You are only allowed to modify the `index.html` file and create the `ai_player.js` file.
# Format your answer in the following format for the files that need to be updated:
# <code filename="{{name}}.{{extension}}">
# ...
# </code> 

# <game_implementation>
# {game_implementation}
# </game_implementation>
# """

# * include strategies with randomness
# . It must always keep exploring and trying new things
# * make sure your implementation is robust and never gets stuck in an infinite loop (e.g. stuck on game over screen, cycle the same sequence of positions over and over, etc.)
prompt_policy = """Task: Implement an AI that can play and fully explore the game.

<instructions>
* implement the ai player in a separate file called "ai_player.js"
* make sure to access the game state via the window.gameInstance object
* use document.dispatchEvent to simulate key presses with proper keyboard events
* include keyCode/which values (e.g., 37 for left, 39 for right, 38 for up, 13 for enter)
* manage both keydown and keyup events to control player movement properly
* add `bubbles: true` to all keyboard events
* IMPORTANT: hard reset the game with 'R' after 1000 steps! Make sure this works even if the policy gets stuck.
* always reset the game with 'R' when the game is over!
* try different exploration strategies
* make sure your implementation is robust

Example keyboard event handling pseudocode:
```javascript
// Track pressed keys
const keyStates = {{ ArrowLeft: false, ArrowRight: false, ArrowUp: false }};

// Press a key
function pressKey(key) {{
  if (keyStates[key]) return; // Already pressed
  
  // Map keys to keyCodes
  const keyCodeMap = {{
    'ArrowLeft': 37,
    'ArrowRight': 39,
    'ArrowUp': 38,
    'Enter': 13
  }};
  
  // Create and dispatch keydown event
  document.dispatchEvent(new KeyboardEvent('keydown', {{
    key: key,
    code: key,
    keyCode: keyCodeMap[key],
    which: keyCodeMap[key],
    bubbles: true
  }}));
  
  keyStates[key] = true;
}}

// Release a key
function releaseKey(key) {{
  if (!keyStates[key]) return; // Not pressed
  
  // Create keyup event with same properties
  // ... similar to above with 'keyup' instead of 'keydown'
  
  keyStates[key] = false;
}}
```
</instructions>
"""
# * keep the exploration policy minimal but effective

# not sure this helps:
# * continuously adapt and improve the policy based on which strategies are working best
# * keep adapting the policy and keep track of which strategy is working best


prompt_list_mechanics = """Task: Analyze the player's movement types and interactions with other entities in this game.

<instructions>
List all the types of player movement types and interactions between the player and other entities in the game provided in <game_implementation>.
* The player's movement types are the game mechanics that modify the player's position and that don't involve any other entity. They are controlled by the user's keyboard or mouse inputs.
* An entity interaction is different. It is an event that occurs when the player interacts with another entity.
* Interactions are individual events while the player's movement types are continuous streams of data.
* In some cases, it is possible that an entity changes the movement mode of the player (for example, if someones uses a car to move around). In this case, clearly separate the interaction events with that entity (placed in the entity interaction list) from the movement controls (placed in the player movement controls list). In the car example, the interaction events would be when the player gets in the car or gets out of the car, while the movement controls would be the car's movement.
* When naming an interaction type, try to use a generic name that reflects function, independently of the entity involved. For example, if the player has to reach a flag to win the level, the interaction type is "reach_goal" and the entity is "flag".
    * You will find a list of possible movement and interaction types in <movement_type_library> and <interaction_type_library> (ignore if empty). 
    * If the movement or interaction type you are looking for is already in the list, use it. Otherwise, create a new one.
    * Do not include a movement or interaction type if it is not present in the game provided in <game_implementation>.

Output json lists of dictionaries with the following information:
* Player movement types (in <player_movement_list>):
    * "movement_type": An identifier for the movement type (snake_case convention).
    * "description": A description of the movement type.
    * "data": Additional movement type specific data that are in the debug prints. Dictionary with one or more keys. For each key in the data dictionary, provide a short description.

* Interactions with other entities (in <interaction_list>):
    * "interaction_type": An identifier for the interaction type involving the player (snake_case convention). Make sure the identifier names the interaction type from the player's perspective.
    * "description": A general description of the type of interaction (describe the generic name). After the generic description, add the specific example with the entity involved in this game (format it as "Example: ...").
    * "entity": The other entity involved in the interaction with the player (snake_case convention).
    * "data": Additional interaction specific data that are in the debug prints. Dictionary with one or more keys. For each key in the data dictionary, provide a short description.

For each movement control and interaction type, indicate where to place a debug print statement (a single statement or a few when needed) that checks whether it is correctly executed when the game is played.
* Place instructions for the player's movement controls and interactions debugging in <player_movement_debugging> and <interaction_debugging> respectively.
* Give enough context to know where to insert the debug print statements in the code.
</instructions>

<formatting_instructions>
Structure your answer as follows:
<player_movement_list>
[
    {{
        "movement_type": "{{movement_type}}",
        "description": "Description of the movement control",
        "data": {{
            "{{key}}": "Description of the data"
        }}
    }},
    ...
]
</player_movement_list>

<interaction_list>
[
    {{
        "interaction_type": "{{interaction_type}}",
        "description": "Description of the interaction between the player and the other entity",
        "entity": "Description of the other entity involved in the interaction with the player",
        "data": {{
            "{{key}}": "Description of the data"
        }}
    }},
    ...
]
</interaction_list>

<player_movement_debugging>
...
</player_movement_debugging>

<interaction_debugging>
...
</interaction_debugging>
</formatting_instructions>

<movement_type_library>
{movement_type_library}
</movement_type_library>

<interaction_type_library>
{interaction_type_library}
</interaction_type_library>
"""


prompt_log_mechanics = """Task: Modify the provided game implementation to log data during the game execution.

<instructions> 
* <player_movement_list> and <interaction_list> contain the list of movement types and interaction types to log.
* <player_movement_debugging> and <interaction_debugging> contain the code locations where to insert the code for the movement and interaction logging.
    * You do not need to insert the debug prints. The debugging instructions are there to tell you where to insert the logging code.
    * Closely follow these debugging instructions. Insert the logging code at the exact location specified in the debugging instructions.
    * Do not log any other movement and interaction types than the ones specified in <player_movement_list> and <interaction_list>.
* In addition to the data structures described in <player_movement_list> and <interaction_list>, store the following:
    * "timestamp": The timestamp of the execution
    * "framecount": The framecount of the execution accessed via `p.frameCount`
* Store the logs via the `p` object inside the p5js instance (e.g. using `p.logs` or `this.p.logs`) with the following structure:
    ```javascript
    const p5 = window.p5
    let gameInstance = new p5(p => {{        
        // Initialize the logs. Important: do not reset the logs at any point in the code! These logs are considered write-only!
        p.logs = {{
            "interactions": [],
            "movements": [],
            // additionally, store player position in a separate variable (even if it is already stored in "movements")
            "player_positions": [],
            // store the key and/or mouse inputs used in the game
            "inputs": [],
            // store the game states
            "game_states": []
        }};
        ...
    }});
    ```
* The logs object in the code is considered write-only. Don't reset it. We want to keep track of all the logs since the start of the p5js game instance.
* Store the player position at every frame in its own variable (even if it is already stored in "movements"). Store both the screen position (position on the canvas) and the game position (position in the game world). Use the following format:
    * "screen_x": The x position of the player on the screen
    * "screen_y": The y position of the player on the screen
    * "game_x": The x position of the player in the game world
    * "game_y": The y position of the player in the game world
    * "framecount": The framecount of the event accessed via `p.frameCount`
* Store the control inputs when they are triggered by the player (keyPressed, keyReleased, etc.). Store only the inputs used in the game. Use the following format:
    * "input_type": The type input event (e.g. keyPressed)
    * "timestamp": The timestamp of the event
    * "framecount": The framecount of the event accessed via `p.frameCount`
    * "data": Additional data specific to the input type. Store `key` and `keyCode` if the input is a key.
* Store the game states using the following format:
    * "game_state": "start", "reset", "win", or "fail"
    * "timestamp": The timestamp of the event
    * "framecount": The framecount of the event accessed via `p.frameCount`
    * "data": Additional data specific to the game state. For example, the player's score when win the game. Leave empty if not applicable.
</instructions>

IMPORTANT: Don't modify any of the original code. You are only allowed to add the logging code.
"""



model = "claude-3-7-sonnet-20250219"
# model = "gemini-2.5-pro-exp-03-25"
# model = "gpt-4.1-2025-04-14"


if "gemini" in model:
    prompt_format = prompt_format_gemini
else:
    prompt_format = prompt_format



save_dir = Path(__file__).parent / "results" / Path(__file__).stem / perspective

# TODO: games are very buggy when thinking is true
# thinking = True
thinking = False

max_samples = 5

run_name = datetime.now().strftime("%Y%m%d_%H%M%S")
run_name = f"run1_{model}"

save_dir = save_dir / run_name


if thinking:
    # prompt_game_code += "\nThink thoroughly about the game level and in great detail. Don't write code during the planning phase."
    prompt_game_code += "\n<thinking_instructions>Think thoroughly about how to make an interesting and engaging game. Don't write code during the planning phase! Think about the game design in great detail. Refine the game design until it is fully concrete and specific.</thinking_instructions>"

    prompt_policy += "\n<thinking_instructions>Think thoroughly about how to implement the exploration strategies. Don't write code during the planning phase!</thinking_instructions>"


# Initialize Anthropic client
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
            answer = ""
            with anthropic_client.messages.stream(
                max_tokens=40000,
                messages=[{"role": "user", "content": prompt}],
                model=model,
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




        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            top_k=64,
            max_output_tokens=65536,
            response_mime_type="text/plain",
        )

        answer = ""
        for chunk in gemini_client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                answer += chunk.text
                print(chunk.text, end="", flush=True)

        if thinking:
            return "", answer
        return answer


    elif "gpt" in model:
        response = openai_client.responses.create(
            model=model,
            input=prompt
        )

        answer = response.output_text
        if thinking:
            return "", answer
        return answer

    else:
        raise ValueError(f"Model {model} not supported")


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

class P5jsEnv(gym.Env):
    """A Gym-like interface for P5js games using preprocessed data."""

    metadata = {"render_modes": ["rgb_array"], "render_fps": 60}

    KEY_TO_INDEX = {
        "Enter": 0, # enter
        " ": 1, # space
        "ArrowLeft": 2, # arrow left
        "ArrowUp": 3, # arrow up
        "ArrowRight": 4, # arrow right
        "ArrowDown": 5, # arrow down
        "r": 6, # r
        # "e": 7, # e
        # "a": 8, # a
    }

    def __init__(
        self, 
        game_code: Dict[str, str], # Dictionary of file paths to file contents
        headless: bool = True,
        framerate: int = 60,
        obs_size: tuple = (96, 96),
        max_episode_steps: int = 2000,
        obs_seq_len: int = 4,
        use_positions: bool = True,
    ):
        """Initialize the P5js data environment.
        
        Args:
            game_code: Dictionary mapping file paths (relative to game root) to their content.
                       Must contain at least "index.html".
            headless: Whether to run the browser in headless mode
            framerate: Framerate of the game
            obs_size: Target size for resizing images (width, height)
            max_episode_steps: Maximum steps per episode
            obs_seq_len: Length of observation sequence
            use_positions: Whether to include player positions in observations
        """
        if not game_code or "index.html" not in game_code:
            raise ValueError("`game_code` must be a dictionary containing at least 'index.html'")
            
        self.game_code = game_code
        self.headless = headless
        self.framerate = framerate
        self.obs_size = obs_size
        self._max_episode_steps = max_episode_steps
        self.obs_seq_len = obs_seq_len
        self.use_positions = use_positions
        
        # State variables
        self.browser = None
        self.page = None
        self.temp_path = None # This will become the temporary directory path
        self.frame_count = 0
        self.playwright = None  # Initialize playwright to None
        self.frame_history = []  # Store frame history for stacking
        self.action_history = []  # Store action history for stacking
        self.position_history = []  # Store position history for stacking
        
        self.action_space = spaces.Box(low=0, high=1, shape=(len(self.KEY_TO_INDEX),), dtype=np.float32)
        
        # Define observation space based on whether positions are used
        obs_dict = {
            "frame_stack": spaces.Box(
                low=0,
                high=255,
                shape=(3 * self.obs_seq_len, self.obs_size[1], self.obs_size[0]),
                dtype=np.uint8,
            ),
            "action_stack": spaces.Box(
                low=0,
                high=1,
                shape=((self.obs_seq_len - 1), len(self.KEY_TO_INDEX)),
                dtype=np.float32,
            ),
        }
        
        # Add position_stack to observation space if using positions
        if self.use_positions:
            obs_dict["position_stack"] = spaces.Box(
                low=0,
                high=1,
                shape=(self.obs_seq_len, 2),  # x, y coordinates for each frame
                dtype=np.float32,
            )
            
        self.observation_space = spaces.Dict(obs_dict)

    def reset(self, seed=None, options=None) -> Tuple[Dict, Dict]:
        """Reset the environment to initial state.
        
        Args:
            seed: Random seed
            options: Additional options
            
        Returns:
            observation: Initial observation
            info: Additional information
        """
        super().reset(seed=seed)

        # Clear frame, action, and position history
        self.frame_history = []
        self.action_history = []
        self.position_history = []

        # Instead of closing and reopening the browser, just reload the page
        if self.browser is not None and self.page is not None:
            print("Resetting browser session")
            # Reload the page
            self.page.reload()
            
            # Wait for canvas to be available
            self.page.wait_for_selector("canvas")
            
            # Make sure the page is focused
            self.page.evaluate("""
            document.querySelector('canvas').focus();
            window.focus();
            """)
        else:
            # If browser doesn't exist, create it
            print("Creating new browser session")
            self._setup_browser()

        # Automatically start the game by pressing Enter
        print("Pressing Enter")
        self.page.keyboard.down("Enter")
        self._redraw()
        self.page.keyboard.up("Enter")
        
        # Get the initial observation
        # obs = self._get_observation()
        obs = None
        self.iter = 0

        info = {}
        info["is_success"] = False
        return obs, info
    
    def step(self, action) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Take a step in the environment by performing an action.
        
        Args:
            action: Action vector of shape (len(KEY_TO_INDEX),) with binary key states
                   or action class index (int)
        
        Returns:
            observation: New observation after the action
            reward: Reward for the action
            terminated: Whether the episode is terminated
            truncated: Whether the episode is truncated
            info: Additional information
        """
        # Convert binary action vector to key press/release events
        if len(self.action_history) > 0:
            last_action = self.action_history[-1]
            # Compare with previous action to detect changes
            for i, (prev, curr) in enumerate(zip(last_action, action)):
                # Get the key name for this index
                key = list(self.KEY_TO_INDEX.keys())[list(self.KEY_TO_INDEX.values()).index(i)]
                
                # Key pressed (0->1)
                if prev < 0.5 and curr >= 0.5:
                    print(f"Pressing {key}")
                    self.page.keyboard.down(key)
                
                # Key released (1->0)
                elif prev >= 0.5 and curr < 0.5:
                    print(f"Releasing {key}")
                    self.page.keyboard.up(key)
        else:
            # First action, just press the active keys
            for i, val in enumerate(action):
                if val >= 0.5:  # Key is active
                    key = list(self.KEY_TO_INDEX.keys())[list(self.KEY_TO_INDEX.values()).index(i)]
                    print(f"Pressing {key}")
                    self.page.keyboard.down(key)
        
        # Add action to history
        # self.action_history.append(action.copy())

        # Redraw the game
        self._redraw()
        
        # Get the new observation
        # obs = self._get_observation()  # TODO: not needed here
        obs = None
        # Calculate reward
        # reward = self._get_reward()
        reward = 0.0
        # Additional info
        info = {
            "frame_count": self._get_framecount(),
            # "position": self._get_player_position(),
            "is_success": False
        }
        
        terminated = reward != 0.0
        truncated = False
    
        if self.iter >= self._max_episode_steps:
            truncated = True
            terminated = True
        self.iter += 1

        return obs, reward, terminated, truncated, info
    
    def render(self) -> Union[np.ndarray, None]:
        return self._get_observation()["pixels"]
        # if self.render_mode == "rgb_array":
        #     return self._get_observation()["pixels"]
        # elif self.render_mode == "human":
        #     # For human rendering, we're already displaying in the browser if headless=False
        #     return None
        # else:
        #     raise ValueError(f"Unsupported render mode: {self.render_mode}")
    
    def close(self) -> None:
        """Close the browser and clean up resources."""
        if self.browser is not None:
            self.browser.close()
            self.browser = None
            self.page = None
            self.playwright.stop()
            self.playwright = None
        
        # Clean up temporary directory using the stored object
        if hasattr(self, 'temp_dir_obj') and self.temp_dir_obj:
            try:
                self.temp_dir_obj.cleanup()
                print(f"Cleaned up temporary directory: {self.temp_dir_obj.name}")
            except Exception as e:
                print(f"Error cleaning up temporary directory {self.temp_dir_obj.name}: {e}")
            self.temp_dir_obj = None # Reset after cleanup
            self.temp_path = None # Also reset temp_path

    def _setup_browser(self) -> None:
        """Set up the browser and page for interacting with the P5js game."""
        
        # Create a temporary directory to store game files
        # Store the TemporaryDirectory object for later cleanup
        self.temp_dir_obj = tempfile.TemporaryDirectory() 
        self.temp_path = self.temp_dir_obj.name
        temp_dir_path = Path(self.temp_path)
        
        print(f"Created temporary game directory: {self.temp_path}")

        # Inject code to stop animation loop into index.html content
        noloop_js = """
<script>
window.addEventListener('load', function() {
    (function() {
        const inst = window.gameInstance;
        console.log("monkey patching setup after load");
        const originalSetup = inst.setup;
        inst.setup = function() {
            originalSetup.apply(this, arguments); // Pass arguments
            inst.noLoop();
            console.log("noLoop() called after setup");
        };
    })();
});
</script>"""
        html_content = self.game_code.get("index.html", "")
        if "</body>" in html_content:
            html_content = html_content.replace("</body>", noloop_js + "</body>")
        else:
            html_content += noloop_js
        
        # Write all game files to the temporary directory
        for file_path_str, file_content in self.game_code.items():
            full_path = temp_dir_path / file_path_str
            # Ensure parent directory exists
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write content (use modified html_content for index.html)
            content_to_write = html_content if file_path_str == "index.html" else file_content
            full_path.write_text(content_to_write, encoding='utf-8')

        # Launch the browser
        playwright = sync_playwright().start()
        self.playwright = playwright
        self.browser = playwright.firefox.launch(headless=self.headless)
        
        # Create a new page with initial viewport
        self.page = self.browser.new_page()
        
        # Load the game from the temporary index.html
        index_html_path = temp_dir_path / "index.html"
        self.page.goto(f"file://{index_html_path.resolve()}") # Use resolved absolute path
        
        # Wait for canvas to be available
        self.page.wait_for_selector("canvas")
        
        # Get actual canvas size from the game
        canvas_size = self.page.evaluate("""() => {
            const canvas = document.querySelector('canvas');
            return canvas ? {width: canvas.width, height: canvas.height} : null;
        }""")
        
        if canvas_size:
            # Update viewport to match canvas size
            self.width = canvas_size['width']
            self.height = canvas_size['height']
            self.page.set_viewport_size({"width": self.width, "height": self.height})
            # print(f"Detected canvas size: {self.width}x{self.height}, adjusting viewport")
        
        # Remove margins and center canvas
        self.page.add_style_tag(content="""
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
        }
        canvas { display: block; }
        """)
        
        # Make sure the page is focused
        self.page.evaluate("""
        document.querySelector('canvas').focus();
        window.focus();
        """)
            
    def _get_observation(self) -> Dict:
        """Get the current observation from the game."""
        # Get image data directly from canvas using toDataURL (similar to p5.capture approach)
        data_url = self.page.evaluate("""() => {
            const canvas = document.querySelector('canvas');
            return canvas ? canvas.toDataURL('image/png') : null;
        }""")
        
        # Extract the base64 encoded data from the data URL
        header, encoded = data_url.split(",", 1)
        binary_data = base64.b64decode(encoded)
        
        # Convert to numpy array using PIL
        image = Image.open(io.BytesIO(binary_data))
        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        image_array = np.array(image)
        
        # Resize the frame to match model's expected input
        processed_image = cv2.resize(image_array, self.obs_size)
        
        # Add to frame history
        self.frame_history.append(processed_image)
        
        # Keep only the last obs_seq_len frames
        if len(self.frame_history) > self.obs_seq_len:
            self.frame_history = self.frame_history[-self.obs_seq_len:]
        
        # If we don't have enough frames yet, duplicate the current frame
        while len(self.frame_history) < self.obs_seq_len:
            self.frame_history.append(processed_image)
        
        # Convert to tensor format for consistency with PyTorch
        frame_stack = []
        for frame in self.frame_history:
            # Convert to CHW format
            frame = frame.transpose(2, 0, 1)
            frame_stack.append(frame)
        
        # Stack frames along channel dimension
        stacked_frames = np.concatenate(frame_stack, axis=0)
        
        # Get the action history
        if len(self.action_history) > self.obs_seq_len - 1:
            self.action_history = self.action_history[-(self.obs_seq_len - 1):]
        
        # If we don't have enough actions yet, pad with zeros
        while len(self.action_history) < self.obs_seq_len - 1:
            self.action_history.insert(0, np.zeros(len(self.KEY_TO_INDEX), dtype=np.float32))
        
        # Stack the actions
        stacked_actions = np.array(self.action_history)
        
        # Create observation dictionary
        observation = {
            "frame_stack": stacked_frames,
            "action_stack": stacked_actions
        }
        
        # Add position data if enabled
        if self.use_positions:
            # Get current player position
            try:
                pos_x, pos_y = self._get_player_position()
                
                # Normalize positions to [0, 1] based on image size
                normalized_x = float(pos_x) / self.width
                normalized_y = float(pos_y) / self.height
                
                # Add to position history
                self.position_history.append(np.array([normalized_x, normalized_y], dtype=np.float32))
                
            except Exception as e:
                print(f"Error getting player position: {e}")
                # Use zeros if position can't be determined
                self.position_history.append(np.zeros(2, dtype=np.float32))
            
            # Keep only the last obs_seq_len positions
            if len(self.position_history) > self.obs_seq_len:
                self.position_history = self.position_history[-self.obs_seq_len:]
            
            # If we don't have enough positions yet, pad with zeros
            while len(self.position_history) < self.obs_seq_len:
                self.position_history.insert(0, np.zeros(2, dtype=np.float32))
            
            # Stack the positions
            stacked_positions = np.array(self.position_history)
            
            # Add to observation
            observation["position_stack"] = stacked_positions
        
        return observation
    
    def _get_player_position(self) -> Tuple[float, float]:
        framecount = self._get_framecount()
        positions = self.page.evaluate("window.gameInstance.logs.player_positions")
        positions_by_framecount = {pos["framecount"]: pos for pos in positions}
        position = positions_by_framecount[framecount]
        return (position["screen_x"], position["screen_y"])

    def _get_framecount(self) -> int:
        framecount = self.page.evaluate("window.gameInstance.frameCount")
        return framecount

    def _redraw(self) -> None:
        self.page.evaluate("window.gameInstance.redraw();")

    def _get_reward(self) -> float:
        game_states = self.page.evaluate("window.gameInstance.logs.game_states")
        if game_states[-1] == "win":
            return 1.0
        elif game_states[-1] == "fail":
            return -1.0
        return 0.0

    def get_logs(self) -> Dict:
        return self.page.evaluate("window.gameInstance.logs")



def code_from_dir(code_dir: Path) -> dict:
    code = {}
    for file_path in code_dir.rglob("*.html"):
        with open(file_path, "r", encoding="utf-8") as f:
            code[str(file_path.relative_to(code_dir))] = f.read()
    for file_path in code_dir.rglob("*.js"):
        with open(file_path, "r", encoding="utf-8") as f:
            code[str(file_path.relative_to(code_dir))] = f.read()
    return code



if __name__ == "__main__":
    # headless = False
    headless = True

    if not thinking:
        score_threshold = 70
    else:
        score_threshold = 60

    answer_themes = generate(model, prompt_themes, save_dir / "themes")

    if thinking:
        game_dir_name = "thinking"
    else:
        game_dir_name = "no_thinking"

    themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)
    for idx, theme in enumerate(themes):
        game_validated = False
        sample_idx = 0
        while not game_validated and sample_idx < max_samples:
            _save_dir = save_dir / game_dir_name / "games" / f"theme_{idx}" / f"sample_{sample_idx}"
            # generate code
            game_dir = _save_dir / "code_original"
            print(f"Theme {idx}: {theme}")

            description = theme
            prompt = prompt_combined.format(
                game_implementation_task=prompt_game_code.format(
                    description=description,
                    p5js_guidelines=p5js_guidelines,
                ),
                ai_player_task=prompt_policy,
                list_mechanics_task=prompt_list_mechanics,
                logging_task=prompt_log_mechanics,
                prompt_format=prompt_format
            )
            answer_game_code = generate(model, prompt, game_dir, thinking=thinking)
            breakpoint()

            game_code = code_from_dir(game_dir)

            # make sure the code runs
            if not (_save_dir / "run_check.json").exists():
                try:
                    num_steps = 500

                    env = P5jsEnv(game_code, headless=headless)
                    env.reset()
                    for i in range(num_steps):
                        action = env.action_space.sample()
                        env.step(action)
                        print(i)
                    env.close()
                    # save success
                    with open(_save_dir / "run_check.json", "w", encoding="utf-8") as f:
                        json.dump({"success": True, "num_steps": num_steps}, f, indent=4)
                except Exception as e:
                    print(f"Error: {e}")
                    # breakpoint()
                    env.close()
                    # save error
                    with open(_save_dir / "run_check.json", "w", encoding="utf-8") as f:
                        json.dump({"error": str(e), "num_steps": num_steps}, f, indent=4)
                    # resample new game
                    sample_idx += 1
                    continue
            else:
                with open(_save_dir / "run_check.json", "r", encoding="utf-8") as f:
                    results = json.load(f)
                    if "error" in results:
                        print(f"Error: {results['error']}")
                        sample_idx += 1
                        continue


            # add AI policy to the code
            policy_dir = _save_dir / "code_with_policy"
            print(f"Theme {idx}: {theme}")

            game_code_str = ""
            for relative_path, code in game_code.items():
                game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

            # copy original code to policy dir
            for relative_path, code in game_code.items():
                dest_path = policy_dir / relative_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(code)
            

            prompt = prompt_policy.format(
                game_implementation=game_code_str,
            )
            generate(model, prompt, policy_dir, thinking=thinking)

            # make sure the code with policy runs
            if not (_save_dir / "run_policy_check.json").exists():
                try:
                    num_steps = 5000

                    code_with_policy = code_from_dir(policy_dir)
                    env = P5jsEnv(code_with_policy, headless=headless)
                    env.reset()
                    for i in range(num_steps):
                        action = np.zeros(env.action_space.shape)
                        env.step(action)
                        print(i)
                    env.close()
                    # save success
                    with open(_save_dir / "run_policy_check.json", "w", encoding="utf-8") as f:
                        json.dump({"success": True, "num_steps": num_steps}, f, indent=4)
                except Exception as e:
                    print(f"Error: {e}")
                    # breakpoint()
                    env.close()
                    # save error
                    with open(_save_dir / "run_policy_check.json", "w", encoding="utf-8") as f:
                        json.dump({"error": str(e), "num_steps": num_steps}, f, indent=4)
                    # resample new game
                    sample_idx += 1
                    continue
            else:
                with open(_save_dir / "run_policy_check.json", "r", encoding="utf-8") as f:
                    results = json.load(f)
                    if "error" in results:
                        print(f"Error: {results['error']}")
                        sample_idx += 1
                        continue



            # extract mechanics from code
            mechanics_dir = _save_dir / "list_mechanics"

            prompt = prompt_list_mechanics.format(
                game_implementation=game_code_str,
                movement_type_library={},
                interaction_type_library={},
            )
            answer_list_mechanics = generate(model, prompt, mechanics_dir)

            mvt_control_list = re.findall(r"<player_movement_list>(.*?)</player_movement_list>", answer_list_mechanics, re.DOTALL)
            mvt_control_list = json.loads(mvt_control_list[0])
            interaction_list = re.findall(r"<interaction_list>(.*?)</interaction_list>", answer_list_mechanics, re.DOTALL)
            interaction_list = json.loads(interaction_list[0])
            mechanics_implemented = set(m["movement_type"] for m in mvt_control_list) | \
                set(m["interaction_type"] for m in interaction_list)

            # add mechanics logging to the code
            code_logs_dir = _save_dir / "code_with_logs"
            # copy original code to code_logs_dir
            for relative_path, code in game_code.items():
                dest_path = code_logs_dir / relative_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(code)

            prompt = prompt_log_mechanics.format(
                game_implementation=game_code_str,
                logging_instructions=answer_list_mechanics,
            )
            answer_code_with_logs = generate(model, prompt, code_logs_dir)

            # combine code with logs and policy in a single folder
            code_with_logs_and_policy_dir = _save_dir / "code_with_logs_and_policy"
            # first, copy all the files from code_with_logs
            code_with_logs = code_from_dir(code_logs_dir)
            for relative_path, code in code_with_logs.items():
                dest_path = code_with_logs_and_policy_dir / relative_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(code)
                    
            # second, copy index.html and ai_player.js from code_with_policy
            code_with_policy = code_from_dir(policy_dir)
            for relative_path in ["index.html", "ai_player.js"]:
                if relative_path in code_with_policy:
                    dest_path = code_with_logs_and_policy_dir / relative_path
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(dest_path, "w", encoding="utf-8") as f:
                        f.write(code_with_policy[relative_path])

            code_with_logs_and_policy = code_from_dir(code_with_logs_and_policy_dir)

            # calculate consistency score with policy
            if not (_save_dir / "consistency_check.json").exists():
                num_steps = 10000

                try:
                    env = P5jsEnv(code_with_logs_and_policy, headless=headless)
                    env.reset()
                    for i in range(num_steps):
                        # no action (zeros)
                        action = np.zeros(env.action_space.shape)
                        env.step(action)
                        print(i)
                    logs = env.get_logs()
                    env.close()
                    mechanics_logged = set([event["interaction_type"] for event in logs["interactions"]]) | \
                        set([event["movement_type"] for event in logs["movements"]])

                    # random policy (use env without policy)
                    # env = P5jsEnv(code_with_logs, headless=headless)
                    # env.reset()
                    # for i in range(num_steps):
                    #     action = env.action_space.sample()
                    #     env.step(action)
                    #     print(i)
                    # logs_random = env.get_logs()
                    # env.close()
                    # mechanics_logged_random = set([event["interaction_type"] for event in logs["interactions"]]) | \
                    #     set([event["movement_type"] for event in logs["movements"]])

                except Exception as e:
                    print(f"Error: {e}")
                    env.close()
                    # save error
                    with open(_save_dir / "consistency_check.json", "w", encoding="utf-8") as f:
                        json.dump({"error": str(e)}, f, indent=4)
                    # resample new game
                    sample_idx += 1
                    continue

                # save results
                consistency_check = {
                    "num_steps": num_steps,
                    # "logs": logs,
                    # "logs_random": logs_random,
                    "mechanics_implemented": list(mechanics_implemented),
                    "mechanics_logged": list(mechanics_logged),
                    # "mechanics_logged_random": list(mechanics_logged_random),
                }
                with open(_save_dir / "consistency_check.json", "w", encoding="utf-8") as f:
                    json.dump(consistency_check, f, indent=4)
            else:
                with open(_save_dir / "consistency_check.json", "r", encoding="utf-8") as f:
                    consistency_check = json.load(f)
                    if "error" in consistency_check:
                        print(f"Error: {consistency_check['error']}")
                        sample_idx += 1
                        continue
                    mechanics_implemented = set(consistency_check["mechanics_implemented"])
                    mechanics_logged = set(consistency_check["mechanics_logged"])
                    # mechanics_logged_random = set(results["mechanics_logged_random"])

            print(mechanics_implemented)
            print(mechanics_logged)
            # print(mechanics_logged_random)

            # check how many of the implemented mechanics are logged when the game is played
            score = 0
            for m in mechanics_implemented:
                if m in mechanics_logged:
                    score += 1
            score = 100 * score / len(mechanics_implemented)
            print(f"Score: {score}")

            # add score to consistency_check.json
            consistency_check["score"] = score
            with open(_save_dir / "consistency_check.json", "w", encoding="utf-8") as f:
                json.dump(consistency_check, f, indent=4)

            # score_random = 0
            # for m in mechanics_implemented:
            #     if m in mechanics_logged_random:
            #         score_random += 1
            # score_random = 100 * score_random / len(mechanics_implemented)
            # print(f"Score random: {score_random}")
            
            # TODO: resample policy code if not better than random policy?
            # if no different between policy samples, resample the game
            # breakpoint()

            if score >= 70:
                game_validated = True
            else:
                sample_idx += 1
    
    
        # stop after 20 games
        if idx >= 15:
            break


    # move all the final games (sample with highest index) to a separate folder
    final_dir = save_dir / game_dir_name / "final_games"
    final_dir.mkdir(parents=True, exist_ok=True)
    
    game_dir = save_dir / game_dir_name / "games"
    if game_dir.exists():
        for theme_dir in sorted(game_dir.glob("theme_*")):
            # Find all sample directories for this theme
            sample_dirs = sorted(theme_dir.glob("sample_*"), key=lambda d: int(d.name.split("_")[-1]))
            if sample_dirs:
                # Pick the sample with the highest index
                final_sample_dir = sample_dirs[-1] / "code_with_logs"
                # Copy to final_dir with theme name
                dest_dir = final_dir / theme_dir.name
                if dest_dir.exists():
                    shutil.rmtree(dest_dir)
                shutil.copytree(final_sample_dir, dest_dir)

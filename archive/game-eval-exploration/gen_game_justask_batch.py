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


# perspective = "top-down"
perspective = "side-scrolling"

prompt_themes = """Task: list 100 themes for 2D game level ideas with a """ + perspective + """ perspective.

Structure your answer as follows:
<theme>
category: ...
description: ...
</theme>
"""


prompt_game_code = """
Task: Implement a 2D game level with a """ + perspective + """ perspective in javascript (600x400 pixels) based on the following description:
<description>
{description}
</description>

{prompt_format}
"""

prompt_format = """
Use the following format to write your final code:
<code filename="index.html">
...
</code>
"""

prompt_format_gemini = """
Use the following format to write your final code:
```{block_type} filename="index.html"
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

You are only allowed to modify the `index.html` file and create the `ai_player.js` file.
Format your answer in the following format for the files that need to be updated:
<code filename="{{name}}.{{extension}}">
...
</code> 

<game_implementation>
{game_implementation}
</game_implementation>
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

<game_implementation>
{game_implementation}
</game_implementation>
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

Decide which files in <game_implementation> need to be updated. When updating a file, make sure to rewrite the entire code for that file.
IMPORTANT: Don't modify any of the original code in <game_implementation>. You are only allowed to add the logging code.
Format your answer in the following format for the files that need to be updated:
<code filename="{{name}}.{{extension}}">
...
</code> 

<game_implementation>
{game_implementation}
</game_implementation>

{logging_instructions}

Reminder: Don't modify any of the original code in <game_implementation>. You are only allowed to add the logging code.
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
run_name = f"run2/{model}"

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


def create_batch_request(model, prompts):
    """Create a batch request for the Anthropic Message Batches API.
    
    Args:
        model: The model to use
        prompts: List of prompts to include in the batch
        
    Returns:
        Batch object created via Anthropic API
    """
    from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
    from anthropic.types.messages.batch_create_params import Request
    
    if not isinstance(prompts, list):
        raise ValueError("prompts must be a list for batch processing")
    
    requests = []
    
    for idx, prompt in enumerate(prompts):
        requests.append(
            Request(
                custom_id=f"request_{idx}",
                params=MessageCreateParamsNonStreaming(
                    model=model,
                    max_tokens=40000,
                    messages=[{"role": "user", "content": prompt}]
                )
            )
        )
    
    batch = anthropic_client.messages.batches.create(requests=requests)
    return batch


def wait_for_batch_completion(batch_id, poll_interval=10):
    """Poll until a batch is complete.
    
    Args:
        batch_id: The ID of the batch to check
        poll_interval: How often to check batch status in seconds
        
    Returns:
        Completed batch object
    """
    import time
    
    while True:
        batch = anthropic_client.messages.batches.retrieve(batch_id)
        
        if batch.processing_status == "ended":
            return batch
        
        # Calculate total requests by summing all counts
        total_requests = (
            batch.request_counts.processing +
            batch.request_counts.succeeded +
            batch.request_counts.errored +
            batch.request_counts.canceled +
            batch.request_counts.expired
        )
        
        print(f"Batch {batch_id} status: {batch.processing_status}, " 
              f"Processed: {batch.request_counts.succeeded}/{total_requests}, "
              f"Processing: {batch.request_counts.processing}, "
              f"Errors: {batch.request_counts.errored}")
        
        time.sleep(poll_interval)


def get_batch_results(batch_id):
    """Retrieve and parse results from a completed batch.
    
    Args:
        batch_id: The ID of the completed batch
        
    Returns:
        Dictionary mapping custom_ids to completion results
    """
    results = {}
    
    for result in anthropic_client.messages.batches.results(batch_id):
        custom_id = result.custom_id
        
        if result.result.type == "succeeded":
            # Extract the message content
            message = result.result.message
            content = "".join([block.text for block in message.content if block.type == "text"])
            results[custom_id] = content
        else:
            # Handle error cases
            results[custom_id] = f"Error: {result.result.type}"
            if result.result.type == "errored" and hasattr(result.result, "error"):
                results[custom_id] += f" - {result.result.error.message}"
    
    return results


def get_completion(model, prompt, thinking=False):
    """Get completion from the model.
    
    Args:
        model: The model to use
        prompt: Either a single prompt (str) or a list of prompts for batch processing
        thinking: Whether to use thinking mode
        
    Returns:
        Either a string with the completion or a dict of completions for batch mode
    """
    if "claude" in model and isinstance(prompt, list):
        # Use batch API for multiple prompts
        batch = create_batch_request(model, prompt)
        print(f"Created batch {batch.id}, waiting for completion...")
        
        completed_batch = wait_for_batch_completion(batch.id)
        results = get_batch_results(completed_batch.id)
        
        # Return all results
        return results
    
    # Single prompt processing below
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
        # Handle batch mode for Gemini by processing each prompt individually
        if isinstance(prompt, list):
            results = {}
            for i, p in enumerate(prompt):
                response = gemini_client.models.generate_content(
                    model=model,
                    contents=p,
                )
                results[f"request_{i}"] = response.text
            return results
        
        # Single prompt for Gemini
        response = gemini_client.models.generate_content(
            model=model,
            contents=prompt,
        )

        answer = response.text
        if thinking:
            return "", answer
        return answer

    elif "gpt" in model:
        # Handle batch mode for GPT by processing each prompt individually
        if isinstance(prompt, list):
            results = {}
            for i, p in enumerate(prompt):
                response = openai_client.responses.create(
                    model=model,
                    input=p
                )
                results[f"request_{i}"] = response.output_text
            return results
            
        # Single prompt for GPT
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
    Generate code for a given prompt or batch of prompts.

    Args:
        model: The model to use for generation
        prompt: The prompt or list of prompts to generate code for
        save_dir: Directory or list of directories to save results
        code_dir: Directory or list of directories to save extracted code
        thinking: Whether to use thinking mode (for models that support it)
        max_tries: The maximum number of tries to generate the code
    
    Returns:
        Either a single answer string or a dictionary of answers if prompt is a list
    """
    # Determine if we're in batch mode
    batch_mode = isinstance(prompt, list)
    
    if batch_mode:
        if not isinstance(save_dir, list) or len(prompt) != len(save_dir):
            raise ValueError("When prompt is a list, save_dir must be a matching list of directories")
            
        # Set up code_dir as a list if not provided
        if code_dir is None:
            code_dir = save_dir
        elif not isinstance(code_dir, list) or len(prompt) != len(code_dir):
            raise ValueError("When prompt is a list, code_dir must be None or a matching list of directories")
        
        # Create all necessary directories
        for dir_path in save_dir:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Save all prompts first
        for p, sd in zip(prompt, save_dir):
            # Save prompt
            with open(sd / "prompt.txt", "w") as f:
                f.write(p)
            
            # Save model info
            with open(sd / "model.txt", "w") as f:
                f.write(model)
        
        # Check if all results already exist
        all_exist = True
        for sd in save_dir:
            if not (sd / "answer.txt").exists():
                all_exist = False
                break
                
        if all_exist:
            print(f"All batch results already exist, loading from files")
            batch_results = {}
            for i, sd in enumerate(save_dir):
                with open(sd / "answer.txt", "r") as f:
                    batch_results[f"request_{i}"] = f.read()
            
            # Extract code blocks for each result
            for i, (result, cd) in enumerate(zip(batch_results.values(), code_dir)):
                extract_code_blocks(model, result, cd)
                
            return batch_results
        
        # If not all results exist, generate them using the API
        try_idx = 0
        batch_results = None
        
        while try_idx < max_tries:
            try:
                batch_results = get_completion(model, prompt, thinking=thinking)
                if thinking and not isinstance(batch_results, dict):
                    # If thinking is enabled but result is not a dict, we got a (thinking, answer) tuple
                    # Convert to a dict with a single entry
                    _, actual_answer = batch_results
                    batch_results = {"request_0": actual_answer}
                break
            except Exception as e:
                print(f"Batch processing error: {e}")
                try_idx += 1
                continue
        
        if try_idx == max_tries:
            raise ValueError(f"Failed to generate code after {max_tries} tries")
        
        # Save each result
        for i, (sd, cd) in enumerate(zip(save_dir, code_dir)):
            result_key = f"request_{i}"
            if result_key in batch_results:
                answer = batch_results[result_key]
                
                # Save answer
                with open(sd / "answer.txt", "w") as f:
                    f.write(answer)
                
                # Extract code blocks
                extract_code_blocks(model, answer, cd)
            else:
                print(f"Warning: No result found for request_{i}")
        
        return batch_results
    
    # Original single prompt functionality below
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

    # Generate themes (this is fast, can be done with a single request)
    start_time = datetime.now()
    answer_themes = generate(model, prompt_themes, save_dir / "themes")
    end_time = datetime.now()
    print(f"Theme generation took {end_time - start_time}")
    
    themes = re.findall(r"<theme>(.*?)</theme>", answer_themes, re.DOTALL)

    if thinking:
        game_dir_name = "thinking"
    else:
        game_dir_name = "no_thinking"

    # Process themes in batches for better efficiency
    max_themes_to_process = 10
    batch_size = 10
    
    for batch_start in range(0, min(max_themes_to_process, len(themes)), batch_size):
        batch_end = min(batch_start + batch_size, min(max_themes_to_process, len(themes)))
        current_themes = themes[batch_start:batch_end]
        print(f"Processing themes batch {batch_start} to {batch_end-1}")
        
        # Prepare batch data
        prompts = []
        save_dirs = []
        code_dirs = []
        
        for idx, theme in enumerate(current_themes, batch_start):
            _save_dir = save_dir / game_dir_name / "games" / f"theme_{idx}" / f"sample_0"
            game_dir = _save_dir / "code_original"
            
            description = theme
            prompt = prompt_game_code.format(
                description=description,
                p5js_guidelines=p5js_guidelines,
                prompt_format=prompt_format
            )
            
            prompts.append(prompt)
            save_dirs.append(game_dir)
            code_dirs.append(game_dir)
        
        # Generate game code for all themes in batch using the simplified interface
        batch_start_time = datetime.now()
        print(f"Batch generation started at: {batch_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        generate(
            model, 
            prompts,  # List of prompts for batch processing
            save_dirs,  # List of save directories
            code_dirs,  # List of code directories
            thinking=thinking
        )
        
        batch_end_time = datetime.now()
        batch_duration = batch_end_time - batch_start_time
        print(f"Batch generation completed at: {batch_end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Batch generation took: {batch_duration} for {len(prompts)} prompts")
        print(f"Average time per prompt: {batch_duration / len(prompts)}")
        
        print(f"Successfully processed game code for batch {batch_start} to {batch_end-1}")
    
    print("Game code generation complete!")

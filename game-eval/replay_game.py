import os
import tempfile
import time
import json
import shutil
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
from typing import List, Dict, Any
import datasets

# Follow same convention as other files for save_dir
save_dir = Path(__file__).parent / "results" / Path(__file__).stem
save_dir.mkdir(parents=True, exist_ok=True)



def replay_game(game_files: Dict[str, Any], actions: List[Dict[str, Any]], save_dir: Path = None, debug: bool = False):
    """Replay a game with recorded actions.
    
    Args:
        game_files: Dictionary with file paths as keys and file contents as values
        actions: List of action dictionaries to replay
        save_dir: Optional directory to save screenshots/videos
        debug: If True, show the browser window and add delays
    """
    if save_dir is not None:
        save_dir.mkdir(parents=True, exist_ok=True)

    # Create a temporary directory to hold the game files
    temp_dir = tempfile.mkdtemp()
    temp_path = None
    
    try:
        # Find the HTML file - usually index.html
        html_file_path = None
        html_content = None
        
        for file_path, content in game_files.items():
            if file_path.endswith('.html'):
                html_file_path = file_path
                html_content = content
                break
        
        if not html_file_path or not html_content:
            raise ValueError("No HTML file found in game files")
            
        # Write HTML file
        temp_path = os.path.join(temp_dir, os.path.basename(html_file_path))
        with open(temp_path, 'w') as f:
            f.write(html_content)
        
        # Write all other files (JS, CSS, etc.)
        for file_path, content in game_files.items():
            if file_path != html_file_path:  # Skip the HTML file we already wrote
                # Create subdirectories if needed
                file_dir = os.path.dirname(file_path)
                if file_dir:
                    os.makedirs(os.path.join(temp_dir, file_dir), exist_ok=True)
                
                file_full_path = os.path.join(temp_dir, file_path)
                with open(file_full_path, 'w') as f:
                    f.write(content)
        
        with sync_playwright() as p:
            # browser = p.chromium.launch(headless=not debug)  # rendering issues
            browser = p.firefox.launch(headless=not debug)

            # Create page directly from browser instead of using a context
            page = browser.new_page(viewport={"width": 600, "height": 400})
            
            # Load the game - use file:// URL format
            page.goto(f"file://{temp_path}")
            
            # Remove margins and center canvas
            page.add_style_tag(content="""
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
            
            /* Focus state indicator */
            .focus-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                color: white;
                transition: background-color 0.3s;
            }
            .focused { background-color: rgba(0, 128, 0, 0.7); }
            .blurred { background-color: rgba(255, 0, 0, 0.7); }
            """)

            # Add focus indicator to the page
            page.evaluate("""
            const indicator = document.createElement('div');
            indicator.className = 'focus-indicator blurred';
            indicator.textContent = 'BLURRED';
            document.body.appendChild(indicator);
            
            // Track focus state globally
            window.isFocused = false;
            
            // Add native focus/blur listeners for debugging
            window.addEventListener('focus', () => {
                indicator.className = 'focus-indicator focused';
                indicator.textContent = 'FOCUSED';
                window.isFocused = true;
            });
            
            window.addEventListener('blur', () => {
                indicator.className = 'focus-indicator blurred';
                indicator.textContent = 'BLURRED';
                window.isFocused = false;
            });
            """)

            # Set up action replay
            current_action_idx = 0

            # Track the last action type to handle special sequences
            last_action_type = None
            
            # Keep tracking frames and executing actions at the right time
            while current_action_idx < len(actions):
                # Get current frame count
                frame_count = page.evaluate("window.gameInstance.frameCount")
                
                # Check if we have an action to execute at this frame
                if frame_count >= actions[current_action_idx]["framecount"]:
                    action = actions[current_action_idx]
                    print(action)
                    
                    # Special case: When the game is not focused and the user moves the mouse to the "start" button and click it to start the game,
                    # the recorded actions are only "focus" followed by "mouseup". The "mousedown" is not recorded because the game is not focused yet.
                    if last_action_type == "focus" and action["type"] == "mouseup":
                        if debug:
                            print(f"Frame {frame_count}: Detected focus+mouseup sequence, adding implicit mousedown")
                        # Implicit mousedown at the same position as the mouseup
                        page.mouse.move(action["x"], action["y"])
                        page.mouse.down(button="left" if action.get("button", 0) == 0 else "right")
                    
                    # Execute the action based on its type
                    if action["type"] == "mousedown":
                        if debug:
                            print(f"Frame {frame_count}: Executing mousedown at ({action['x']}, {action['y']})")
                        page.mouse.move(action["x"], action["y"])
                        page.mouse.down(button="left" if action.get("button", 0) == 0 else "right")
                    elif action["type"] == "mouseup":
                        if debug:
                            print(f"Frame {frame_count}: Executing mouseup")
                        page.mouse.up(button="left" if action.get("button", 0) == 0 else "right")
                    elif action["type"] == "mousemove":
                        if debug:
                            print(f"Frame {frame_count}: Moving mouse to ({action['x']}, {action['y']})")
                        page.mouse.move(action["x"], action["y"])
                    elif action["type"] == "click":
                        if debug:
                            print(f"Frame {frame_count}: Clicking at ({action['x']}, {action['y']})")
                        # Perform a full click (move + down + up)
                        page.mouse.move(action["x"], action["y"])
                        page.mouse.click(action["x"], action["y"], button="left" if action.get("button", 0) == 0 else "right")
                    elif action["type"] == "keydown":
                        if debug:
                            print(f"Frame {frame_count}: Key down {action['key']}")
                        # Handle key down event - just press the key down without releasing
                        page.keyboard.down(action['key'])
                    elif action["type"] == "keyup":
                        if debug:
                            print(f"Frame {frame_count}: Key up {action['key']}")
                        # Handle key up event
                        page.keyboard.up(action['key'])
                    elif action["type"] == "focus":
                        if debug:
                            print(f"Frame {frame_count}: Focus")
                        # Set focus to the canvas or window
                        page.evaluate("""
                        document.querySelector('canvas').focus();
                        window.focus();
                        const indicator = document.querySelector('.focus-indicator');
                        indicator.className = 'focus-indicator focused';
                        indicator.textContent = 'FOCUSED';
                        window.isFocused = true;
                        """)
                    elif action["type"] == "blur":
                        if debug:
                            print(f"Frame {frame_count}: Blur")
                        # Remove focus
                        page.evaluate("""
                        document.querySelector('canvas').blur();
                        const indicator = document.querySelector('.focus-indicator');
                        indicator.className = 'focus-indicator blurred';
                        indicator.textContent = 'BLURRED';
                        window.isFocused = false;
                        """)
                    else:
                        if debug:
                            print(f"Frame {frame_count}: Unknown action type: {action['type']}")
                    
                    # Store the last action type for special sequence detection
                    last_action_type = action["type"]
                    
                    # Move to next action
                    current_action_idx += 1
                
                # Small delay to prevent hammering the browser
                # time.sleep(0.001)
                
            
            # if debug:
            #     print("All actions executed. Press Enter to continue...")
            #     input()
            
            browser.close()
            
    finally:
        # Clean up temp directory
        shutil.rmtree(temp_dir)


if __name__ == "__main__":
    debug = True

    games_dataset_id = "generative-games/gen-games-v3"
    preferences_dataset_id = "generative-games/gen-games-v3-preferences-test"

    # Load datasets
    games_dataset = datasets.load_dataset(games_dataset_id, split="train")
    preferences_dataset = datasets.load_dataset(preferences_dataset_id, split="train")
    
    
    for preference in preferences_dataset:
        actions_a = json.loads(preference["actions_a"])
        actions_b = json.loads(preference["actions_b"])

        # Get corresponding games from the game dataset
        game_a = games_dataset.filter(lambda x: x["id"] == preference["game_a_id"])
        game_b = games_dataset.filter(lambda x: x["id"] == preference["game_b_id"])

        if len(game_a) == 0 or len(game_b) == 0:
            print(f"Game not found: {preference['game_a_id']} or {preference['game_b_id']}")
            continue
        
        game_a = game_a[0]
        game_b = game_b[0]
        
        # Create dictionaries mapping file paths to file contents
        game_a_files = {path: content for path, content in zip(game_a["game_file_paths"], game_a["game_file_contents"])}
        game_b_files = {path: content for path, content in zip(game_b["game_file_paths"], game_b["game_file_contents"])}

        print(f"Replaying game A with {len(actions_a)} actions, method: {game_a['method']}, narrative_id: {game_a['game_narrative_id']}, sample_id: {game_a['game_title']}")
        replay_game(game_a_files, actions_a, save_dir, debug=debug)
        print(f"Replaying game B with {len(actions_b)} actions, method: {game_b['method']}, narrative_id: {game_b['game_narrative_id']}, sample_id: {game_b['game_title']}")
        replay_game(game_b_files, actions_b, save_dir, debug=debug)



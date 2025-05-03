import json
from collections import defaultdict
from pathlib import Path
import random
import numpy as np
import cv2
import matplotlib.pyplot as plt
import os
from typing import Any, Dict, Tuple, Union, Dict, List
from PIL import Image
import tempfile
import pandas as pd
from playwright.sync_api import sync_playwright
import matplotlib.animation as animation
from datasets import load_dataset # Added for dataset loading
import seaborn as sns
import gymnasium as gym
from gymnasium import spaces


games_version = "v5"
run_name = "test"

GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"
# STATIC_ANALYSIS_DATASET = f"generative-games/gen-games-{games_version}-static-analysis"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem / games_version / run_name
save_dir.mkdir(parents=True, exist_ok=True)


def preprocess_p5js_data(image, position, obs_size=(96, 96), grayscale=True):
    """
    Preprocess a single image and position from a p5js environment.
    
    Args:
        image: Image from p5js environment (numpy array)
        position: Position data (x, y coordinates)
        obs_size: Target size for resizing images (width, height)
        
    Returns:
        processed_image: Resized and padded image
        processed_position: Adjusted position coordinates
    """
    def resize_with_padding(image, obs_size=(96, 96)):
        """
        Resize an image to the target size with padding to maintain aspect ratio.
        
        Args:
            image: Input image (numpy array)
            obs_size: Target size as (width, height)
            
        Returns:
            Resized image with padding (numpy array)
        """
        h, w = image.shape[:2]
        target_w, target_h = obs_size
        
        # Calculate aspect ratios
        aspect_ratio_orig = w / h
        aspect_ratio_target = target_w / target_h
        
        # Calculate new dimensions while preserving aspect ratio
        if aspect_ratio_orig > aspect_ratio_target:
            # Width is the limiting factor
            new_w = target_w
            new_h = int(new_w / aspect_ratio_orig)
        else:
            # Height is the limiting factor
            new_h = target_h
            new_w = int(new_h * aspect_ratio_orig)
        
        # Resize the image while preserving aspect ratio
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Create a black canvas of the target size
        padded = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        
        # Calculate padding offsets to center the image
        pad_h = (target_h - new_h) // 2
        pad_w = (target_w - new_w) // 2
        
        # Place the resized image on the canvas
        padded[pad_h:pad_h+new_h, pad_w:pad_w+new_w] = resized
        
        return padded

    # Resize image with padding to maintain aspect ratio
    processed_image = resize_with_padding(image, obs_size)
    
    # Get image dimensions for position adjustment
    h, w = image.shape[:2]
    target_w, target_h = obs_size
    
    # Calculate scaling factors
    aspect_ratio_orig = w / h
    aspect_ratio_target = target_w / target_h
    
    # Calculate new dimensions while preserving aspect ratio
    if aspect_ratio_orig > aspect_ratio_target:
        # Width is the limiting factor
        new_w = target_w
        new_h = int(new_w / aspect_ratio_orig)
        x_scale = target_w / w
        y_scale = new_h / h
        x_offset = 0
        y_offset = (target_h - new_h) // 2
    else:
        # Height is the limiting factor
        new_h = target_h
        new_w = int(new_h * aspect_ratio_orig)
        x_scale = new_w / w
        y_scale = target_h / h
        x_offset = (target_w - new_w) // 2
        y_offset = 0
    
    # Extract position coordinates
    x, y = position
    
    # Normalize original positions if needed
    if x > 1.0 or y > 1.0:
        # Positions are in pixel coordinates, normalize them first
        x_norm = x / w
        y_norm = y / h
    else:
        # Positions are already normalized [0,1]
        x_norm = x
        y_norm = y
    
    # Apply scaling and offset for the new image size
    x_adjusted = (x_norm * x_scale * w + x_offset) / target_w
    y_adjusted = (y_norm * y_scale * h + y_offset) / target_h
    
    processed_position = (x_adjusted, y_adjusted)
    
    # convert image to grayscale
    if grayscale:
        processed_image = cv2.cvtColor(processed_image, cv2.COLOR_RGB2GRAY)
        # Convert grayscale back to 3 channels to match the expected shape
        processed_image = cv2.cvtColor(processed_image, cv2.COLOR_GRAY2RGB)

    return processed_image, processed_position


def inverse_transform_position(transformed_pos, orig_size, obs_size=(96, 96)):
    """
    Inverse transform a position from observation space back to original game space.
    
    Args:
        transformed_pos: Position in observation space (x, y)
        orig_size: Original image dimensions (width, height)
        obs_size: Observation size (width, height)
        
    Returns:
        original_pos: Position in original game space (x, y)
    """
    x, y = transformed_pos
    w, h = orig_size
    target_w, target_h = obs_size
    
    # Calculate scaling factors (same as in preprocess_p5js_data)
    aspect_ratio_orig = w / h
    aspect_ratio_target = target_w / target_h
    
    if aspect_ratio_orig > aspect_ratio_target:
        # Width is the limiting factor
        new_w = target_w
        new_h = int(new_w / aspect_ratio_orig)
        x_scale = target_w / w
        y_scale = new_h / h
        x_offset = 0
        y_offset = (target_h - new_h) // 2
    else:
        # Height is the limiting factor
        new_h = target_h
        new_w = int(new_h * aspect_ratio_orig)
        x_scale = new_w / w
        y_scale = target_h / h
        x_offset = (target_w - new_w) // 2
        y_offset = 0
    
    # Inverse transform: remove padding and scaling
    x_orig = ((x * target_w - x_offset) / (x_scale * w))
    y_orig = ((y * target_h - y_offset) / (y_scale * h))
    
    # Convert back to pixel coordinates if needed
    if x_orig <= 1.0 and y_orig <= 1.0:
        x_orig = x_orig * w
        y_orig = y_orig * h
    
    return (x_orig, y_orig)



class P5jsEnv(gym.Env):
    """A Gym-like interface for P5js games using preprocessed data."""

    metadata = {"render_modes": ["rgb_array"], "render_fps": 30}

    def __init__(
        self, 
        game_code: Dict[str, str], # Dictionary of file paths to file contents
        headless: bool = True,
        framerate: int = 30,
        obs_size: tuple = (96, 96),
        max_episode_steps: int = 200,
    ):
        """Initialize the P5js data environment.
        
        Args:
            game_code: Dictionary mapping file paths (relative to game root) to their content.
                       Must contain at least "index.html".
            headless: Whether to run the browser in headless mode
            framerate: Framerate of the game
            obs_size: Target size for resizing images (width, height)
            max_episode_steps: Maximum steps per episode
        """
        if not game_code or "index.html" not in game_code:
            raise ValueError("`game_code` must be a dictionary containing at least 'index.html'")
            
        self.game_code = game_code
        self.headless = headless
        self.framerate = framerate
        self.obs_size = obs_size
        self._max_episode_steps = max_episode_steps
        
        # State variables
        self.browser = None
        self.page = None
        self.temp_path = None # This will become the temporary directory path
        self.frame_count = 0
        self.playwright = None  # Initialize playwright to None
        
        self.action_space = spaces.Box(low=0, high=1, shape=(2,), dtype=np.float32)
        self.observation_space = spaces.Dict(
            {
                "pixels": spaces.Box(
                    low=0,
                    high=255,
                    shape=(self.obs_size[1], self.obs_size[0], 3),
                    dtype=np.uint8,
                ),
                "agent_pos": spaces.Box(
                    low=np.array([0, 0]),
                    high=np.array([1, 1]),
                    dtype=np.float64,
                ),
                "framecount": spaces.Box(
                    low=0,
                    high=np.inf,
                    shape=(1,),
                    dtype=np.int32,
                ),
            }
        )

    def reset(self, seed=None, options=None) -> np.ndarray:
        super().reset(seed=seed)

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
        # self.page.keyboard.press("Enter")
        self.page.keyboard.down("Enter")
        self._redraw()
        self.page.keyboard.up("Enter")
        
        # Get the initial observation
        obs = self._get_observation()
        self.iter = 0

        info = {}
        info["is_success"] = False
        return obs, info
    
    def step(self, action) -> Tuple[np.ndarray, float, bool, Dict]:
        """Take a step in the environment by performing an action.
        
        Args:
            action: Action to take
        
        Returns:
            observation: New observation after the action
            reward: Reward for the action
            done: Whether the episode is done
            info: Additional information
        """
        print("action: ", action)
        self.previous_action = action
        self._execute_action(action)

        self._redraw()
        
        # Get the new observation
        obs = self._get_observation()
        
        # Calculate reward
        reward = self._get_reward()
        
        # Get player position
        position = self._get_player_position()

        # Additional info
        info = {
            "frame_count": self.frame_count,
            "position": position,
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

    def _execute_action(self, action) -> None:
        last_action_type = None
        debug = True
        frame_count = self._get_framecount()
        # Special case: When the game is not focused and the user moves the mouse to the "start" button and click it to start the game,
        # the recorded actions are only "focus" followed by "mouseup". The "mousedown" is not recorded because the game is not focused yet.
        if last_action_type == "focus" and action["type"] == "mouseup":
            if debug:
                print(f"Frame {frame_count}: Detected focus+mouseup sequence, adding implicit mousedown")
            # Implicit mousedown at the same position as the mouseup
            self.page.mouse.move(action["x"], action["y"])
            self.page.mouse.down(button="left" if action.get("button", 0) == 0 else "right")
        
        # Execute the action based on its type
        if action["type"] == "mousedown":
            if debug:
                print(f"Frame {frame_count}: Executing mousedown at ({action['x']}, {action['y']})")
            self.page.mouse.move(action["x"], action["y"])
            self.page.mouse.down(button="left" if action.get("button", 0) == 0 else "right")
        elif action["type"] == "mouseup":
            if debug:
                print(f"Frame {frame_count}: Executing mouseup")
            self.page.mouse.up(button="left" if action.get("button", 0) == 0 else "right")
        elif action["type"] == "mousemove":
            if debug:
                print(f"Frame {frame_count}: Moving mouse to ({action['x']}, {action['y']})")
            self.page.mouse.move(action["x"], action["y"])
        elif action["type"] == "click":
            if debug:
                print(f"Frame {frame_count}: Clicking at ({action['x']}, {action['y']})")
            # Perform a full click (move + down + up)
            self.page.mouse.move(action["x"], action["y"])
            self.page.mouse.click(action["x"], action["y"], button="left" if action.get("button", 0) == 0 else "right")
        elif action["type"] == "keydown":
            if debug:
                print(f"Frame {frame_count}: Key down {action['key']}")
            # Handle key down event - just press the key down without releasing
            self.page.keyboard.down(action['key'])
        elif action["type"] == "keyup":
            if debug:
                print(f"Frame {frame_count}: Key up {action['key']}")
            # Handle key up event
            self.page.keyboard.up(action['key'])
        elif action["type"] == "focus":
            if debug:
                print(f"Frame {frame_count}: Focus")
            # Set focus to the canvas or window
            self.page.evaluate("""
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
            self.page.evaluate("""
            document.querySelector('canvas').blur();
            const indicator = document.querySelector('.focus-indicator');
            indicator.className = 'focus-indicator blurred';
            indicator.textContent = 'BLURRED';
            window.isFocused = false;
            """)
        else:
            if debug:
                print(f"Frame {frame_count}: Unknown action type: {action['type']}")
            
    def _get_observation(self) -> np.ndarray:
        # Get image data directly from canvas using toDataURL (similar to p5.capture approach)
        data_url = self.page.evaluate("""() => {
            const canvas = document.querySelector('canvas');
            return canvas ? canvas.toDataURL('image/png') : null;
        }""")
        
        # Convert base64 data URL to numpy array
        import io
        import base64
        
        # Extract the base64 encoded data from the data URL
        header, encoded = data_url.split(",", 1)
        binary_data = base64.b64decode(encoded)
        
        # Convert to numpy array using PIL
        image = Image.open(io.BytesIO(binary_data))
        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        image_array = np.array(image)
        
        # TODO: why pos seems to be lagging by one frame?
        position = self._get_player_position()

        # store original image size
        self.original_image_size = (image_array.shape[1], image_array.shape[0])
        
        # Process the image and position
        processed_image, processed_position = preprocess_p5js_data(
            image_array, 
            position, 
            self.obs_size
        )
        return {
            "pixels": processed_image,
            "agent_pos": np.array(processed_position)
        }
    
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


def analyze_logs(logs, save_dir=None):
    movements_by_type = defaultdict(list)
    for event in logs["movements"]:
        movements_by_type[event["movement_type"]].append(event)

    interactions_by_type = defaultdict(list)
    for event in logs["interactions"]:
        interactions_by_type[event["interaction_type"]].append(event)

    inputs_by_type = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_type[event["input_type"]].append(event)

    if save_dir is not None:
        save_dir.mkdir(exist_ok=True, parents=True)

        plt.figure()
        for mvt_type, events in movements_by_type.items():
            print(mvt_type, len(events))
            plt.bar(mvt_type, len(events))
        plt.savefig(save_dir / "movements_counts.png")

        # bar plot of interaction type counts
        plt.figure()
        for interaction_type, events in interactions_by_type.items():
            print(interaction_type, len(events))
            plt.bar(interaction_type, len(events))
        plt.savefig(save_dir / "interactions_counts.png")


    results = {
        "interactions": interactions_by_type,
        "movements": movements_by_type,
        "interaction_counts": {k: len(v) for k, v in interactions_by_type.items() if len(v) > 0},
        "movement_counts": {k: len(v) for k, v in movements_by_type.items() if len(v) > 0},
        "interaction_types": [k for k, v in interactions_by_type.items() if len(v) > 0],
        "movement_types": [k for k, v in movements_by_type.items() if len(v) > 0]
    }
    return results


if __name__ == "__main__":
    
    print(f"Loading dataset: {GAMES_DATASET}")
    game_dataset = load_dataset(GAMES_DATASET, split="train", token=os.environ.get("HF_TOKEN"))
    print(f"Loaded dataset with {len(game_dataset)} games")

    rating_dataset = load_dataset(RATING_DATASET, split="train", token=os.environ.get("HF_TOKEN"))
    print(f"Loaded rating dataset with {len(rating_dataset)} games")

    results = defaultdict(lambda: defaultdict(dict))
    for i in range(len(game_dataset)):
        game_data = game_dataset[i] 
        game_id = game_data["id"]
        print(f"Using game ID: {game_id}")
        _save_dir = save_dir / "random_policy" / game_id
        _save_dir.mkdir(parents=True, exist_ok=True)

        if (_save_dir / "results.json").exists():
            print(f"Skipping game {game_id} because it already exists")
            with open(_save_dir / "results.json", "r") as f:
                res = json.load(f)
            
            results[game_data["model"]][game_data["method"]].update(
                {
                    game_data["game_concept"]: res
                }
            )
            continue

        if (_save_dir / "logs.json").exists():
            print(f"Skipping game {game_id} because it already exists")
            with open(_save_dir / "logs.json", "r") as f:
                logs = json.load(f)

        else:

            # Construct the game_code dictionary
            game_code = {
                path: content 
                for path, content in zip(game_data["game_file_paths"], game_data["game_file_contents"])
            }
            
            # Initialize environment

            # Reset environment
            print("Resetting environment...")
            try:
                # can raise error if no index.html
                env = P5jsEnv(
                    game_code=game_code,
                    headless=True,
                    obs_size=(96, 96)
                )
            except Exception as e:
                print(f"Error initializing environment: {e}")
                continue

            try:
                # can raise error if gameInstance not found
                obs, info = env.reset()
                print(f"Observation shape: {obs['pixels'].shape}")
            except Exception as e:
                print(f"Error resetting environment: {e}")
                env.close()
                continue

            frames = [obs['pixels']]
            positions = [obs['agent_pos']]

            # arrow keys or space
            keys = ["ArrowLeft", "ArrowRight", " ", "Enter"]
            current_key = random.choice(keys)
            sample_key_every = 10

            for i in range(100):
                print(f"Step {i}")

                if i % sample_key_every == 0:
                    action = {
                        "type": "keyup",
                        "key": current_key
                    }
                    current_key = random.choice(keys)
                else:
                    action = {
                        "type": "keydown",
                        "key": current_key
                    }

                obs, reward, terminated, truncated, info = env.step(action)
                frames.append(obs['pixels'])
                positions.append(obs['agent_pos'])

            logs = env.get_logs()
            # save logs
            with open(_save_dir / "logs.json", "w") as f:
                json.dump(logs, f)

            # animate frames and overlay positions
            import matplotlib.animation as animation
            
            # Create figure and axis
            fig, ax = plt.subplots(figsize=(8, 8))
            
            # Initialize the image
            img_plot = ax.imshow(frames[0])
            
            # Function to update the animation
            def update(frame_idx):
                # Clear previous position markers
                ax.clear()
                ax.imshow(frames[frame_idx])
                
                # Plot the position
                pos = positions[frame_idx]
                ax.plot(pos[0] * frames[frame_idx].shape[1], pos[1] * frames[frame_idx].shape[0], 'ro', markersize=10)
                
                # Add frame number
                ax.text(10, 20, f"Frame: {frame_idx}", color='white', fontsize=12, 
                        bbox=dict(facecolor='black', alpha=0.5))
                
                # Remove axis ticks
                ax.set_xticks([])
                ax.set_yticks([])
                
                return []
            
            # Create animation
            ani = animation.FuncAnimation(fig, update, frames=len(frames), 
                                        interval=50, blit=False)
            
            # Save animation
            # ani.save(save_dir / "animation.mp4", writer='ffmpeg', fps=30)
            # save as gif
            ani.save(_save_dir / "animation.gif", writer='pillow', fps=60)
            print(f"Animation saved to {_save_dir / 'animation.gif'}")
            
            env.close()


        res = analyze_logs(logs, _save_dir)

        results[game_data["model"]][game_data["method"]].update(
            {
                game_data["game_concept"]: res
            }
        )

        # save res
        with open(_save_dir / "results.json", "w") as f:
            json.dump(res, f)



    human_results = defaultdict(lambda: defaultdict(dict))
    for entry in rating_dataset:
        rating_id = entry["id"]
        game_id = entry["game_id"]

        # find matching game 
        game = game_dataset.filter(lambda x: x["id"] == game_id)
        assert len(game) == 1
        game = game[0]

        model = game["model"]
        method = game["method"]
        logs = json.loads(entry["logs"])

        # TODO
        if len(logs) == 0:
            continue

        human_res = analyze_logs(logs)
        human_results[model][method].update(
            {
                game["game_concept"]: human_res
            }
        )


        # policy_res = results[model][method][game["game_concept"]]

        # print("interaction types")
        # print("human", human_res["interaction_types"])
        # print("policy", policy_res["interaction_types"])

        # print("movement types")
        # print("human", human_res["movement_types"])
        # print("policy", policy_res["movement_types"])

        # print("-"*100)
        # comp_results["game_concept"].append(game_concept)
        # comp_results["model"].append(model)
        # comp_results["method"].append(method)
        # comp_results["human_interaction_types"].append(human_res["interaction_types"])
        # comp_results["policy_interaction_types"].append(policy_res["interaction_types"])
        # comp_results["human_movement_types"].append(human_res["movement_types"])
        # comp_results["policy_movement_types"].append(policy_res["movement_types"])

    def get_results_by_type(results, key):
        results_by_type = defaultdict(list)
        for game_name, res in results.items():
            for interaction_type in res[key]:
                results_by_type[interaction_type].append(game_name)
        return results_by_type

    for model in results.keys():
        for method in results[model].keys():
            _save_dir = save_dir / model / method
            _save_dir.mkdir(parents=True, exist_ok=True)

            human_res = human_results[model][method]
            policy_res = results[model][method]

            # aggregate results by type (list of games for each type)
            human_interaction_by_type = get_results_by_type(human_res, "interaction_types")
            policy_interaction_by_type = get_results_by_type(policy_res, "interaction_types")

            human_movement_by_type = get_results_by_type(human_res, "movement_types")
            policy_movement_by_type = get_results_by_type(policy_res, "movement_types")

            # compute game counts
            human_interaction_counts = {k: len(v) for k, v in human_interaction_by_type.items()}
            policy_interaction_counts = {k: len(v) for k, v in policy_interaction_by_type.items()}

            human_movement_counts = {k: len(v) for k, v in human_movement_by_type.items()}
            policy_movement_counts = {k: len(v) for k, v in policy_movement_by_type.items()}

            # sort by counts in human results
            sorted_human_interaction_counts = sorted(human_interaction_counts.items(), key=lambda x: x[1], reverse=True)
            sorted_human_movement_counts = sorted(human_movement_counts.items(), key=lambda x: x[1], reverse=True)

            sorted_policy_interaction_counts = sorted(policy_interaction_counts.items(), key=lambda x: human_interaction_counts[x[0]], reverse=True)
            sorted_policy_movement_counts = sorted(policy_movement_counts.items(), key=lambda x: human_movement_counts[x[0]], reverse=True)

            # plot counts for movement types
            plt.figure(figsize=(8, 5))
            movement_data = pd.DataFrame({
                'type': [x[0] for x in sorted_human_movement_counts] + [x[0] for x in sorted_policy_movement_counts],
                'count': [x[1] for x in sorted_human_movement_counts] + [x[1] for x in sorted_policy_movement_counts],
                'source': ['human'] * len(sorted_human_movement_counts) + ['policy'] * len(sorted_policy_movement_counts)
            })
            sns.barplot(data=movement_data, x='type', y='count', hue='source')
            plt.xticks(rotation=90)
            plt.xlabel('')
            ax = plt.gca()
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.legend(title='')
            plt.tight_layout()
            plt.savefig(_save_dir / "movement_counts.png")

            # plot counts for interaction types
            plt.figure(figsize=(8, 5))
            interaction_data = pd.DataFrame({
                'type': [x[0] for x in sorted_human_interaction_counts] + [x[0] for x in sorted_policy_interaction_counts],
                'count': [x[1] for x in sorted_human_interaction_counts] + [x[1] for x in sorted_policy_interaction_counts],
                'source': ['human'] * len(sorted_human_interaction_counts) + ['policy'] * len(sorted_policy_interaction_counts)
            })
            sns.barplot(data=interaction_data, x='type', y='count', hue='source')
            plt.xticks(rotation=90)
            plt.xlabel('')
            ax = plt.gca()
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.legend(title='')
            plt.tight_layout()
            plt.savefig(_save_dir / "interaction_counts.png")






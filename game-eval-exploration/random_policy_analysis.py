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
import matplotlib.pyplot as plt

import gymnasium as gym
from gymnasium import spaces
from playwright.sync_api import sync_playwright


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
        self.action_history.append(action.copy())

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


def run_policy(code, num_steps=10000, headless=True):
    env = P5jsEnv(code, headless=headless)
    env.reset()
    prev_action = np.zeros(env.action_space.shape)
    L = 5
    for i in range(num_steps):
        if i % 4000 == 0:
            # reset the game
            key = env.KEY_TO_INDEX["r"]
            action = np.zeros(env.action_space.shape)
            action[key] = 1
            prev_action = action.copy()
        elif i % L == 0:
            # sample new key to press (except 'r')
            key = np.random.randint(0, env.action_space.shape[0]-1)
            action = np.zeros(env.action_space.shape)
            action[key] = 1
            prev_action = action.copy()
            # sample new L
            L = np.random.randint(5, 500)
        else:
            action = prev_action

        env.step(action)
        print(i)
    env.close()


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

        run_policy(code_original, headless=False)
        run_policy(code_improved, headless=False)

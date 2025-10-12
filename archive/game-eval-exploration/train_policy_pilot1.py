from datetime import datetime
from pathlib import Path
import json
import shutil
import tempfile
import cv2
import sys
import argparse
from collections import defaultdict
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from typing import Dict, Tuple, Union
import io
import base64
from PIL import Image
    
import gymnasium as gym
from gymnasium import spaces

import torch
import torch.nn as nn
from torch.utils.data import Dataset
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from datasets import load_dataset
from huggingface_hub import hf_hub_download

from playwright.sync_api import sync_playwright

import pytorch_lightning as pl
from pytorch_lightning.loggers import WandbLogger
from pytorch_lightning.callbacks import ModelCheckpoint


# mapping between key codes and index in key vector
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
KEY_CODE_TO_KEY = {
    13: "Enter",
    32: " ",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    82: "r",
}

INPUT_EVENT_TYPES = ["keyPressed", "keyReleased"]

# Create action classes for all possible combinations of up to 2 keys
def create_action_classes():
    # No keys pressed (1 option)
    no_key_action = {0: []}
    
    # Single key presses (len(KEY_TO_INDEX) options)
    single_key_actions = {i+1: [i] for i in range(len(KEY_TO_INDEX))}
    
    # Two key combinations (len(KEY_TO_INDEX) choose 2 options)
    two_key_actions = {}
    class_idx = len(KEY_TO_INDEX) + 1
    for i in range(len(KEY_TO_INDEX)):
        for j in range(i+1, len(KEY_TO_INDEX)):
            two_key_actions[class_idx] = [i, j]
            class_idx += 1
    
    # Combine all action classes
    action_classes = {**no_key_action, **single_key_actions, **two_key_actions}
    # Also create reverse mapping for encoding
    action_indices = {tuple(sorted(v)): k for k, v in action_classes.items()}
    
    return action_classes, action_indices

ACTION_CLASSES, ACTION_INDICES = create_action_classes()
NUM_ACTION_CLASSES = len(ACTION_CLASSES)

def encode_action(action_vector):
    # Find which keys are pressed (indices where value is 1)
    pressed_keys = [i for i, v in enumerate(action_vector) if v > 0.5]
    pressed_keys = tuple(sorted(pressed_keys))
    
    # Get the class index for this combination
    return ACTION_INDICES.get(pressed_keys, ACTION_INDICES[()])  # Default to no keys

def decode_action(action_class):
    # Get the keys that should be pressed for this class
    pressed_keys = ACTION_CLASSES.get(action_class, [])
    # Create binary action vector
    action = np.zeros(len(KEY_TO_INDEX))
    for key_idx in pressed_keys:
        action[key_idx] = 1.0
    return action


games_version = "v5"
run_name = "pilot1"
GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"


timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
RUN_NAME = f"run_{timestamp}"  # Default run name
CHECKPOINT_DIR = None  # Will be set once RUN_NAME is determined

# Define log directories at the module level
log_dirs = [
    Path(__file__).parent / "results" / "games_v5" / "rating_46cb9522-1ca3-4676-96f4-855276f1ea2a_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1",
    Path(__file__).parent / "results" / "games_v5" / "rating_42a0b09d-9cfe-4ebe-8e59-13c9b46ab150_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"
    # Path(__file__).parent / "results" / "games_v6" / "rating_f44c1006-31f9-4621-a6d6-b46e2d181662_game_e94e6d38decf1bba54bcffd14217319d5f07cbafafb721b132efd2220519eabb"
]

def load_data_from_dir(log_dir):
    with open(log_dir / "logs.json", "r", encoding="utf-8") as f:
        logs = json.load(f)

    video_path = log_dir / "video.mp4"

    video_metadata = json.load(open(video_path.parent / "metadata.json", "r"))
    # Important: the first frame in the video corresponds to video_framecount_start + 1
    # the video is started at video_framecount_start but the first captured frame is video_framecount_start + 1
    video_framecount_start = int(video_metadata["video_start_framecount"])
    # video_fps = int(video_metadata["fps"])

    return video_path, logs, video_framecount_start


def load_data(video_path, logs, video_framecount_start):
    """
    Load data from video and logs.
    By convention, action a_t is the action from frame I_t to I_{t+1}.

    Args:
        video_path: Path to the video file
        logs: Dictionary containing game logs
        video_framecount_start: Frame count at which video starts

    Returns:
        frames: List of numpy arrays containing video frames
        key_actions: Array of shape (num_frames, num_keys) with binary key states
        player_positions: List of tuples (x, y) for player positions
        events: List of strings for events to display
    """
    # Load video
    cap = cv2.VideoCapture(str(video_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Extract frames
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame_rgb)
    
    # Process key actions
    inputs_by_frame = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_frame[event["framecount"]].append(event)
    
    key_actions = np.zeros((total_frames, len(KEY_TO_INDEX)))
    for idx, framecount in enumerate(range(video_framecount_start, total_frames + video_framecount_start)):
        if idx == 0:
            prev_key_vector = np.zeros(len(KEY_TO_INDEX))
        else:
            prev_key_vector = key_actions[idx-1]
            
        if framecount not in inputs_by_frame:
            new_key_vector = prev_key_vector
        else:    
            events = inputs_by_frame[framecount]
            new_key_vector = prev_key_vector.copy()
            for event in events:
                event_type = event["input_type"]
                if event_type not in INPUT_EVENT_TYPES:
                    continue

                if "key" in event["data"]:                
                    key = event["data"]["key"]
                elif "keyCode" in event["data"]:
                    key_code = event["data"]["keyCode"]
                    if key_code not in KEY_CODE_TO_KEY:
                        print(f"Unexpected key code: {key_code}")
                        continue
                    key = KEY_CODE_TO_KEY[key_code]
                else:
                    raise ValueError(f"Unexpected event data: {event['data']}")

                if key not in KEY_TO_INDEX:
                    continue
                key_idx = KEY_TO_INDEX[key]

                if event_type == "keyPressed":
                    new_key_vector[key_idx] = 1
                elif event_type == "keyReleased":
                    new_key_vector[key_idx] = 0

        key_actions[idx] = new_key_vector    

    # make sure action precedes change in frame (a_t is the action from I_t to I_{t+1})
    key_actions = key_actions[1:]  # shift actions back by 1
    # add zero action at the end
    key_actions = np.concatenate([key_actions, np.zeros((1, len(KEY_TO_INDEX)))], axis=0)

    # Process player positions
    canvas_size = (600, 400)  # Default canvas size
    scale_x = video_width / canvas_size[0]
    scale_y = video_height / canvas_size[1]
    
    player_pos_by_frame = {}
    for event in logs["player_positions"]:
        player_pos_by_frame[event["framecount"]] = (event["screen_x"], event["screen_y"])
    
    player_positions = []
    for idx in range(total_frames):
        framecount = idx + video_framecount_start + 1
        if framecount in player_pos_by_frame:
            x, y = player_pos_by_frame[framecount]
            x = x * scale_x
            y = y * scale_y
            player_positions.append((x, y))
        else:
            player_positions.append(None)
    
    # Process events
    events_by_frame = defaultdict(list)
    
    # Game states
    for event in logs.get("game_states", []):
        frame = event["framecount"]
        events_by_frame[frame].append(f"State: {event['game_state']}")
    
    # Movements
    for event in logs.get("movements", []):
        frame = event["framecount"]
        events_by_frame[frame].append(f"Move: {event['movement_type']}")
    
    # Interactions
    for event in logs.get("interactions", []):
        frame = event["framecount"]
        events_by_frame[frame].append(f"Interaction: {event['interaction_type']}")
    
    # Inputs
    for event in logs.get("inputs", []):
        frame = event["framecount"]
        events_by_frame[frame].append(f"Input: {event['input_type']}")
    
    events = []
    for idx in range(total_frames):
        framecount = idx + video_framecount_start + 1
        if framecount in events_by_frame:
            events.append(events_by_frame[framecount])
        else:
            events.append([])
    
    cap.release()
    return frames, key_actions, player_positions, events


class GameDataset(Dataset):
    def __init__(self, frames, key_actions, player_positions=None, transform=None, img_size=(96, 96), obs_seq_len=4):
        """
        PyTorch Dataset for game frames and actions
        
        Args:
            frames: List of numpy arrays containing video frames
            key_actions: Array of shape (num_frames, num_keys) with binary key states
            player_positions: List of (x, y) tuples for player positions
            transform: Optional transform to apply to the frames
            img_size: Target size for resizing images (height, width)
            obs_seq_len: Length of observation sequence (frames and actions)
        """
        self.frames = frames
        self.key_actions = key_actions
        self.player_positions = player_positions
        self.transform = transform
        self.img_size = img_size
        self.obs_seq_len = obs_seq_len
        
    def __len__(self):
        # Skip first frames plus (obs_seq_len - 1) frames
        return max(0, len(self.frames) - self.obs_seq_len)
    
    def __getitem__(self, idx):
        # Get a stack of consecutive frames
        frame_stack = []
        action_stack = []
        position_stack = []
        
        for i in range(self.obs_seq_len):
            # Stack frames
            frame = self.frames[idx + i]
            # Resize the frame to match model's expected input
            frame = cv2.resize(frame, self.img_size)
            
            # Convert frame to tensor and normalize
            if self.transform:
                frame = self.transform(frame)
            else:
                # Simple default transform: convert to tensor and normalize
                frame = torch.FloatTensor(frame.transpose(2, 0, 1)) / 255.0
                
            frame_stack.append(frame)
            
            # Stack positions if available
            if self.player_positions is not None and self.player_positions[idx + i] is not None:
                x, y = self.player_positions[idx + i]
                # Normalize positions to [0, 1]
                position = torch.FloatTensor([float(x) / self.img_size[0], float(y) / self.img_size[1]])
                position_stack.append(position)
            else:
                # If position is not available, use zeros
                position_stack.append(torch.zeros(2))
            
            # Stack actions (except for the last frame which is the target)
            if i < self.obs_seq_len - 1:
                action = torch.FloatTensor(self.key_actions[idx + i])
                action_stack.append(action)
        
        # Stack the frames along the channel dimension
        # Each frame has shape [C, H, W], stack to get [C*obs_seq_len, H, W]
        stacked_frames = torch.cat(frame_stack, dim=0)
        
        # Stack the actions into a single tensor
        stacked_actions = torch.stack(action_stack, dim=0)  # Shape: [obs_seq_len-1, num_keys]
        
        # Stack the positions into a single tensor
        stacked_positions = torch.stack(position_stack, dim=0)  # Shape: [obs_seq_len, 2]
        
        # Target is the action class for the last frame in the sequence
        target_action = self.key_actions[idx + self.obs_seq_len - 1]
        target_action_class = encode_action(target_action)
        
        return {
            'frame_stack': stacked_frames, 
            'action_stack': stacked_actions,
            'position_stack': stacked_positions
        }, target_action_class


class P5jsEnv(gym.Env):
    """A Gym-like interface for P5js games using preprocessed data."""

    metadata = {"render_modes": ["rgb_array"], "render_fps": 60}

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
        
        self.action_space = spaces.Box(low=0, high=1, shape=(len(KEY_TO_INDEX),), dtype=np.float32)
        
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
                shape=((self.obs_seq_len - 1), len(KEY_TO_INDEX)),
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
        obs = self._get_observation()
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
        # Convert action class to binary vector if needed
        if isinstance(action, (int, np.integer)):
            action = decode_action(action)
            
        # Convert binary action vector to key press/release events
        if len(self.action_history) > 0:
            last_action = self.action_history[-1]
            # Compare with previous action to detect changes
            for i, (prev, curr) in enumerate(zip(last_action, action)):
                # Get the key name for this index
                key = list(KEY_TO_INDEX.keys())[list(KEY_TO_INDEX.values()).index(i)]
                
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
                    key = list(KEY_TO_INDEX.keys())[list(KEY_TO_INDEX.values()).index(i)]
                    print(f"Pressing {key}")
                    self.page.keyboard.down(key)
        
        # Add action to history
        self.action_history.append(action.copy())

        # Redraw the game
        self._redraw()
        
        # Get the new observation
        obs = self._get_observation()
        
        # Calculate reward
        reward = self._get_reward()
        
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
            self.action_history.insert(0, np.zeros(len(KEY_TO_INDEX), dtype=np.float32))
        
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


# class GamePolicy(nn.Module):
#     def __init__(self, img_size=(96, 96), obs_seq_len=4, use_positions=True, num_classes=NUM_ACTION_CLASSES):
#         super().__init__()
        
#         # Calculate input channels based on observation sequence length
#         self.input_channels = 3 * obs_seq_len
        
#         # CNN backbone for image processing
#         self.cnn = nn.Sequential(
#             nn.Conv2d(self.input_channels, 32, kernel_size=8, stride=4),
#             nn.ReLU(),
#             nn.Conv2d(32, 64, kernel_size=4, stride=2),
#             nn.ReLU(),
#             nn.Conv2d(64, 64, kernel_size=3, stride=1),
#             nn.ReLU(),
#             nn.Flatten()
#         )
        
#         # Calculate CNN output size
#         h_out = (img_size[1] - 8) // 4 + 1
#         h_out = (h_out - 4) // 2 + 1
#         h_out = (h_out - 3) // 1 + 1
        
#         w_out = (img_size[0] - 8) // 4 + 1
#         w_out = (w_out - 4) // 2 + 1
#         w_out = (w_out - 3) // 1 + 1
        
#         cnn_output_size = 64 * h_out * w_out
        
#         # Action history processing
#         self.action_size = len(KEY_TO_INDEX) * (obs_seq_len - 1)
        
#         # Position processing if enabled
#         self.use_positions = use_positions
#         if use_positions:
#             self.position_size = 2 * obs_seq_len
#             combined_size = cnn_output_size + self.action_size + self.position_size
#         else:
#             combined_size = cnn_output_size + self.action_size
        
#         # Policy head
#         self.policy_head = nn.Sequential(
#             nn.Linear(combined_size, 512),
#             nn.ReLU(),
#             nn.Linear(512, num_classes)
#         )
    
#     def forward(self, x):
#         # Process image frames
#         frame_stack = x['frame_stack']
#         cnn_features = self.cnn(frame_stack)
        
#         # Process action history
#         action_stack = x['action_stack']
#         action_flat = action_stack.reshape(action_stack.shape[0], -1)
        
#         # Process player positions if enabled
#         if self.use_positions:
#             position_stack = x['position_stack']
#             position_flat = position_stack.reshape(position_stack.shape[0], -1)
#             combined = torch.cat([cnn_features, action_flat, position_flat], dim=1)
#         else:
#             combined = torch.cat([cnn_features, action_flat], dim=1)
        
#         # Output action logits
#         logits = self.policy_head(combined)
#         return logits


class GamePolicy(nn.Module):
    def __init__(self, img_size=(96, 96), obs_seq_len=4, use_positions=True, num_classes=NUM_ACTION_CLASSES):
        super().__init__()
        
        # Calculate input channels based on observation sequence length
        self.input_channels = 3 * obs_seq_len
        
        # CNN backbone for image processing
        self.cnn = nn.Sequential(
            nn.Conv2d(self.input_channels, 32, kernel_size=8, stride=4),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=4, stride=2),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, stride=1),
            nn.ReLU(),
            nn.Flatten()
        )
        
        # Calculate CNN output size
        h_out = (img_size[1] - 8) // 4 + 1
        h_out = (h_out - 4) // 2 + 1
        h_out = (h_out - 3) // 1 + 1
        
        w_out = (img_size[0] - 8) // 4 + 1
        w_out = (w_out - 4) // 2 + 1
        w_out = (w_out - 3) // 1 + 1
        
        cnn_output_size = 64 * h_out * w_out
        
        # Action history processing
        self.action_size = len(KEY_TO_INDEX) * (obs_seq_len - 1)
        
        # Position processing if enabled
        self.use_positions = use_positions
        if use_positions:
            self.position_size = 2 * obs_seq_len
            combined_size = cnn_output_size + self.action_size + self.position_size
        else:
            combined_size = cnn_output_size + self.action_size
        
        # Policy head
        self.policy_head = nn.Sequential(
            nn.Linear(cnn_output_size, 512),
            nn.ReLU(),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        # Process image frames
        frame_stack = x['frame_stack']
        cnn_features = self.cnn(frame_stack)
        
        logits = self.policy_head(cnn_features)
        return logits


class GamePolicyLightning(pl.LightningModule):
    def __init__(self, img_size=(96, 96), obs_seq_len=4, use_positions=True, 
                 learning_rate=1e-4, weight_decay=1e-5):
        super().__init__()
        self.save_hyperparameters()
        
        # Create policy model
        self.model = GamePolicy(
            img_size=img_size,
            obs_seq_len=obs_seq_len,
            use_positions=use_positions
        )
        
        # Loss function
        self.criterion = nn.CrossEntropyLoss()
        
    def forward(self, x):
        return self.model(x)
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = self.criterion(logits, y)
        
        # Calculate accuracy
        preds = torch.argmax(logits, dim=1)
        acc = (preds == y).float().mean()
        
        # Log metrics
        self.log('train_loss', loss, prog_bar=True)
        self.log('train_acc', acc, prog_bar=True)
        
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = self.criterion(logits, y)
        
        # Calculate accuracy
        preds = torch.argmax(logits, dim=1)
        acc = (preds == y).float().mean()
        
        # Log metrics
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', acc, prog_bar=True)
        
        return loss
    
    def configure_optimizers(self):
        optimizer = torch.optim.Adam(
            self.parameters(),
            lr=self.hparams.learning_rate,
            weight_decay=self.hparams.weight_decay
        )
        return optimizer


def load_human_data():
    game_dataset = load_dataset(GAMES_DATASET, split="train")
    rating_dataset = load_dataset(RATING_DATASET, split="train")

    # remove test users (any user with "test" in their id)
    rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
    print(f"After removing test users: {rating_dataset}")

    all_actions = []
    all_player_positions = []
    all_frames = []

    for i, entry in enumerate(rating_dataset):
        rating_id = entry["id"]
        game_id = entry["game_id"]
        game = game_dataset.filter(lambda x: x["id"] == game_id)
        assert len(game) == 1
        game = game[0]

        # retrieve corresponding video
        key = f"rating_{rating_id}_game_{game_id}"
        video_filename = f"{key}.mp4"

        try:
            video_path = hf_hub_download(
                repo_id=VIDEO_DATASET,
                filename=video_filename,
                repo_type="dataset",
            )
        except Exception as e:
            print(f"Error downloading video {video_filename}: {e}")
            continue

        logs = json.loads(entry["logs"])
        events = json.loads(entry["events"])

        # find video start event
        video_framecount_start = None
        for event in events:
            if event["type"] == "video_recording_started":
                video_framecount_start = event["framecount"]
                break

        if video_framecount_start is None:
            print(f"No video start event found for rating {rating_id} and game {game_id}")
            continue

        frames, key_actions, player_positions, events = load_data(Path(video_path), logs, video_framecount_start)
        # keep data after game starts for first time
        start_idx = None
        for i, event in enumerate(events):
            if "State: start" in event:
                start_idx = i
                break
        frames = frames[start_idx:]
        key_actions = key_actions[start_idx:]
        player_positions = player_positions[start_idx:]
        events = events[start_idx:]
        # animate_frames(frames, key_actions, player_positions, events)

        # remove indices where player_positions is None
        valid_indices = [i for i, pos in enumerate(player_positions) if pos is not None]
        frames = [frames[i] for i in valid_indices]
        key_actions = [key_actions[i] for i in valid_indices]
        player_positions = [player_positions[i] for i in valid_indices]
        events = [events[i] for i in valid_indices]

        all_frames.extend(frames)
        all_actions.extend(key_actions)
        all_player_positions.extend(player_positions)

    return all_frames, all_actions, all_player_positions


class GameDataModule(pl.LightningDataModule):
    def __init__(self, log_dirs, img_size=(96, 96), obs_seq_len=4, 
                 batch_size=32, train_ratio=0.8, num_workers=4):
        super().__init__()
        self.log_dirs = log_dirs
        self.img_size = img_size
        self.obs_seq_len = obs_seq_len
        self.batch_size = batch_size
        self.train_ratio = train_ratio
        self.num_workers = num_workers
        
    def prepare_data(self):
        # This is called on 1 GPU only
        pass
    
    def setup(self, stage=None):
        # Load data from all log directories
        # frames = []
        # key_actions = []
        # player_positions = []
        
        # for log_dir in self.log_dirs:
        #     video_path, logs, video_framecount_start = load_data_from_dir(log_dir)
        #     _frames, _key_actions, _player_positions, _ = load_data(
        #         video_path, logs, video_framecount_start
        #     )
        #     frames.extend(_frames)
        #     key_actions.extend(_key_actions)
        #     player_positions.extend(_player_positions)
        
        frames, key_actions, player_positions = load_human_data()

        # Create dataset
        dataset = GameDataset(
            frames=frames,
            key_actions=key_actions,
            player_positions=player_positions,
            img_size=self.img_size,
            obs_seq_len=self.obs_seq_len
        )
        
        # Split into train and validation sets
        dataset_size = len(dataset)
        train_size = int(dataset_size * self.train_ratio)
        val_size = dataset_size - train_size
        
        self.train_dataset, self.val_dataset = random_split(
            dataset, [train_size, val_size]
        )
        
        print(f"Dataset split: {train_size} training, {val_size} validation samples")
    
    def train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            num_workers=self.num_workers
        )
    
    def val_dataloader(self):
        return DataLoader(
            self.val_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=self.num_workers
        )


def evaluate_model(model_path, game_code, num_episodes=5, max_steps=500, obs_seq_len=4):
    """
    Evaluate a trained Lightning policy model on a game environment.
    
    Args:
        model_path: Path to the trained model checkpoint
        game_code: Dictionary mapping file paths to their content
        num_episodes: Number of episodes to run
        max_steps: Maximum steps per episode
        obs_seq_len: Length of observation sequence
        
    Returns:
        success_rate: Fraction of episodes that were successful
        mean_reward: Mean reward across episodes
        mean_steps: Mean number of steps across episodes
    """
    # Create environment with frame stacking
    env = P5jsEnv(
        game_code, 
        headless=False, 
        max_episode_steps=max_steps,
        obs_seq_len=obs_seq_len
    )
    
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = GamePolicyLightning.load_from_checkpoint(model_path)
    model.to(device)
    model.eval()
    
    # Run evaluations
    episode_rewards = []
    episode_steps = []
    successes = 0
    
    for episode in range(num_episodes):
        print(f"Episode {episode+1}/{num_episodes}")
        
        # Reset environment
        obs, _ = env.reset()
        
        done = False
        rewards = []
        step_count = 0
        
        while not done and step_count < max_steps:
            # Prepare input for model
            x = {
                'frame_stack': torch.FloatTensor(obs['frame_stack']).unsqueeze(0).to(device),
                'action_stack': torch.FloatTensor(obs['action_stack']).unsqueeze(0).to(device),
            }
            
            if 'position_stack' in obs:
                x['position_stack'] = torch.FloatTensor(obs['position_stack']).unsqueeze(0).to(device)
            
            # Get action from policy
            with torch.no_grad():
                logits = model(x)
                # Add temperature parameter (default to 1.0 if not present)
                temperature = 600.0
                logits = logits / temperature
                # breakpoint()
                probs = torch.softmax(logits, dim=1)
                action_class = torch.multinomial(probs, num_samples=1).item()

            # Convert action class to binary vector
            action_binary = decode_action(action_class)
            
            # Take step in environment
            next_obs, reward, terminated, truncated, _ = env.step(action_binary)
            
            # Store reward
            rewards.append(reward)
            
            # Check if done
            done = terminated or truncated
            
            # Update observation
            obs = next_obs
            step_count += 1
        
        # Calculate episode statistics
        episode_reward = sum(rewards)
        episode_steps.append(step_count)
        episode_rewards.append(episode_reward)
        
        # Check if episode was successful
        if episode_reward > 0:
            successes += 1
    
    # Clean up
    env.close()
    
    # Calculate summary statistics
    success_rate = successes / num_episodes
    mean_reward = sum(episode_rewards) / num_episodes
    mean_steps = sum(episode_steps) / num_episodes
    
    print(f"Success rate: {success_rate:.2f}")
    print(f"Mean reward: {mean_reward:.2f}")
    print(f"Mean steps: {mean_steps:.2f}")
    
    return success_rate, mean_reward, mean_steps


def main(args):
    # Set the checkpoint directory
    CHECKPOINT_DIR = Path(__file__).parent / "results" / Path(__file__).stem / "checkpoints" / RUN_NAME
    CHECKPOINT_DIR.mkdir(exist_ok=True, parents=True)
    
    # Hyperparameters
    img_size = (96, 96)  # (width, height)
    obs_seq_len = 2 if args.obs_seq_len is None else args.obs_seq_len
    batch_size = 32 if args.batch_size is None else args.batch_size
    max_epochs = 100 if args.max_epochs is None else args.max_epochs
    learning_rate = 1e-4 if args.learning_rate is None else args.learning_rate
    use_positions = False
    
    # Initialize data module
    data_module = GameDataModule(
        log_dirs=log_dirs,
        img_size=img_size, 
        obs_seq_len=obs_seq_len,
        batch_size=batch_size
    )
    
    # Initialize model
    if args.ckpt_path and Path(args.ckpt_path).exists():
        print(f"Loading model from checkpoint: {args.ckpt_path}")
        model = GamePolicyLightning.load_from_checkpoint(args.ckpt_path)
    else:
        model = GamePolicyLightning(
            img_size=img_size,
            obs_seq_len=obs_seq_len,
            use_positions=use_positions,
            learning_rate=learning_rate
        )
    
    # Setup logging
    logger = None
    if args.wandb:
        logger = WandbLogger(
            project="game-policy-training",
            name=RUN_NAME,
            log_model=True
        )
        # Log hyperparameters
        logger.log_hyperparams({
            'img_size': img_size,
            'obs_seq_len': obs_seq_len,
            'batch_size': batch_size,
            'learning_rate': learning_rate
        })
    
    # Setup callbacks
    checkpoint_callback = ModelCheckpoint(
        dirpath=CHECKPOINT_DIR,
        filename='{epoch}-{val_loss:.2f}',
        save_top_k=3,
        monitor='val_loss',
        mode='min'
    )
    
    # Setup trainer
    trainer = pl.Trainer(
        max_epochs=max_epochs,
        devices=1,
        logger=logger,
        callbacks=[checkpoint_callback],
    )
    
    # Train model
    trainer.fit(model, data_module)
    
    # Save final model
    trainer.save_checkpoint(str(CHECKPOINT_DIR / "final_model.ckpt"))
    # Save a standalone version for easy loading
    torch.save(model.state_dict(), str(CHECKPOINT_DIR / "policy_model.pth"))
    
    print(f"Training completed. Model saved to {CHECKPOINT_DIR}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a policy model for P5js games")
    parser.add_argument("action", nargs="?", choices=["train", "eval"], default="train",
                        help="Action to perform: train or eval")
    parser.add_argument("--ckpt_path", type=str, help="Path to checkpoint to resume training from or evaluate")
    parser.add_argument("--obs_seq_len", type=int, help="Length of observation sequence")
    parser.add_argument("--batch_size", type=int, help="Batch size for training")
    parser.add_argument("--max_epochs", type=int, help="Maximum number of epochs to train")
    parser.add_argument("--learning_rate", type=float, help="Learning rate")
    parser.add_argument("--fp16", action="store_true", help="Use mixed precision training")
    parser.add_argument("--wandb", action="store_true", help="Use Weights & Biases for logging")
    # Evaluation specific arguments
    parser.add_argument("--num_episodes", type=int, default=3, help="Number of episodes to evaluate")
    parser.add_argument("--max_steps", type=int, default=1000, help="Maximum steps per episode")
    parser.add_argument("--game_id", type=str, help="Game ID to evaluate on (if not provided, uses first game from log dirs)")
    
    args = parser.parse_args()
    
    if args.action == "train":
        main(args)
    elif args.action == "eval":
        # Check if a checkpoint is provided
        if not args.ckpt_path:
            print("Error: --ckpt_path is required for evaluation")
            sys.exit(1)
            
        # Set default observation sequence length if not provided
        obs_seq_len = 2 if args.obs_seq_len is None else args.obs_seq_len
        
        # Load game code from dataset
        import datasets
        print("GAMES_DATASET", GAMES_DATASET)
        game_dataset = datasets.load_dataset(GAMES_DATASET, split="train")

        rating_dataset = load_dataset(RATING_DATASET, split="train")
        # remove test users (any user with "test" in their id)
        rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
        print(f"After removing test users: {rating_dataset}")

        game_id = rating_dataset[10]["game_id"]

        
        # Get game_id - from args or from the first log directory
        # game_id = args.game_id
        # if not game_id:
        #     log_dir = log_dirs[0]
        #     video_metadata = json.load(open(log_dir / "metadata.json", "r"))
        #     game_id = video_metadata["game_id"]
        
        print(f"Evaluating policy on game: {game_id}")
        


        # not really good for ood games
        # game_dataset_id = "generative-games/gen-games-v6"
        # game_dataset = load_dataset(GAMES_DATASET, split="train")
        # game_id = game_dataset[0]["id"]



        # Filter dataset to get the specific game
        game_data = game_dataset.filter(lambda x: x["id"] == game_id)
        if len(game_data) == 0:
            print(f"Game with ID {game_id} not found in dataset")
            sys.exit(1)
        
        game_data = game_data[0]
        
        # Create game code dictionary
        game_code = {
            path: content 
            for path, content in zip(game_data["game_file_paths"], game_data["game_file_contents"])
        }
        
        print(f"Found game with {len(game_code)} files")

        # Evaluate policy
        success_rate, mean_reward, mean_steps = evaluate_model(
            args.ckpt_path, 
            game_code,
            num_episodes=args.num_episodes, 
            max_steps=args.max_steps,
            obs_seq_len=obs_seq_len
        )
        
        print(f"Evaluation results:")
        print(f"Success rate: {success_rate:.2f}")
        print(f"Mean reward: {mean_reward:.2f}")
        print(f"Mean steps: {mean_steps:.2f}")
  
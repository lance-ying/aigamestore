"""
Policy training for game control based on video frames and key actions.

This script provides functionality to:
1. Load game data (frames, key actions, player positions, events)
2. Create a PyTorch dataset for training
3. Build and train a CNN policy network
4. Visualize predictions and log metrics with wandb

Example usage:

# View game animation:
python train_policy.py

# Train a policy network without wandb:
python train_policy.py train

# Train a policy network with wandb logging:
python train_policy.py train --wandb

# Run inference with a trained model:
python train_policy.py infer

# Usage in custom code:
frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
dataset = GameDataset(frames, key_actions, img_size=(96, 96))
model = train_policy(frames, key_actions, epochs=5, use_wandb=True)
"""
from pathlib import Path
import json
import shutil
import tempfile
import cv2
import sys
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
    
from playwright.sync_api import sync_playwright


# mapping between key codes and index in key vector
KEY_TO_INDEX = {
    "Enter": 0, # enter
    " ": 1, # space
    "ArrowLeft": 2, # arrow left
    "ArrowUp": 3, # arrow up
    "ArrowRight": 4, # arrow right
    "ArrowDown": 5, # arrow down
    "r": 6, # r
}
INPUT_EVENT_TYPES = ["keyPressed", "keyReleased"]

games_version = "v5"
GAMES_DATASET = f"generative-games/gen-games-{games_version}"

RUN_NAME = "run2"
CHECKPOINT_DIR = Path(__file__).parent / "results" / Path(__file__).stem / "checkpoints" / RUN_NAME


# def preprocess_frame(image, position, obs_size=(96, 96), grayscale=False):
#     """
#     Preprocess a single image and position from a p5js environment.
    
#     Args:
#         image: Image from p5js environment (numpy array)
#         position: Position data (x, y coordinates)
#         obs_size: Target size for resizing images (width, height)
        
#     Returns:
#         processed_image: Resized and padded image
#         processed_position: Adjusted position coordinates
#     """
#     def resize_with_padding(image, obs_size=(96, 96)):
#         """
#         Resize an image to the target size with padding to maintain aspect ratio.
        
#         Args:
#             image: Input image (numpy array)
#             obs_size: Target size as (width, height)
            
#         Returns:
#             Resized image with padding (numpy array)
#         """
#         h, w = image.shape[:2]
#         target_w, target_h = obs_size
        
#         # Calculate aspect ratios
#         aspect_ratio_orig = w / h
#         aspect_ratio_target = target_w / target_h
        
#         # Calculate new dimensions while preserving aspect ratio
#         if aspect_ratio_orig > aspect_ratio_target:
#             # Width is the limiting factor
#             new_w = target_w
#             new_h = int(new_w / aspect_ratio_orig)
#         else:
#             # Height is the limiting factor
#             new_h = target_h
#             new_w = int(new_h * aspect_ratio_orig)
        
#         # Resize the image while preserving aspect ratio
#         resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
#         # Create a black canvas of the target size
#         padded = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        
#         # Calculate padding offsets to center the image
#         pad_h = (target_h - new_h) // 2
#         pad_w = (target_w - new_w) // 2
        
#         # Place the resized image on the canvas
#         padded[pad_h:pad_h+new_h, pad_w:pad_w+new_w] = resized
        
#         return padded

#     # Resize image with padding to maintain aspect ratio
#     processed_image = resize_with_padding(image, obs_size)
    
#     # Get image dimensions for position adjustment
#     h, w = image.shape[:2]
#     target_w, target_h = obs_size
    
#     # Calculate scaling factors
#     aspect_ratio_orig = w / h
#     aspect_ratio_target = target_w / target_h
    
#     # Calculate new dimensions while preserving aspect ratio
#     if aspect_ratio_orig > aspect_ratio_target:
#         # Width is the limiting factor
#         new_w = target_w
#         new_h = int(new_w / aspect_ratio_orig)
#         x_scale = target_w / w
#         y_scale = new_h / h
#         x_offset = 0
#         y_offset = (target_h - new_h) // 2
#     else:
#         # Height is the limiting factor
#         new_h = target_h
#         new_w = int(new_h * aspect_ratio_orig)
#         x_scale = new_w / w
#         y_scale = target_h / h
#         x_offset = (target_w - new_w) // 2
#         y_offset = 0
    
#     # Extract position coordinates
#     x, y = position
    
#     # Normalize original positions if needed
#     if x > 1.0 or y > 1.0:
#         # Positions are in pixel coordinates, normalize them first
#         x_norm = x / w
#         y_norm = y / h
#     else:
#         # Positions are already normalized [0,1]
#         x_norm = x
#         y_norm = y
    
#     # Apply scaling and offset for the new image size
#     x_adjusted = (x_norm * x_scale * w + x_offset) / target_w
#     y_adjusted = (y_norm * y_scale * h + y_offset) / target_h
    
#     processed_position = (x_adjusted, y_adjusted)
    
#     # convert image to grayscale
#     if grayscale:
#         processed_image = cv2.cvtColor(processed_image, cv2.COLOR_RGB2GRAY)
#         # Convert grayscale back to 3 channels to match the expected shape
#         processed_image = cv2.cvtColor(processed_image, cv2.COLOR_GRAY2RGB)

#     return processed_image, processed_position


def load_data(video_path, logs, video_framecount_start):
    """
    Load data from video and logs.
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
                key = event["data"]["key"]
                if key not in KEY_TO_INDEX:
                    continue
                key_idx = KEY_TO_INDEX[key]

                if event_type == "keyPressed":
                    new_key_vector[key_idx] = 1
                elif event_type == "keyReleased":
                    new_key_vector[key_idx] = 0

        key_actions[idx] = new_key_vector
    
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
    def __init__(self, frames, key_actions, transform=None, img_size=(96, 96)):
        """
        PyTorch Dataset for game frames and actions
        
        Args:
            frames: List of numpy arrays containing video frames
            key_actions: Array of shape (num_frames, num_keys) with binary key states
            transform: Optional transform to apply to the frames
            img_size: Target size for resizing images (height, width)
        """
        self.frames = frames
        self.key_actions = key_actions
        self.transform = transform
        self.img_size = img_size
        
    def __len__(self):
        # Skip first frame since we need previous action
        return len(self.frames) - 1
    
    def __getitem__(self, idx):
        # Current frame
        frame = self.frames[idx + 1]  # +1 since we're skipping first frame
        
        # Resize the frame to match model's expected input
        frame = cv2.resize(frame, self.img_size)
        
        # Convert frame to tensor and normalize
        if self.transform:
            frame = self.transform(frame)
        else:
            # Simple default transform: convert to tensor and normalize
            frame = torch.FloatTensor(frame.transpose(2, 0, 1)) / 255.0
        
        # Previous action (at idx) as input and current action (at idx+1) as target
        prev_action = torch.FloatTensor(self.key_actions[idx])
        current_action = torch.FloatTensor(self.key_actions[idx + 1])
        
        return {'frame': frame, 'prev_action': prev_action}, current_action


def analyze_video_logs(video_path, logs, video_framecount_start):
    movements_by_type = defaultdict(list)
    for event in logs["movements"]:
        movements_by_type[event["movement_type"]].append(event)

    interactions_by_type = defaultdict(list)
    for event in logs["interactions"]:
        interactions_by_type[event["interaction_type"]].append(event)

    inputs_by_type = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_type[event["input_type"]].append(event)

    # TODO: save canvas size, dt, etc. in logs["metadata"]
    canvas_size = (600, 400)

    # player_pos_x = np.array(logs["player_positions"]["x"])
    # player_pos_y = np.array(logs["player_positions"]["y"])
    # # flip y coord (y coord is 0 at the top of the game canvas in p5js convention)
    # player_pos_y_flipped = canvas_size[1] - player_pos_y
    # player_pos_framecount_start = logs["player_positions"]["start_framecount"]
    # player_pos_frames = np.arange(len(player_pos_x)) + player_pos_framecount_start

    player_pos_x = []
    player_pos_y = []
    player_pos_frames = []
    for event in logs["player_positions"]:
        player_pos_x.append(event["screen_x"])
        player_pos_y.append(event["screen_y"])
        player_pos_frames.append(event["framecount"])
    player_pos_x = np.array(player_pos_x)
    player_pos_y = np.array(player_pos_y)
    # flip y coord (y coord is 0 at the top of the game canvas in p5js convention)
    player_pos_y_flipped = canvas_size[1] - player_pos_y 
 
    game_states = logs["game_states"]


    assert video_path.exists(), f"Video path {video_path} does not exist"
    cap = cv2.VideoCapture(str(video_path))
        
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Calculate scaling factors
    original_canvas_width, original_canvas_height = canvas_size
    scale_x = video_width / original_canvas_width
    scale_y = video_height / original_canvas_height
    

    # convert keyPressed/keyReleased input events to binary key vectors (1 when key pressed and 0 when released)
    # can have multiple keyPressed/keyReleased events per frame
    inputs_by_frame = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_frame[event["framecount"]].append(event)


    key_actions = np.zeros((total_frames, len(KEY_TO_INDEX)))
    # idx starts at 0 and frame starts at 1
    for idx, framecount in enumerate(range(video_framecount_start, total_frames + video_framecount_start)):
        if idx == 0:
            prev_key_vector = np.zeros(len(KEY_TO_INDEX))
        else:
            prev_key_vector = key_actions[idx-1]

        if framecount not in inputs_by_frame:
            new_key_vector = prev_key_vector
        else:    
            events = inputs_by_frame[framecount]

            # can have multiple keyPressed/keyReleased events per frame
            new_key_vector = prev_key_vector.copy()
            for event in events:
                event_type = event["input_type"]
                if event_type not in INPUT_EVENT_TYPES:
                    raise ValueError(f"Unexpected event type: {event_type}")
                key = event["data"]["key"]
                key_idx = KEY_TO_INDEX[key]

                if event_type == "keyPressed":
                    print(f"keyPressed: {key}, frame: {framecount}")
                    new_key_vector[key_idx] = 1
                elif event_type == "keyReleased":
                    print(f"keyReleased: {key}, frame: {framecount}")
                    new_key_vector[key_idx] = 0

        key_actions[idx] = new_key_vector

    # plt.figure()
    # plt.imshow(key_actions[-1000:, :])
    # plt.show()
    # breakpoint()

    # Create a dictionary to store events by frame
    events_by_frame = defaultdict(list)
    for event in game_states:
        frame = event["framecount"]
        events_by_frame[frame].append(f"State: {event['game_state']}")
    
    for mvt_type, events in movements_by_type.items():
        for event in events:
            frame = event["framecount"]
            events_by_frame[frame].append(f"Move: {mvt_type}")
    
    for interaction_type, events in interactions_by_type.items():
        for event in events:
            frame = event["framecount"]
            events_by_frame[frame].append(f"Interaction: {interaction_type}")

    for input_type, events in inputs_by_type.items():
        for event in events:
            frame = event["framecount"]
            events_by_frame[frame].append(f"Input: {input_type}")

    events = []  # events at every video frame (start at video_framecount_start)
    for idx in range(total_frames):
        framecount = idx + video_framecount_start + 1
        if framecount in events_by_frame:
            events.append(events_by_frame[framecount])
        else:
            events.append([])

    player_pos_by_frame = {}
    for framecount, pos in zip(player_pos_frames, zip(player_pos_x, player_pos_y)):
        player_pos_by_frame[framecount] = pos

    player_positions = []
    for idx in range(total_frames):
        framecount = idx + video_framecount_start + 1
        if framecount in player_pos_by_frame:
            # scale player positions to video frame size
            x, y = player_pos_by_frame[framecount]
            x = x * scale_x
            y = y * scale_y
            player_positions.append((x, y))
        else:
            player_positions.append(None)

    # frames = []
    # while True:
    #     ret, frame = cap.read()
    #     if not ret:
    #         break
    #     # Convert BGR to RGB
    #     frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    #     frames.append(frame_rgb)
    
    # cap.release()

    # animate_frames(frames, key_actions, player_positions=player_positions, events=events)

    # Animate video and events relative to p5js frameCount (useful to check when video starts relative to frameCount)

    # Create figure for video display
    plt.figure(figsize=(10, 6))

    # Animation function
    def update(framecount):
        """
        Args:
            framecount: matches p5js frameCount (first frame is frameCount=1)
        """
        plt.clf()
        # p5js frameCount=1 corresponds to the first frame, which is index 0 with cv2
        cap.set(cv2.CAP_PROP_POS_FRAMES, framecount-video_framecount_start-1)
        ret, frame = cap.read()
        if not ret:
            return
        
        # Convert BGR to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Display frame
        plt.imshow(frame)
                
        if framecount in player_pos_by_frame:
            # Scale player position to video frame size
            x, y = player_pos_by_frame[framecount]
            x = x * scale_x
            y = y * scale_y
            
            # Draw player marker
            plt.plot(x, y, 'ro', markersize=10, alpha=0.7)
            plt.text(x + 10, y + 10, f"Player", color='white', 
                    bbox=dict(facecolor='black', alpha=0.5))
        
        # Show events for this frame
        if framecount in events_by_frame:
            events_text = "\n".join(events_by_frame[framecount])
            plt.text(10, 10, events_text, color='white', 
                    bbox=dict(facecolor='black', alpha=0.5))
        
        # Add virtual keyboard display
        idx = framecount - 1
        if 0 <= idx < len(key_actions):
            # Create a small axes for the keyboard in the bottom right
            keyboard_ax = plt.axes([0.7, 0.05, 0.25, 0.15])
            keyboard_ax.axis('off')
            
            # Get current key states
            key_states = key_actions[idx]
            
            # Define key positions (left, bottom, width, height)
            key_positions = {
                "ArrowLeft": (0.2, 0.4, 0.15, 0.15),
                "ArrowUp": (0.4, 0.6, 0.15, 0.15),
                "ArrowRight": (0.6, 0.4, 0.15, 0.15),
                "ArrowDown": (0.4, 0.2, 0.15, 0.15),
                "Space": (0.2, 0.0, 0.6, 0.15),
                "r": (0.8, 0.0, 0.15, 0.15),
                "Enter": (0.8, 0.2, 0.15, 0.25)
            }
            
            # Key labels
            key_labels = {
                "ArrowLeft": "←", 
                "ArrowUp": "↑", 
                "ArrowRight": "→", 
                "ArrowDown": "↓",
                "Space": "SPACE",
                "r": "R",
                "Enter": "↵"
            }
            
            # Draw keys with appropriate colors
            for i, (key_name, position) in enumerate(key_positions.items()):
                key_idx = KEY_TO_INDEX.get(key_name if key_name != "Space" else " ", i)
                color = 'red' if key_states[key_idx] else 'lightgray'
                rect = plt.Rectangle(position[:2], position[2], position[3], 
                                    fill=True, color=color, alpha=0.7, ec='black')
                keyboard_ax.add_patch(rect)
                keyboard_ax.text(position[0] + position[2]/2, position[1] + position[3]/2, 
                                key_labels[key_name], ha='center', va='center', 
                                color='black', fontweight='bold')
            
            keyboard_ax.set_xlim(0, 1)
            keyboard_ax.set_ylim(0, 1)
        
        plt.title(f"Frame {framecount}")
        plt.axis('off')
        
    # Global variables for animation control
    class AnimationState:
        def __init__(self):
            self.is_paused = False
            self.current_frame_num = 0
    
    state = AnimationState()
    
    def on_key(event):
        if event.key == ' ':
            state.is_paused = not state.is_paused
        elif event.key == 'right' and state.is_paused:
            state.current_frame_num = min(state.current_frame_num + 1, total_frames - 1)
            update(state.current_frame_num)
            plt.draw()
        elif event.key == 'left' and state.is_paused:
            state.current_frame_num = max(state.current_frame_num - 1, video_framecount_start + 1)
            update(state.current_frame_num)
            plt.draw()
    
    # Connect the key press event
    fig = plt.gcf()
    fig.canvas.mpl_connect('key_press_event', on_key)

    def animate(framecount):
        if not state.is_paused:
            state.current_frame_num = framecount
            update(framecount)
        else:
            # When paused, keep showing the current frame
            update(state.current_frame_num)
    
    # Create a generator that yields frames based on pause state
    def frame_generator():
        framecount = video_framecount_start + 1 # start at video framecount start + 1
        while framecount < total_frames:
            if not state.is_paused:
                yield framecount
                framecount += 1
            else:
                yield state.current_frame_num
    
    anim = FuncAnimation(fig, animate, frames=frame_generator, 
                        interval=10, blit=False, save_count=total_frames)
    
    plt.show()
    
    # Release video capture
    cap.release()


def animate_frames(frames, key_actions, player_positions=None, events=None, fps=30):
    """
    Run animation with provided frames and key actions.
    Assume all the data are dense (entry for each frame idx) and aligned (start at a common reference frame idx).

    Args:
        frames: List of numpy arrays containing video frames
        key_actions: Array of shape (num_frames, num_keys) with binary key states
        player_positions: List of tuples (x, y) for player positions
        events: List of strings for events to display
    """
    # Create figure
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Animation state
    class AnimationState:
        def __init__(self):
            self.is_paused = False
            self.current_frame = 0
    
    state = AnimationState()
    
    # Key press handler
    def on_key(event):
        if event.key == ' ':
            state.is_paused = not state.is_paused
        elif event.key == 'right' and state.is_paused:
            state.current_frame = min(state.current_frame + 1, len(frames) - 1)
            update(state.current_frame)
            plt.draw()
        elif event.key == 'left' and state.is_paused:
            state.current_frame = max(state.current_frame - 1, 0)
            update(state.current_frame)
            plt.draw()
    
    fig.canvas.mpl_connect('key_press_event', on_key)
    
    # Update function
    def update(frame_idx):
        if frame_idx >= len(frames):
            return
            
        ax.clear()
        
        # Display frame
        ax.imshow(frames[frame_idx])
        
        # Show player position if available
        if player_positions is not None and player_positions[frame_idx] is not None:
            x, y = player_positions[frame_idx]
            ax.plot(x, y, 'ro', markersize=10, alpha=0.7)
            ax.text(x + 10, y + 10, f"Player", color='white', 
                    bbox=dict(facecolor='black', alpha=0.5))
        
        # Show events if available
        if events is not None:
            events_text = "\n".join(events[frame_idx])
            ax.text(10, 10, events_text, color='white', 
                    bbox=dict(facecolor='black', alpha=0.5))
        
        # Add virtual keyboard display
        if frame_idx < len(key_actions):
            # Create a small axes for the keyboard in the bottom right
            keyboard_ax = plt.axes([0.7, 0.05, 0.25, 0.15])
            keyboard_ax.axis('off')
            
            # Get current key states
            key_states = key_actions[frame_idx]
            
            # Define key positions (left, bottom, width, height)
            key_positions = {
                "ArrowLeft": (0.2, 0.4, 0.15, 0.15),
                "ArrowUp": (0.4, 0.6, 0.15, 0.15),
                "ArrowRight": (0.6, 0.4, 0.15, 0.15),
                "ArrowDown": (0.4, 0.2, 0.15, 0.15),
                "Space": (0.2, 0.0, 0.6, 0.15),
                "r": (0.8, 0.0, 0.15, 0.15),
                "Enter": (0.8, 0.2, 0.15, 0.25)
            }
            
            # Key labels
            key_labels = {
                "ArrowLeft": "←", 
                "ArrowUp": "↑", 
                "ArrowRight": "→", 
                "ArrowDown": "↓",
                "Space": "SPACE",
                "r": "R",
                "Enter": "↵"
            }
            
            # Draw keys with appropriate colors
            for i, (key_name, position) in enumerate(key_positions.items()):
                key_idx = KEY_TO_INDEX.get(key_name if key_name != "Space" else " ", i)
                color = 'red' if key_states[key_idx] else 'lightgray'
                rect = plt.Rectangle(position[:2], position[2], position[3], 
                                    fill=True, color=color, alpha=0.7, ec='black')
                keyboard_ax.add_patch(rect)
                keyboard_ax.text(position[0] + position[2]/2, position[1] + position[3]/2, 
                                key_labels[key_name], ha='center', va='center', 
                                color='black', fontweight='bold')
            
            keyboard_ax.set_xlim(0, 1)
            keyboard_ax.set_ylim(0, 1)
        
        ax.set_title(f"Frame {frame_idx}")
        ax.axis('off')
    
    # Animation function
    def animate(frame_idx):
        if not state.is_paused:
            state.current_frame = frame_idx
            update(frame_idx)
        else:
            update(state.current_frame)
    
    # Frame generator
    def frame_generator():
        frame_idx = 0
        while frame_idx < len(frames):
            if not state.is_paused:
                yield frame_idx
                frame_idx += 1
            else:
                yield state.current_frame
    
    anim = FuncAnimation(fig, animate, frames=frame_generator, 
                        interval=10, blit=False, save_count=len(frames))
        
    plt.show()
    return anim



class PolicyNetwork(nn.Module):
    def __init__(self, input_channels, num_keys, img_size):
        super().__init__()
        # Simple CNN for image processing
        self.conv = nn.Sequential(
            nn.Conv2d(input_channels, 32, kernel_size=8, stride=4),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=4, stride=2),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, stride=1),
            nn.ReLU(),
            nn.Flatten()
        )
        
        # Calculate the actual flattened size based on input dimensions
        # Create a dummy input to determine output size
        with torch.no_grad():
            dummy_input = torch.zeros(1, input_channels, img_size[1], img_size[0])
            conv_out = self.conv(dummy_input)
            self.fc_input_size = conv_out.shape[1]
        
        # Combine image features with previous action and predict next action
        self.fc = nn.Sequential(
            nn.Linear(self.fc_input_size + num_keys, 512),
            nn.ReLU(),
            nn.Linear(512, num_keys),
            nn.Sigmoid()  # Output activation for multi-label binary classification
        )
        
    def forward(self, x, prev_action):
        # Process image
        img_features = self.conv(x)
        # Concatenate with previous action
        combined = torch.cat([img_features, prev_action], dim=1)
        # Predict next action
        return self.fc(combined)


def visualize_prediction(model, frame, prev_action, target, device, img_size=(96, 96)):
    """
    Visualize model prediction vs target
    
    Args:
        model: Trained policy network
        frame: Current frame (numpy array)
        prev_action: Previous action vector
        target: Target action vector
        device: Torch device
        img_size: Size to resize frame to (width, height)
        
    Returns:
        Figure with visualization
    """
    import matplotlib.pyplot as plt
    
    # Get prediction
    pred = run_inference(model, frame, prev_action, device, img_size)
    
    # Create figure
    fig, axs = plt.subplots(2, 1, figsize=(8, 10))
    
    # Plot the frame
    axs[0].imshow(frame)
    axs[0].set_title("Input Frame")
    axs[0].axis("off")
    
    # Plot the actions
    key_names = ["Enter", "Space", "Left", "Up", "Right", "Down", "R"]
    x = range(len(key_names))
    
    axs[1].bar(x, target, width=0.4, label="Target", alpha=0.6)
    axs[1].bar([i+0.4 for i in x], pred, width=0.4, label="Prediction", alpha=0.6)
    axs[1].set_xticks([i+0.2 for i in x])
    axs[1].set_xticklabels(key_names)
    axs[1].set_ylim(0, 1)
    axs[1].set_title("Actions")
    axs[1].legend()
    
    plt.tight_layout()
    return fig


def train_policy(frames, key_actions, batch_size=32, epochs=5, lr=1e-4, img_size=(96, 96), use_wandb=True):
    """
    Train a policy network on the given frames and key actions
    
    Args:
        frames: List of video frames
        key_actions: Array of shape (num_frames, num_keys) with binary key states
        batch_size: Batch size for training
        epochs: Number of epochs to train
        lr: Learning rate
        img_size: Size to resize frames to (width, height)
        use_wandb: Whether to use wandb for logging
        
    Returns:
        Trained policy network
    """
    # Import necessary libraries
    import torch.optim as optim
    import torch.nn as nn
    from torch.utils.data import DataLoader, random_split
    
    # Initialize wandb if requested
    if use_wandb:
        try:
            import wandb
            wandb.init(project="game-policy", config={
                "learning_rate": lr,
                "epochs": epochs,
                "batch_size": batch_size,
                "img_size": img_size,
                "optimizer": "Adam",
                "model": "CNN-Policy"
            })
        except ImportError:
            print("wandb not installed. Run 'pip install wandb' to use it.")
            use_wandb = False
    
    # Create dataset
    dataset = GameDataset(frames, key_actions, img_size=img_size)
    print(f"Dataset length: {len(dataset)}")

    x, y = dataset[0]
    print(f"Frame shape: {x['frame'].shape}")
    print(f"Previous action shape: {x['prev_action'].shape}")
    print(f"Target action shape: {y.shape}")
    # plt.imshow(x['frame'][0])
    # plt.show()
    # breakpoint()
    
    # Split into train and validation sets (80/20 split)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)
    
    # Create model, optimizer, and loss function
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = PolicyNetwork(input_channels=3, num_keys=7, img_size=img_size)
    model = model.to(device)
    
    # Log model architecture to wandb
    if use_wandb:
        wandb.watch(model, log="all")
    
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCELoss()  # Binary cross-entropy for multi-label classification
    
    # Select a few examples to visualize during training
    vis_indices = [10, 50, 100]  # Some random indices
    vis_examples = []
    for idx in vis_indices:
        if idx < len(dataset):
            inputs, target = dataset[idx]
            vis_examples.append((
                frames[idx + 1],  # Original frame before processing
                inputs['prev_action'].numpy(),
                target.numpy()
            ))
    
    # Training loop
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0
        for i, (inputs, targets) in enumerate(train_loader):
            # Move data to device
            frame = inputs['frame'].to(device)
            prev_action = inputs['prev_action'].to(device)
            targets = targets.to(device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = model(frame, prev_action)
            
            # Calculate loss and backpropagate
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
            # Log batch loss to wandb
            if use_wandb and i % 10 == 0:  # Log every 10 batches
                wandb.log({"batch_loss": loss.item(), 
                          "batch": epoch * len(train_loader) + i})
        
        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                frame = inputs['frame'].to(device)
                prev_action = inputs['prev_action'].to(device)
                targets = targets.to(device)
                
                outputs = model(frame, prev_action)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
        
        # Average loss for the epoch
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        # Print progress
        print(f'Epoch {epoch+1}/{epochs}, Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}')
        
        # Log metrics to wandb
        if use_wandb:
            log_dict = {
                "epoch": epoch + 1,
                "train_loss": avg_train_loss,
                "val_loss": avg_val_loss
            }
            
            # Log visualizations for sample predictions
            if (epoch + 1) % 1 == 0:  # Every epoch
                for i, (frame, prev_action, target) in enumerate(vis_examples):
                    fig = visualize_prediction(model, frame, prev_action, target, device, img_size)
                    log_dict[f"example_{i}"] = wandb.Image(fig)
                    plt.close(fig)
            
            wandb.log(log_dict)
    
    # Finish wandb run
    if use_wandb:
        wandb.finish()
    
    return model


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
        
        self.action_space = spaces.Box(low=0, high=1, shape=(len(KEY_TO_INDEX),), dtype=np.float32)
        self.observation_space = spaces.Dict(
            {
                "pixels": spaces.Box(
                    low=0,
                    high=255,
                    shape=(self.obs_size[1], self.obs_size[0], 3),
                    dtype=np.uint8,
                ),
                "prev_action": spaces.Box(
                    low=0,
                    high=1,
                    shape=(len(KEY_TO_INDEX),),
                    dtype=np.float32,
                ),
            }
        )

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
        
        # Initialize action state
        self.previous_action = np.zeros(len(KEY_TO_INDEX), dtype=np.float32)
        self.last_action = np.zeros(len(KEY_TO_INDEX), dtype=np.float32)
        
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
        
        Returns:
            observation: New observation after the action
            reward: Reward for the action
            terminated: Whether the episode is terminated
            truncated: Whether the episode is truncated
            info: Additional information
        """
        # Store the current action for next observation
        self.previous_action = action
        print(f"Action: {action}")
        
        # Convert binary action vector to key press/release events
        if hasattr(self, 'last_action'):
            # Compare with previous action to detect changes
            for i, (prev, curr) in enumerate(zip(self.last_action, action)):
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
        
        # Store current action for next comparison
        self.last_action = action.copy()

        # Redraw the game
        self._redraw()
        
        # Get the new observation
        obs = self._get_observation()
        
        # Calculate reward
        reward = self._get_reward()
        
        # Additional info
        info = {
            "frame_count": self._get_framecount(),
            "position": self._get_player_position(),
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
        
        # Get the previous action state
        if not hasattr(self, 'previous_action'):
            # Initialize with zeros if no previous action
            prev_action = np.zeros(len(KEY_TO_INDEX), dtype=np.float32)
        else:
            prev_action = self.previous_action
        
        return {
            "pixels": processed_image,
            "prev_action": prev_action
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




def run_inference(model, frame, prev_action, device=None, img_size=(96, 96)):
    """
    Run inference with the trained policy network
    
    Args:
        model: Trained policy network
        frame: Current frame (numpy array)
        prev_action: Previous action vector
        device: Torch device to use (defaults to cuda if available)
        img_size: Size to resize frame to (width, height)
        
    Returns:
        Predicted action probabilities
    """
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    model.eval()
    
    # Resize frame to match network input size
    frame = cv2.resize(frame, img_size)
    
    # Preprocess frame
    frame_tensor = torch.FloatTensor(frame.transpose(2, 0, 1)) / 255.0
    frame_tensor = frame_tensor.unsqueeze(0).to(device)  # Add batch dimension
    
    # Convert previous action to tensor
    prev_action_tensor = torch.FloatTensor(prev_action).unsqueeze(0).to(device)
    
    # Run inference
    with torch.no_grad():
        predicted_action = model(frame_tensor, prev_action_tensor)
    
    return predicted_action.cpu().numpy()[0]


def rollout_policy(env, policy_model, num_steps=500, device=None):
    """
    Run a trained policy network in the environment.
    
    Args:
        env: The P5jsEnv environment
        policy_model: The trained policy network
        num_steps: Number of steps to run
        device: Torch device to use
        
    Returns:
        rewards: List of rewards
        observations: List of observations
        actions: List of actions
    """
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    policy_model.to(device)
    policy_model.eval()
    
    rewards = []
    observations = []
    actions = []
    
    # Reset the environment
    obs, _ = env.reset()
    
    for _ in range(num_steps):
        # Convert observation to tensor
        frame = torch.FloatTensor(obs["pixels"]).permute(2, 0, 1).unsqueeze(0).to(device) / 255.0
        prev_action = torch.FloatTensor(obs["prev_action"]).unsqueeze(0).to(device)
        
        # Get action from policy network
        with torch.no_grad():
            action = policy_model(frame, prev_action)

        # Convert action to numpy array
        action_np = action.squeeze(0).cpu().numpy()

        action_str = "".join([f"{key}: {action_np[i]:.2f} " for i, key in enumerate(KEY_TO_INDEX.keys())])
        print(f"Action: {action_str}")
        # if _ % 100 == 0:
        #     plt.figure()
        #     plt.bar(range(len(action_np)), action_np)
        #     plt.xticks(range(len(action_np)), list(KEY_TO_INDEX.keys()), rotation=90)
        #     plt.show()
        
        # Threshold action probabilities to binary
        # action_binary = (action_np >= 0.5).astype(np.float32)

        # Randomly sample from action distribution
        action_binary = np.random.binomial(1, action_np)
        
        
        # Take step in environment
        next_obs, reward, terminated, truncated, _ = env.step(action_binary)
        
        # Store results
        rewards.append(reward)
        observations.append(obs)
        actions.append(action_binary)
        
        # Update observation
        obs = next_obs
        
        # Check if episode is done
        if terminated or truncated:
            break
    
    return rewards, observations, actions


def evaluate_policy(model_path, game_code, num_episodes=5, max_steps=500):
    """
    Evaluate a trained policy on a game.
    
    Args:
        model_path: Path to the trained model
        game_code: Dictionary mapping file paths to their content
        num_episodes: Number of episodes to run
        max_steps: Maximum steps per episode
        
    Returns:
        success_rate: Fraction of episodes that were successful
        mean_reward: Mean reward across episodes
        mean_steps: Mean number of steps across episodes
    """
    # Create environment
    env = P5jsEnv(game_code, headless=False, max_episode_steps=max_steps)
    
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = PolicyNetwork(input_channels=3, num_keys=len(KEY_TO_INDEX), img_size=env.obs_size).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    
    # Run evaluations
    episode_rewards = []
    episode_steps = []
    successes = 0
    
    for episode in range(num_episodes):
        print(f"Episode {episode+1}/{num_episodes}")
        rewards, observations, actions = rollout_policy(env, model, max_steps, device)
        
        # Calculate episode statistics
        episode_reward = sum(rewards)
        episode_steps.append(len(rewards))
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


if __name__ == "__main__":
    # long waiting time before start the game
    # log_dir = Path(__file__).parent / "results" / "games_v5" / "rating_26db5ff3-73ab-4a7c-8e95-e166682a2715_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"

    # simple left/right movements
    log_dir = Path(__file__).parent / "results" / "games_v5" / "rating_b6251405-403d-4df1-a3bb-046ab0075e1b_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"

    # around 5 min of gameplay
    log_dir = Path(__file__).parent / "results" / "games_v5" / "rating_46cb9522-1ca3-4676-96f4-855276f1ea2a_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"

    with open(log_dir / "logs.json", "r", encoding="utf-8") as f:
        logs = json.load(f)

    video_path = log_dir / "video.mp4"

    video_metadata = json.load(open(video_path.parent / "metadata.json", "r"))
    # Important: the first frame in the video corresponds to video_framecount_start + 1
    # the video is started at video_framecount_start but the first captured frame is video_framecount_start + 1
    video_framecount_start = int(video_metadata["video_start_framecount"])
    video_fps = int(video_metadata["fps"])

    # Load the data
    # frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
    
    # analyze_video_logs(video_path, logs, video_framecount_start)
    # animate_frames(frames, key_actions, player_positions=player_positions, events=events)

    # Create models directory if it doesn't exist
    models_dir = CHECKPOINT_DIR
    models_dir.mkdir(exist_ok=True, parents=True)
    model_path = models_dir / "policy_model.pth"
    
    # Set image size for model
    img_size = (96, 96)  # (width, height)
    
    # Choose what to do based on arguments (can be extended with argparse)
    use_wandb = "--wandb" in sys.argv
    
    if len(sys.argv) > 1:
        if "train" in sys.argv:
            # copy content of log_dir to models_dir
            for file in log_dir.iterdir():
                shutil.copy(file, models_dir / file.name)

            # Load the data
            frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
            
            # Train the policy network
            model = train_policy(frames, key_actions, epochs=50, lr=1e-3, img_size=img_size, use_wandb=use_wandb)
            
            # Save the model
            torch.save(model.state_dict(), model_path)
            print(f"Model saved to {model_path}")
            
        elif "infer" in sys.argv:
            # Load the data
            frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
            
            # Load the model
            if not model_path.exists():
                print(f"Model not found at {model_path}. Train a model first with 'python train_policy.py train'")
                sys.exit(1)
            
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            model = PolicyNetwork(input_channels=3, num_keys=len(KEY_TO_INDEX), img_size=img_size).to(device)
            model.load_state_dict(torch.load(model_path, map_location=device))
            print(f"Model loaded from {model_path}")
            
            # Run inference on a sample frame
            sample_idx = 10  # Choose a sample frame
            prev_action = key_actions[sample_idx]
            frame = frames[sample_idx + 1]
            
            predicted_action = run_inference(model, frame, prev_action, device, img_size=img_size)
            actual_action = key_actions[sample_idx + 1]
            
            print("Predicted action:", predicted_action)
            print("Actual action:   ", actual_action)
            
        elif "eval" in sys.argv:
            # Load game code from dataset
            import datasets
            game_dataset = datasets.load_dataset(GAMES_DATASET, split="train")
            
            # Get game_id from metadata
            game_id = video_metadata["game_id"]
            
            print(f"Evaluating policy on game: {game_id}")
            
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
            success_rate, mean_reward, mean_steps = evaluate_policy(
                model_path, 
                game_code,
                num_episodes=3, 
                max_steps=1000
            )
        elif "visualize" in sys.argv or "animate" in sys.argv:
            # Load the data
            frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
            
            # Visualize the data with animation
            animate_frames(frames, key_actions, player_positions=player_positions, events=events)
    else:
        # Load the data
        frames, key_actions, player_positions, events = load_data(video_path, logs, video_framecount_start)
        
        # Visualize the data with animation
        animate_frames(frames, key_actions, player_positions=player_positions, events=events)




    # TODO?: balance dataset to have enough transitions where action different from prev_action (otherwise model will just learn to output same as input action)
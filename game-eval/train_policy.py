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
    # "e": 7, # e
    # "a": 8, # a
}
INPUT_EVENT_TYPES = ["keyPressed", "keyReleased"]

games_version = "v5"
GAMES_DATASET = f"generative-games/gen-games-{games_version}"

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
RUN_NAME = f"run_{timestamp}"  # Default run name
CHECKPOINT_DIR = None  # Will be set once RUN_NAME is determined


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
                key = event["data"]["key"]
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
        
        # Target is the action for the last frame in the sequence
        target_action = torch.FloatTensor(self.key_actions[idx + self.obs_seq_len - 1])
        
        return {
            'frame_stack': stacked_frames, 
            'action_stack': stacked_actions,
            'position_stack': stacked_positions
        }, target_action


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
    for idx, framecount in enumerate(range(1, total_frames + 1)):
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
    def __init__(self, input_channels=3, num_keys=len(KEY_TO_INDEX), img_size=(96, 96), obs_seq_len=4, use_positions=True):
        super().__init__()
        # Simple CNN for image processing
        self.conv = nn.Sequential(
            nn.Conv2d(input_channels * obs_seq_len, 32, kernel_size=8, stride=4),
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
            dummy_input = torch.zeros(1, input_channels * obs_seq_len, img_size[1], img_size[0])
            conv_out = self.conv(dummy_input)
            self.fc_input_size = conv_out.shape[1]
        
        # Process action sequence with a small MLP
        self.action_encoder = nn.Sequential(
            nn.Linear(num_keys * (obs_seq_len - 1), 64),
            nn.ReLU()
        )
        
        # Process position sequence with a small MLP
        self.use_positions = use_positions
        if use_positions:
            self.position_encoder = nn.Sequential(
                nn.Linear(2 * obs_seq_len, 32),  # 2D position for each frame
                nn.ReLU()
            )
            combined_size = self.fc_input_size + 64 + 32
        else:
            combined_size = self.fc_input_size + 64
        
        # Combine image features with action history and predict next action
        self.fc = nn.Sequential(
            nn.Linear(combined_size, 512),
            nn.ReLU(),
            nn.Linear(512, num_keys),
            nn.Sigmoid()  # Output activation for multi-label binary classification
        )
        
    def forward(self, x, action_stack, position_stack=None):
        # Process image sequence
        img_features = self.conv(x)
        
        # Flatten action stack
        batch_size = action_stack.shape[0]
        action_flat = action_stack.reshape(batch_size, -1)  # Flatten to [batch, (obs_seq_len-1)*num_keys]
        
        # Process action sequence
        action_features = self.action_encoder(action_flat)
        
        if self.use_positions and position_stack is not None:
            # Flatten position stack
            pos_flat = position_stack.reshape(batch_size, -1)  # Flatten to [batch, obs_seq_len*2]
            
            # Process position sequence
            pos_features = self.position_encoder(pos_flat)
            
            # Concatenate image, action, and position features
            combined = torch.cat([img_features, action_features, pos_features], dim=1)
        else:
            # Concatenate image and action features
            combined = torch.cat([img_features, action_features], dim=1)
        
        # Predict next action
        return self.fc(combined)


def visualize_prediction(model, frames, action_stack, target, device, img_size=(96, 96), position_stack=None, obs_seq_len=4):
    """
    Visualize model prediction vs target
    
    Args:
        model: Trained policy network
        frames: List of frames to stack
        action_stack: Stack of previous actions
        target: Target action vector
        device: Torch device
        img_size: Size to resize frames to (width, height)
        position_stack: Optional stack of player positions
        obs_seq_len: Length of observation sequence
        
    Returns:
        Figure with visualization
    """
    import matplotlib.pyplot as plt
    
    # Get prediction using run_inference
    pred = run_inference(model, frames, action_stack, device, img_size, obs_seq_len=obs_seq_len, position_stack=position_stack)
    
    # Create figure
    fig, axs = plt.subplots(2, 1, figsize=(8, 10))
    
    # Plot the last frame in the sequence
    axs[0].imshow(frames[-1])
    axs[0].set_title("Current Frame")
    axs[0].axis("off")
    
    # Plot the actions
    key_names = list(KEY_TO_INDEX.keys())
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


def train_policy(frames, key_actions, player_positions=None, batch_size=32, epochs=5, lr=1e-4, img_size=(96, 96), use_wandb=True, obs_seq_len=4, use_positions=True):
    """
    Train a policy network on the given frames and key actions
    
    Args:
        frames: List of video frames
        key_actions: Array of shape (num_frames, num_keys) with binary key states
        player_positions: List of (x, y) tuples for player positions
        batch_size: Batch size for training
        epochs: Number of epochs to train
        lr: Learning rate
        img_size: Size to resize frames to (width, height)
        use_wandb: Whether to use wandb for logging
        obs_seq_len: Length of observation sequence (frames and actions)
        use_positions: Whether to use player positions as input
        
    Returns:
        Trained policy network
    """
    # Initialize wandb if requested
    if use_wandb:
        try:
            import wandb
            wandb.init(project="game-policy", name=RUN_NAME, config={
                "learning_rate": lr,
                "epochs": epochs,
                "batch_size": batch_size,
                "img_size": img_size,
                "obs_seq_len": obs_seq_len,
                "use_positions": use_positions,
                "optimizer": "Adam",
                "model": "CNN-Policy"
            })
        except ImportError:
            print("wandb not installed. Run 'pip install wandb' to use it.")
            use_wandb = False
    
    # Create dataset
    dataset = GameDataset(frames, key_actions, player_positions, img_size=img_size, obs_seq_len=obs_seq_len)
    print(f"Dataset length: {len(dataset)}")

    x, y = dataset[0]
    print(f"Frame shape: {x['frame_stack'].shape}")
    print(f"Action stack shape: {x['action_stack'].shape}")
    print(f"Position stack shape: {x['position_stack'].shape}")
    print(f"Target action shape: {y.shape}")
    
    # Split into train and validation sets (80/20 split)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)
    
    # Create model, optimizer, and loss function
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = PolicyNetwork(
        input_channels=3, 
        num_keys=len(KEY_TO_INDEX), 
        img_size=img_size, 
        obs_seq_len=obs_seq_len,
        use_positions=use_positions
    )
    model = model.to(device)
    
    # Log model architecture to wandb
    if use_wandb:
        wandb.watch(model, log="all")
    
    optimizer = optim.Adam(model.parameters(), lr=lr)
    # optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    criterion = nn.BCELoss()  # Binary cross-entropy for multi-label classification
    
    # Select a few examples to visualize during training
    vis_indices = [10, 50, 100]  # Some random indices
    vis_examples = []
    for idx in vis_indices:
        if idx < len(dataset):
            inputs, target = dataset[idx]
            vis_examples.append((
                frames[idx + obs_seq_len - 1],  # Last frame in the sequence
                inputs['action_stack'].numpy(),
                inputs['position_stack'].numpy() if use_positions else None,
                target.numpy()
            ))
    
    # Variables to track the best model
    best_val_loss = float('inf')
    best_model_state = None
    
    # Training loop
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0
        for i, (inputs, targets) in enumerate(train_loader):
            # Move data to device
            frame_stack = inputs['frame_stack'].to(device)
            action_stack = inputs['action_stack'].to(device)
            position_stack = inputs['position_stack'].to(device) if use_positions else None
            targets = targets.to(device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = model(frame_stack, action_stack, position_stack)
            
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
                frame_stack = inputs['frame_stack'].to(device)
                action_stack = inputs['action_stack'].to(device)
                position_stack = inputs['position_stack'].to(device) if use_positions else None
                targets = targets.to(device)
                
                outputs = model(frame_stack, action_stack, position_stack)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
        
        # Average loss for the epoch
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        # Save the best model based on validation loss
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_model_state = model.state_dict().copy()
            # Save the best model so far
            best_model_path = models_dir / "best_policy_model.pth"
            torch.save(best_model_state, best_model_path)
            print(f"New best model saved with val_loss: {best_val_loss:.4f}")
        
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
                for i, (frame, action_stack, position_stack, target) in enumerate(vis_examples):
                    # Use visualization function
                    fig = visualize_prediction(
                        model, 
                        [frame] * obs_seq_len, 
                        action_stack, 
                        target, 
                        device, 
                        img_size,
                        position_stack,
                        obs_seq_len
                    )
                    log_dict[f"example_{i}"] = wandb.Image(fig)
                    plt.close(fig)
            
            wandb.log(log_dict)
    
    # Load the best model before returning
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f"Loaded best model with val_loss: {best_val_loss:.4f}")
    
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




def run_inference(model, frames, action_stack, device=None, img_size=(96, 96), obs_seq_len=4, position_stack=None):
    """
    Run inference with the trained policy network
    
    Args:
        model: Trained policy network
        frames: List of consecutive frames (numpy arrays)
        action_stack: Stack of previous actions
        device: Torch device to use (defaults to cuda if available)
        img_size: Size to resize frame to (width, height)
        obs_seq_len: Length of observation sequence
        position_stack: Optional stack of player positions
        
    Returns:
        Predicted action probabilities
    """
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    if len(frames) < obs_seq_len:
        raise ValueError(f"Expected at least {obs_seq_len} frames, got {len(frames)}")
    
    if isinstance(action_stack, np.ndarray) and action_stack.ndim == 2:
        # Action history is already in correct format
        if action_stack.shape[0] != obs_seq_len - 1:
            raise ValueError(f"Expected action_history with {obs_seq_len-1} actions, got {action_stack.shape[0]}")
    else:
        # Convert list or single action to correct format
        if not isinstance(action_stack, list):
            action_stack = [action_stack]
        
        # Pad if necessary
        while len(action_stack) < obs_seq_len - 1:
            action_stack.insert(0, np.zeros(len(KEY_TO_INDEX), dtype=np.float32))
        
        # Truncate if necessary
        if len(action_stack) > obs_seq_len - 1:
            action_stack = action_stack[-(obs_seq_len - 1):]
        
        action_stack = np.array(action_stack)
    
    model.eval()
    
    # Process the stack of frames
    frame_stack = []
    for frame in frames[-obs_seq_len:]:  # Use only the last obs_seq_len frames
        # Resize frame to match network input size
        frame = cv2.resize(frame, img_size)
        
        # Convert to tensor and normalize
        frame_tensor = torch.FloatTensor(frame.transpose(2, 0, 1)) / 255.0
        frame_stack.append(frame_tensor)
    
    # Stack frames along channel dimension
    stacked_frames = torch.cat(frame_stack, dim=0)
    stacked_frames = stacked_frames.unsqueeze(0).to(device)  # Add batch dimension
    
    # Convert action history to tensor
    action_tensor = torch.FloatTensor(action_stack).unsqueeze(0).to(device)
    
    # Process position stack if available
    position_tensor = None
    if position_stack is not None:
        if isinstance(position_stack, np.ndarray):
            position_tensor = torch.FloatTensor(position_stack).unsqueeze(0).to(device)
    
    # Run inference
    with torch.no_grad():
        predicted_action = model(stacked_frames, action_tensor, position_tensor)
    
    return predicted_action.cpu().numpy()[0]


def rollout_policy(env, policy_model, num_steps=500, device=None, use_positions=True):
    """
    Run a trained policy network in the environment.
    
    Args:
        env: The P5jsEnv environment
        policy_model: The trained policy network
        num_steps: Number of steps to run
        device: Torch device to use
        use_positions: Whether to use player positions as input
        
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
        frame_stack = torch.FloatTensor(obs["frame_stack"]).unsqueeze(0).to(device) / 255.0
        action_stack = torch.FloatTensor(obs["action_stack"]).unsqueeze(0).to(device)
        
        # Get position stack if available and enabled
        position_stack = None
        if use_positions and "position_stack" in obs:
            position_stack = torch.FloatTensor(obs["position_stack"]).unsqueeze(0).to(device)
        
        # Get action from policy network
        with torch.no_grad():
            action = policy_model(frame_stack, action_stack, position_stack)
        
        # Convert action to numpy array
        action_np = action.squeeze(0).cpu().numpy()

        action_str = "".join([f"{key}: {action_np[i]:.2f} " for i, key in enumerate(KEY_TO_INDEX.keys())])
        print(f"Action: {action_str}")
        
        # Randomly sample from action distribution
        action_binary = np.random.binomial(1, action_np).astype(np.float32)
        
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


def evaluate_policy(model_path, game_code, num_episodes=5, max_steps=500, obs_seq_len=4):
    """
    Evaluate a trained policy on a game.
    
    Args:
        model_path: Path to the trained model
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
    
    # Get observation size from environment
    obs_size = env.obs_size
    
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = PolicyNetwork(
        input_channels=3, 
        num_keys=len(KEY_TO_INDEX), 
        img_size=obs_size,
        obs_seq_len=obs_seq_len
    ).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    
    # Run evaluations
    episode_rewards = []
    episode_steps = []
    successes = 0
    
    for episode in range(num_episodes):
        print(f"Episode {episode+1}/{num_episodes}")
        rewards, observations, actions = rollout_policy(env, model, max_steps, device, use_positions=True)
        
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
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Train and evaluate a policy network for P5js games")
    parser.add_argument("action", nargs="?", choices=["train", "infer", "eval", "analyze_video"], 
                      help="Action to perform: train, infer, eval, or analyze_video")
    parser.add_argument("--run-name", type=str, help="Name for this training run (default: auto-generated timestamp)")
    parser.add_argument("--wandb", action="store_true", help="Use wandb for logging")
    parser.add_argument("--ckpt-path", type=str, help="Path to a specific checkpoint file for evaluation or inference")
    
    # Parse only known args to avoid issues with additional arguments
    args, unknown = parser.parse_known_args()
    
    # Set the run name if provided
    if args.run_name:
        RUN_NAME = args.run_name
    
    # Now set the checkpoint directory based on the run name
    CHECKPOINT_DIR = Path(__file__).parent / "results" / Path(__file__).stem / "checkpoints" / RUN_NAME
    
    # simple left/right movements
    # log_dir = Path(__file__).parent / "results" / "games_v5" / "rating_b6251405-403d-4df1-a3bb-046ab0075e1b_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"

    # around 5 min of gameplay
    log_dirs = [
        Path(__file__).parent / "results" / "games_v5" / "rating_46cb9522-1ca3-4676-96f4-855276f1ea2a_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1",
        Path(__file__).parent / "results" / "games_v5" / "rating_42a0b09d-9cfe-4ebe-8e59-13c9b46ab150_game_6ecf4c0a8bcbc48f1e16c651e829606539c10ca59a172a4302c125063a3c7dc1"
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

    # Create dataset
    frames = []
    key_actions = []
    player_positions = []
    events = []
    for log_dir in log_dirs:
        video_path, logs, video_framecount_start = load_data_from_dir(log_dir)
        _frames, _key_actions, _player_positions, _events = load_data(video_path, logs, video_framecount_start)
        frames.extend(_frames)
        key_actions.extend(_key_actions)
        player_positions.extend(_player_positions)
        events.extend(_events)        

    # animate_frames(frames, key_actions, player_positions, events)

    # for i in range(200):
    #     print(key_actions[i])


    # for i in range(100):
    #     plt.figure()
    #     actions = np.array(key_actions)
    #     plt.imshow(actions[i*100:(i+1)*100].T)
    #     plt.yticks(range(len(KEY_TO_INDEX)), list(KEY_TO_INDEX.keys()))
    #     plt.tight_layout()
    #     plt.show()

    # Create models directory if it doesn't exist
    models_dir = CHECKPOINT_DIR
    models_dir.mkdir(exist_ok=True, parents=True)
    
    # Set the model path - either from args or default location
    if args.ckpt_path:
        model_path = Path(args.ckpt_path)
    else:
        model_path = models_dir / "policy_model.pth"
    
    # Set image size for model
    img_size = (96, 96)  # (width, height)
    obs_seq_len = 4  # Length of observation sequence (frames and actions)
    
    # Use wandb based on argument
    # use_wandb = args.wandb
    use_wandb = True
    
    # Perform the specified action
    if args.action:
        if args.action == "train":
            # copy content of log_dir to models_dir
            for file in log_dir.iterdir():
                shutil.copy(file, models_dir / file.name)
            
            # Train the policy network
            model = train_policy(
                frames, 
                key_actions, 
                player_positions, 
                epochs=50, 
                lr=1e-3, 
                img_size=img_size, 
                use_wandb=use_wandb,
                obs_seq_len=obs_seq_len,
                use_positions=True
            )
            
            # Save the model
            torch.save(model.state_dict(), model_path)
            print(f"Model saved to {model_path}")

        elif args.action == "infer":            
            # Load the model
            if not model_path.exists():
                print(f"Model not found at {model_path}. Please check the path or train a model first.")
                sys.exit(1)
            else:
                print(f"Using model from: {model_path}")
            
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            model = PolicyNetwork(
                input_channels=3, 
                num_keys=len(KEY_TO_INDEX), 
                img_size=img_size,
                obs_seq_len=obs_seq_len
            ).to(device)
            # model.load_state_dict(torch.load(model_path, map_location=device))
            print(f"Model loaded from {model_path}")

            # Create dataset
            dataset = GameDataset(frames, key_actions, player_positions, img_size=img_size, obs_seq_len=obs_seq_len)
            print(f"Dataset length: {len(dataset)}")

            def visualize_sample(x, y, pred=None):
                frames = x["frame_stack"].reshape(obs_seq_len, 3, 96, 96)
                actions = x["action_stack"]  # (obs_seq_len - 1, num_keys)
                positions = x["position_stack"]  # (obs_seq_len, 2)

                # plot sequence: frame, position, action, frame, position, action, ...
                n_plots = 3 * obs_seq_len
                plt.figure(figsize=(25, 5))
                for i in range(n_plots):
                    plt.subplot(1, n_plots, i + 1)
                    if i % 3 == 0:
                        frame = frames[i // 3].permute(1, 2, 0).cpu().numpy()
                        plt.imshow(frame)
                        plt.title(f"Frame {i // 3}")
                    elif i % 3 == 1:
                        position = positions[i // 3].cpu().numpy()
                        plt.scatter(position[0], position[1], color="red")
                        plt.title(f"Position {i // 3}")
                    else:
                        # show target if last action
                        if i // 3 == obs_seq_len - 1:
                            action = y.cpu().numpy()
                            plt.bar(range(len(action)), action)
                            if pred is not None:
                                plt.scatter(range(len(pred)), pred, color="red")
                            plt.xticks(range(len(action)), list(KEY_TO_INDEX.keys()), rotation=90)
                            plt.title(f"Target {i // 3}")
                        else:
                            action = actions[i // 3].cpu().numpy()
                            plt.bar(range(len(action)), action)
                            plt.xticks(range(len(action)), list(KEY_TO_INDEX.keys()), rotation=90)
                            plt.title(f"Action {i // 3}")
                plt.tight_layout()
                plt.show()

            dataloader = DataLoader(dataset, batch_size=1, shuffle=True)
            for i, (x, y) in enumerate(dataloader):
                pred = model(x["frame_stack"], x["action_stack"], x["position_stack"])
                pred = pred.squeeze(0).cpu().detach().numpy()

                # remove batch dimension
                for key in x.keys():
                    x[key] = x[key].squeeze(0)
                y = y.squeeze(0)

                # if (y == x["action_stack"][-1]).all():
                #     continue

                visualize_sample(x, y, pred)

            # Run inference on a sample frame
            sample_idx = 10  # Choose a sample frame
            frame_stack = [frames[sample_idx + i] for i in range(obs_seq_len)]
            action_stack = key_actions[sample_idx:sample_idx + obs_seq_len - 1]
            
            predicted_action = run_inference(
                model, 
                frame_stack, 
                action_stack, 
                device, 
                img_size=img_size,
                obs_seq_len=obs_seq_len
            )
            actual_action = key_actions[sample_idx + obs_seq_len - 1]
            
            print("Predicted action:", predicted_action)
            print("Actual action:   ", actual_action)
        elif args.action == "eval":
            # Load game code from dataset
            import datasets
            game_dataset = datasets.load_dataset(GAMES_DATASET, split="train")
            
            # take first log_dir
            log_dir = log_dirs[0]
            video_metadata = json.load(open(log_dir / "metadata.json", "r"))

            # Get game_id from metadata
            game_id = video_metadata["game_id"]
            
            print(f"Evaluating policy on game: {game_id}")
            
            # Check if the model exists
            if not model_path.exists():
                print(f"Model not found at {model_path}. Please check the path or train a model first.")
                sys.exit(1)
            else:
                print(f"Using model from: {model_path}")
            
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
                max_steps=1000,
                obs_seq_len=obs_seq_len
            )
        elif args.action == "analyze_video":
            analyze_video_logs(video_path, logs, video_framecount_start)
    else:
        # If no action is specified, load the data and visualize it
        print("No action specified. Loading data and visualizing...")
        
        # Visualize the data with animation
        animate_frames(frames, key_actions, player_positions=player_positions, events=events)




    # TODO?: balance dataset to have enough transitions where action different from prev_action (otherwise model will just learn to output same as input action)
from datetime import datetime
from pathlib import Path
import json
import pickle
import shutil
import tempfile
import cv2
import sys
import argparse
from collections import defaultdict
from huggingface_hub import hf_hub_download
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from typing import Dict, Tuple, Union
import io
import base64
from PIL import Image

from datasets import load_dataset

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


games_version = "v5"
run_name = "pilot1"

GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"
STATIC_ANALYSIS_DATASET = f"generative-games/gen-games-{games_version}-static-analysis"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem


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
    # player_pos_y_flipped = canvas_size[1] - player_pos_y 
 
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
                    print(f"Unexpected event type: {event_type}")
                    continue
                    # raise ValueError(f"Unexpected event type: {event_type}")
                key = event["data"]["key"]
                if key not in KEY_TO_INDEX:
                    print(f"Unexpected key: {key}")
                    continue
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


import torch
import torch.nn as nn
import torch.nn.functional as F
import pytorch_lightning as pl
from torch.utils.data import Dataset, DataLoader, random_split


class ActionSequenceDataset(Dataset):
    """Dataset for action sequence modeling with player positions."""
    def __init__(self, player_positions, key_actions, seq_len=300):
        """
        Args:
            player_positions: List of (x, y) tuples for player positions
            key_actions: Array of shape (num_frames, num_keys) with binary key states
            seq_len: Length of sequences to use for training
        """
        self.player_positions = player_positions
        self.key_actions = key_actions
        self.seq_len = seq_len
        
    def __len__(self):
        return max(0, len(self.player_positions) - self.seq_len - 1)  # -1, so we have a target
    
    def __getitem__(self, idx):
        start_idx = idx
        end_idx = idx + self.seq_len
        
        # Gather positions and actions for this sequence
        positions = self.player_positions[start_idx:end_idx]
        actions = self.key_actions[start_idx:end_idx]
        
        # Convert to tensors
        positions_tensor = torch.tensor(positions, dtype=torch.float32)
        actions_tensor = torch.tensor(actions, dtype=torch.float32)
        
        # Input is interleaved sequence of [pos_0, act_0, pos_1, act_1, ...]
        input_seq = torch.zeros(self.seq_len * 2, positions_tensor.shape[1] + actions_tensor.shape[1])
        
        for i in range(self.seq_len):
            # Position features
            input_seq[i*2, :2] = positions_tensor[i]
            # Action features (shift by 2 to avoid overlap with position features)
            input_seq[i*2+1, 2:] = actions_tensor[i]
        
        # Target is the next action after the sequence
        target = torch.tensor(self.key_actions[end_idx], dtype=torch.float32)
        
        return input_seq, target


class PositionActionTransformer(nn.Module):
    """Transformer model for predicting actions based on position and action history."""
    def __init__(self, input_dim, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1, num_actions=len(KEY_TO_INDEX)):
        super().__init__()
        
        # Input embedding
        self.input_embedding = nn.Linear(input_dim, d_model)
        
        # Positional encoding
        self.pos_encoder = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.GELU(),
            nn.Linear(d_model, d_model),
            nn.Dropout(dropout)
        )
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Output head
        self.output_head = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim_feedforward, num_actions),
            nn.Sigmoid()  # For binary classification of key states
        )
        
    def forward(self, x):
        # x shape: [batch_size, seq_len, input_dim]
        
        # Input embedding
        x = self.input_embedding(x)
        
        # Add positional encoding
        x = x + self.pos_encoder(x)
        
        # Transformer encoder
        x = self.transformer_encoder(x)
        
        # Use the final token's representation for prediction
        x = x[:, -1, :]
        
        # Output layer
        return self.output_head(x)


class ActionSequencePredictor(pl.LightningModule):
    """PyTorch Lightning module for action sequence prediction."""
    def __init__(self, 
                 input_dim, 
                 lr=1e-4, 
                 d_model=64, 
                 nhead=4, 
                 num_layers=2, 
                 dim_feedforward=128, 
                 dropout=0.1,
                 weight_decay=1e-5):
        super().__init__()
        
        self.save_hyperparameters()
        
        # Model
        self.model = PositionActionTransformer(
            input_dim=input_dim,
            d_model=d_model,
            nhead=nhead,
            num_layers=num_layers,
            dim_feedforward=dim_feedforward,
            dropout=dropout
        )
        
        # Loss function
        self.criterion = nn.BCELoss()
        
    def forward(self, x):
        return self.model(x)
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = self.criterion(y_hat, y)
        self.log('train_loss', loss, prog_bar=True)
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = self.criterion(y_hat, y)
        self.log('val_loss', loss, prog_bar=True)
        return loss
    
    def configure_optimizers(self):
        optimizer = torch.optim.Adam(
            self.parameters(), 
            lr=self.hparams.lr, 
            weight_decay=self.hparams.weight_decay
        )
        return optimizer


def train_transformer_model(player_positions, key_actions, batch_size=32, max_epochs=30, seq_len=300):
    """
    Train a transformer model to predict actions based on position and action history.
    
    Args:
        player_positions: List of (x, y) tuples for player positions
        key_actions: Array of shape (num_frames, num_keys) with binary key states
        batch_size: Batch size for training
        max_epochs: Maximum number of epochs to train
        seq_len: Length of sequences to use for training
        
    Returns:
        Trained model
    """
    # Create dataset
    dataset = ActionSequenceDataset(player_positions, key_actions, seq_len=seq_len)
    
    # Split dataset into train and validation
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset, 
        batch_size=batch_size, 
        shuffle=True, 
        num_workers=4,
        pin_memory=True
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=batch_size, 
        num_workers=4,
        pin_memory=True
    )
    
    # Get input dimensions from first batch
    example_batch, _ = next(iter(train_loader))
    input_dim = example_batch.shape[-1]
    
    # Create model
    model = ActionSequencePredictor(input_dim=input_dim)
    
    # Create logger
    from pytorch_lightning.loggers import WandbLogger
    wandb_logger = WandbLogger(project="action-sequence-prediction", 
                             name="transformer-model",
                             log_model=True)
    
    # Create trainer
    trainer = pl.Trainer(
        max_epochs=max_epochs,
        accelerator='auto',
        devices='auto',
        logger=wandb_logger,
        callbacks=[
            pl.callbacks.EarlyStopping(monitor='val_loss', patience=10),
            pl.callbacks.ModelCheckpoint(
                dirpath=save_dir / "checkpoints",
                filename='transformer-{epoch:02d}-{val_loss:.4f}',
                save_top_k=3,
                monitor='val_loss',
                mode='min'
            )
        ]
    )
    
    # Train model
    trainer.fit(model, train_loader, val_loader)
    
    return model


if __name__ == "__main__":
    game_dataset = load_dataset(GAMES_DATASET, split="train")
    rating_dataset = load_dataset(RATING_DATASET, split="train")

    # remove test users (any user with "test" in their id)
    rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
    print(f"After removing test users: {rating_dataset}")

    if not (save_dir / "player_positions.pkl").exists():
        all_actions = []
        all_player_positions = []
        # all_frames = []  # take too much memory

        results = defaultdict(list)
        for i, entry in enumerate(rating_dataset):
            rating_id = entry["id"]
            game_id = entry["game_id"]

            _res_dir = save_dir / "results_by_user" / f"user_{entry['user_id']}" / f"game_{game_id}"
            _res_dir.mkdir(exist_ok=True, parents=True)

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
                if not (_res_dir / "video.mp4").exists():
                    shutil.copy(video_path, _res_dir / "video.mp4")

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

            # analyze_video_logs(Path(video_path), logs, video_framecount_start)
        
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

            # all_frames.extend(frames)
            all_actions.extend(key_actions)
            all_player_positions.extend(player_positions)

        with open(save_dir / "key_actions.pkl", "wb") as f:
            pickle.dump(all_actions, f)
        with open(save_dir / "player_positions.pkl", "wb") as f:
            pickle.dump(all_player_positions, f)

    # load data
    with open(save_dir / "key_actions.pkl", "rb") as f:
        key_actions = pickle.load(f)
    with open(save_dir / "player_positions.pkl", "rb") as f:
        player_positions = pickle.load(f)

    # Train transformer model
    model = train_transformer_model(player_positions, key_actions)
    
    # Save model
    torch.save(model.state_dict(), save_dir / "transformer_model.pt")
    print(f"Model saved to {save_dir / 'transformer_model.pt'}")


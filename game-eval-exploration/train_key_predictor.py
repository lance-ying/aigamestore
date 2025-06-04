import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import pickle
from pathlib import Path
import numpy as np
import cv2 # For frame loading if needed
from collections import defaultdict
import json
from huggingface_hub import hf_hub_download
import shutil

# Constants from train_action_seq.py (adjust if needed)
KEY_TO_INDEX = {
    "Enter": 0, # enter
    " ": 1, # space
    "ArrowLeft": 2, # arrow left
    "ArrowUp": 3, # arrow up
    "ArrowRight": 4, # arrow right
    "ArrowDown": 5, # arrow down
    "r": 6, # r
}
NUM_KEYS = len(KEY_TO_INDEX)

# Create action classes for all possible combinations of up to 2 keys
def create_action_classes():
    # No keys pressed (1 option)
    no_key_action = {0: []}
    
    # Single key presses (len(KEY_TO_INDEX) options)
    single_key_actions = {i+1: [i] for i in range(NUM_KEYS)}
    
    # Two key combinations (len(KEY_TO_INDEX) choose 2 options)
    two_key_actions = {}
    class_idx = NUM_KEYS + 1
    for i in range(NUM_KEYS):
        for j in range(i+1, NUM_KEYS):
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
    action = np.zeros(NUM_KEYS)
    for key_idx in pressed_keys:
        action[key_idx] = 1.0
    return action

# --- Dataset Class ---
class GameActionDataset(Dataset):
    def __init__(self, data_path, transform=None, img_size=(64, 64)):
        """
        Load real data from saved pickle files
        
        Args:
            data_path: Path to directory containing key_actions.pkl and player_positions.pkl
            transform: Optional transform to apply to frames
            img_size: Target size for frames (width, height)
        """
        print(f"Loading data from {data_path}...")
        self.img_size = img_size
        self.transform = transform
        
        # Load key actions and player positions
        key_actions_path = Path(data_path) / "key_actions.pkl"
        player_positions_path = Path(data_path) / "player_positions.pkl"
        
        if not key_actions_path.exists() or not player_positions_path.exists():
            raise FileNotFoundError(f"Data files not found at {data_path}")
        
        # Load the saved data files
        with open(key_actions_path, "rb") as f:
            self.key_actions = pickle.load(f)
        
        with open(player_positions_path, "rb") as f:
            self.player_positions = pickle.load(f)
        
        print(f"Loaded {len(self.key_actions)} key actions and {len(self.player_positions)} player positions")
        
        # Validate data: ensure we have matching numbers of actions and positions
        if len(self.key_actions) != len(self.player_positions):
            print(f"Warning: Mismatch between number of actions ({len(self.key_actions)}) and positions ({len(self.player_positions)})")
            # Use the smaller length
            self.length = min(len(self.key_actions), len(self.player_positions))
        else:
            self.length = len(self.key_actions)
        
        # Process player positions - normalize to [0, 1]
        # Find max values for normalization
        pos_x_values = [pos[0] for pos in self.player_positions if pos is not None]
        pos_y_values = [pos[1] for pos in self.player_positions if pos is not None]
        
        if pos_x_values and pos_y_values:
            self.max_x = max(pos_x_values)
            self.max_y = max(pos_y_values)
        else:
            # Default values if no valid positions
            self.max_x = 600
            self.max_y = 400
        
        print(f"Position normalization: max_x={self.max_x}, max_y={self.max_y}")
        
        # Process key actions array to numpy if needed
        if isinstance(self.key_actions[0], list):
            self.key_actions = [np.array(action) for action in self.key_actions]
        
        # For now, we'll use dummy frames but with the correct dimensions
        # In a real implementation, you'd load the actual frames here
        # or implement a frame loader in __getitem__
        self.frames = [
            np.random.randint(0, 255, (self.img_size[1], self.img_size[0], 3), dtype=np.uint8)
            for _ in range(self.length)
        ]

    def __len__(self):
        return self.length

    def __getitem__(self, idx):
        # Get the frame (dummy for now)
        frame = self.frames[idx]
        
        # Get player position
        pos = self.player_positions[idx]
        if pos is None:
            # If position is None, use zeros
            pos_normalized = np.zeros(2, dtype=np.float32)
        else:
            # Normalize position
            pos_normalized = np.array([
                pos[0] / self.max_x,
                pos[1] / self.max_y
            ], dtype=np.float32)
        
        # Get key action and convert to class
        action_vector = self.key_actions[idx]
        action_class = encode_action(action_vector)
        
        # Process frame
        # For a real implementation, you might load the frame from disk here
        # Convert to tensor and apply transforms
        frame_tensor = torch.FloatTensor(frame.transpose(2, 0, 1)) / 255.0
        
        if self.transform:
            frame_tensor = self.transform(frame_tensor)
        
        return {
            "frame": frame_tensor, 
            "position": torch.FloatTensor(pos_normalized), 
            "action": torch.tensor(action_class, dtype=torch.long)
        }

# --- Model Definition ---
class KeyPredictor(nn.Module):
    def __init__(self, num_action_classes, frame_channels=3, frame_height=64, frame_width=64):
        super().__init__()
        # CNN for frames (example structure)
        self.conv1 = nn.Conv2d(frame_channels, 16, kernel_size=5, stride=2, padding=2) # Output: B x 16 x H/2 x W/2
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2) # Output: B x 16 x H/4 x W/4
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1) # Output: B x 32 x H/4 x W/4
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2) # Output: B x 32 x H/8 x W/8

        # Calculate flattened size after conv layers
        cnn_output_height = frame_height // 8
        cnn_output_width = frame_width // 8
        self.flattened_size = 32 * cnn_output_height * cnn_output_width

        # MLP for player positions
        self.pos_fc1 = nn.Linear(2, 16)
        self.pos_relu = nn.ReLU()
        self.pos_fc2 = nn.Linear(16, 32)

        # Combined layers
        self.combined_fc1 = nn.Linear(self.flattened_size + 32, 128)
        self.combined_relu = nn.ReLU()
        self.output_fc = nn.Linear(128, num_action_classes)  # Now outputs logits for action classes

    def forward(self, frame, position):
        # Process frame
        x_frame = self.pool1(self.relu1(self.conv1(frame)))
        x_frame = self.pool2(self.relu2(self.conv2(x_frame)))
        x_frame = torch.flatten(x_frame, 1) # Flatten

        # Process position
        x_pos = self.pos_relu(self.pos_fc1(position))
        x_pos = self.pos_fc2(x_pos)

        # Combine
        x_combined = torch.cat((x_frame, x_pos), dim=1)
        x = self.combined_relu(self.combined_fc1(x_combined))
        output = self.output_fc(x) # Raw logits for class prediction
        return output

# --- Training Loop ---
def train_model(model, dataloader, criterion, optimizer, device, num_epochs=10):
    model.train()
    print(f"Starting training on {device}...")
    for epoch in range(num_epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        for i, batch in enumerate(dataloader):
            frames = batch['frame'].to(device)
            positions = batch['position'].to(device)
            targets = batch['action'].to(device)

            optimizer.zero_grad()

            outputs = model(frames, positions)
            loss = criterion(outputs, targets)

            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            
            # Calculate accuracy
            _, predicted = torch.max(outputs.data, 1)
            total += targets.size(0)
            correct += (predicted == targets).sum().item()
            
            if (i + 1) % 10 == 0: # Print every 10 batches
                print(f'Epoch [{epoch+1}/{num_epochs}], Batch [{i+1}/{len(dataloader)}], Loss: {running_loss / 10:.4f}, Acc: {100 * correct / total:.2f}%')
                running_loss = 0.0
                correct = 0
                total = 0
    print("Finished Training")

# --- Evaluation Function ---
def evaluate_model(model, dataloader, device):
    model.eval()
    correct = 0
    total = 0
    
    # Keep track of confusion matrix data
    class_correct = [0] * NUM_ACTION_CLASSES
    class_total = [0] * NUM_ACTION_CLASSES
    
    with torch.no_grad():
        for batch in dataloader:
            frames = batch['frame'].to(device)
            positions = batch['position'].to(device)
            targets = batch['action'].to(device)
            
            outputs = model(frames, positions)
            _, predicted = torch.max(outputs.data, 1)
            
            total += targets.size(0)
            correct += (predicted == targets).sum().item()
            
            # Update per-class accuracy
            for i in range(len(targets)):
                label = targets[i].item()
                class_total[label] += 1
                if predicted[i] == label:
                    class_correct[label] += 1
    
    # Overall accuracy
    accuracy = 100 * correct / total
    print(f'Overall Test Accuracy: {accuracy:.2f}%')
    
    # Per-class accuracy for classes that have samples
    for i in range(NUM_ACTION_CLASSES):
        if class_total[i] > 0:
            class_acc = 100 * class_correct[i] / class_total[i]
            # Get the keys for this class
            keys = ACTION_CLASSES[i]
            key_names = [list(KEY_TO_INDEX.keys())[k] for k in keys] if keys else ["None"]
            key_str = '+'.join(key_names)
            print(f'Class {i} ({key_str}): {class_acc:.2f}% ({class_correct[i]}/{class_total[i]})')
    
    return accuracy

# --- Main Execution ---
if __name__ == "__main__":
    # Configuration
    data_dir = Path(__file__).parent / "results" / "train_action_seq" # Path to where key_actions.pkl etc. are
    save_path = Path(__file__).parent / "results" / "key_predictor_model.pth"
    save_path.parent.mkdir(parents=True, exist_ok=True)

    batch_size = 32
    learning_rate = 0.001
    num_epochs = 10 # Increased slightly for real data
    frame_height, frame_width = 64, 64 # Target size for frames

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Transformations
    transform = transforms.Compose([
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])

    # Load real data
    try:
        dataset = GameActionDataset(data_path=data_dir, transform=transform, img_size=(frame_width, frame_height))
        
        # Print class distribution
        action_counts = {}
        for i in range(len(dataset)):
            action_class = dataset[i]['action'].item()
            if action_class not in action_counts:
                action_counts[action_class] = 0
            action_counts[action_class] += 1
        
        print("\nAction class distribution:")
        for action_class, count in sorted(action_counts.items()):
            keys = ACTION_CLASSES[action_class]
            key_names = [list(KEY_TO_INDEX.keys())[k] for k in keys] if keys else ["None"]
            key_str = '+'.join(key_names)
            print(f"Class {action_class} ({key_str}): {count} samples ({count/len(dataset)*100:.2f}%)")
            
        # Split dataset into train and test sets
        train_size = int(0.8 * len(dataset))
        test_size = len(dataset) - train_size
        train_dataset, test_dataset = torch.utils.data.random_split(dataset, [train_size, test_size])
        
        train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
        test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

        # Print dataset statistics
        print(f"\nNumber of action classes: {NUM_ACTION_CLASSES}")
        print(f"Total samples: {len(dataset)}")
        print(f"Training samples: {len(train_dataset)}")
        print(f"Testing samples: {len(test_dataset)}")

        # Model, Loss, Optimizer
        model = KeyPredictor(num_action_classes=NUM_ACTION_CLASSES, frame_height=frame_height, frame_width=frame_width).to(device)
        criterion = nn.CrossEntropyLoss() # For multi-class classification
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)

        # Train the model
        train_model(model, train_dataloader, criterion, optimizer, device, num_epochs)
        
        # Evaluate the model
        evaluate_model(model, test_dataloader, device)

        # Save the model
        print(f"Saving model to {save_path}")
        torch.save(model.state_dict(), save_path)
        
        print("Script finished.")
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("\nPlease ensure the pickle files exist in the specified directory.")
        print("If you need to generate them, run train_action_seq.py first.") 
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from pathlib import Path
import json
import logging
from typing import Dict, List, Optional, Tuple
from tqdm import tqdm
import wandb
from models.reward_model import RewardModel
from datetime import datetime


class GameCodeDataset(Dataset):
    """Dataset for game code and their version numbers"""

    def __init__(self, data_dir: Path):
        """
        Initialize dataset from game directories
        Args:
            data_dir: Directory containing game folders
        """
        self.samples = []
        self._load_games(data_dir)

    def _load_games(self, data_dir: Path):
        """Load all game versions from the data directory"""
        for game_dir in data_dir.glob("**/game_*"):
            versions_dir = game_dir / "versions"
            if not versions_dir.exists():
                continue

            # Load all versions (v0 through v10)
            for version_dir in versions_dir.glob("v*"):
                try:
                    # Get version number (0-10)
                    version_num = int(version_dir.name[1:])

                    html_path = version_dir / "index.html"
                    js_path = version_dir / "game.js"

                    if not all(p.exists() for p in [html_path, js_path]):
                        continue

                    with open(html_path, "r", encoding="utf-8") as f:
                        html_code = f.read()
                    with open(js_path, "r", encoding="utf-8") as f:
                        js_code = f.read()

                    self.samples.append(
                        {
                            "html_code": html_code,
                            "js_code": js_code,
                            "version": version_num,  # Direct version number as score
                            "path": str(version_dir),
                        }
                    )

                except Exception as e:
                    logging.warning(f"Error loading version from {version_dir}: {e}")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict:
        return self.samples[idx]


class RewardTrainer:
    """Trainer for the reward model"""

    def __init__(
        self,
        model: RewardModel,
        train_data_dir: Path,
        val_data_dir: Optional[Path] = None,
        batch_size: int = 8,
        learning_rate: float = 1e-4,
        num_epochs: int = 50,
        checkpoint_dir: Optional[Path] = None,
        use_wandb: bool = False,
    ):
        """
        Initialize the trainer

        Args:
            model: Reward model to train
            train_data_dir: Directory containing training data
            val_data_dir: Directory containing validation data
            batch_size: Training batch size
            learning_rate: Learning rate
            num_epochs: Number of training epochs
            checkpoint_dir: Directory to save checkpoints
            use_wandb: Whether to use Weights & Biases for logging
        """
        self.model = model
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.num_epochs = num_epochs
        self.checkpoint_dir = checkpoint_dir
        self.use_wandb = use_wandb

        # Setup device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(self.device)

        # Initialize datasets and dataloaders
        self.train_dataset = GameCodeDataset(train_data_dir)
        self.train_loader = DataLoader(
            self.train_dataset, batch_size=batch_size, shuffle=True, num_workers=4
        )

        if val_data_dir:
            self.val_dataset = GameCodeDataset(val_data_dir)
            self.val_loader = DataLoader(
                self.val_dataset, batch_size=batch_size, shuffle=False, num_workers=4
            )
        else:
            self.val_loader = None

        # Setup optimizer and scheduler
        self.optimizer = AdamW(
            self.model.parameters(), lr=learning_rate, weight_decay=0.01
        )
        self.scheduler = CosineAnnealingLR(self.optimizer, T_max=num_epochs)

        # Initialize wandb
        if use_wandb:
            wandb.init(
                project="game-reward-model",
                entity="prometheus",
            )

        # Create checkpoint directory
        if checkpoint_dir:
            checkpoint_dir.mkdir(parents=True, exist_ok=True)

    def train_epoch(self) -> Dict[str, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        all_predictions = []
        all_targets = []

        for batch in tqdm(self.train_loader, desc="Training"):
            # Get batch data
            html_codes = batch["html_code"]
            js_codes = batch["js_code"]
            target_versions = torch.tensor(batch["version"], device=self.device)

            # Forward pass
            self.optimizer.zero_grad()
            predicted_scores = self.model(html_codes, js_codes)

            # Compute loss
            loss = self.model.compute_loss(predicted_scores, target_versions)

            # Backward pass
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            all_predictions.extend(predicted_scores.cpu().detach().numpy())
            all_targets.extend(target_versions.cpu().numpy())

        # Calculate metrics
        avg_loss = total_loss / len(self.train_loader)
        prediction_accuracy = sum(
            abs(p - t) < 0.5 for p, t in zip(all_predictions, all_targets)
        ) / len(all_predictions)

        return {"loss": avg_loss, "accuracy": prediction_accuracy}

    @torch.no_grad()
    def validate(self) -> Dict[str, float]:
        """Run validation"""
        if not self.val_loader:
            return {}

        self.model.eval()
        total_loss = 0
        all_predictions = []
        all_targets = []

        for batch in tqdm(self.val_loader, desc="Validation"):
            html_codes = batch["html_code"]
            js_codes = batch["js_code"]
            target_versions = torch.tensor(batch["version"], device=self.device)

            predicted_scores = self.model(html_codes, js_codes)
            loss = self.model.compute_loss(predicted_scores, target_versions)

            total_loss += loss.item()
            all_predictions.extend(predicted_scores.cpu().numpy())
            all_targets.extend(target_versions.cpu().numpy())

        avg_loss = total_loss / len(self.val_loader)
        prediction_accuracy = sum(
            abs(p - t) < 0.5 for p, t in zip(all_predictions, all_targets)
        ) / len(all_predictions)

        return {"val_loss": avg_loss, "val_accuracy": prediction_accuracy}

    def save_checkpoint(self, epoch: int, metrics: Dict):
        """Save a model checkpoint"""
        if not self.checkpoint_dir:
            return

        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scheduler_state_dict": self.scheduler.state_dict(),
            "metrics": metrics,
        }

        path = self.checkpoint_dir / f"checkpoint_epoch_{epoch}.pt"
        torch.save(checkpoint, path)

    def load_checkpoint(self, path: Path):
        """Load a model checkpoint"""
        checkpoint = torch.load(path)

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.scheduler.load_state_dict(checkpoint["scheduler_state_dict"])

        return checkpoint["epoch"], checkpoint["metrics"]

    def train(self):
        """Run full training loop"""
        best_val_loss = float("inf")

        for epoch in range(self.num_epochs):
            print(f"\nEpoch {epoch + 1}/{self.num_epochs}")

            # Training
            train_metrics = self.train_epoch()

            # Validation
            val_metrics = self.validate()

            # Update learning rate
            self.scheduler.step()

            # Log metrics
            metrics = {**train_metrics, **val_metrics}
            if self.use_wandb:
                wandb.log(metrics)

            print(f"Train loss: {train_metrics['loss']:.4f}")
            if val_metrics:
                print(f"Val loss: {val_metrics['val_loss']:.4f}")

            # Save checkpoint if best model
            if val_metrics and val_metrics["val_loss"] < best_val_loss:
                best_val_loss = val_metrics["val_loss"]
                self.save_checkpoint(epoch, metrics)

        print("\nTraining completed!")


def prepare_training_data(games_dir: Path, output_dir: Path):
    """
    Prepare training data by generating expert scores for games
    This would typically involve human experts rating games
    """
    # TODO: Implement data preparation process
    pass


if __name__ == "__main__":
    # Example usage
    model = RewardModel(vocab_size=50000, d_model=512, nhead=8, num_encoder_layers=6)

    trainer = RewardTrainer(
        model=model,
        train_data_dir=Path("data/train"),
        val_data_dir=Path("data/val"),
        batch_size=8,
        learning_rate=1e-4,
        num_epochs=50,
        checkpoint_dir=Path("checkpoints"),
        use_wandb=True,
    )

    trainer.train()

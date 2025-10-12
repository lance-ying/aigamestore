from dataclasses import dataclass
from typing import Optional
from pathlib import Path
from .model_config import RewardModelConfig, CodeImproverConfig, PPOConfig


@dataclass
class DataConfig:
    """Configuration for data handling"""

    train_data_dir: Path
    val_data_dir: Optional[Path] = None
    output_dir: Path = Path("outputs")
    checkpoint_dir: Path = Path("checkpoints")

    batch_size: int = 16
    num_workers: int = 4
    shuffle: bool = True

    def __post_init__(self):
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)


@dataclass
class RewardModelTrainingConfig:
    """Configuration for reward model training"""

    model_config: RewardModelConfig
    data_config: DataConfig

    num_epochs: int = 50
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    warmup_steps: int = 1000
    eval_steps: int = 500
    save_steps: int = 1000

    use_wandb: bool = True
    project_name: str = "game-reward-model"

    early_stopping_patience: int = 5
    gradient_accumulation_steps: int = 1


@dataclass
class ImprovementPipelineConfig:
    """Configuration for code improvement pipeline"""

    model_config: CodeImproverConfig
    data_config: DataConfig

    num_iterations: int = 10
    save_all_versions: bool = True
    parallel_processing: bool = False
    max_attempts_per_iteration: int = 3


@dataclass
class PPOTrainingConfig:
    """Configuration for PPO fine-tuning"""

    model_config: CodeImproverConfig
    reward_model_config: RewardModelConfig
    ppo_config: PPOConfig
    data_config: DataConfig

    num_epochs: int = 100
    max_steps: int = 1000000
    eval_interval: int = 1000
    save_interval: int = 5000

    use_wandb: bool = True
    project_name: str = "code-improver-ppo"

    checkpoint_strategy: str = "best"  # 'best' or 'last' or 'all'
    eval_batch_size: int = 16


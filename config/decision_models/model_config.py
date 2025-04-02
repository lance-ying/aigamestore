from dataclasses import dataclass
from typing import Optional, List
from pathlib import Path


@dataclass
class BaseModelConfig:
    """Base configuration for all models"""

    model_name: Optional[str] = None
    model_path: Optional[Path] = None
    device: Optional[str] = "cuda"
    max_seq_length: Optional[int] = 1024
    vocab_size: Optional[int] = 50000


@dataclass
class RewardModelConfig(BaseModelConfig):
    """Configuration for the reward model"""

    d_model: int = 512
    nhead: int = 8
    num_encoder_layers: int = 6
    dim_feedforward: int = 2048
    dropout: float = 0.1
    tokenizer_path: Optional[str] = None

    # Score weights for different aspects
    score_weights: dict = None

    def __post_init__(self):
        if self.score_weights is None:
            self.score_weights = {
                # Code quality weights
                "code_structure": 0.7,
                "code_modularity": 0.7,
                "readability": 0.6,
                "maintainability": 0.6,
                "performance": 0.8,
                # Game mechanics weights
                "game_mechanics": 0.9,
                "game_controls": 0.8,
                "collision_detection": 0.7,
                # Game experience weights
                "fun_factor": 1.0,
                "innovation": 0.9,
                "challenge_design": 0.9,
                "replay_value": 0.8,
                # UI weights
                "user_experience": 0.8,
                "visual_clarity": 0.7,
                "ui_feedback": 0.7,
                # Overall scores weights
                "technical_score": 0.9,
                "gameplay_score": 1.0,
                "overall": 1.0,
            }


@dataclass
class CodeImproverConfig(BaseModelConfig):
    """Configuration for the code improver model"""

    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    num_return_sequences: int = 1
    max_new_tokens: int = 2048

    improvement_aspects: List[str] = None

    def __post_init__(self):
        if self.improvement_aspects is None:
            self.improvement_aspects = [
                "code organization",
                "performance optimization",
                "error handling",
                "user experience",
                "code readability",
                "game mechanics",
                "visual design",
                "code modularity",
            ]


@dataclass
class PPOConfig:
    """Configuration for PPO fine-tuning"""

    learning_rate: float = 1e-5
    clip_epsilon: float = 0.2
    value_loss_coef: float = 0.5
    entropy_coef: float = 0.01
    max_grad_norm: float = 0.5
    ppo_epochs: int = 4
    mini_batch_size: int = 8
    gamma: float = 0.99
    gae_lambda: float = 0.95


# Default configurations
DEFAULT_REWARD_MODEL_CONFIG = RewardModelConfig(
    d_model=512, nhead=8, num_encoder_layers=6
)

DEFAULT_CODE_IMPROVER_CONFIG = CodeImproverConfig(
    model_name="o3-mini", temperature=0.7, top_p=0.9
)

DEFAULT_PPO_CONFIG = PPOConfig(
    learning_rate=1e-5, clip_epsilon=0.2, value_loss_coef=0.5
)

import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical
from typing import List, Dict, Tuple
from pathlib import Path
import wandb
from tqdm import tqdm
import numpy as np
from models.reward_model import RewardModel
from transformers import AutoModelForCausalLM, AutoTokenizer


class ModelFinetuner:
    """Fine-tune language model using PPO with reward model feedback"""

    def __init__(
        self,
        base_model_name: str = "deepseek-ai/deepseek-coder-1.3b-base",
        reward_model_path: str = "checkpoints/reward_model.pt",
        device: str = "cuda",
        learning_rate: float = 1e-5,
        clip_epsilon: float = 0.2,
        value_loss_coef: float = 0.5,
        entropy_coef: float = 0.01,
        max_grad_norm: float = 0.5,
        ppo_epochs: int = 4,
        mini_batch_size: int = 8,
        use_wandb: bool = True,
    ):
        """
        Initialize the model fine-tuner

        Args:
            base_model_name: Name/path of the base language model
            reward_model_path: Path to trained reward model
            device: Device to run training on
            learning_rate: Learning rate for optimization
            clip_epsilon: PPO clipping parameter
            value_loss_coef: Value function loss coefficient
            entropy_coef: Entropy bonus coefficient
            max_grad_norm: Maximum gradient norm for clipping
            ppo_epochs: Number of PPO epochs per batch
            mini_batch_size: Size of mini-batches for PPO updates
            use_wandb: Whether to use Weights & Biases logging
        """
        self.device = torch.device(device)
        self.clip_epsilon = clip_epsilon
        self.value_loss_coef = value_loss_coef
        self.entropy_coef = entropy_coef
        self.max_grad_norm = max_grad_norm
        self.ppo_epochs = ppo_epochs
        self.mini_batch_size = mini_batch_size
        self.use_wandb = use_wandb

        # Initialize models
        self.policy = AutoModelForCausalLM.from_pretrained(base_model_name).to(
            self.device
        )
        self.policy_old = AutoModelForCausalLM.from_pretrained(base_model_name).to(
            self.device
        )
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)

        # Load reward model
        self.reward_model = RewardModel()
        self.reward_model.load_state_dict(torch.load(reward_model_path))
        self.reward_model = self.reward_model.to(self.device)
        self.reward_model.eval()

        # Initialize optimizer
        self.optimizer = optim.Adam(self.policy.parameters(), lr=learning_rate)

        if use_wandb:
            wandb.init(project="code-improver-ppo")

    def compute_rewards(
        self, html_codes: List[str], js_codes: List[str]
    ) -> torch.Tensor:
        """Compute rewards using the reward model"""
        with torch.no_grad():
            rewards = []
            for html, js in zip(html_codes, js_codes):
                scores = self.reward_model(html, js)
                # Use overall score as the reward
                rewards.append(scores["overall"])
            return torch.tensor(rewards, device=self.device)

    def generate_code(
        self, prompt: str, max_length: int = 1024
    ) -> Tuple[str, torch.Tensor]:
        """Generate code and return action probabilities"""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.policy.generate(
                **inputs,
                max_length=max_length,
                do_sample=True,
                output_scores=True,
                return_dict_in_generate=True,
            )

        generated_ids = outputs.sequences[0]
        generated_text = self.tokenizer.decode(generated_ids)

        # Get action probabilities
        scores = torch.stack(outputs.scores, dim=1)
        action_probs = torch.softmax(scores, dim=-1)

        return generated_text, action_probs

    def evaluate_actions(
        self, states: torch.Tensor, actions: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Evaluate actions and compute value estimates"""
        outputs = self.policy(
            input_ids=states, labels=actions, output_hidden_states=True
        )

        action_logprobs = -outputs.loss
        state_values = self.policy.transformer.wte(states).mean(dim=1)
        dist = Categorical(logits=outputs.logits)
        dist_entropy = dist.entropy().mean()

        return action_logprobs, state_values, dist_entropy

    def ppo_update(
        self,
        states: torch.Tensor,
        actions: torch.Tensor,
        old_action_probs: torch.Tensor,
        rewards: torch.Tensor,
        advantages: torch.Tensor,
    ) -> Dict[str, float]:
        """Perform PPO update"""
        # Convert to PyTorch tensors
        states = torch.tensor(states, device=self.device)
        actions = torch.tensor(actions, device=self.device)
        old_action_probs = torch.tensor(old_action_probs, device=self.device)
        rewards = torch.tensor(rewards, device=self.device)
        advantages = torch.tensor(advantages, device=self.device)

        # PPO update for multiple epochs
        for _ in range(self.ppo_epochs):
            # Generate random mini-batches
            batch_size = states.size(0)
            indices = torch.randperm(batch_size)

            for start_idx in range(0, batch_size, self.mini_batch_size):
                end_idx = start_idx + self.mini_batch_size
                batch_indices = indices[start_idx:end_idx]

                # Get mini-batch data
                state_batch = states[batch_indices]
                action_batch = actions[batch_indices]
                old_action_prob_batch = old_action_probs[batch_indices]
                advantage_batch = advantages[batch_indices]
                reward_batch = rewards[batch_indices]

                # Evaluate actions
                action_logprobs, state_values, dist_entropy = self.evaluate_actions(
                    state_batch, action_batch
                )

                # Calculate ratios
                ratios = torch.exp(action_logprobs - old_action_prob_batch)

                # Calculate surrogate losses
                surr1 = ratios * advantage_batch
                surr2 = (
                    torch.clamp(ratios, 1 - self.clip_epsilon, 1 + self.clip_epsilon)
                    * advantage_batch
                )

                # Calculate policy and value losses
                policy_loss = -torch.min(surr1, surr2).mean()
                value_loss = 0.5 * (state_values - reward_batch).pow(2).mean()

                # Calculate total loss
                loss = (
                    policy_loss
                    + self.value_loss_coef * value_loss
                    - self.entropy_coef * dist_entropy
                )

                # Update policy
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(
                    self.policy.parameters(), self.max_grad_norm
                )
                self.optimizer.step()

        return {
            "policy_loss": policy_loss.item(),
            "value_loss": value_loss.item(),
            "entropy": dist_entropy.item(),
        }

    def compute_gae(
        self,
        rewards: torch.Tensor,
        values: torch.Tensor,
        gamma: float = 0.99,
        lambda_: float = 0.95,
    ) -> torch.Tensor:
        """Compute Generalized Advantage Estimation"""
        advantages = torch.zeros_like(rewards)
        last_gae = 0

        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_value = 0
            else:
                next_value = values[t + 1]

            delta = rewards[t] + gamma * next_value - values[t]
            advantages[t] = last_gae = delta + gamma * lambda_ * last_gae

        return advantages

    def finetune(
        self,
        training_data: List[Dict],
        num_epochs: int = 100,
        batch_size: int = 16,
        checkpoint_dir: Path = Path("checkpoints"),
    ):
        """
        Fine-tune the model using PPO

        Args:
            training_data: List of training examples
            num_epochs: Number of training epochs
            batch_size: Batch size for training
            checkpoint_dir: Directory to save checkpoints
        """
        checkpoint_dir.mkdir(parents=True, exist_ok=True)

        for epoch in range(num_epochs):
            epoch_stats = []

            # Process training data in batches
            for i in range(0, len(training_data), batch_size):
                batch = training_data[i : i + batch_size]

                # Generate improved code for each example
                states, actions, old_probs = [], [], []
                html_codes, js_codes = [], []

                for example in batch:
                    prompt = example["prompt"]
                    generated_code, action_probs = self.generate_code(prompt)

                    # Parse generated code into HTML and JS
                    html, js = self.parse_generated_code(generated_code)
                    html_codes.append(html)
                    js_codes.append(js)

                    # Store trajectory information
                    states.append(self.tokenizer.encode(prompt))
                    actions.append(self.tokenizer.encode(generated_code))
                    old_probs.append(action_probs)

                # Compute rewards using reward model
                rewards = self.compute_rewards(html_codes, js_codes)

                # Compute advantages
                with torch.no_grad():
                    state_values = self.policy_old(
                        torch.tensor(states, device=self.device)
                    ).pooler_output
                advantages = self.compute_gae(rewards, state_values)

                # Update policy using PPO
                stats = self.ppo_update(states, actions, old_probs, rewards, advantages)
                epoch_stats.append(stats)

                # Update old policy
                self.policy_old.load_state_dict(self.policy.state_dict())

            # Log epoch statistics
            avg_stats = {
                k: np.mean([s[k] for s in epoch_stats]) for k in epoch_stats[0].keys()
            }

            if self.use_wandb:
                wandb.log({"epoch": epoch, **avg_stats})

            # Save checkpoint
            if (epoch + 1) % 10 == 0:
                checkpoint_path = checkpoint_dir / f"model_epoch_{epoch+1}.pt"
                torch.save(
                    {
                        "epoch": epoch,
                        "model_state_dict": self.policy.state_dict(),
                        "optimizer_state_dict": self.optimizer.state_dict(),
                        "stats": avg_stats,
                    },
                    checkpoint_path,
                )

            print(f"Epoch {epoch+1}/{num_epochs}, Stats: {avg_stats}")

    def parse_generated_code(self, generated_text: str) -> Tuple[str, str]:
        """Parse generated text into HTML and JavaScript code"""
        # Extract HTML and JS code using regex patterns
        html_pattern = r"```html\s*(.*?)\s*```"
        js_pattern = r"```javascript\s*(.*?)\s*```"

        import re

        html_match = re.search(html_pattern, generated_text, re.DOTALL)
        js_match = re.search(js_pattern, generated_text, re.DOTALL)

        html_code = html_match.group(1) if html_match else ""
        js_code = js_match.group(1) if js_match else ""

        return html_code, js_code

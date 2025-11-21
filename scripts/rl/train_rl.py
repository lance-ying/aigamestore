#!/usr/bin/env python3
"""
Train a reinforcement learning agent on a p5.js game using Stable-Baselines3.

This script demonstrates how to use the gym_wrapper to train RL agents on
browser-based games.

Usage:
    python train_rl.py --game snake-io --steps 50000
    python train_rl.py --game snake-io --algo PPO --render
    python train_rl.py --game snake-io --load models/snake_ppo.zip --eval

Examples:
    # Train PPO agent on snake-io
    python train_rl.py --game snake-io --steps 100000

    # Train DQN agent with rendering
    python train_rl.py --game snake-io --algo DQN --render --steps 50000

    # Evaluate trained model
    python train_rl.py --game snake-io --load models/snake_ppo.zip --eval --episodes 10

Dependencies:
    pip install stable-baselines3[extra] gymnasium numpy playwright
    playwright install chromium
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import numpy as np
from stable_baselines3 import PPO, DQN, A2C
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv

from scripts.rl.gym_wrapper_true import P5GameEnv


def make_env(game_name: str, render_mode=None, **kwargs):
    """Create and wrap the environment."""
    def _init():
        env = P5GameEnv(
            game_name=game_name,
            render_mode=render_mode,
            **kwargs
        )
        env = Monitor(env)
        return env
    return _init


def train(args):
    """Train an RL agent."""
    print(f"\n{'='*60}")
    print(f"Training RL Agent")
    print(f"{'='*60}\n")
    print(f"Game: {args.game}")
    print(f"Algorithm: {args.algo}")
    print(f"Total timesteps: {args.steps:,}")
    print(f"Observation type: {args.obs_type}")
    print(f"Headless: {not args.render}\n")

    # Create environment
    env = DummyVecEnv([
        make_env(
            args.game,
            render_mode="human" if args.render else None,
            observation_type=args.obs_type,
            headless=not args.render
        )
    ])

    # Create model
    model_classes = {
        "PPO": PPO,
        "DQN": DQN,
        "A2C": A2C,
    }

    if args.algo not in model_classes:
        print(f"❌ Error: Unknown algorithm '{args.algo}'")
        print(f"   Available: {', '.join(model_classes.keys())}")
        sys.exit(1)

    ModelClass = model_classes[args.algo]

    if args.load:
        print(f"📂 Loading model from {args.load}...")
        model = ModelClass.load(args.load, env=env)
    else:
        print(f"🤖 Creating new {args.algo} model...")

        # Algorithm-specific hyperparameters
        if args.algo == "PPO":
            model = ModelClass(
                "MlpPolicy",
                env,
                verbose=1,
                learning_rate=3e-4,
                n_steps=2048,
                batch_size=64,
                n_epochs=10,
                gamma=0.99,
                gae_lambda=0.95,
                clip_range=0.2,
                ent_coef=0.01,
            )
        elif args.algo == "DQN":
            model = ModelClass(
                "MlpPolicy",
                env,
                verbose=1,
                learning_rate=1e-4,
                buffer_size=50000,
                learning_starts=1000,
                batch_size=32,
                gamma=0.99,
                target_update_interval=1000,
                exploration_fraction=0.1,
                exploration_final_eps=0.05,
            )
        else:  # A2C
            model = ModelClass(
                "MlpPolicy",
                env,
                verbose=1,
                learning_rate=7e-4,
                n_steps=5,
                gamma=0.99,
                ent_coef=0.01,
            )

    # Setup callbacks
    models_dir = Path("models") / args.game
    models_dir.mkdir(parents=True, exist_ok=True)

    checkpoint_callback = CheckpointCallback(
        save_freq=max(args.steps // 10, 1000),
        save_path=str(models_dir),
        name_prefix=f"{args.algo.lower()}_checkpoint",
    )

    # Train
    print(f"\n🎯 Starting training...\n")

    try:
        model.learn(
            total_timesteps=args.steps,
            callback=[checkpoint_callback],
            progress_bar=True,
        )
    except KeyboardInterrupt:
        print(f"\n⚠️  Training interrupted by user")

    # Save final model
    final_path = models_dir / f"{args.algo.lower()}_final.zip"
    model.save(str(final_path))

    print(f"\n✅ Training complete!")
    print(f"📁 Model saved to: {final_path}\n")

    env.close()


def evaluate(args):
    """Evaluate a trained agent."""
    if not args.load:
        print("❌ Error: --load is required for evaluation")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Evaluating RL Agent")
    print(f"{'='*60}\n")
    print(f"Game: {args.game}")
    print(f"Model: {args.load}")
    print(f"Episodes: {args.episodes}\n")

    # Create environment
    env = P5GameEnv(
        game_name=args.game,
        render_mode="human" if args.render else None,
        observation_type=args.obs_type,
        headless=not args.render
    )

    # Load model
    print(f"📂 Loading model...")

    # Detect algorithm from filename
    algo_name = None
    for algo in ["PPO", "DQN", "A2C"]:
        if algo.lower() in args.load.lower():
            algo_name = algo
            break

    if not algo_name:
        algo_name = args.algo

    model_classes = {"PPO": PPO, "DQN": DQN, "A2C": A2C}
    ModelClass = model_classes[algo_name]

    model = ModelClass.load(args.load)

    # Run evaluation
    print(f"🎮 Running evaluation...\n")

    episode_rewards = []
    episode_lengths = []

    for episode in range(args.episodes):
        obs, info = env.reset()
        episode_reward = 0
        episode_length = 0
        done = False

        while not done:
            action, _states = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, info = env.step(action)
            episode_reward += reward
            episode_length += 1
            done = terminated or truncated

        episode_rewards.append(episode_reward)
        episode_lengths.append(episode_length)

        print(f"Episode {episode + 1}/{args.episodes}: "
              f"Reward={episode_reward:.2f}, "
              f"Length={episode_length}, "
              f"Score={info.get('score', 0)}")

    # Print summary
    print(f"\n{'='*60}")
    print(f"Evaluation Summary")
    print(f"{'='*60}")
    print(f"Mean reward: {np.mean(episode_rewards):.2f} ± {np.std(episode_rewards):.2f}")
    print(f"Mean length: {np.mean(episode_lengths):.1f} ± {np.std(episode_lengths):.1f}")
    print(f"Min/Max reward: {np.min(episode_rewards):.2f} / {np.max(episode_rewards):.2f}")
    print()

    env.close()


def main():
    parser = argparse.ArgumentParser(
        description="Train RL agents on p5.js games",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--game",
        default="snake-io",
        help="Game name (directory name in public/games/)"
    )

    parser.add_argument(
        "--algo",
        choices=["PPO", "DQN", "A2C"],
        default="PPO",
        help="RL algorithm to use (default: PPO)"
    )

    parser.add_argument(
        "--steps",
        type=int,
        default=50000,
        help="Total training timesteps (default: 50000)"
    )

    parser.add_argument(
        "--obs-type",
        choices=["state", "pixels"],
        default="state",
        help="Observation type (default: state)"
    )

    parser.add_argument(
        "--render",
        action="store_true",
        help="Render the environment (show browser window)"
    )

    parser.add_argument(
        "--eval",
        action="store_true",
        help="Evaluate mode instead of training"
    )

    parser.add_argument(
        "--episodes",
        type=int,
        default=10,
        help="Number of episodes for evaluation (default: 10)"
    )

    parser.add_argument(
        "--load",
        type=str,
        help="Path to model to load (.zip file)"
    )

    args = parser.parse_args()

    # Check if game exists
    game_dir = Path("public/games") / args.game
    if not game_dir.exists():
        print(f"❌ Error: Game directory not found: {game_dir}")
        sys.exit(1)

    if not (game_dir / "gym_api.js").exists():
        print(f"❌ Error: gym_api.js not found in {game_dir}")
        print(f"   Run: python scripts/rl/add_gym_api.py {game_dir}")
        sys.exit(1)

    # Run training or evaluation
    if args.eval:
        evaluate(args)
    else:
        train(args)


if __name__ == "__main__":
    main()

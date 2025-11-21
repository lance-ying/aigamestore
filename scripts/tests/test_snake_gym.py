#!/usr/bin/env python3
"""
Quick test script for snake-io Gym wrapper.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.rl.gym_wrapper import P5GameEnv

def main():
    print("\n" + "="*60)
    print("Testing snake-io Gym Wrapper")
    print("="*60 + "\n")

    # Create environment
    print("Creating environment...")
    env = P5GameEnv(
        game_name="snake-io",
        render_mode=None,  # Set to "human" to see the game
        observation_type="state",
        max_episode_steps=500,
        headless=True
    )

    print(f"✓ Environment created")
    print(f"  Action space: {env.action_space}")
    print(f"  Observation space: {env.observation_space}")
    print()

    # Run test episodes
    num_episodes = 3
    print(f"Running {num_episodes} test episodes...\n")

    for episode in range(num_episodes):
        obs, info = env.reset()
        episode_reward = 0
        done = False
        step = 0

        print(f"Episode {episode + 1}:")
        print(f"  Initial obs shape: {obs.shape}")
        print(f"  Initial info: {info}")

        while not done and step < 200:
            # Take random action
            action = env.action_space.sample()
            obs, reward, terminated, truncated, info = env.step(action)

            episode_reward += reward
            done = terminated or truncated
            step += 1

            # Print every 50 steps
            if step % 50 == 0:
                print(f"  Step {step}: Reward={episode_reward:.2f}, Score={info.get('score', 0)}")

        print(f"  ✓ Episode finished: {step} steps, Total Reward: {episode_reward:.2f}, Final Score: {info.get('score', 0)}")
        print()

    env.close()

    print("="*60)
    print("✅ Test completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print("  1. Train an agent: uv run python scripts/rl/train_rl.py --game snake-io --steps 100000")
    print("  2. Watch training: tensorboard --logdir models/")
    print()

if __name__ == "__main__":
    main()

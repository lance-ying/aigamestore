#!/usr/bin/env python3
"""
Quick test - just 1 episode with 50 steps
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.rl.gym_wrapper import P5GameEnv
import time

def main():
    print("\n" + "="*60)
    print("Quick Snake.io Test (1 episode, 50 steps)")
    print("="*60 + "\n")

    # Create environment
    print("Creating environment...")
    start = time.time()
    env = P5GameEnv(
        game_name="snake-io",
        render_mode=None,
        observation_type="state",
        max_episode_steps=50,  # Very short
        headless=True
    )
    print(f"✓ Environment created in {time.time() - start:.1f}s")
    print(f"  Action space: {env.action_space}")
    print(f"  Observation space: {env.observation_space}")
    print()

    # Single quick episode
    print("Running 1 test episode (50 steps max)...\n")

    start = time.time()
    obs, info = env.reset()
    print(f"✓ Reset complete ({time.time() - start:.1f}s)")
    print(f"  Observation shape: {obs.shape}")
    print(f"  Initial info: {info}")
    print()

    episode_reward = 0
    done = False
    step = 0

    print("Taking steps...")
    while not done and step < 50:
        step_start = time.time()

        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)

        episode_reward += reward
        done = terminated or truncated
        step += 1

        # Print every 10 steps
        if step % 10 == 0 or done:
            print(f"  Step {step}: Reward={episode_reward:.2f}, Score={info.get('score', 0)}, "
                  f"Time={time.time() - step_start:.3f}s")

    print()
    print(f"✓ Episode finished: {step} steps, Total Reward: {episode_reward:.2f}")
    print(f"  Total episode time: {time.time() - start:.1f}s")
    print(f"  Average step time: {(time.time() - start) / step:.3f}s")
    print()

    env.close()

    print("="*60)
    print("✅ Test completed successfully!")
    print("="*60)
    print()
    print("Performance notes:")
    print(f"  - Each step takes ~{(time.time() - start) / step:.2f}s (browser automation overhead)")
    print(f"  - For training, expect ~10-20 steps/second")
    print(f"  - 100k steps = ~1.5-3 hours of training")
    print()

if __name__ == "__main__":
    main()

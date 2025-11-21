#!/usr/bin/env python3
"""
Debug test with verbose output
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.rl.gym_wrapper import P5GameEnv
import time

def main():
    print("\n" + "="*60)
    print("Debug Test with Verbose Output")
    print("="*60 + "\n")

    # Create environment
    print("Creating environment...")
    start = time.time()
    env = P5GameEnv(
        game_name="snake-io",
        render_mode=None,
        observation_type="state",
        max_episode_steps=10,  # Very short for debugging
        headless=True
    )
    print(f"✓ Environment created in {time.time() - start:.1f}s\n")

    # Test reset
    print("=" * 40)
    print("Testing reset()...")
    print("=" * 40)
    start = time.time()

    try:
        obs, info = env.reset()
        print(f"✓ Reset completed in {time.time() - start:.1f}s")
        print(f"  Observation: {obs}")
        print(f"  Info: {info}")
    except Exception as e:
        print(f"✗ Reset failed: {e}")
        import traceback
        traceback.print_exc()
        env.close()
        return

    print()

    # Test a few steps with detailed output
    print("=" * 40)
    print("Testing step()...")
    print("=" * 40)

    for i in range(5):
        print(f"\nStep {i+1}:")
        print(f"  Action: Taking random action...")

        action = env.action_space.sample()
        print(f"    Selected action: {action}")

        step_start = time.time()
        try:
            obs, reward, terminated, truncated, info = env.step(action)
            elapsed = time.time() - step_start

            print(f"  ✓ Step completed in {elapsed:.3f}s")
            print(f"    Reward: {reward:.2f}")
            print(f"    Terminated: {terminated}, Truncated: {truncated}")
            print(f"    Score: {info.get('score', 0)}")
            print(f"    Phase: {info.get('phase', 'unknown')}")
            print(f"    Observation shape: {obs.shape}")

            if terminated or truncated:
                print(f"\n  Episode ended at step {i+1}")
                break

        except Exception as e:
            print(f"  ✗ Step failed: {e}")
            import traceback
            traceback.print_exc()
            break

    print()
    print("=" * 40)
    print("Closing environment...")
    print("=" * 40)
    env.close()
    print("\n✅ Debug test complete!\n")

if __name__ == "__main__":
    main()

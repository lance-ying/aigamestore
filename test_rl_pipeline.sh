#!/bin/bash
# Test script to demonstrate the complete RL training pipeline

set -e  # Exit on error

echo "================================================"
echo "RL Training Pipeline - Complete Test"
echo "================================================"
echo ""

GAME="snake-io"
GAME_DIR="public/games/$GAME"

# Check if game exists
if [ ! -d "$GAME_DIR" ]; then
    echo "❌ Error: Game directory not found: $GAME_DIR"
    exit 1
fi

echo "Game: $GAME"
echo "Directory: $GAME_DIR"
echo ""

# Step 1: Generate Gym API
echo "📝 Step 1: Generating Gym API..."
echo "Command: python scripts/rl/add_gym_api.py $GAME_DIR"
echo ""

python scripts/rl/add_gym_api.py "$GAME_DIR"

if [ ! -f "$GAME_DIR/gym_api.js" ]; then
    echo "❌ Error: gym_api.js was not created"
    exit 1
fi

echo "✅ gym_api.js created successfully"
echo ""

# Step 2: Test Gym wrapper
echo "📝 Step 2: Testing Gym wrapper..."
echo "This will run 3 test episodes with random actions"
echo ""

python -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))
from scripts.rl.gym_wrapper import P5GameEnv
import numpy as np

env = P5GameEnv(
    game_name='$GAME',
    render_mode=None,
    observation_type='state',
    max_episode_steps=500,
    headless=True
)

print(f'Action space: {env.action_space}')
print(f'Observation space: {env.observation_space}')
print()

for episode in range(3):
    obs, info = env.reset()
    episode_reward = 0
    done = False
    step = 0

    while not done and step < 200:
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        episode_reward += reward
        done = terminated or truncated
        step += 1

    print(f'Episode {episode + 1}: {step} steps, Reward: {episode_reward:.2f}, Score: {info.get(\"score\", 0)}')

env.close()
print()
"

echo "✅ Gym wrapper test passed"
echo ""

# Step 3: Quick training test (small number of steps)
echo "📝 Step 3: Quick training test (1000 steps)..."
echo "Command: python scripts/rl/train_rl.py --game $GAME --steps 1000"
echo ""

python scripts/rl/train_rl.py --game "$GAME" --algo PPO --steps 1000

echo ""
echo "✅ Training test completed"
echo ""

# Summary
echo "================================================"
echo "Pipeline Test Summary"
echo "================================================"
echo ""
echo "✅ All steps completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Review the generated gym_api.js in $GAME_DIR/"
echo "  2. Run full training: python scripts/rl/train_rl.py --game $GAME --steps 100000"
echo "  3. Evaluate the model: python scripts/rl/train_rl.py --game $GAME --load models/$GAME/ppo_final.zip --eval"
echo ""
echo "For more information, see RL_TRAINING.md"
echo ""

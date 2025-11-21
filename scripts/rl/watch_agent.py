#!/usr/bin/env python3
"""
Watch a trained RL agent play the game in real-time.

Usage:
    python watch_agent.py --model models/snake-io/ppo_final.zip
    python watch_agent.py --model models/snake-io/ppo_final.zip --episodes 5 --speed 1.0
"""

import argparse
import sys
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from stable_baselines3 import PPO, DQN, A2C
from scripts.rl.gym_wrapper_true import P5GameEnv


def watch_agent(model, env, num_episodes=1, speed=1.0, show_stats=True):
    """
    Watch the agent play with live statistics.
    
    Args:
        model: Trained model
        env: Game environment
        num_episodes: Number of episodes to play
        speed: Game speed multiplier (higher = faster)
        show_stats: Print statistics during play
    """
    
    for episode in range(num_episodes):
        print(f"\n{'='*60}")
        print(f"Episode {episode + 1}/{num_episodes}")
        print(f"{'='*60}\n")
        
        obs, info = env.reset()
        episode_reward = 0
        episode_length = 0
        done = False
        
        # Track actions - get names from env config
        action_names = {}
        if hasattr(env, 'action_labels') and env.action_labels:
            action_names = {i: label for i, label in enumerate(env.action_labels)}
        else:
            # Fallback to generic names
            action_names = {i: f"action_{i}" for i in range(env.action_space.n)}
        
        action_history = []
        
        step = 0
        while not done:
            # Get action from model
            action, _states = model.predict(obs, deterministic=True)
            action = int(action)
            action_history.append(action)
            
            # Step environment
            obs, reward, terminated, truncated, info = env.step(action)
            episode_reward += reward
            episode_length += 1
            done = terminated or truncated
            step += 1
            
            # Print stats periodically
            if show_stats and step % 50 == 0:
                score = info.get('score', 0)
                player_length = info.get('playerLength', 0)
                print(f"  Step {step:4d} | Score: {score:3d} | Length: {player_length:3d} | "
                      f"Reward: {episode_reward:7.1f} | Action: {action_names[action]}")
            
            # Control speed
            if speed < 1.0:
                time.sleep((1.0 - speed) * 0.1)
        
        # Episode summary
        print(f"\n{'-'*60}")
        print(f"Episode {episode + 1} Complete!")
        print(f"{'-'*60}")
        print(f"Total Steps:   {episode_length}")
        print(f"Total Reward:  {episode_reward:.2f}")
        print(f"Final Score:   {info.get('score', 0)}")
        print(f"Final Length:  {info.get('playerLength', 0)}")
        
        # Action breakdown
        print(f"\nAction Distribution:")
        for action_id in sorted(set(action_history)):
            count = action_history.count(action_id)
            pct = (count / len(action_history)) * 100
            bar = '█' * int(pct / 2)
            print(f"  {action_names[action_id]:>6s}: {count:4d} ({pct:5.1f}%) {bar}")
        
        if episode < num_episodes - 1:
            print(f"\nStarting next episode in 3 seconds...")
            time.sleep(3)
    
    print(f"\n{'='*60}")
    print(f"All Episodes Complete!")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Watch trained RL agent play",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "--model",
        default="models/snake-io/ppo_final.zip",
        help="Path to model file (.zip) - default: models/snake-io/ppo_final.zip"
    )
    
    parser.add_argument(
        "--game",
        default="snake-io",
        help="Game name (default: snake-io)"
    )
    
    parser.add_argument(
        "--episodes",
        type=int,
        default=1,
        help="Number of episodes to watch (default: 1)"
    )
    
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Game speed multiplier 0.0-1.0 (default: 1.0 = full speed, 0.5 = slower)"
    )
    
    parser.add_argument(
        "--no-stats",
        action="store_true",
        help="Don't print statistics during play"
    )
    
    args = parser.parse_args()
    
    # Check if model exists
    model_path = Path(args.model)
    if not model_path.exists():
        print(f"❌ Error: Model not found: {model_path}")
        print(f"\nAvailable models:")
        models_dir = Path("models") / args.game
        if models_dir.exists():
            for model_file in models_dir.glob("*.zip"):
                print(f"  - {model_file}")
        return
    
    print("\n" + "="*60)
    print("WATCH RL AGENT PLAY")
    print("="*60)
    print(f"\nModel:    {args.model}")
    print(f"Game:     {args.game}")
    print(f"Episodes: {args.episodes}")
    print(f"Speed:    {args.speed}x")
    
    # Detect algorithm from filename
    algo_name = "PPO"
    for algo in ["PPO", "DQN", "A2C"]:
        if algo.lower() in args.model.lower():
            algo_name = algo
            break
    
    # Load model
    print(f"\n📂 Loading {algo_name} model...")
    model_classes = {"PPO": PPO, "DQN": DQN, "A2C": A2C}
    ModelClass = model_classes[algo_name]
    model = ModelClass.load(args.model)
    print("✓ Model loaded")
    
    # Create environment with rendering
    print(f"\n🎮 Starting game environment...")
    env = P5GameEnv(
        game_name=args.game,
        render_mode="human",  # Show the browser window
        observation_type="state",
        headless=False  # NOT headless - we want to see it!
    )
    print("✓ Environment ready")
    
    print(f"\n🎬 Starting playback...")
    print(f"{'='*60}\n")
    
    # Watch the agent play
    watch_agent(
        model,
        env,
        num_episodes=args.episodes,
        speed=args.speed,
        show_stats=not args.no_stats
    )
    
    # Cleanup
    env.close()


if __name__ == "__main__":
    main()


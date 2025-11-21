#!/usr/bin/env python3
"""
Analyze a trained RL model to understand its performance and characteristics.

Usage:
    python analyze_model.py --model models/snake-io/ppo_final.zip --episodes 20
"""

import argparse
import json
import sys
import numpy as np
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from stable_baselines3 import PPO, DQN, A2C
from scripts.rl.gym_wrapper_true import P5GameEnv


def analyze_model_structure(model):
    """Analyze the model architecture and hyperparameters."""
    print("\n" + "="*60)
    print("MODEL STRUCTURE")
    print("="*60)
    
    # Get policy architecture
    print(f"\nPolicy Type: {model.policy.__class__.__name__}")
    print(f"Observation Space: {model.observation_space}")
    print(f"Action Space: {model.action_space}")
    
    # Get hyperparameters
    print("\n" + "-"*60)
    print("HYPERPARAMETERS")
    print("-"*60)
    
    if hasattr(model, 'learning_rate'):
        lr = model.learning_rate
        if callable(lr):
            lr = lr(1.0)  # Get initial learning rate
        print(f"Learning Rate: {lr}")
    
    if hasattr(model, 'gamma'):
        print(f"Gamma (discount): {model.gamma}")
    
    if hasattr(model, 'n_steps'):
        print(f"Steps per update: {model.n_steps}")
    
    if hasattr(model, 'batch_size'):
        print(f"Batch size: {model.batch_size}")
    
    if hasattr(model, 'ent_coef'):
        print(f"Entropy coefficient: {model.ent_coef}")
    
    if hasattr(model, 'clip_range'):
        clip = model.clip_range
        if callable(clip):
            clip = clip(1.0)
        print(f"Clip range: {clip}")
    
    # Neural network architecture
    print("\n" + "-"*60)
    print("NEURAL NETWORK ARCHITECTURE")
    print("-"*60)
    
    if hasattr(model.policy, 'mlp_extractor'):
        print(f"\nPolicy Network:")
        for name, param in model.policy.mlp_extractor.named_parameters():
            print(f"  {name}: {list(param.shape)}")
        
        print(f"\nAction Head:")
        for name, param in model.policy.action_net.named_parameters():
            print(f"  {name}: {list(param.shape)}")
        
        print(f"\nValue Head:")
        for name, param in model.policy.value_net.named_parameters():
            print(f"  {name}: {list(param.shape)}")
    
    # Count total parameters
    total_params = sum(p.numel() for p in model.policy.parameters())
    trainable_params = sum(p.numel() for p in model.policy.parameters() if p.requires_grad)
    print(f"\nTotal Parameters: {total_params:,}")
    print(f"Trainable Parameters: {trainable_params:,}")


def evaluate_model(model, env, num_episodes=20, render=False):
    """Evaluate model performance over multiple episodes."""
    print("\n" + "="*60)
    print(f"PERFORMANCE EVALUATION ({num_episodes} episodes)")
    print("="*60 + "\n")
    
    episode_rewards = []
    episode_lengths = []
    episode_scores = []
    
    action_counts = {0: 0, 1: 0, 2: 0, 3: 0}
    action_names = {0: "no-op", 1: "left", 2: "right", 3: "boost"}
    
    for episode in range(num_episodes):
        obs, info = env.reset()
        episode_reward = 0
        episode_length = 0
        done = False
        
        while not done:
            action, _states = model.predict(obs, deterministic=True)
            action_counts[int(action)] += 1
            
            obs, reward, terminated, truncated, info = env.step(action)
            episode_reward += reward
            episode_length += 1
            done = terminated or truncated
        
        episode_rewards.append(episode_reward)
        episode_lengths.append(episode_length)
        episode_scores.append(info.get('score', 0))
        
        if (episode + 1) % 5 == 0:
            print(f"Episode {episode + 1}/{num_episodes}: "
                  f"Reward={episode_reward:.2f}, "
                  f"Length={episode_length}, "
                  f"Score={info.get('score', 0)}")
    
    # Calculate statistics
    print("\n" + "-"*60)
    print("STATISTICS")
    print("-"*60)
    
    print(f"\nRewards:")
    print(f"  Mean: {np.mean(episode_rewards):.2f} ± {np.std(episode_rewards):.2f}")
    print(f"  Min/Max: {np.min(episode_rewards):.2f} / {np.max(episode_rewards):.2f}")
    print(f"  Median: {np.median(episode_rewards):.2f}")
    
    print(f"\nEpisode Lengths:")
    print(f"  Mean: {np.mean(episode_lengths):.1f} ± {np.std(episode_lengths):.1f}")
    print(f"  Min/Max: {np.min(episode_lengths)} / {np.max(episode_lengths)}")
    print(f"  Median: {np.median(episode_lengths):.0f}")
    
    print(f"\nGame Scores:")
    print(f"  Mean: {np.mean(episode_scores):.1f} ± {np.std(episode_scores):.1f}")
    print(f"  Min/Max: {np.min(episode_scores)} / {np.max(episode_scores)}")
    print(f"  Median: {np.median(episode_scores):.0f}")
    
    # Action distribution
    total_actions = sum(action_counts.values())
    print(f"\nAction Distribution (total actions: {total_actions}):")
    for action_id, count in sorted(action_counts.items()):
        percentage = (count / total_actions) * 100
        print(f"  {action_names[action_id]:>6s}: {count:6d} ({percentage:5.1f}%)")
    
    return {
        'rewards': episode_rewards,
        'lengths': episode_lengths,
        'scores': episode_scores,
        'action_counts': action_counts,
    }


def analyze_behavior(model, env, num_steps=1000):
    """Analyze specific behavioral patterns."""
    print("\n" + "="*60)
    print(f"BEHAVIORAL ANALYSIS (observing {num_steps} steps)")
    print("="*60 + "\n")
    
    obs, info = env.reset()
    
    # Track sequences
    action_sequences = []
    current_sequence = []
    prev_action = None
    
    state_samples = []
    
    for step in range(num_steps):
        action, _states = model.predict(obs, deterministic=True)
        action = int(action)
        
        # Track action sequences
        if action == prev_action:
            current_sequence.append(action)
        else:
            if current_sequence:
                action_sequences.append((prev_action, len(current_sequence)))
            current_sequence = [action]
            prev_action = action
        
        # Sample states
        if step % 100 == 0:
            state_samples.append(obs.copy())
        
        obs, reward, terminated, truncated, info = env.step(action)
        
        if terminated or truncated:
            obs, info = env.reset()
    
    # Analyze action sequences
    action_names = {0: "no-op", 1: "left", 2: "right", 3: "boost"}
    
    print("Action Persistence (average consecutive actions):")
    sequence_stats = {}
    for action, length in action_sequences:
        if action not in sequence_stats:
            sequence_stats[action] = []
        sequence_stats[action].append(length)
    
    for action in sorted(sequence_stats.keys()):
        avg_length = np.mean(sequence_stats[action])
        max_length = np.max(sequence_stats[action])
        print(f"  {action_names[action]:>6s}: avg={avg_length:.1f}, max={max_length}")
    
    # Analyze state distribution
    print("\n" + "-"*60)
    print("State Statistics (sampled observations)")
    print("-"*60)
    
    state_samples = np.array(state_samples)
    print(f"\nObservation space: {state_samples.shape[1]} dimensions")
    print(f"Samples collected: {len(state_samples)}")
    
    # Show min/max/mean for each dimension
    print("\nPer-dimension statistics:")
    for i in range(min(10, state_samples.shape[1])):  # Show first 10 dims
        print(f"  Dim {i:2d}: "
              f"mean={np.mean(state_samples[:, i]):6.3f}, "
              f"std={np.std(state_samples[:, i]):6.3f}, "
              f"min={np.min(state_samples[:, i]):6.3f}, "
              f"max={np.max(state_samples[:, i]):6.3f}")
    
    if state_samples.shape[1] > 10:
        print(f"  ... ({state_samples.shape[1] - 10} more dimensions)")


def main():
    parser = argparse.ArgumentParser(description="Analyze trained RL model")
    
    parser.add_argument(
        "--model",
        required=True,
        help="Path to model file (.zip)"
    )
    
    parser.add_argument(
        "--game",
        default="snake-io",
        help="Game name (default: snake-io)"
    )
    
    parser.add_argument(
        "--episodes",
        type=int,
        default=20,
        help="Number of episodes for evaluation (default: 20)"
    )
    
    parser.add_argument(
        "--render",
        action="store_true",
        help="Render during evaluation"
    )
    
    parser.add_argument(
        "--analyze-behavior",
        action="store_true",
        help="Perform detailed behavioral analysis"
    )
    
    parser.add_argument(
        "--output",
        help="Save analysis results to JSON file"
    )
    
    args = parser.parse_args()
    
    # Check if model exists
    model_path = Path(args.model)
    if not model_path.exists():
        print(f"❌ Error: Model not found: {model_path}")
        return
    
    print("\n" + "="*60)
    print("RL MODEL ANALYSIS")
    print("="*60)
    print(f"\nModel: {args.model}")
    print(f"Game: {args.game}")
    
    # Load model
    print("\n📂 Loading model...")
    
    # Detect algorithm from filename
    algo_name = "PPO"
    for algo in ["PPO", "DQN", "A2C"]:
        if algo.lower() in args.model.lower():
            algo_name = algo
            break
    
    model_classes = {"PPO": PPO, "DQN": DQN, "A2C": A2C}
    ModelClass = model_classes[algo_name]
    
    model = ModelClass.load(args.model)
    print(f"✓ Loaded {algo_name} model")
    
    # Analyze model structure
    analyze_model_structure(model)
    
    # Create environment
    print(f"\n🎮 Creating environment...")
    env = P5GameEnv(
        game_name=args.game,
        render_mode="human" if args.render else None,
        observation_type="state",
        headless=not args.render
    )
    print("✓ Environment ready")
    
    # Evaluate performance
    results = evaluate_model(model, env, num_episodes=args.episodes, render=args.render)
    
    # Behavioral analysis
    if args.analyze_behavior:
        analyze_behavior(model, env, num_steps=1000)
    
    # Save results
    if args.output:
        output_data = {
            'model_path': str(model_path),
            'algorithm': algo_name,
            'game': args.game,
            'episodes_evaluated': args.episodes,
            'mean_reward': float(np.mean(results['rewards'])),
            'std_reward': float(np.std(results['rewards'])),
            'mean_length': float(np.mean(results['lengths'])),
            'mean_score': float(np.mean(results['scores'])),
            'action_distribution': results['action_counts'],
            'all_rewards': [float(r) for r in results['rewards']],
            'all_lengths': [int(l) for l in results['lengths']],
            'all_scores': [int(s) for s in results['scores']],
        }
        
        output_path = Path(args.output)
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"\n✅ Results saved to: {output_path}")
    
    env.close()
    print("\n" + "="*60)
    print("Analysis Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()











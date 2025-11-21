#!/usr/bin/env python3
"""
Simple model visualization that doesn't require running the game.
Shows the model's internal parameters and decision patterns.
"""

import numpy as np
import matplotlib.pyplot as plt
from stable_baselines3 import PPO
import argparse
from pathlib import Path


def visualize_policy_weights(model, output_file="model_weights.png"):
    """Visualize the weights of the policy network."""
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('PPO Policy Network Visualization', fontsize=16, fontweight='bold')
    
    # Get policy parameters
    policy_params = {name: param.detach().cpu().numpy() 
                    for name, param in model.policy.named_parameters()}
    
    # 1. Input layer weights (18 inputs → 64 hidden)
    input_weights = policy_params['mlp_extractor.policy_net.0.weight']
    im1 = axes[0, 0].imshow(input_weights, aspect='auto', cmap='RdBu_r', vmin=-0.5, vmax=0.5)
    axes[0, 0].set_title('Input Layer Weights (64 neurons × 18 inputs)', fontweight='bold')
    axes[0, 0].set_xlabel('Input Features (18 state dims)')
    axes[0, 0].set_ylabel('Hidden Neurons (64)')
    
    # Add feature labels
    feature_labels = [
        'p.x', 'p.y', 'p.angle', 'p.len', 'p.spd', 'p.boost',  # player (6)
        'pel.x', 'pel.y', 'pel.d',  # nearest pellet (3)
        'en.x', 'en.y', 'en.d',  # nearest enemy (3)
        'ob.x', 'ob.y', 'ob.d',  # nearest obstacle (3)
        'lvl', 'score', 'target'  # scalars (3)
    ]
    axes[0, 0].set_xticks(range(18))
    axes[0, 0].set_xticklabels(feature_labels, rotation=45, ha='right', fontsize=8)
    plt.colorbar(im1, ax=axes[0, 0], label='Weight Value')
    
    # 2. Action head weights (64 hidden → 4 actions)
    action_weights = policy_params['action_net.weight']
    im2 = axes[0, 1].imshow(action_weights, aspect='auto', cmap='RdBu_r', vmin=-0.5, vmax=0.5)
    axes[0, 1].set_title('Action Head Weights (4 actions × 64 neurons)', fontweight='bold')
    axes[0, 1].set_xlabel('Hidden Neurons (64)')
    axes[0, 1].set_ylabel('Actions')
    axes[0, 1].set_yticks(range(4))
    axes[0, 1].set_yticklabels(['No-op', 'Left', 'Right', 'Boost'])
    plt.colorbar(im2, ax=axes[0, 1], label='Weight Value')
    
    # 3. Weight distribution histogram
    all_weights = np.concatenate([param.flatten() for name, param in policy_params.items() 
                                  if 'weight' in name])
    axes[1, 0].hist(all_weights, bins=50, color='steelblue', edgecolor='black', alpha=0.7)
    axes[1, 0].set_title('Weight Distribution', fontweight='bold')
    axes[1, 0].set_xlabel('Weight Value')
    axes[1, 0].set_ylabel('Frequency')
    axes[1, 0].axvline(0, color='red', linestyle='--', linewidth=2, label='Zero')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)
    
    # 4. Action biases (which actions are preferred by default)
    action_biases = policy_params['action_net.bias']
    actions = ['No-op', 'Left', 'Right', 'Boost']
    colors = ['gray', 'blue', 'red', 'orange']
    bars = axes[1, 1].bar(actions, action_biases, color=colors, edgecolor='black', alpha=0.7)
    axes[1, 1].set_title('Action Biases (Default Preferences)', fontweight='bold')
    axes[1, 1].set_ylabel('Bias Value')
    axes[1, 1].axhline(0, color='black', linestyle='-', linewidth=1)
    axes[1, 1].grid(True, alpha=0.3, axis='y')
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        axes[1, 1].text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.3f}',
                       ha='center', va='bottom' if height > 0 else 'top',
                       fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"✅ Saved visualization to: {output_file}")
    
    return fig


def analyze_input_importance(model):
    """Analyze which input features are most important to the policy."""
    print("\n" + "="*60)
    print("INPUT FEATURE IMPORTANCE ANALYSIS")
    print("="*60 + "\n")
    
    # Get first layer weights
    policy_params = {name: param.detach().cpu().numpy() 
                    for name, param in model.policy.named_parameters()}
    input_weights = policy_params['mlp_extractor.policy_net.0.weight']
    
    # Calculate importance as sum of absolute weights
    importance = np.abs(input_weights).sum(axis=0)
    
    feature_labels = [
        'player.x', 'player.y', 'player.angle', 'player.length', 'player.speed', 'player.isBoosting',
        'pellet.x', 'pellet.y', 'pellet.distance',
        'enemy.x', 'enemy.y', 'enemy.distance',
        'obstacle.x', 'obstacle.y', 'obstacle.distance',
        'level', 'score', 'targetLength'
    ]
    
    # Sort by importance
    sorted_indices = np.argsort(importance)[::-1]
    
    print("Feature Importance (top to bottom):\n")
    for rank, idx in enumerate(sorted_indices, 1):
        bar = '█' * int(importance[idx] / importance[sorted_indices[0]] * 30)
        print(f"{rank:2d}. {feature_labels[idx]:20s} {importance[idx]:6.2f} {bar}")
    
    print("\n" + "-"*60)
    print("INTERPRETATION:")
    print("-"*60)
    
    # Group by category
    categories = {
        'Player State': list(range(0, 6)),
        'Nearest Pellet': list(range(6, 9)),
        'Nearest Enemy': list(range(9, 12)),
        'Nearest Obstacle': list(range(12, 15)),
        'Game Info': list(range(15, 18)),
    }
    
    print("\nImportance by Category:")
    for cat_name, indices in categories.items():
        cat_importance = sum(importance[i] for i in indices)
        bar = '█' * int(cat_importance / importance.sum() * 50)
        pct = (cat_importance / importance.sum()) * 100
        print(f"  {cat_name:20s} {pct:5.1f}% {bar}")


def main():
    parser = argparse.ArgumentParser(description="Visualize PPO model internals")
    parser.add_argument("--model", required=True, help="Path to model (.zip)")
    parser.add_argument("--output", default="model_analysis.png", help="Output image file")
    
    args = parser.parse_args()
    
    model_path = Path(args.model)
    if not model_path.exists():
        print(f"❌ Error: Model not found: {model_path}")
        return
    
    print("\n" + "="*60)
    print("PPO MODEL VISUALIZATION")
    print("="*60)
    print(f"\nModel: {args.model}")
    
    # Load model
    print("\n📂 Loading model...")
    model = PPO.load(args.model)
    print("✓ Model loaded successfully")
    
    # Analyze input importance
    analyze_input_importance(model)
    
    # Visualize weights
    print("\n📊 Creating visualizations...")
    visualize_policy_weights(model, args.output)
    
    print("\n" + "="*60)
    print("Visualization Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()











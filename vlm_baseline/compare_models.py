#!/usr/bin/env python3
"""
Compare multiple VLM models on the same game.

This script runs multiple models on the same game and compares their performance.
Useful for benchmarking different VLM providers and models.
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from vlm import VLMGamePlayer, logger


def run_comparison(
    models: List[str],
    game_url: str,
    max_turns: int = 50,
    turn_delay: float = 1.0,
    output_dir: str = "./comparison_results",
) -> Dict[str, Any]:
    """
    Run multiple models on the same game and compare results.
    
    Args:
        models: List of model names in format "provider:model"
        game_url: URL of the game to play
        max_turns: Maximum turns per game
        turn_delay: Delay between turns
        output_dir: Directory to save results
        
    Returns:
        Dictionary with comparison results
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True, parents=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = {
        "timestamp": timestamp,
        "game_url": game_url,
        "max_turns": max_turns,
        "turn_delay": turn_delay,
        "models": {},
    }
    
    for model_name in models:
        logger.info(f"\n{'='*60}")
        logger.info(f"Testing model: {model_name}")
        logger.info(f"{'='*60}\n")
        
        try:
            # Initialize player
            player = VLMGamePlayer(
                model_name=model_name,
                game_url=game_url,
                headless=True,
                max_turns=max_turns,
                turn_delay=turn_delay,
            )
            
            # Play game - unique directory will be created automatically
            stats = player.play(screenshot_dir=output_dir, use_unique_dir=True)
            
            # Store results
            results["models"][model_name] = {
                "stats": stats,
                "screenshot_dir": stats["screenshot_dir"],
                "success": True,
                "error": None,
            }
            
            logger.info(f"\n{model_name} Results:")
            logger.info(f"  Turns: {stats['turns']}")
            logger.info(f"  Valid actions: {stats['valid_actions']}")
            logger.info(f"  Invalid actions: {stats['invalid_actions']}")
            logger.info(f"  Errors: {stats['errors']}")
            logger.info(f"  Duration: {stats['duration']:.2f}s")
            logger.info(f"  Success rate: {stats['valid_actions'] / max(stats['turns'], 1) * 100:.1f}%")
            
        except Exception as e:
            logger.error(f"Failed to test {model_name}: {e}")
            results["models"][model_name] = {
                "success": False,
                "error": str(e),
            }
    
    # Save results to JSON
    results_file = output_path / f"comparison_{timestamp}.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"\nResults saved to: {results_file}")
    
    return results


def print_comparison_summary(results: Dict[str, Any]) -> None:
    """Print a summary comparison table."""
    logger.info("\n" + "="*80)
    logger.info("COMPARISON SUMMARY")
    logger.info("="*80)
    
    # Header
    logger.info(f"{'Model':<40} {'Success Rate':<15} {'Valid':<8} {'Invalid':<8} {'Time':<10}")
    logger.info("-"*80)
    
    # Sort models by success rate
    model_stats = []
    for model, data in results["models"].items():
        if data.get("success"):
            stats = data["stats"]
            success_rate = stats["valid_actions"] / max(stats["turns"], 1) * 100
            model_stats.append((model, success_rate, stats))
    
    model_stats.sort(key=lambda x: x[1], reverse=True)
    
    # Print rows
    for model, success_rate, stats in model_stats:
        logger.info(
            f"{model:<40} "
            f"{success_rate:>6.1f}%       "
            f"{stats['valid_actions']:>6}  "
            f"{stats['invalid_actions']:>6}  "
            f"{stats['duration']:>7.1f}s"
        )
    
    # Print failed models
    failed = [m for m, d in results["models"].items() if not d.get("success")]
    if failed:
        logger.info("\nFailed models:")
        for model in failed:
            error = results["models"][model].get("error", "Unknown error")
            logger.info(f"  - {model}: {error}")
    
    logger.info("="*80)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Compare multiple VLM models on game playing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Compare GPT-4o and Claude
  python compare_models.py --models openai:gpt-4o anthropic:claude-3-5-sonnet-20241022
  
  # Compare all major providers
  python compare_models.py --models \\
    openai:gpt-4o \\
    anthropic:claude-3-5-sonnet-20241022 \\
    google:gemini-2.0-flash \\
    together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo
  
  # Custom game and settings
  python compare_models.py \\
    --models openai:gpt-4o openai:gpt-4o-mini \\
    --game-url https://aigamestore.org/play/10 \\
    --max-turns 30
        """
    )
    
    parser.add_argument(
        "--models",
        type=str,
        nargs="+",
        required=True,
        help="List of models to compare in format 'provider:model'"
    )
    parser.add_argument(
        "--game-url",
        type=str,
        default="https://aigamestore.org/play/6",
        help="URL of the game to play"
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=50,
        help="Maximum number of turns per game (default: 50)"
    )
    parser.add_argument(
        "--turn-delay",
        type=float,
        default=1.0,
        help="Delay in seconds between turns (default: 1.0)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./comparison_results",
        help="Directory to save results (default: ./comparison_results)"
    )
    
    args = parser.parse_args()
    
    # Run comparison
    results = run_comparison(
        models=args.models,
        game_url=args.game_url,
        max_turns=args.max_turns,
        turn_delay=args.turn_delay,
        output_dir=args.output_dir,
    )
    
    # Print summary
    print_comparison_summary(results)


if __name__ == "__main__":
    main()


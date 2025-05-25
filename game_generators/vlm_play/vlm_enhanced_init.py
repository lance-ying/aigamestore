"""
Enhanced VLM Play module with improved error handling and console error tracking.

This module provides enhanced versions of the original VLM Play components that
incorporate the robust error handling features from the game_check module, 
while maintaining the same interfaces.
"""

import logging
import os
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Import our enhanced components
from .browser_utils_updated import BrowserManager as EnhancedBrowserManager
from .vlm_play_bridge_updated import (
    EnhancedVLMEvaluation, 
    evaluate_game_enhanced,
    test_record_only_enhanced
)
from .vlm_eval_guided_updated import (
    EnhancedVLMEvaluationGuided,
    evaluate_game_guided_enhanced
)

# Make the enhanced implementations available
BrowserManager = EnhancedBrowserManager
VLMPlayEvaluation = EnhancedVLMEvaluation
VLMPlayEvaluationGuided = EnhancedVLMEvaluationGuided
evaluate_game = evaluate_game_enhanced
evaluate_game_guided = evaluate_game_guided_enhanced
test_record_only = test_record_only_enhanced

# Export public API
__all__ = [
    "BrowserManager",
    "VLMPlayEvaluation",
    "VLMPlayEvaluationGuided",
    "evaluate_game",
    "evaluate_game_guided",
    "test_record_only",
]


async def run_enhanced_evaluation(
    game_path: str, 
    output_dir: Optional[str] = None, 
    api_key: Optional[str] = None,
    mode: str = "standard"
) -> Dict[str, Any]:
    """
    Run an enhanced evaluation on a game.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save the output files
        api_key: API key for Gemini (will use environment variable if not provided)
        mode: Evaluation mode ("standard" or "guided")
        
    Returns:
        Results dictionary from the evaluation
    """
    # Set up output directory if not provided
    if not output_dir:
        if os.path.isdir(game_path):
            output_dir = os.path.join(game_path, "vlm_evaluation_enhanced")
        else:
            output_dir = os.path.join(os.path.dirname(game_path), "vlm_evaluation_enhanced")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Run the appropriate evaluation mode
    if mode.lower() == "guided":
        logging.info(f"Running enhanced guided evaluation for {game_path}")
        evaluator = EnhancedVLMEvaluationGuided(game_path, output_dir, api_key)
        results = await evaluator.evaluate_game()
    else:
        logging.info(f"Running enhanced standard evaluation for {game_path}")
        evaluator = EnhancedVLMEvaluation(game_path, output_dir, api_key)
        results = await evaluator.evaluate_game()
    
    # Save results to a file
    import json
    results_file = os.path.join(output_dir, f"enhanced_{mode}_results.json")
    
    # Convert any non-serializable objects to strings
    def json_serializable_results(obj):
        if isinstance(obj, dict):
            return {k: json_serializable_results(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [json_serializable_results(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        else:
            return str(obj)
    
    # Write to file
    with open(results_file, "w") as f:
        json.dump(json_serializable_results(results), f, indent=2)
    
    logging.info(f"Enhanced evaluation results saved to {results_file}")
    
    return results 
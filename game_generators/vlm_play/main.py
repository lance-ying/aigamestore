#!/usr/bin/env python3
"""
Command line interface to evaluate games using Gemini Vision.
"""

import os
import sys
import argparse
import json
import logging
from typing import Dict, Any, Optional
import datetime

from .evaluator import evaluate_game


def main():
    """Parse command line arguments and evaluate a game."""
    parser = argparse.ArgumentParser(
        description="Evaluate games by recording gameplay and analyzing using Gemini."
    )
    
    parser.add_argument(
        "game_path", help="Path to the game directory or HTML file to evaluate"
    )
    
    parser.add_argument(
        "--api-key",
        help="Google API key for Gemini (defaults to GOOGLE_API_KEY env variable)",
    )
    
    parser.add_argument(
        "--output-dir",
        help="Directory to save outputs (defaults to 'evaluation_results' in game directory)",
    )
    
    parser.add_argument(
        "--verbose", action="store_true", help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    try:
        # Evaluate the game
        start_time = datetime.datetime.now()
        logging.info(f"Starting evaluation at {start_time}")
        
        results = evaluate_game(args.game_path, args.api_key)
        
        end_time = datetime.datetime.now()
        elapsed = end_time - start_time
        logging.info(f"Evaluation completed in {elapsed.total_seconds():.2f} seconds")
        
        # Determine output directory
        output_dir = args.output_dir
        if not output_dir:
            output_dir = os.path.join(
                os.path.dirname(os.path.abspath(args.game_path)), "evaluation_results"
            )
            
        os.makedirs(output_dir, exist_ok=True)
        
        # Save results to JSON
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = os.path.join(output_dir, f"evaluation_results_{timestamp}.json")
        
        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)
            
        logging.info(f"Results saved to {results_file}")
        
        # Print summary
        print("\n===== Game Evaluation Summary =====")
        print(f"Game: {args.game_path}")
        if results["success"]:
            print(f"Status: Success - Evaluated {len(results['evaluations'])} game modes")
            
            # Print ratings if available
            for eval_data in results["evaluations"]:
                button_id = eval_data.get("button_id", "unknown")
                rating = eval_data.get("rating", "N/A")
                print(f"  Mode {button_id}: Rating {rating}/10")
                
            print(f"\nDetailed results saved to {results_file}")
        else:
            print(f"Status: Failed - {results.get('error', 'Unknown error')}")
            
        # Return success status
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during evaluation: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main()) 
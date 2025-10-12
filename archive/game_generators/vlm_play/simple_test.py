#!/usr/bin/env python3
"""
Simple standalone script to run game evaluation.

This script avoids package import issues and ensures the evaluation runs correctly.

Usage:
    python simple_test.py --game_path /path/to/game/directory
"""

import os
import sys
import asyncio
import argparse
import time
import logging
from pathlib import Path

# Add parent directory to path to ensure proper imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
sys.path.insert(0, current_dir)

# Import the classes directly without relying on __init__.py
from vlm_play_test import VLMPlayEvaluation


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Test the VLMPlayEvaluation class with a game.")
    parser.add_argument("--game_path", required=True, help="Path to the game directory or HTML file")
    parser.add_argument("--output", "-o", help="Directory to save recorded videos and evaluation results")
    parser.add_argument("--api-key", help="Google API key for Gemini access (will use GOOGLE_API_KEY env var if not provided)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    parser.add_argument("--skip-eval", action="store_true", help="Skip Gemini evaluation (record only)")
    parser.add_argument("--only-button", help="Test only a specific button ID (e.g., 'test_1_ModeBtn')")
    
    return parser.parse_args()


async def run_test(args):
    """Run the test with the provided arguments."""
    game_path = os.path.abspath(args.game_path)
    output_dir = args.output
    api_key = args.api_key or os.environ.get("GOOGLE_API_KEY")
    
    if not os.path.exists(game_path):
        print(f"Error: Game path does not exist: {game_path}")
        return 1
    
    print(f"Testing VLMPlayEvaluation with game: {game_path}")
    
    # Full test with evaluation
    try:
        print("Starting full evaluation with Gemini...")
        
        # Initialize the VLMPlayEvaluation class
        evaluator = VLMPlayEvaluation(game_path, output_dir, api_key)
        
        # Filter to only test a specific button if requested
        if args.only_button:
            # We'll monkey patch the evaluate_game method to filter buttons
            original_record_videos_parallel = evaluator._record_test_videos_parallel
            
            async def filtered_record_videos_parallel(test_buttons):
                filtered_buttons = [btn for btn in test_buttons if btn["id"] == args.only_button]
                if not filtered_buttons:
                    print(f"Warning: Button with ID '{args.only_button}' not found")
                    return {}
                print(f"Filtered to only test button: {args.only_button}")
                return await original_record_videos_parallel(filtered_buttons)
            
            evaluator._record_test_videos_parallel = filtered_record_videos_parallel
        
        # Start the timer
        start_time = time.time()
        
        # Run the evaluation
        results = await evaluator.evaluate_game()
        
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Display results
        print("\n" + "="*80)
        print(f"Evaluation Results (completed in {elapsed_time:.2f} seconds):")
        print("="*80)
        
        if results["success"]:
            print(f"Success! Evaluated {len(results['evaluations'])} tests")
            
            # Display video paths
            print("\nRecorded Videos:")
            for i, eval_data in enumerate(results["evaluations"]):
                video_path = eval_data.get("video_path", "")
                if video_path:
                    print(f"  {i+1}. {os.path.basename(video_path)} - Button: {eval_data.get('button_id', '')}")
            
            # Display aggregated feedback summary
            if results.get("aggregated_feedback"):
                print("\nAggregated Feedback Summary:")
                print("="*80)
                agg = results["aggregated_feedback"]
                
                if "critical_issues" in agg:
                    critical_issues = agg["critical_issues"].split("\n")
                    print("\nCritical Issues:")
                    for issue in critical_issues:
                        if issue.strip():
                            print(f"  - {issue.strip()}")
                
                if "gameplay_assessment" in agg:
                    print("\nGameplay Assessment:")
                    print(agg["gameplay_assessment"])
                
                if "technical_assessment" in agg:
                    print("\nTechnical Assessment:")
                    print(agg["technical_assessment"])
                
                if "recommendations" in agg:
                    recommendations = agg["recommendations"].split("\n")
                    print("\nRecommendations:")
                    for rec in recommendations:
                        if rec.strip():
                            print(f"  - {rec.strip()}")
                
                # Print the full summary section if it exists
                if "conclusion" in agg:
                    print("\nOverall Conclusion:")
                    print(agg["conclusion"].strip())
                
                print("="*80)
            
            # Show output location
            print(f"\nFull results saved to: {output_dir or os.path.join(os.path.dirname(game_path), 'vlm_evaluation')}")
            print(f"HTML report: {os.path.join(output_dir or os.path.join(os.path.dirname(game_path), 'vlm_evaluation'), 'evaluation_report.html')}")
            
            return 0
        else:
            print(f"Evaluation failed with errors:")
            for error in results.get("errors", ["Unknown error"]):
                print(f"  - {error}")
            return 1
            
    except Exception as e:
        print(f"Error during evaluation: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """Main entry point."""
    args = parse_args()
    
    # Configure logging
    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level, 
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run the test
    return asyncio.run(run_test(args))


if __name__ == "__main__":
    sys.exit(main()) 
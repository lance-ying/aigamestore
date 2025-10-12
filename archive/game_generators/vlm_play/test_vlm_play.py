#!/usr/bin/env python3
"""
Test script for VLMPlayEvaluation class.

This script demonstrates how to use the VLMPlayEvaluation class to:
1. Record gameplay for TEST buttons in a game
2. Generate evaluation using Gemini
3. View the results in a structured format

Usage:
    python test_vlm_play.py --game_path /path/to/game/directory
"""

import os
import sys
import json
import asyncio
import argparse
import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add the current directory to the path to allow direct imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
sys.path.insert(0, current_dir)

# Import the required modules
from vlm_play.vlm_play_test import VLMPlayEvaluation
from vlm_play.browser_utils import BrowserManager


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


async def test_record_only(game_path: str, output_dir: Optional[str] = None, only_button: Optional[str] = None):
    """Test only the recording functionality."""
    results = {
        "success": False,
        "game_path": game_path,
        "video_paths": [],
        "errors": [],
    }
    
    try:
        # Setup evaluator but we'll use its components directly
        evaluator = VLMPlayEvaluation(game_path, output_dir)
        
        # Setup browser to find TEST buttons
        browser_manager = BrowserManager(game_path)
        browser, url = await browser_manager.setup_browser()
        context = await browser.new_context()
        page = await context.new_page()
        
        # Navigate to the page
        await page.goto(url, wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Find all TEST buttons with the new format
        test_buttons = await page.evaluate(
            """
            () => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                return buttons
                    .filter(btn => btn.id && btn.id.toLowerCase().includes('test_') && btn.id.toLowerCase().includes('modebtn'))
                    .map(btn => ({
                        id: btn.id,
                        text: btn.innerText || btn.value || '',
                        testMode: (btn.onclick && btn.onclick.toString().match(/setControlMode\\(['"]([^'"]+)['"]\\)/)?.[1]) || ''
                    }));
            }
            """
        )
        
        await context.close()
        
        if not test_buttons:
            print("Error: No TEST buttons found on the page")
            return results
        
        print(f"Found {len(test_buttons)} TEST buttons:")
        for i, btn in enumerate(test_buttons):
            print(f"  {i+1}. ID: {btn['id']}, Text: {btn['text']}, Mode: {btn['testMode']}")
        
        # Filter to only the specified button if requested
        if only_button:
            test_buttons = [btn for btn in test_buttons if btn["id"] == only_button]
            if not test_buttons:
                print(f"Error: Button with ID '{only_button}' not found")
                return results
            print(f"Filtered to only test button: {only_button}")
        
        # Record videos for test buttons
        print("\nStarting video recording:")
        start_time = time.time()
        video_paths = await evaluator._record_test_videos_parallel(test_buttons)
        end_time = time.time()
        
        num_videos = len(video_paths)
        if num_videos > 0:
            results["success"] = True
            for button_info, video_path in video_paths.items():
                results["video_paths"].append(video_path)
                print(f"  Recorded: {os.path.basename(video_path)} for button {button_info['id']}")
            print(f"\nSuccessfully recorded {num_videos}/{len(test_buttons)} videos in {end_time - start_time:.2f} seconds")
        else:
            print("Error: No videos were recorded")
        
        # Close the browser
        await browser.close()
        await browser_manager.close()
        
    except Exception as e:
        print(f"Error during testing: {str(e)}")
        results["errors"].append(str(e))
    
    return results


async def run_test(args):
    """Run the test with the provided arguments."""
    game_path = os.path.abspath(args.game_path)
    output_dir = args.output
    api_key = args.api_key or os.environ.get("GOOGLE_API_KEY")
    
    if not os.path.exists(game_path):
        print(f"Error: Game path does not exist: {game_path}")
        return 1
    
    print(f"Testing VLMPlayEvaluation with game: {game_path}")
    
    # Test only recording functionality if requested
    if args.skip_eval:
        print("Skipping Gemini evaluation, recording videos only")
        results = await test_record_only(game_path, output_dir, args.only_button)
        
        if results["success"]:
            print(f"\nRecording complete! {len(results['video_paths'])} videos saved to: {output_dir or os.path.join(os.path.dirname(game_path), 'vlm_evaluation')}")
            return 0
        else:
            print(f"\nRecording failed with errors: {results['errors']}")
            return 1
    
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
                
                if "recommendations" in agg:
                    recommendations = agg["recommendations"].split("\n")
                    print("\nRecommendations:")
                    for rec in recommendations:
                        if rec.strip():
                            print(f"  - {rec.strip()}")
                
                if "strengths" in agg:
                    strengths = agg["strengths"].split("\n")
                    print("\nStrengths:")
                    for strength in strengths:
                        if strength.strip():
                            print(f"  - {strength.strip()}")
                
                # Print the full summary section if it exists
                if "summary" in agg:
                    print("\nOverall Summary:")
                    print(agg["summary"].strip())
                
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
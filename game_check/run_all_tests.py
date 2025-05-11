#!/usr/bin/env python3
"""
Run all game tests to verify game functionality.
"""

import os
import sys
import json
import argparse
import logging
import asyncio
from typing import Dict, Any, List

from .tests.load_test import check_game_loads, report_load_test
from .tests.interaction_test import test_game_interaction, report_interaction_test
from .utils.helpers import save_test_results

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

def run_all_tests(game_path: str, output_file: str = None) -> Dict[str, Any]:
    """
    Run all game tests.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_file: Path to save combined results (optional)
        
    Returns:
        Dictionary with results from all tests
    """
    results = {
        "game_path": game_path,
        "load_test": {},
        "interaction_test": {},
        "overall_result": False
    }
    
    # Run load test
    logging.info("Running game load test...")
    load_results = check_game_loads(game_path)
    results["load_test"] = load_results
    
    # Add console error message if test failed
    if not load_results.get("test_result", False) and not "console_error_message" in load_results:
        error_messages = []
        if "console_logs" in load_results:
            for msg_type, messages in load_results["console_logs"].items():
                for msg in messages:
                    if "error" in msg.lower():
                        error_messages.append(msg)
        elif "console_errors" in load_results:
            # Fallback to legacy field
            for err in load_results["console_errors"]:
                if "error" in err.lower():
                    error_messages.append(err)
                    
        if error_messages:
            load_results["console_error_message"] = "\n".join(error_messages)
    
    report_load_test(load_results)
    
    # Only run interaction tests if load test passed
    if load_results.get("test_result", False):
        # Run interaction test
        logging.info("Running game interaction test...")
        interaction_results = test_game_interaction(game_path)
        results["interaction_test"] = interaction_results
        
        # Add console error message if test failed
        if not interaction_results.get("test_result", False) and not "console_error_message" in interaction_results:
            error_messages = []
            if "console_logs" in interaction_results:
                for msg_type, messages in interaction_results["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            error_messages.append(msg)
            elif "console_errors" in interaction_results:
                # Fallback to legacy field
                for err in interaction_results["console_errors"]:
                    if "error" in err.lower():
                        error_messages.append(err)
                    
            if error_messages:
                interaction_results["console_error_message"] = "\n".join(error_messages)
        
        report_interaction_test(interaction_results)
    else:
        logging.warning("Skipping interaction test because load test failed")
        results["interaction_test"] = {"test_result": False, "error": "Skipped due to load test failure"}
    
    # Calculate overall result (all tests passed)
    results["overall_result"] = (
        results["load_test"].get("test_result", False) and
        results["interaction_test"].get("test_result", False)
    )


    # Save combined results if output file specified
    if output_file:
        try:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            logging.info(f"Combined results saved to {output_file}")
        except Exception as e:
            logging.error(f"Error saving combined results: {e}")
    
    # Print overall result
    print("\n" + "="*50)
    print("OVERALL TEST RESULTS")
    print("="*50)
    print(f"Load Test: {'✅ PASSED' if results['load_test'].get('test_result', False) else '❌ FAILED'}")
    interaction_test = results['interaction_test']
    game_start_test = interaction_test['game_start_test']
    gameplay_test = interaction_test['gameplay_test']
    print(f"Game Start Test: {'✅ PASSED' if game_start_test['test_result'] else '❌ FAILED'}")
    print(f"Gameplay Test: {'✅ PASSED' if gameplay_test['test_result'] else '❌ FAILED'}")
    print("-"*50)
    print(f"Overall Result: {'✅ PASSED' if results['overall_result'] else '❌ FAILED'}")
    print("="*50 + "\n")
    
    return results

def main():
    parser = argparse.ArgumentParser(description="Run all game tests")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument("--output", "-o", help="Path to save combined results (JSON)")
    parser.add_argument("--skip-load", action="store_true", help="Skip load test")
    parser.add_argument("--skip-interaction", action="store_true", help="Skip interaction test")

    args = parser.parse_args()
    
    # Normalize game path
    game_path = os.path.abspath(args.game_path)
    if not os.path.exists(game_path):
        logging.error(f"Game path does not exist: {game_path}")
        sys.exit(1)
    
    # Set up output file path if provided
    output_file = args.output
    if output_file and not os.path.isabs(output_file):
        output_file = os.path.abspath(output_file)
    
    # Define which tests to run
    tests_to_run = {
        "load": not args.skip_load,
        "interaction": not args.skip_interaction,
    }
    
    # If skipping load test but running others, warn user
    if not tests_to_run["load"] and (tests_to_run["interaction"]):
        logging.warning("Running interaction tests without load test may fail if game doesn't load properly")
    
    # Run tests selectively
    results = {
        "game_path": game_path,
        "overall_result": False
    }
    
    # Run load test if not skipped
    if tests_to_run["load"]:
        logging.info("Running game load test...")
        load_results = check_game_loads(game_path)
        results["load_test"] = load_results
        
        # Add console error message if test failed
        if not load_results.get("test_result", False) and not "console_error_message" in load_results:
            error_messages = []
            if "console_logs" in load_results:
                for msg_type, messages in load_results["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            error_messages.append(msg)
            elif "console_errors" in load_results:
                # Fallback to legacy field
                for err in load_results["console_errors"]:
                    if "error" in err.lower():
                        error_messages.append(err)
                    
            if error_messages:
                load_results["console_error_message"] = "\n".join(error_messages)
        
        report_load_test(load_results)
        
        # Skip other tests if load test failed
        if not load_results.get("test_result", False):
            logging.warning("Load test failed. Skipping remaining tests.")
            if tests_to_run["interaction"]:
                results["interaction_test"] = {"test_result": False, "error": "Skipped due to load test failure"}
            # Save results and exit
            if output_file:
                with open(output_file, 'w') as f:
                    json.dump(results, f, indent=2)
            
            sys.exit(1)
    
    # Run interaction test if not skipped
    if tests_to_run["interaction"]:
        logging.info("Running game interaction test...")
        interaction_results = test_game_interaction(game_path)
        results["interaction_test"] = interaction_results
        
        # Add console error message if test failed
        if not interaction_results.get("test_result", False) and not "console_error_message" in interaction_results:
            error_messages = []
            if "console_logs" in interaction_results:
                for msg_type, messages in interaction_results["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            error_messages.append(msg)
            elif "console_errors" in interaction_results:
                # Fallback to legacy field
                for err in interaction_results["console_errors"]:
                    if "error" in err.lower():
                        error_messages.append(err)
                    
            if error_messages:
                interaction_results["console_error_message"] = "\n".join(error_messages)
        
        report_interaction_test(interaction_results)
    

    # Calculate overall result (required tests only - load and interaction)
    test_results = []
    
    # Add load test result if run
    if tests_to_run["load"]:
        test_results.append(results.get("load_test", {}).get("test_result", False))
    
    # Add interaction test result if run
    if tests_to_run["interaction"]:
        test_results.append(results.get("interaction_test", {}).get("test_result", False))
    
    # Calculate overall result (all required tests must pass)
    results["overall_result"] = all(test_results) if test_results else False
    
    # Save combined results if output file specified
    if output_file:
        try:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            logging.info(f"Combined results saved to {output_file}")
        except Exception as e:
            logging.error(f"Error saving combined results: {e}")
    
    # Print overall result
    print("\n" + "="*50)
    print("OVERALL TEST RESULTS")
    print("="*50)
    if tests_to_run["load"]:
        print(f"Load Test: {'✅ PASSED' if results.get('load_test', {}).get('test_result', False) else '❌ FAILED'}")
    if tests_to_run["interaction"]:
        interaction_test = results['interaction_test']['interaction_test']
        game_start_test = interaction_test['game_start_test']
        gameplay_test = interaction_test['gameplay_test']
        print(f"Game Start Test: {'✅ PASSED' if game_start_test['test_result'] else '❌ FAILED'}")
        print(f"Gameplay Test: {'✅ PASSED' if gameplay_test['test_result'] else '❌ FAILED'}")
    print("-"*50)
    print(f"Overall Result: {'✅ PASSED' if results['overall_result'] else '❌ FAILED'}")
    print("="*50 + "\n")
    
    sys.exit(0 if results["overall_result"] else 1)

if __name__ == "__main__":
    main() 
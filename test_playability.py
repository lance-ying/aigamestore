#!/usr/bin/env python
"""
Simple test script for checking game playability using ECS state comparison.
"""

import os
import sys
import json
import logging
import argparse
from metrics.core.ecs_analyzer import test_game_playability

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def main():
    """Parse command line arguments and run the playability test."""
    parser = argparse.ArgumentParser(description="Test game playability by comparing ECS states")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument(
        "--duration", 
        type=int, 
        default=15, 
        help="Duration in seconds to wait for user interaction (default: 15)"
    )
    parser.add_argument(
        "--output", 
        default=None, 
        help="Path to save the results JSON file (default: alongside the game)"
    )
    
    args = parser.parse_args()
    
    # Validate game path
    if not os.path.exists(args.game_path):
        logging.error(f"Game path does not exist: {args.game_path}")
        return 1
        
    # Run the playability test
    logging.info(f"Testing playability for: {args.game_path}")
    logging.info(f"Interaction duration: {args.duration} seconds")
    
    print("\n" + "-"*80)
    print("PLAYABILITY TEST INSTRUCTIONS:")
    print("1. The game will load in a headless browser")
    print("2. The script will first capture the initial ECS state")
    print(f"3. You will have {args.duration} seconds to interact with the game")
    print("4. After the time expires, the script will capture the final state")
    print("5. The states will be compared to determine if the game is playable")
    print("-"*80 + "\n")
    
    # Run the test
    results = test_game_playability(args.game_path, args.duration)
    
    # Determine output path for results
    if args.output:
        output_path = args.output
    else:
        if os.path.isfile(args.game_path):
            parent_dir = os.path.dirname(args.game_path)
        else:
            parent_dir = args.game_path
        output_path = os.path.join(parent_dir, "playability_results.json")
    
    # Save results
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*80)
    print(f"PLAYABILITY TEST RESULTS:")
    print(f"Game appears to be playable: {results['playable']}")
    
    if results['playable']:
        if results['changes']['new_entities']:
            print(f"- {len(results['changes']['new_entities'])} new entities appeared")
        if results['changes']['removed_entities']:
            print(f"- {len(results['changes']['removed_entities'])} entities were removed")
        if results['changes']['changed_entities']:
            print(f"- {len(results['changes']['changed_entities'])} entities changed state")
    else:
        print(f"Reason: {results.get('reason', 'No state changes detected during interaction')}")
    
    print(f"\nDetailed results saved to: {output_path}")
    print("="*80 + "\n")
    
    return 0 if results['playable'] else 1

if __name__ == "__main__":
    sys.exit(main()) 
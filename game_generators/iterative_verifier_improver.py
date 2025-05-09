#!/usr/bin/env python3
"""
Iterative Game Verifier and Improver

This script takes a path to a folder with game files, runs tests to check if:
1. The game loads properly
2. The game starts on pressing enter
3. Random actions lead to changes in the game state

It uses the BaseTesting class for verification and aggregating error messages.
"""

import os
import sys
import argparse
import logging
from typing import Dict, Any
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import BaseTesting class
from game_generators.basic_testing import BasicTesting

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def main():
    """Main function to parse arguments and run the verification process."""
    parser = argparse.ArgumentParser(
        description="Verify games by checking if they load, start, and respond to actions"
    )
    parser.add_argument(
        "--game_path",
        required=True,
        help="Path to the folder containing the index.html and js files for the game"
    )
    parser.add_argument(
        "--output", "-o", 
        help="Path to save combined results (JSON)"
    )
    
    args = parser.parse_args()
    
    # Create an instance of BasicTesting
    tester = BasicTesting()
    
    # Run verification
    results, _, _ = tester.verify_game(args.game_path, args.output)
    
    # Aggregate and print feedback
    aggregated_feedback = tester.aggregate_feedback(results)
    tester.print_aggregated_feedback(aggregated_feedback)
    
    # Exit with appropriate status code
    sys.exit(0 if results["overall_result"] else 1)

if __name__ == "__main__":
    main()
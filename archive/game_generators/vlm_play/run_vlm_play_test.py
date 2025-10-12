#!/usr/bin/env python3
"""
Helper script to run the VLM Play test with proper import handling.

This script ensures that the vlm_play module can be properly imported
whether run from within the vlm_play directory or from the parent directory.

Usage:
    python run_vlm_play_test.py --game_path /path/to/game/directory
"""

import os
import sys
import argparse
import asyncio

# Check for required packages
try:
    from google import genai
except ImportError:
    print("Error: The 'google-genai' package is required to run VLM Play tests.")
    print("Please install it with: pip install google-genai")
    sys.exit(1)

# Add parent directory to path to ensure proper imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Now import can work correctly
from vlm_play.test_vlm_play import parse_args, run_test


def main():
    """Main entry point with proper import handling."""
    # Parse arguments
    args = parse_args()
    
    # Run the test
    return asyncio.run(run_test(args))


if __name__ == "__main__":
    sys.exit(main()) 
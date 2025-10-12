#!/usr/bin/env python3
"""
Command-line interface for game_check testing.
"""

import os
import sys

# Ensure the game_check package is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the run_all_tests function from game_check
from game_check.run_all_tests import main

if __name__ == "__main__":
    main() 
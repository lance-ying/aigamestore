#!/usr/bin/env python3
"""
Evaluate games by recording gameplay and analyzing using Gemini 2.0 Flash.
This is a wrapper script that uses the modular implementation.
"""

import os
import sys
import logging

# Add parent directory to path to ensure imports work
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# Import from our modular implementation
from .main import main

if __name__ == "__main__":
    sys.exit(main())

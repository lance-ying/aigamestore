"""
Utility functions for browser-based game testing.
"""

import os
import logging
import re
from typing import Dict, Any, List

# Configure logging for local module
logger = logging.getLogger(__name__)

def setup_screenshots_dir(game_path: str) -> str:
    """
    Creates and returns the path to the screenshots directory.
    
    Args:
        game_path: Path to the game directory or HTML file
        
    Returns:
        Path to the screenshots directory
    """
    screenshots_dir = os.path.join(os.path.dirname(game_path), "game_check_results", "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)
    return screenshots_dir

def get_url_for_game(game_path: str, port: int, is_html_file: bool) -> str:
    """
    Determines the URL to access the game.
    
    Args:
        game_path: Path to the game directory or HTML file
        port: Port for the HTTP server
        is_html_file: Whether the game_path is a single HTML file
        
    Returns:
        URL to access the game
    """
    if is_html_file:
        # Use file:// protocol for direct HTML files
        abs_path = os.path.abspath(game_path)
        url = f"file://{abs_path}"
        logging.info(f"Using direct file URL: {url}")
    else:
        # Use HTTP for served directories
        url = f"http://localhost:{port}"
        logging.info(f"Using HTTP server URL: {url}")
    
    return url

def extract_source_info(error_str: str) -> tuple:
    """
    Extracts source file and line number information from error messages.
    
    Args:
        error_str: Error message string
        
    Returns:
        Tuple of (source_file, line_number)
    """
    source_file = None
    line_number = None
    
    # Try to match file:// protocol paths with line numbers
    file_url_match = re.search(r'file://[/\\]([^:]+):([0-9]+)(?::[0-9]+)?', error_str)
    if file_url_match:
        full_path = file_url_match.group(1)
        line_number = file_url_match.group(2)
        source_file = os.path.basename(full_path)  # Extract just the filename
    else:
        # Try to match the common pattern: "at Function (file.js:123:45)"
        file_match = re.search(r'at (?:.*?)(?:\()?([a-zA-Z0-9._\-/\\]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?(?:\))?', error_str)
        if file_match:
            full_path = file_match.group(1)
            source_file = os.path.basename(full_path)  # Extract just the filename
            
            # Try to extract line number
            line_match = re.search(r'([a-zA-Z0-9._\-/\\]+\.(js|mjs|ts|jsx|tsx)):([0-9]+)', error_str)
            if line_match:
                line_number = line_match.group(3)
        else:
            # Try to match module import patterns: "Error loading module from "file.js""
            module_match = re.search(r'(?:loading|importing|from|module) ["\']([a-zA-Z0-9._\-/\\]+\.(js|mjs|ts|jsx|tsx))["\']', error_str)
            if module_match:
                full_path = module_match.group(1)
                source_file = os.path.basename(full_path)  # Extract just the filename
            else:
                # Try to match filename patterns in the error message
                filename_match = re.search(r'(?:in|at|from) ["\']?([a-zA-Z0-9._\-/\\]+\.(js|mjs|ts|jsx|tsx))["\']?', error_str)
                if filename_match:
                    full_path = filename_match.group(1)
                    source_file = os.path.basename(full_path)  # Extract just the filename
    
    return source_file, line_number

def format_error_with_source(error: str, source_file: str = None, line_number: str = None) -> str:
    """
    Formats an error message with source file and line number information.
    
    Args:
        error: Error message
        source_file: Source file name
        line_number: Line number in the source file
        
    Returns:
        Formatted error message
    """
    source_info = ""
    if source_file:
        if line_number:
            source_info = f" [Source: {source_file}:{line_number}]"
        else:
            source_info = f" [Source: {source_file}]"
    
    return f"{error}{source_info}"

def initialize_results_dict() -> Dict[str, Any]:
    """
    Initialize a results dictionary with standard fields.
    
    Returns:
        A dictionary with standard result fields
    """
    return {
        "test_result": False,
        "console_logs": {
            "error": [],
            "warning": [],
            "info": [],
            "log": [],
            "debug": [],
            "other": []
        },
        "console_errors": [],  # Keep for backwards compatibility
        "js_exceptions": [],   # For JS syntax errors and exceptions
        "network_errors": [],  # For tracking network request failures
        "resource_errors": [], # For tracking resource loading failures
        "parse_errors": [],    # For syntax/parse errors in scripts
        "stack_traces": [],    # For collecting stack traces
        "canvas_found": False,
        "screenshots": []
    }

def initialize_interaction_results_dict() -> Dict[str, Any]:
    """
    Initialize a results dictionary for interaction tests.
    
    Returns:
        A dictionary with interaction test result fields
    """
    results = initialize_results_dict()
    results.update({
        "visual_changes": [],
        "key_tests": [],
        "game_start_test": {
            "test_result": False,
            "diff_score": 0,
            "screenshot": ""
        },
        "gameplay_test": {
            "test_result": False,
            "diff_scores": [],
            "screenshots": []
        }
    })
    return results 
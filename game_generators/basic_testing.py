#!/usr/bin/env python3
"""
Basic Testing Class

This module provides a base class for testing game files by checking if:
1. The game loads properly
2. The game starts on pressing enter
3. Random actions lead to changes in the game state

It uses functions from the game_check module to perform these tests.
"""

import os
import sys
import logging
import re
from typing import Dict, Any, List, Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import game_check functions
from game_check.tests.load_test import check_game_loads, report_load_test
from game_check.tests.interaction_test import test_game_interaction, report_interaction_test
from game_check.utils.helpers import save_test_results, find_html_file


class BasicTesting:
    """Base class for game testing that provides methods for verifying games and aggregating error messages."""
    
    def __init__(self):
        """Initialize the testing class."""
        # Configure logging if not already configured
        if not logging.getLogger().handlers:
            logging.basicConfig(
                level=logging.INFO, 
                format="%(asctime)s - %(levelname)s - %(message)s"
            )
    
    def clean_message(self, msg: str) -> str:
        """
        Clean messages by removing file path patterns.
        
        Args:
            msg: The message to clean
            
        Returns:
            The cleaned message
        """
        if not isinstance(msg, str):
            return msg
            
        # Remove common file paths like /path/to/file.js:123
        cleaned = re.sub(r'/?([a-zA-Z0-9_\-./]+\.(js|html|css|json)):[0-9]+', '', msg)
        
        # Remove error locations like "at line 123, column 45"
        cleaned = re.sub(r'at line [0-9]+,? column [0-9]+', '', cleaned)
        
        # Clean up extra spaces, tabs, etc.
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Remove empty parentheses that might be left after stripping
        cleaned = re.sub(r'\(\s*\)', '', cleaned).strip()
        
        return cleaned
    
    def get_logs(self, logs_dict: Dict[str, List[str]], test_name: str) -> Tuple[Dict[str, List[str]], bool]:
        """
        Get logs with proper formatting and add to feedback.
        
        Args:
            logs_dict: Dictionary of logs by type
            test_name: Name of the test for display purposes
            
        Returns:
            Tuple containing:
            - Feedback dictionary with processed logs
            - Boolean indicating if logs were found
        """
        if not logs_dict:
            return {}, False
            
        has_logs = False
        feedback = {
            "errors": [],
            "warnings": [],
            "info": [],
            "logs": [],
            "other": []
        }
        
        # Process errors first as they're most important
        if "error" in logs_dict and logs_dict["error"]:
            print(f"\n{test_name} ERRORS:")
            for msg in logs_dict["error"]:
                cleaned_msg = self.clean_message(msg)
                print(f"  - {cleaned_msg}")
                feedback["errors"].append(cleaned_msg)
            has_logs = True
            
        # Process warnings
        if "warning" in logs_dict and logs_dict["warning"]:
            print(f"\n{test_name} WARNINGS:")
            for msg in logs_dict["warning"]:
                cleaned_msg = self.clean_message(msg)
                print(f"  - {cleaned_msg}")
                feedback["warnings"].append(cleaned_msg)
            has_logs = True
            
        # Process info logs
        if "info" in logs_dict and logs_dict["info"]:
            print(f"\n{test_name} INFO:")
            for msg in logs_dict["info"]:
                cleaned_msg = self.clean_message(msg)
                print(f"  - {cleaned_msg}")
                feedback["info"].append(cleaned_msg)
            has_logs = True
            
        # Process regular logs
        if "log" in logs_dict and logs_dict["log"]:
            print(f"\n{test_name} LOGS:")
            for msg in logs_dict["log"]:
                cleaned_msg = self.clean_message(msg)
                print(f"  - {cleaned_msg}")
                feedback["logs"].append(cleaned_msg)
                # Also capture errors from regular logs
                if "error" in cleaned_msg.lower():
                    feedback["errors"].append(cleaned_msg)
            has_logs = True
            
        # Process other logs if present
        if "other" in logs_dict and logs_dict["other"]:
            print(f"\n{test_name} OTHER:")
            for msg in logs_dict["other"]:
                cleaned_msg = self.clean_message(msg)
                print(f"  - {cleaned_msg}")
                feedback["other"].append(cleaned_msg)
            has_logs = True
            
        return feedback, has_logs
    
    def verify_game(self, game_path: str, output_file: Optional[str] = None) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        """
        Verify a game by running tests to check if it loads, starts, and responds to actions.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_file: Path to save combined results (optional)
            
        Returns:
            Tuple containing:
            - Results dictionary with test outcomes
            - Load test logs dictionary
            - Interaction test logs dictionary
        """
        results = {
            "game_path": game_path,
            "load_test": {},
            "interaction_test": {},
            "overall_result": False
        }
        
        # Normalize game path
        game_path = os.path.abspath(game_path)
        if not os.path.exists(game_path):
            logging.error(f"Game path does not exist: {game_path}")
            results["error"] = f"Game path does not exist: {game_path}"
            return results, {}, {}
        
        # Run load test
        logging.info("Running game load test...")
        load_results = check_game_loads(game_path)
        results["load_test"] = load_results
        report_load_test(load_results)
        
        # Only run interaction tests if load test passed
        if load_results.get("test_result", False):
            # Run interaction test
            logging.info("Running game interaction test...")
            interaction_results = test_game_interaction(game_path)
            results["interaction_test"] = interaction_results
            report_interaction_test(interaction_results)
        else:
            logging.warning("Skipping interaction test because load test failed")
            results["interaction_test"] = {"test_result": False, "error": "Skipped due to load test failure"}
        
        # Calculate overall result
        load_test_passed = results["load_test"].get("test_result", False)
        interaction_test_passed = results["interaction_test"].get("test_result", False)
        results["overall_result"] = load_test_passed and interaction_test_passed
        
        # Print overall result
        print("\n" + "="*50)
        print("OVERALL TEST RESULTS")
        print("="*50)
        print(f"Load Test: {'✅ PASSED' if load_test_passed else '❌ FAILED'}")
        
        # Access and display detailed interaction test results
        try:
            if isinstance(results["interaction_test"], dict) and "interaction_test" in results["interaction_test"]:
                interaction_detail = results["interaction_test"]["interaction_test"]
                if isinstance(interaction_detail, dict):
                    # Display game start test results
                    if "game_start_test" in interaction_detail:
                        game_start_test = interaction_detail["game_start_test"]
                        print(f"Game Start Test: {'✅ PASSED' if game_start_test.get('test_result', False) else '❌ FAILED'}")
                    
                    # Display gameplay test results
                    if "gameplay_test" in interaction_detail:
                        gameplay_test = interaction_detail["gameplay_test"]
                        print(f"Gameplay Test: {'✅ PASSED' if gameplay_test.get('test_result', False) else '❌ FAILED'}")
            else:
                # Fallback if structure doesn't match expected format
                print(f"Interaction Test: {'✅ PASSED' if interaction_test_passed else '❌ FAILED'}")
        except Exception as e:
            logging.warning(f"Error displaying detailed interaction results: {e}")
            print(f"Interaction Test: {'✅ PASSED' if interaction_test_passed else '❌ FAILED'}")
        
        print("-"*50)
        print(f"Overall Result: {'✅ PASSED' if results['overall_result'] else '❌ FAILED'}")
        print("="*50 + "\n")
        
        # Print console logs, info, and errors
        print("="*50)
        print("CONSOLE OUTPUT")
        print("="*50)
        
        # Initialize feedback dictionary in results
        results["feedback"] = {
            "load_test": {},
            "interaction_test": {}
        }
        
        # Get load test logs
        load_logs = results["load_test"].get("console_logs", {})
        load_feedback, load_logs_printed = self.get_logs(load_logs, "LOAD TEST")
        results["feedback"]["load_test"] = load_feedback
        
        # Get interaction test logs
        interaction_logs = results["interaction_test"].get("console_logs", {})
        interaction_feedback, interaction_logs_printed = self.get_logs(interaction_logs, "INTERACTION TEST")
        results["feedback"]["interaction_test"] = interaction_feedback
        
        # Combine all feedback for easy access
        results["feedback"]["all_errors"] = load_feedback.get("errors", []) + interaction_feedback.get("errors", [])
        results["feedback"]["all_warnings"] = load_feedback.get("warnings", []) + interaction_feedback.get("warnings", [])
        results["feedback"]["all_logs"] = (
            load_feedback.get("logs", []) + interaction_feedback.get("logs", []) +
            load_feedback.get("info", []) + interaction_feedback.get("info", []) +
            load_feedback.get("other", []) + interaction_feedback.get("other", [])
        )
        
        # If no logs were printed, inform the user
        if not load_logs_printed and not interaction_logs_printed:
            print("\nNo console logs collected during tests.")
        
        print("="*50 + "\n")
        
        # Save combined results if output file specified
        if output_file:
            try:
                import json
                with open(output_file, 'w') as f:
                    json.dump(results, f, indent=2)
                logging.info(f"Combined results saved to {output_file}")
            except Exception as e:
                logging.error(f"Error saving combined results: {e}")
        
        return results, load_logs, interaction_logs
    
    def aggregate_feedback(self, results: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Aggregate feedback from both tests to avoid duplicate messages.
        
        Args:
            results: Results dictionary from verify_game
            
        Returns:
            Dictionary with aggregated feedback by category
        """
        # Define the categories to aggregate
        categories = ["errors", "warnings", "info", "logs", "other"]
        
        # Create a dictionary to store unique messages by category
        aggregated_feedback = {category: set() for category in categories}
        
        # Collect unique messages from both tests
        for test_type in ["load_test", "interaction_test"]:
            for category in categories:
                if category in results["feedback"][test_type]:
                    for item in results["feedback"][test_type][category]:
                        if item:  # Skip empty messages
                            aggregated_feedback[category].add(item)
        
        # Convert sets to sorted lists for the final output
        return {category: sorted(list(items)) for category, items in aggregated_feedback.items()}
    
    def print_aggregated_feedback(self, aggregated_feedback: Dict[str, List[str]]) -> None:
        """
        Print aggregated feedback by category.
        
        Args:
            aggregated_feedback: Dictionary with aggregated feedback by category
        """
        print("\nAggregated Test Feedback:")
        
        for category, items in aggregated_feedback.items():
            if items:
                print(f"\n{category.upper()}:")
                for item in items:
                    print(f"- {item}") 
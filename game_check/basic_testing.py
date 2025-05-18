#!/usr/bin/env python3
"""
Basic Testing Class

This module provides a base class for testing game files by checking if:
1. The game loads properly
2. The game starts on pressing enter
3. Random actions lead to changes in the game state
4. Automated testing works properly (if applicable)

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
            
        # Don't clean stack traces to preserve useful information
        if "    at " in msg or "\n    at " in msg:
            return msg
            
        # Preserve error messages for undefined variables and other critical runtime errors
        if any(pattern.lower() in msg.lower() for pattern in [
            "is not defined", 
            "is undefined", 
            "cannot read property",
            "cannot read properties of undefined",
            "ReferenceError",
            "SyntaxError",
            "TypeError",
            "RangeError",
            "URIError",
            "EvalError",
            "InternalError",
            "Uncaught",
        ]):
            # if there is a path in the msg starting with "file://" or "http://" or "https://", replace it with str.strip(-/)[-1] which keeps the last part of the path that is the file name
            if any(pattern in msg.lower() for pattern in ["file://", "http://", "https://"]):
                msg = re.sub(r'file://|http://|https://', '', msg)
                msg = msg.strip("/")[-1]

            return msg
            
        # Clean up extra spaces, tabs, etc.
        cleaned = re.sub(r'\s+', ' ', msg).strip()
        
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
            "other": [],
            "syntax_errors": [],  # Special category for syntax errors
            "stack_traces": [],   # For stack traces
            "module_errors": [],  # New category for module/import errors
            "undefined_vars": [], # New category for undefined variable errors
            "game_start_errors": []  # New category specifically for game start errors
        }
        
        # First, process all error messages to ensure we capture their stack traces
        if "error" in logs_dict and logs_dict["error"]:
            error_with_traces = []
            
            for msg in logs_dict["error"]:
                # Check if this is a JavaScript runtime error
                error_msg = str(msg)
                
                # Look for common runtime error patterns
                is_runtime_error = any(pattern in error_msg.lower() for pattern in [
                    "is not defined",
                    "is undefined",
                    "cannot read property",
                    "cannot read properties of undefined",
                    "null is not an object",
                    "is not a function",
                    "undefined is not a function",
                    "cannot set property",
                    "cannot access",
                    "referenceerror",
                    "typeerror"
                ])
                
                # Check specifically for undefined variable errors
                is_undefined_var = any(pattern in error_msg.lower() for pattern in [
                    "is not defined",
                    "is undefined",
                ])
                
                # Check for module import errors
                is_module_error = any(pattern in error_msg.lower() for pattern in [
                    "import",
                    "export",
                    "module",
                    "cannot find module",
                    "failed to load module",
                    "error loading module",
                    "cannot resolve module",
                    "import(",
                    "dynamic import"
                ])
                
                # Check for game start specific errors
                is_game_start_error = any(pattern in error_msg.lower() for pattern in [
                    "gamestate",
                    "game_state",
                    "p.gamestate",
                    "game phase",
                    "game not starting",
                    "error after pressing enter",
                    "captured by error handler"
                ])
                
                # For runtime errors, add the full message as both an error and a stack trace
                if is_runtime_error:
                    # Keep the original message intact for stack traces
                    feedback["errors"].append(error_msg)
                    feedback["stack_traces"].append(error_msg)
                    error_with_traces.append(error_msg)
                    
                    # Also add to specific error categories for better feedback
                    if is_undefined_var:
                        feedback["undefined_vars"].append(error_msg)
                    if is_module_error:
                        feedback["module_errors"].append(error_msg)
                    if is_game_start_error:
                        feedback["game_start_errors"].append(error_msg)
        
        # First, specifically check for syntax errors since they're often critical
        syntax_errors = []
        for log_type, messages in logs_dict.items():
            for msg in messages:
                lower_msg = str(msg).lower()
                
                # Check for module import errors first (to categorize separately)
                is_module_error = any(pattern in lower_msg for pattern in [
                    "import",
                    "export",
                    "module",
                    "cannot find module",
                    "failed to load module",
                    "error loading module",
                    "cannot resolve module"
                ])
                
                # Check for game start errors
                is_game_start_error = any(pattern in lower_msg for pattern in [
                    "gamestate",
                    "game_state", 
                    "p.gamestate",
                    "game phase",
                    "game not starting",
                    "error after pressing enter",
                    "captured by error handler"
                ])
                
                if is_module_error:
                    feedback["module_errors"].append(msg)
                    # Also add to stack traces to preserve full information
                    feedback["stack_traces"].append(msg)
                
                if is_game_start_error:
                    feedback["game_start_errors"].append(msg)
                    # Also add as a regular error
                    feedback["errors"].append(msg)
                    
                # Check for various syntax error patterns
                if any(pattern in lower_msg for pattern in [
                    "syntaxerror", 
                    "syntax error", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input"
                ]):
                    # Keep the full message for syntax errors
                    syntax_errors.append(msg)
                    feedback["syntax_errors"].append(msg)
                    feedback["errors"].append(msg)
                    
                    # Extract and preserve stack trace
                    stack_trace = self.extract_stack_trace(msg)
                    if stack_trace:
                        feedback["stack_traces"].append(stack_trace)
                    
        # If we found syntax errors, print them first and prominently
        if syntax_errors:
            print(f"\n{test_name} SYNTAX ERRORS (critical):")
            for msg in syntax_errors:
                print(f"  - 🚫 {msg}")
            has_logs = True
        
        # If we found game start errors, print them prominently
        if feedback["game_start_errors"]:
            print(f"\n{test_name} GAME START ERRORS (critical):")
            for msg in feedback["game_start_errors"]:
                print(f"  - 🎮 {msg}")
            has_logs = True
        
        # Process regular errors
        if "error" in logs_dict and logs_dict["error"]:
            print(f"\n{test_name} ERRORS:")
            for msg in logs_dict["error"]:
                # Skip errors we've already logged as syntax errors or runtime errors
                if msg in error_with_traces:
                    continue
                    
                lower_msg = str(msg).lower()
                is_syntax_error = any(pattern in lower_msg for pattern in [
                    "syntaxerror", 
                    "syntax error", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier"
                ])
                
                # Skip if it's a game start error we already displayed
                is_game_start_error = any(pattern in lower_msg for pattern in [
                    "gamestate",
                    "game_state", 
                    "p.gamestate",
                    "game phase",
                    "game not starting",
                    "error after pressing enter"
                ])
                
                if not is_syntax_error and not is_game_start_error:
                    # Keep the full message for better debugging
                    print(f"  - {msg}")
                    feedback["errors"].append(msg)
                    
                    # Extract and preserve stack trace
                    stack_trace = self.extract_stack_trace(msg)
                    if stack_trace:
                        feedback["stack_traces"].append(stack_trace)
                        print(f"    Stack trace: {stack_trace}")
            has_logs = True
        
        # Process warnings
        if "warning" in logs_dict and logs_dict["warning"]:
            print(f"\n{test_name} WARNINGS:")
            for msg in logs_dict["warning"]:
                feedback["warnings"].append(msg)
                print(f"  - {msg}")
            has_logs = True
            
        # Process info logs
        if "info" in logs_dict and logs_dict["info"]:
            print(f"\n{test_name} INFO:")
            for msg in logs_dict["info"]:
                cleaned_msg = self.clean_message(msg)
                feedback["info"].append(cleaned_msg)
                print(f"  - {cleaned_msg}")
            has_logs = True
            
        # Process regular logs
        if "log" in logs_dict and logs_dict["log"]:
            print(f"\n{test_name} LOGS:")
            for msg in logs_dict["log"]:
                cleaned_msg = self.clean_message(msg)
                feedback["logs"].append(cleaned_msg)
                print(f"  - {cleaned_msg}")
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
        
        # Extract automated testing check result if available
        automated_testing_check_passed = True  # Default to True if not present
        has_automated_testing_buttons = False
        if (
            "interaction_test" in results and 
            "interaction_test" in results["interaction_test"] and
            "automated_testing_check" in results["interaction_test"]["interaction_test"]
        ):
            automated_check = results["interaction_test"]["interaction_test"]["automated_testing_check"]
            automated_testing_check_passed = automated_check.get("test_result", True)
            has_automated_testing_buttons = automated_check.get("buttons_found", False)
            
            # Add automated testing info to results
            results["automated_testing_check"] = {
                "test_result": automated_testing_check_passed,
                "buttons_found": has_automated_testing_buttons,
                "player_info_changed": automated_check.get("player_info_changed", False)
            }
        
        # Overall result is true only if all tests pass
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
                    
                    # Display automated testing check results if buttons were found
                    if "automated_testing_check" in interaction_detail:
                        automated_check = interaction_detail["automated_testing_check"]
                        if automated_check.get("buttons_found", False):
                            print(f"Automated Testing Check: {'✅ PASSED' if automated_check.get('test_result', False) else '❌ FAILED'}")
                            if not automated_check.get("test_result", False):
                                print("  - Player information is not changing during automated testing")
                        else:
                            print("Automated Testing Check: ⏭️ SKIPPED (No automated testing buttons found)")
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
        
        # If automated testing buttons were found but not working, add a specific error
        if has_automated_testing_buttons and not automated_testing_check_passed:
            automated_error = "Automated testing is not working: player information is not changing during automated testing"
            if "all_errors" in results["feedback"]:
                results["feedback"]["all_errors"].append(automated_error)
            else:
                results["feedback"]["all_errors"] = [automated_error]
        
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
        categories = [
            "errors", 
            "warnings", 
            "info", 
            "logs", 
            "other", 
            "syntax_errors", 
            "stack_traces",
            "module_errors",
            "undefined_vars"
        ]
        
        # Create a dictionary to store unique messages by category
        aggregated_feedback = {category: set() for category in categories}
        
        # Collect unique messages from both tests
        for test_type in ["load_test", "interaction_test"]:
            for category in categories:
                if test_type in results["feedback"] and category in results["feedback"][test_type]:
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
        
        # Print module errors first since they're often the root cause of many issues
        if "module_errors" in aggregated_feedback and aggregated_feedback["module_errors"]:
            print("\n🔄 MODULE/IMPORT ERRORS:")
            for item in aggregated_feedback["module_errors"]:
                # Only print concise error messages, not full stack traces
                if "at " not in item and not item.count("\n") > 1:
                    print(f"- {item}")
                
        # Print undefined variable errors since they're common issues
        if "undefined_vars" in aggregated_feedback and aggregated_feedback["undefined_vars"]:
            print("\n❓ UNDEFINED VARIABLE ERRORS:")
            for item in aggregated_feedback["undefined_vars"]:
                # Only print concise error messages, not stack traces
                if "Page error:" in item or "Console error:" in item:
                    print(f"- {item}")
                elif "is undefined" in item or "is not defined" in item:
                    # Try to extract just the error part without stack trace
                    if "\n" in item:
                        concise_item = item.split("\n")[0]
                        print(f"- {concise_item}")
                    else:
                        print(f"- {item}")
        
        # Hide stack traces by default in normal output
        # if "stack_traces" in aggregated_feedback and aggregated_feedback["stack_traces"]:
        #    print("\n⚠️ STACK TRACES:")
        #    for item in aggregated_feedback["stack_traces"]:
        #        print(f"- {item}\n")
        
        # Print syntax errors next since they're critical
        if "syntax_errors" in aggregated_feedback and aggregated_feedback["syntax_errors"]:
            print("\n🚫 SYNTAX ERRORS (critical):")
            for item in aggregated_feedback["syntax_errors"]:
                # Only print concise error messages, not stack traces
                if "at " not in item and not item.count("\n") > 1:
                    print(f"- {item}")
        
        # Print other categories
        categories_order = ["errors", "warnings", "info", "logs", "other"]
        for category in categories_order:
            if category in aggregated_feedback and aggregated_feedback[category]:
                print(f"\n{category.upper()}:")
                for item in aggregated_feedback[category]:
                    # Skip items that look like stack traces
                    if "at " not in item and not item.count("\n") > 1:
                        print(f"- {item}") 
    
    def extract_stack_trace(self, msg: str) -> Optional[str]:
        """
        Extract stack trace from an error message.
        
        Args:
            message: The error message that may contain a stack trace
            
        Returns:
            The stack trace if present, otherwise None
        """
        if not isinstance(msg, str):
            return None
            
        # Check for common JavaScript runtime errors that might have stack traces
        runtime_error_patterns = [
            "is not defined",
            "is undefined",
            "cannot read property",
            "cannot read properties of undefined",
            "null is not an object",
            "is not a function",
            "undefined is not a function",
            "cannot set property",
            "cannot access",
            "referenceerror",
            "typeerror",
            "syntaxerror",
            "urierror",
            "evalerror",
            "rangeerror",
            "p.gamestate",
            "game_state",
            "uncaught"
        ]
        
        # If it's a runtime error, treat the entire message as potentially having a stack trace
        for pattern in runtime_error_patterns:
            if pattern.lower() in msg.lower():
                return msg
            
        # Check for common stack trace patterns
        if "    at " in msg or "at " in msg:
            # Handle different stack trace formats
            
            # Handle ES6 module imports (which often have different stack trace formats)
            # Look for patterns like "at ModuleEvaluation" or references to import/export
            if any(pattern in msg for pattern in [
                "ModuleEvaluation", 
                "import", 
                "export", 
                "module", 
                "ModuleNamespaceObject",
                "node_modules",
                ".js:",
                ".mjs:",
                ".jsx:",
                ".ts:",
                ".tsx:",
                "import(",
                "import.",
                "imported from",
                "Failed to load module from",
                "Dynamic import",
                "Uncaught SyntaxError"
            ]):
                # Make sure we keep the full stack trace including ES6 module information
                return msg
            
            # Standard stack trace format
            return msg
            
        # Look for error locations that might indicate a stack trace
        if re.search(r'at .+\.js:[0-9]+:[0-9]+', msg) or re.search(r'[a-zA-Z0-9_\-./]+\.(js|mjs|jsx|ts|tsx):[0-9]+', msg):
            return msg
        
        # Look for module import errors
        if re.search(r'(Failed to|Error|Cannot) (load|resolve|find|import) (module|file|dependency) [\'"]([^\'"])+[\'"]', msg, re.IGNORECASE):
            return msg
                
        # Check for gameState specific errors
        if "gamestate" in msg.lower() or "p.gamestate" in msg.lower() or "game phase" in msg.lower():
            return msg
            
        return None 
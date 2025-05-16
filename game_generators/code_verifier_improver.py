#!/usr/bin/env python3
"""
Code Verifier and Improver

This file implements an a game verifier and improver based on feedback it gets from the verifier.
It takes as input a path to a folder with game files and a mode as command line argument.
It has two modes: basic_test and vibe_coding
For each mode, it uses a specific verifier to get feedback and uses CodeFeedbackIterator to update the game code.
basic_test:
  - verifies the following using BasicTesting:
    - checks if the game loads
    - checks if the game starts on pressing ENTER
    - checks if random actions lead to changes in the game state
  - uses BasicTesting to get the results
  - if load_test['test_result'] is False, then the feedback is based on the aggregate_feedback['load_test']['error']
  - if interaction_test['test_result'] is False, then the feedback is based on the ['error'] and told that "the interaction test was not possible so it should check if the game starts when ENTER is pressed and pressing control keys leads to changes in the game state and update the rendering. Also, should check for syntax errors."
  - if overall_result is False, then the feedback is based on the aggregate_feedback['error'] and told that "the game is not playable so it should be fixed"
  - uses CodeFeedbackIterator to update the game code based on the feedback
  - It should not change any code that is not mentioned in the feedback and output the code with the same filenames in the following format without any additional text.
vibe_coding:
  - uses the vibe coding framework to update the game code
"""

import json
import os
import sys
import argparse
import logging
from typing import Dict, Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import BaseTesting class
from game_generators.basic_testing import BasicTesting

# Import CodeFeedbackIterator
from game_generators.code_feedback_iterator import CodeFeedbackIterator
from vlm_play.vlm_play_test import VLMPlayEvaluation
from vlm_play.test_vlm_play import test_record_only
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def generate_feedback_from_results(results: Dict[str, Any], mode: str) -> str:
    """
    Generate feedback message based on test results for basic_test mode

    Args:
        results: Results dictionary from the verification
        mode: The mode being used (basic_test or vibe_coding)

    Returns:
        Formatted feedback string for the code improver
    """
    feedback = ""
    if mode == "basic_test":
        feedback = """<context>
We conducted basic tests on the game code. The test checks if the game loads in the browser, followed by an interaction test where the game must start on pressing ENTER, and if random actions lead to changes in the game state and rendered changes on screen.
</context>
Based on the test results, we have the following feedback and tasks for you:

"""
        # Check if load test failed
        if not results["load_test"].get("test_result", False):
            feedback += """<feedback>
<feedback_1>
The game failed to load properly.
"""

            # Get structured errors if available
            structured_errors = []
            if "structured_errors" in results:
                structured_errors = results["structured_errors"]
            elif "load_test" in results and "structured_errors" in results["load_test"]:
                structured_errors = results["load_test"]["structured_errors"]

            # Categorize errors by type
            error_categories = {
                "syntax_error": [],
                "reference_error": [],
                "module_error": [],
                "network_error": [],
                "resource_error": [],
                "sourcemap_error": [],
                "console_error": [],
                "other": [],
            }

            if structured_errors:
                # Group errors by type
                for error in structured_errors:
                    error_type = error.get("type", "other").lower()
                    if error_type in error_categories:
                        error_categories[error_type].append(error)
                    else:
                        error_categories["other"].append(error)

                # First check for syntax errors as they're critical
                if error_categories["syntax_error"]:
                    feedback += "SYNTAX ERRORS FOUND:\n"
                    for error in error_categories["syntax_error"]:
                        source_info = ""
                        if (
                            error.get("source")
                            and error["source"].get("filename")
                            and error["source"].get("line")
                        ):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}:{error['source']['line']}"
                        feedback += f"- {error.get('message', 'Unknown syntax error')}{source_info}\n"
                    feedback += "\nThese syntax errors must be fixed before the game can load properly.\n\n"

                # Check for module/import errors
                if error_categories["module_error"]:
                    feedback += "MODULE/IMPORT ERRORS FOUND:\n"
                    for error in error_categories["module_error"]:
                        source_info = ""
                        if error.get("source") and error["source"].get("filename"):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}"
                    feedback += f"- {error.get('message', 'Unknown module error')}{source_info}\n"
                    feedback += "\nThese errors indicate problems with ES6 modules or file imports. Fix these first.\n\n"

                # Check for undefined variable/reference errors
                if error_categories["reference_error"]:
                    feedback += "UNDEFINED VARIABLE ERRORS FOUND:\n"
                    for error in error_categories["reference_error"]:
                        source_info = ""
                        if (
                            error.get("source")
                            and error["source"].get("filename")
                            and error["source"].get("line")
                        ):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}:{error['source']['line']}"
                        feedback += f"- {error.get('message', 'Unknown reference error')}{source_info}\n"
                    feedback += "\nThese errors indicate variable name typos or missing initialization. Fix these variables.\n\n"

                # Check for network errors
                if error_categories["network_error"]:
                    feedback += "NETWORK ERRORS FOUND:\n"
                    for error in error_categories["network_error"]:
                        feedback += (
                            f"- {error.get('message', 'Unknown network error')}\n"
                        )
                    feedback += "\nThese errors indicate problems loading external resources. Check file paths and URLs.\n\n"

                # Check for resource loading errors
                if error_categories["resource_error"]:
                    feedback += "RESOURCE LOADING ERRORS FOUND:\n"
                    for error in error_categories["resource_error"]:
                        feedback += (
                            f"- {error.get('message', 'Unknown resource error')}\n"
                        )
                    feedback += "\nThese errors indicate problems with loading files or assets. Check file paths and permissions.\n\n"

                # Add other errors if no specific errors were found
                if (
                    not error_categories["syntax_error"]
                    and not error_categories["module_error"]
                    and not error_categories["reference_error"]
                    and not error_categories["network_error"]
                    and not error_categories["resource_error"]
                ):

                    if error_categories["console_error"]:
                        feedback += "CONSOLE ERRORS FOUND:\n"
                        for error in error_categories["console_error"]:
                            source_info = ""
                            if (
                                error.get("source")
                                and error["source"].get("filename")
                                and error["source"].get("line")
                            ):
                                filename = error["source"]["filename"].split("/")[-1]
                                source_info = (
                                    f" in {filename}:{error['source']['line']}"
                                )
                            feedback += f"- {error.get('message', 'Unknown error')}{source_info}\n"
                        feedback += "\n"

                    if error_categories["other"]:
                        feedback += "OTHER ERRORS FOUND:\n"
                        for error in error_categories["other"]:
                            source_info = ""
                            if (
                                error.get("source")
                                and error["source"].get("filename")
                                and error["source"].get("line")
                            ):
                                filename = error["source"]["filename"].split("/")[-1]
                                source_info = (
                                    f" in {filename}:{error['source']['line']}"
                                )
                            feedback += f"- {error.get('message', 'Unknown error')}{source_info}\n"
                        feedback += "\n"
            else:
                # Fallback to the old error handling if structured errors are not available
                print(results["feedback"])
                # First check for module/import errors as they're often the root cause
                module_errors_found = False
                if (
                    "feedback" in results
                    and "load_test" in results["feedback"]
                    and "module_errors" in results["feedback"]["load_test"]
                ):
                    module_errors = results["feedback"]["load_test"]["module_errors"]
                    if module_errors:
                        feedback += "MODULE/IMPORT ERRORS FOUND:\n"
                        for error in module_errors:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate problems with ES6 modules or file imports. Fix these first.\n\n"
                        module_errors_found = True

                # Check for undefined variable errors
                undefined_vars_found = False
                if (
                    "feedback" in results
                    and "load_test" in results["feedback"]
                    and "undefined_vars" in results["feedback"]["load_test"]
                ):
                    undefined_vars = results["feedback"]["load_test"]["undefined_vars"]
                    if undefined_vars:
                        feedback += "UNDEFINED VARIABLE ERRORS FOUND:\n"
                        for error in undefined_vars:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate variable name typos or missing initialization. Fix these variables.\n\n"
                        undefined_vars_found = True

                # Check for common JavaScript runtime errors (like "X is undefined")
                runtime_errors_found = False
                if "feedback" in results and "load_test" in results["feedback"]:
                    runtime_error_patterns = [
                        "is not defined",
                        "is undefined",
                        "cannot read property",
                        "cannot read properties of undefined",
                    ]

                    runtime_errors = []

                    # Look for runtime errors in stack traces and errors
                    if "errors" in results["feedback"]["load_test"]:
                        for error_msg in results["feedback"]["load_test"]["errors"]:
                            for pattern in runtime_error_patterns:
                                if pattern.lower() in str(error_msg).lower():
                                    runtime_errors.append(error_msg)
                                    runtime_errors_found = True
                                    break

                    # If we found runtime errors, highlight them prominently
                    if (
                        runtime_errors_found and not undefined_vars_found
                    ):  # Only show if not already shown in undefined vars
                        feedback += "CRITICAL RUNTIME ERRORS FOUND:\n"
                        for error in runtime_errors:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate variable name typos or missing initialization. Fix these first.\n\n"

                # Add specific error messages if available
                if "feedback" in results and "load_test" in results["feedback"]:
                    # First add stack traces for easier debugging - but only the first line of each
                    if (
                        "stack_traces" in results["feedback"]["load_test"]
                        and results["feedback"]["load_test"]["stack_traces"]
                    ):
                        feedback += "Here are the error locations: \n"
                        for trace in results["feedback"]["load_test"]["stack_traces"]:
                            # Extract only the first line of each stack trace
                            first_line = trace.split("\n")[0].strip()
                            feedback += f"- {first_line}\n"

                    if (
                        "errors" in results["feedback"]["load_test"]
                        and results["feedback"]["load_test"]["errors"]
                        and not runtime_errors_found
                        and not undefined_vars_found
                        and not module_errors_found
                    ):
                        feedback += "Here are the errors: \n"
                        for error in results["feedback"]["load_test"]["errors"]:
                            # Make sure each error is on its own line for clarity
                            feedback += f"{error}\n"

                    if (
                        "syntax_errors" in results["feedback"]["load_test"]
                        and results["feedback"]["load_test"]["syntax_errors"]
                    ):
                        feedback += "Fix these syntax errors: \n"
                        for error in results["feedback"]["load_test"]["syntax_errors"]:
                            # Make sure each error is on its own line
                            feedback += f"{error}\n"

            feedback += "Please fix the game so it loads correctly in the browser.</feedback_1>\n<feedback_2>\nThe interaction test was not possible. Ensure that the game starts when ENTER is pressed and pressing control keys leads to changes in the game state and update the rendering. Also, check for syntax errors. The game should be playable by pressing ENTER and using control keys to move around after your changes.</feedback_2>"

        # Check if interaction test failed (but load test passed)
        elif not results["interaction_test"].get("test_result", False):
            feedback += """<feedback>
<feedback_1>
The game loads but fails the interaction test. Intended output is that random key presses must change the game state and update the visual output in the canvas. Following is the error message: 
"""

            # Get structured errors if available
            structured_errors = []
            if "structured_errors" in results:
                structured_errors = results["structured_errors"]
            elif (
                "interaction_test" in results
                and "structured_errors" in results["interaction_test"]
            ):
                structured_errors = results["interaction_test"]["structured_errors"]

            # Categorize errors by type
            error_categories = {
                "syntax_error": [],
                "reference_error": [],
                "module_error": [],
                "network_error": [],
                "resource_error": [],
                "sourcemap_error": [],
                "console_error": [],
                "other": [],
            }

            if structured_errors:
                # Group errors by type
                for error in structured_errors:
                    error_type = error.get("type", "other").lower()
                    if error_type in error_categories:
                        error_categories[error_type].append(error)
                    else:
                        error_categories["other"].append(error)

                # First check for reference errors as they're common during gameplay
                if error_categories["reference_error"]:
                    feedback += "UNDEFINED VARIABLE ERRORS FOUND DURING GAMEPLAY:\n"
                    for error in error_categories["reference_error"]:
                        source_info = ""
                        if (
                            error.get("source")
                            and error["source"].get("filename")
                            and error["source"].get("line")
                        ):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}:{error['source']['line']}"
                        feedback += f"- {error.get('message', 'Unknown reference error')}{source_info}\n"
                    feedback += "\nThese errors indicate variable name typos or missing initialization during gameplay. Fix these variables.\n\n"

                # Check for syntax errors
                if error_categories["syntax_error"]:
                    feedback += "SYNTAX ERRORS FOUND DURING GAMEPLAY:\n"
                    for error in error_categories["syntax_error"]:
                        source_info = ""
                        if (
                            error.get("source")
                            and error["source"].get("filename")
                            and error["source"].get("line")
                        ):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}:{error['source']['line']}"
                        feedback += f"- {error.get('message', 'Unknown syntax error')}{source_info}\n"
                    feedback += "\nThese syntax errors must be fixed before the game can run properly.\n\n"

                # Check for module/import errors
                if error_categories["module_error"]:
                    feedback += "MODULE/IMPORT ERRORS FOUND DURING GAMEPLAY:\n"
                    for error in error_categories["module_error"]:
                        source_info = ""
                        if error.get("source") and error["source"].get("filename"):
                            filename = error["source"]["filename"].split("/")[-1]
                            source_info = f" in {filename}"
                        feedback += f"- {error.get('message', 'Unknown module error')}{source_info}\n"
                    feedback += "\nThese errors indicate problems with ES6 modules or file imports during gameplay. Fix these first.\n\n"

                # Add other errors if no specific errors were found
                if (
                    not error_categories["reference_error"]
                    and not error_categories["syntax_error"]
                    and not error_categories["module_error"]
                ):

                    if error_categories["console_error"]:
                        feedback += "CONSOLE ERRORS FOUND DURING GAMEPLAY:\n"
                        for error in error_categories["console_error"]:
                            source_info = ""
                            if (
                                error.get("source")
                                and error["source"].get("filename")
                                and error["source"].get("line")
                            ):
                                filename = error["source"]["filename"].split("/")[-1]
                                source_info = (
                                    f" in {filename}:{error['source']['line']}"
                                )
                            feedback += f"- {error.get('message', 'Unknown error')}{source_info}\n"
                        feedback += "\n"

                    if error_categories["other"]:
                        feedback += "OTHER ERRORS FOUND DURING GAMEPLAY:\n"
                        for error in error_categories["other"]:
                            source_info = ""
                            if (
                                error.get("source")
                                and error["source"].get("filename")
                                and error["source"].get("line")
                            ):
                                filename = error["source"]["filename"].split("/")[-1]
                                source_info = (
                                    f" in {filename}:{error['source']['line']}"
                                )
                            feedback += f"- {error.get('message', 'Unknown error')}{source_info}\n"
                        feedback += "\n"

                    # If error is about visual changes, add specific feedback
                    if "error" in results and "visual" in results["error"].lower():
                        feedback += "GAMEPLAY VISUAL ERROR:\n"
                        feedback += f"- {results['error']}\n\n"
                        feedback += "Check your key event handlers and ensure they're properly updating the game state and rendering.\n\n"
            else:
                # Fallback to the old error handling if structured errors are not available
                # First check for module/import errors as they're often the root cause
                module_errors_found = False
                if (
                    "feedback" in results
                    and "interaction_test" in results["feedback"]
                    and "module_errors" in results["feedback"]["interaction_test"]
                ):
                    module_errors = results["feedback"]["interaction_test"][
                        "module_errors"
                    ]
                    if module_errors:
                        feedback += "MODULE/IMPORT ERRORS FOUND:\n"
                        for error in module_errors:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate problems with ES6 modules or file imports during gameplay. Fix these first.\n\n"
                        module_errors_found = True

                # Check for undefined variable errors
                undefined_vars_found = False
                if (
                    "feedback" in results
                    and "interaction_test" in results["feedback"]
                    and "undefined_vars" in results["feedback"]["interaction_test"]
                ):
                    undefined_vars = results["feedback"]["interaction_test"][
                        "undefined_vars"
                    ]
                    if undefined_vars:
                        feedback += "UNDEFINED VARIABLE ERRORS FOUND:\n"
                        for error in undefined_vars:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate variable name typos or missing initialization in gameplay. Fix these variables.\n\n"
                        undefined_vars_found = True

                # Check for common JavaScript runtime errors (like "X is undefined")
                runtime_errors_found = False
                if "feedback" in results and "interaction_test" in results["feedback"]:
                    runtime_error_patterns = [
                        "is not defined",
                        "is undefined",
                        "cannot read property",
                        "cannot read properties of undefined",
                    ]

                    runtime_errors = []

                    # Look for runtime errors in stack traces and errors
                    if "errors" in results["feedback"]["interaction_test"]:
                        for error_msg in results["feedback"]["interaction_test"][
                            "errors"
                        ]:
                            for pattern in runtime_error_patterns:
                                if pattern.lower() in str(error_msg).lower():
                                    runtime_errors.append(error_msg)
                                    runtime_errors_found = True
                                    break

                    # If we found runtime errors, highlight them prominently
                    if (
                        runtime_errors_found and not undefined_vars_found
                    ):  # Only show if not already shown in undefined vars
                        feedback += "CRITICAL RUNTIME ERRORS FOUND:\n"
                        for error in runtime_errors:
                            feedback += f"- {error}\n"
                        feedback += "\nThese errors indicate variable name typos or missing initialization during gameplay. Fix these first.\n\n"

                # Add specific error messages if available
                if "feedback" in results and "interaction_test" in results["feedback"]:
                    # First add stack traces for easier debugging - but only the first line of each
                    if (
                        "stack_traces" in results["feedback"]["interaction_test"]
                        and results["feedback"]["interaction_test"]["stack_traces"]
                    ):
                        feedback += "Here are the error locations: \n"
                        for trace in results["feedback"]["interaction_test"][
                            "stack_traces"
                        ]:
                            # Extract only the first line of each stack trace
                            first_line = trace.split("\n")[0].strip()
                            feedback += f"- {first_line}\n"

                    if (
                        "errors" in results["feedback"]["interaction_test"]
                        and results["feedback"]["interaction_test"]["errors"]
                        and not runtime_errors_found
                        and not undefined_vars_found
                        and not module_errors_found
                    ):
                        feedback += "Here are the errors: \n"
                        for error in results["feedback"]["interaction_test"]["errors"]:
                            # Make sure each error is on its own line
                            feedback += f"{error}\n"

            feedback += """
Please fix these issues to make the game playable and responsive to key presses following the game mechanics.
</feedback_1>
<feedback>
"""

        feedback += """
<important>
Keep your changes to the game code only to address the <feedback> above.
Be careful while making changes to the code, and make sure you are not introducing any new errors.
</important>"""

    elif mode == "vibe_coding":
        # For vibe_coding mode, the feedback is generated by the CodeFeedbackIterator
        feedback = None

    return feedback


def run_verification(game_path: str, output_file: str = None) -> Dict[str, Any]:
    """
    Run the verification process on a game

    Args:
        game_path: Path to the game directory
        output_file: Optional path to save the results

    Returns:
        Results dictionary from verification
    """
    tester = BasicTesting()
    results, load_logs, interaction_logs = tester.verify_game(game_path, output_file)

    # Print results
    for key, value in results.items():
        if key != "feedback":  # Skip printing the detailed feedback
            print(f"{key}: {value}")

    # Check for runtime errors like "X is undefined" and display them prominently
    runtime_error_patterns = [
        "is not defined",
        "is undefined",
        "cannot read property",
        "cannot read properties of undefined",
    ]

    # Check both load and interaction logs for runtime errors
    for logs_dict in [load_logs, interaction_logs]:
        if "error" in logs_dict:
            for error_msg in logs_dict["error"]:
                for pattern in runtime_error_patterns:
                    if pattern.lower() in str(error_msg).lower():
                        print("\n🚨 RUNTIME ERROR DETECTED:")
                        print(f"  {error_msg}")
                        print(
                            "This is likely the cause of the failure. Check variable names and initialization."
                        )
                        break

    # Aggregate and print feedback
    aggregated_feedback = tester.aggregate_feedback(results)
    tester.print_aggregated_feedback(aggregated_feedback)

    return results


def format_vlm_feedback(aggregated_feedback: Dict[str, Any]) -> str:
    """
    Format the aggregated feedback from VLM Play into a structured format for the code improver.
    
    Args:
        aggregated_feedback: Dictionary containing the aggregated feedback sections
        
    Returns:
        Formatted feedback string for the code improver
    """
    feedback = """<context>
We conducted a comprehensive evaluation of your game using VLM Play, which records gameplay videos and analyzes them for issues and improvement opportunities.
</context>

<feedback>
"""
    sections = [
        "critical_issues", 
        "playability_feedback",
        "game_progression_feedback", 
        "game_mechanics_feedback", 
        "graphics_and_animation_feedback", 
        "console_errors_feedback",
        "other_feedback",
        "proposed_enhancements"
    ]
    for section in sections:
        if section in aggregated_feedback and aggregated_feedback[section]:
            feedback += f"## {section.replace('_', ' ').title()}\n\n{aggregated_feedback[section]}\n\n"
    
    feedback += "</feedback>\n\n<important>\nPlease address the issues identified in the feedback, focusing on critical issues first. Update the automated testing code. Ensure the game loads, start on pressing ENTER, key inputs work, and the game is still playable.\n</important>"
    
    return feedback


def main():
    """Main function to parse arguments and run the verification and improvement process."""
    parser = argparse.ArgumentParser(
        description="Verify games by checking if they load, start, and respond to actions, then improve based on feedback"
    )
    parser.add_argument(
        "--game_path",
        required=True,
        help="Path to the folder containing the index.html and js files for the game",
    )
    parser.add_argument(
        "--mode",
        choices=["basic_test", "vibe_coding", "vlm_play"],
        default="basic_test",
        help="Mode to run the verifier and improver in (default: basic_test)",
    )
    parser.add_argument("--output", "-o", help="Path to save combined results (JSON)")
    parser.add_argument(
        "--output_dir",
        help="Directory to save the output files after iteration (for vibe_coding and vlm_play modes)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.25,
        help="Temperature for LLM generation (default: 0.25)",
    )
    parser.add_argument(
        "--show_stack_traces",
        action="store_true",
        default=True,
        help="Show stack traces in the output (default: True)",
    )

    # Add VLM-specific arguments
    parser.add_argument(
        "--api-key",
        help="Google API key for Gemini access (will use GOOGLE_API_KEY env var if not provided)",
    )
    parser.add_argument(
        "--skip-eval",
        action="store_true",
        help="Skip Gemini evaluation in vlm_play mode (record only)",
    )
    parser.add_argument(
        "--only-button",
        help="Test only a specific button ID in vlm_play mode (e.g., 'test_1_ModeBtn')",
    )

    args = parser.parse_args()

    if args.mode == "basic_test":
        # For basic_test mode: first verify, then improve if tests fail
        logging.info("Running verification in basic_test mode...")
        results = run_verification(args.game_path, args.output)
        # Print stack traces if available and requested
        if args.show_stack_traces and "feedback" in results:
            for test_type in ["load_test", "interaction_test"]:
                if (
                    test_type in results["feedback"]
                    and "stack_traces" in results["feedback"][test_type]
                    and results["feedback"][test_type]["stack_traces"]
                ):
                    print(f"\n--- Stack traces from {test_type} ---")
                    for trace in results["feedback"][test_type]["stack_traces"]:
                        print(f"{trace}\n")

        if not results["overall_result"]:
            # Generate feedback based on the verification results
            feedback = generate_feedback_from_results(results, args.mode)

            logging.info("Game verification failed. Improving game code...")
            # Initialize the code improver
            improver = CodeFeedbackIterator(
                verbose=args.verbose, mode="basic_test_fix", temperature=0.1
            )

            # Improve the code based on the feedback
            try:
                improvement_results = improver.iterate_code(args.game_path, feedback)
                logging.info("Code improvement completed successfully")
                logging.info(
                    f"Updated files: {', '.join(improvement_results['updated_files'])}"
                )
                if args.mode != "basic_test_fix":
                    logging.info(
                        f"Iteration saved to: {improvement_results['iteration_dir']}"
                    )

                # Exit with failure status since original verification failed
                sys.exit(1)
            except Exception as e:
                logging.error(f"Error improving code: {str(e)}")
                import traceback

                traceback.print_exc()
                sys.exit(1)
        else:
            logging.info("Game verification passed. No code improvement needed.")
            sys.exit(0)

    elif args.mode == "vibe_coding":
        # For vibe_coding mode: assume code passes basic tests, so improve first, then verify
        logging.info("Running in vibe_coding mode...")

        # Initialize the code improver
        improver = CodeFeedbackIterator(
            verbose=args.verbose, mode="vibe_coding", temperature=args.temperature
        )

        # Improve the code using vibe coding framework
        try:
            logging.info("Improving game code using vibe coding framework...")
            improvement_results = improver.iterate_code(args.game_path, None, output_dir=args.output_dir)
            logging.info("Code improvement completed successfully")
            logging.info(
                f"Updated files: {', '.join(improvement_results['updated_files'])}"
            )
            
            # Use the specified output_dir or the default iteration directory
            iteration_dir = args.output_dir if args.output_dir else improvement_results["iteration_dir"]
            logging.info(f"Iteration saved to: {iteration_dir}")

            # After improving, run verification just to check results (not for further improvement)
            logging.info("Running verification to check improved code...")
            results = run_verification(
                iteration_dir, args.output
            )

            # Print stack traces if available and requested
            if args.show_stack_traces and "feedback" in results:
                for test_type in ["load_test", "interaction_test"]:
                    if (
                        test_type in results["feedback"]
                        and "stack_traces" in results["feedback"][test_type]
                        and results["feedback"][test_type]["stack_traces"]
                    ):
                        print(f"\n--- Stack traces from {test_type} ---")
                        for trace in results["feedback"][test_type]["stack_traces"]:
                            print(f"{trace}\n")

            # Report verification results but don't modify code further
            if results["overall_result"]:
                logging.info("Verification passed for improved code.")
                sys.exit(0)
            else:
                logging.warning(
                    "Verification failed for improved code. No further improvements will be made."
                )
                sys.exit(1)

        except Exception as e:
            logging.error(f"Error in vibe coding: {str(e)}")
            import traceback

            traceback.print_exc()
            sys.exit(1)

    elif args.mode == "vlm_play":
        logging.info("Running in vlm_play mode...")

        async def run_vlm_play():
            try:
                # Initialize VLMPlayEvaluation with output_dir if provided
                output_dir = args.output_dir if args.output_dir else args.output
                evaluator = VLMPlayEvaluation(
                    args.game_path, output_dir=output_dir, api_key=args.api_key
                )

                if args.skip_eval:
                    # Run record-only mode
                    logging.info("Running in record-only mode...")
                    results = await test_record_only(
                        args.game_path, output_dir, args.only_button
                    )

                    if results["success"]:
                        logging.info(
                            f"Successfully recorded {len(results['video_paths'])} videos"
                        )
                        sys.exit(0)
                    else:
                        logging.error(f"Recording failed: {results['errors']}")
                        sys.exit(1)
                else:
                    # Run full evaluation
                    logging.info("Starting full VLM evaluation...")
                    results = await evaluator.evaluate_game()
                    # save the results to a file 
                    with open(os.path.join(output_dir, "vlm_play_results.json"), "w") as f:
                        json.dump(results, f)

                    if results["success"]:
                        logging.info(
                            f"Successfully evaluated {len(results['evaluations'])} tests"
                        )

                        # Display aggregated feedback if available
                        if results.get("aggregated_feedback"):
                            print("\nAggregated Feedback Summary:")
                            print("=" * 80)
                            agg = results["aggregated_feedback"]
                            sections = [
                                "critical_issues", 
                                "playability_feedback",
                                "game_progression_feedback", 
                                "game_mechanics_feedback", 
                                "graphics_and_animation_feedback", 
                                "console_errors_feedback",
                                "automated_testing_feedback",
                                "other_feedback",
                                "proposed_enhancements"
                            ]
                            # Display each section from the aggregated feedback
                            for section in sections:
                                if section in agg and agg[section]:
                                    print(f"\n{section.replace('_', ' ').title()}:")
                                    # Handle multi-line feedback by splitting and formatting
                                    for line in agg[section].split("\n"):
                                        if line.strip():
                                            print(f"  - {line.strip()}")

                        # save the aggregated feedback to a file 
                        # Show output location
                        print(f"\nResults saved to: {output_dir}")
                        # save the aggregated feedback to a file 
                        with open(os.path.join(output_dir, "aggregated_feedback.txt"), "w") as f:
                            f.write(str(results["aggregated_feedback"]))
                        
                        # Generate the HTML report if it wasn't already created
                        if not os.path.exists(os.path.join(output_dir, "evaluation_report.html")):
                            evaluator._generate_combined_report(results)
                            logging.info(f"HTML report generated at: {os.path.join(output_dir, 'evaluation_report.html')}")

                        print(
                            f"HTML report: {os.path.join(output_dir, 'evaluation_report.html')}"
                        )
                        
                        # Initialize the code improver with appropriate settings
                        improver = CodeFeedbackIterator(
                            verbose=args.verbose, mode="guided_feedback", temperature=0.5
                        )
                        
                        # Format the aggregated feedback for the code improver
                        formatted_feedback = format_vlm_feedback(results["aggregated_feedback"])
                        
                        # Improve the code based on the feedback and save to output_dir
                        try:
                            logging.info("Improving game code based on VLM play feedback...")
                            improvement_results = improver.iterate_code(
                                args.game_path, 
                                formatted_feedback, 
                                output_dir=output_dir
                            )
                            logging.info("Code improvement completed successfully")
                            logging.info(
                                f"Updated files: {', '.join(improvement_results['updated_files'])}"
                            )
                            
                            # Show the output directory where updated code is saved
                            if improvement_results.get("iteration_dir"):
                                print(f"\nImproved code saved to: {improvement_results['iteration_dir']}")
                            
                        except Exception as e:
                            logging.error(f"Error improving code: {str(e)}")
                            import traceback
                            traceback.print_exc()
                        
                        sys.exit(0)
                    else:
                        logging.error("VLM evaluation failed")
                        for error in results.get("errors", ["Unknown error"]):
                            logging.error(f"Error: {error}")
                        sys.exit(1)
                    

            except Exception as e:
                logging.error(f"Error in VLM play mode: {str(e)}")
                import traceback

                traceback.print_exc()
                sys.exit(1)

        # Run the async function
        asyncio.run(run_vlm_play())


if __name__ == "__main__":
    main()

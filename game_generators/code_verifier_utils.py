from typing import Dict, Any, List

import logging

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
        feedback = """
<feedback>
We conducted basic tests on the game code. The test checks if the game loads in the browser, followed by an interaction test where the game must start on pressing ENTER, and if gameplay is conducted by pressing control keys without any errors or crashing due to implementation errors.

Here are the error messages:

"""
        # Check for automated testing issues
        has_automated_testing_buttons = False
        automated_testing_passed = True
        
        # Check if automated testing results are available
        if "automated_testing_check" in results:
            has_automated_testing_buttons = results["automated_testing_check"].get("buttons_found", False)
            automated_testing_passed = results["automated_testing_check"].get("test_result", True)
            
        # If automated testing buttons are found but test is failing, add specific feedback
        if has_automated_testing_buttons and not automated_testing_passed:
            feedback += """
AUTOMATED TESTING ISSUES FOUND:
- Automated testing buttons were found, but player information is not changing during testing
- This indicates that the automated test functions are not properly playing the game to result in a change in the player state
- Check your game control mode handlers and ensure the automated testing functions are properly implemented and linked to the game controls

"""

        # Check for game start errors using our dedicated function
        game_start_errors = extract_game_start_errors(results)
        if game_start_errors and not results["interaction_test"].get("test_result", False):
            # Add a special section for game start errors
            feedback += """
GAME START ERRORS FOUND:
- The game did not start properly when pressing ENTER
- This is a critical issue that must be fixed for the game to be playable
"""
            
            # Add gameState errors to feedback
            for error in game_start_errors:
                feedback += f"- {error}\n"
                
            # Add specific advice for gameState errors
            if any("gamestate" in err.lower() or "p." in err.lower() for err in game_start_errors):
                feedback += """
These errors indicate that the game's state management is not working correctly. 
Common causes include:
- The gameState object is not properly initialized before it's accessed
- The 'p' object doesn't exist or doesn't have a gameState property
- There's a timing issue where gameState is accessed before it's ready

Check your game initialization code and ensure gameState is properly set up before the ENTER key is processed.

"""
            
            # Add stack traces for debugging if available
            if ("feedback" in results and 
                "interaction_test" in results["feedback"] and 
                "stack_traces" in results["feedback"]["interaction_test"] and
                results["feedback"]["interaction_test"]["stack_traces"]):
                
                feedback += "STACK TRACES (for debugging):\n"
                stack_traces = results["feedback"]["interaction_test"]["stack_traces"]
                # Include full stack traces, not just the first line
                for trace in stack_traces:
                    if "gamestate" in trace.lower() or "p." in trace.lower():
                        feedback += f"- {trace}\n"
                feedback += "\n"

        # Check if load test failed
        elif not results["load_test"].get("test_result", False):
            feedback += """
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
                        "ReferenceError",
                        "Uncaught",
                        "SyntaxError",
                        "TypeError",
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
                    # Include full stack traces for errors
                    if (
                        "stack_traces" in results["feedback"]["load_test"]
                        and results["feedback"]["load_test"]["stack_traces"]
                    ):
                        feedback += "STACK TRACES (for debugging):\n"
                        for trace in results["feedback"]["load_test"]["stack_traces"]:
                            feedback += f"- {trace}\n"
                        feedback += "\n"

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

            feedback += "Please fix these errors and related errors to make the game playable.\n - The interaction test was not possible. Ensure that the game starts when ENTER is pressed and pressing control keys leads to changes in the game state and update the rendering. Also, check for syntax errors. The game should be playable by pressing ENTER and using control keys to move around after your changes."

        # Check if interaction test failed (but load test passed)
        elif not results["interaction_test"].get("test_result", False):
            feedback += """
The game loads but fails the interaction test. Expected output is that random key presses must change the game state and update the rendered output in the canvas. Following are the error messages: 
"""

            # If automated testing is failing, highlight it again specifically for interaction test failures
            if has_automated_testing_buttons and not automated_testing_passed:
                feedback += """
AUTOMATED TESTING ISSUE:
- The game has automated testing buttons, but the player information is not changing during testing
- This is essential for the game to pass the automated testing check
- Ensure that your automated test functions properly update the player state and the game visual elements

"""

            # Check for game start errors specifically using our extract function
            if not game_start_errors:
                game_start_errors = extract_game_start_errors(results)
                
            if game_start_errors:
                feedback += "GAME START ERRORS FOUND:\n"
                for error in game_start_errors:
                    feedback += f"- {error}\n"
                feedback += "\nThese errors indicate problems with starting the game when pressing ENTER. Fix these first.\n\n"
                
                # Add stack traces related to game start errors
                if ("feedback" in results and 
                    "interaction_test" in results["feedback"] and
                    "stack_traces" in results["feedback"]["interaction_test"] and
                    results["feedback"]["interaction_test"]["stack_traces"]):
                    
                    feedback += "STACK TRACES FOR GAME START ERRORS:\n"
                    for trace in results["feedback"]["interaction_test"]["stack_traces"]:
                        if ("gamestate" in trace.lower() or "p." in trace.lower() or 
                            "enter" in trace.lower() or "game" in trace.lower()):
                            feedback += f"- {trace}\n"
                    feedback += "\n"

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
                    # Include full stack traces for better debugging
                    if (
                        "stack_traces" in results["feedback"]["interaction_test"]
                        and results["feedback"]["interaction_test"]["stack_traces"]
                    ):
                        feedback += "STACK TRACES (for debugging):\n"
                        for trace in results["feedback"]["interaction_test"]["stack_traces"]:
                            feedback += f"- {trace}\n"
                        feedback += "\n"

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
Please consider the possible causes of the error and update the game code to address the feedback to make the game playable.
This only reports the first error that was found which stopped further testing. So, in addition to fixing the error, check for other plausible causes of errors which can lead to similar errors and fix them.
Some of the common causes of errors are: 
- missing imports of variables, functions, or classes
- syntax errors
- referencing undeclared variables
- Uncaught TypeError or ReferenceError because of incorrect variable names or missing imports

</feedback>
"""

        feedback += """
<important>
Be careful while making changes to the code, and make sure you are not introducing any new errors. Game code should be updated to address the feedback. Make sure it loads without errors, starts when ENTER is pressed, and pressing control keys leads to changes in the game state and update the rendering.
"""

        # Add specific instructions for fixing automated testing if needed
        if has_automated_testing_buttons and not automated_testing_passed:
            feedback += """
Also, ensure that the automated testing function properly plays the game to result in a change in the player state. When a test button is clicked and the game is started, the player state should change over time, indicating that the automated testing is working correctly.
"""
            
        feedback += """
</important>"""

    elif mode == "vibe_coding":
        # For vibe_coding mode, the feedback is generated by the CodeFeedbackIterator
        feedback = None

    return feedback

def extract_game_start_errors(results: Dict[str, Any]) -> List[str]:
    """
    Extract all game start related errors from the results.
    
    Args:
        results: Results dictionary from the verification
        
    Returns:
        List of game start errors
    """
    game_start_errors = []
    
    # Check for errors in the game_start_errors category
    if ("feedback" in results and 
        "interaction_test" in results["feedback"] and 
        "game_start_errors" in results["feedback"]["interaction_test"]):
        game_start_errors.extend(results["feedback"]["interaction_test"]["game_start_errors"])
    
    # Check for errors in the specific game_start_test.test_result field
    if ("interaction_test" in results and 
        "interaction_test" in results["interaction_test"] and 
        "game_start_test" in results["interaction_test"]["interaction_test"] and 
        not results["interaction_test"]["interaction_test"]["game_start_test"].get("test_result", True)):
        
        # There was a failure in the game start test, check for any relevant error info
        if "error" in results["interaction_test"]:
            error_msg = results["interaction_test"]["error"]
            if "game did not start" in error_msg.lower() or "pressing enter" in error_msg.lower():
                if error_msg not in game_start_errors:
                    game_start_errors.append(error_msg)
    
    # Check for p.gameState errors in console error messages
    if "interaction_test" in results and "console_error_message" in results["interaction_test"]:
        error_msg = results["interaction_test"]["console_error_message"]
        # Look for common gameState error patterns
        game_state_patterns = [
            "p.gamestate", 
            "gamestate is undefined", 
            "cannot read property", 
            "typeerror",
            "is undefined",
            "null is not an object",
            "enter",
            "game phase",
            "game start"
        ]
        
        # Split by newline to get individual errors
        for line in error_msg.split("\n"):
            if any(pattern in line.lower() for pattern in game_state_patterns):
                if line not in game_start_errors:
                    game_start_errors.append(line)
    
    # Check in console logs directly for game start errors
    if ("interaction_test" in results and 
        "console_logs" in results["interaction_test"]):
        # Patterns that might indicate game start errors
        patterns = [
            "p.gamestate", 
            "gamestate is undefined", 
            "cannot read property", 
            "is undefined",
            "is not defined",
            "enter",
            "game phase",
            "typeError",
            "uncaught",
            "error checking game phase"
        ]
        
        # Check all types of console logs
        for log_type, messages in results["interaction_test"]["console_logs"].items():
            for msg in messages:
                if any(pattern in str(msg).lower() for pattern in patterns):
                    # Format with log type for clarity
                    formatted_msg = f"{log_type}: {msg}" if log_type != "error" else str(msg)
                    if formatted_msg not in game_start_errors:
                        game_start_errors.append(formatted_msg)
    
    # Check for errors in structured_errors
    if ("interaction_test" in results and 
        "structured_errors" in results["interaction_test"]):
        for error in results["interaction_test"]["structured_errors"]:
            msg = error.get("message", "")
            if any(pattern in msg.lower() for pattern in [
                "p.gamestate", "gamestate", "enter", "game phase", "undefined"
            ]):
                if msg not in game_start_errors:
                    game_start_errors.append(msg)
    
    # Check for errors directly in the "error" field
    if "interaction_test" in results and "error" in results["interaction_test"]:
        error_msg = results["interaction_test"]["error"]
        if any(pattern in error_msg.lower() for pattern in [
            "game did not start", "gamestate", "p.", "enter", "pressing enter", "visual change"
        ]):
            if error_msg not in game_start_errors:
                game_start_errors.append(error_msg)
                
    return game_start_errors
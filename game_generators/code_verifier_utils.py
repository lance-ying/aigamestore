from typing import Dict, Any

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
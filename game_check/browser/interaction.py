"""
Interaction utilities for browser-based game testing.
"""

import os
import logging
import random
from typing import Dict, Any, List, Tuple
from playwright.async_api import Page

from .screenshot import save_screenshot, compare_screenshots
from .error_handlers import check_for_error_messages, collect_javascript_errors

# Configure logging for local module
logger = logging.getLogger(__name__)

async def test_key_press(page: Page, key: str, test_name: str, screenshots_dir: str, 
                       frame_counter: int, key_mapping: Dict[str, int]) -> Dict[str, Any]:
    """
    Test a single key press and capture the resulting state.
    
    Args:
        page: Playwright page
        key: Key to press
        test_name: Name of the test
        screenshots_dir: Directory to save screenshots
        frame_counter: Frame counter
        key_mapping: Mapping of keys to key codes
        
    Returns:
        Dictionary with test results
    """
    result = {
        "key": key,
        "test_name": test_name,
        "diff_score": 0,
        "screenshot": "",
    }
    
    try:
        # Ensure the canvas is properly focused before sending key
        await page.evaluate(r"""() => {
            document.body.click();
            const canvas = document.querySelector('canvas');
            if (canvas) {
                if (!canvas.hasAttribute('tabindex')) {
                    canvas.setAttribute('tabindex', '1');
                }
                canvas.focus();
                canvas.click();
            }
        }""")
        
        # Press the key using multiple methods for better reliability
        logging.info(f"Pressing key: {key}")
        
        # Method 1: Standard press
        await page.keyboard.press(key)
        
        # Method 2: Try with down and up events
        await page.keyboard.down(key)
        await page.wait_for_timeout(50)
        await page.keyboard.up(key)
        
        # Method 3: Try sending key via JavaScript for games that use custom event listeners
        key_code = key_mapping.get(key, 0)
        if key_code > 0:
            await page.evaluate(f"""() => {{
                const canvas = document.querySelector('canvas');
                if (canvas) {{
                    const events = ['keydown', 'keypress', 'keyup'];
                    events.forEach(eventType => {{
                        const event = new KeyboardEvent(eventType, {{
                            key: '{key}',
                            keyCode: {key_code},
                            code: '{key}',
                            which: {key_code},
                            bubbles: true,
                            cancelable: true
                        }});
                        canvas.dispatchEvent(event);
                    }});
                }}
            }}""")
                    
        # Wait for visual changes
        await page.wait_for_timeout(50)
        
        # Take a single screenshot after the key press
        screenshot_filename = f"frame_{frame_counter:05d}_action_{key}.png"
        screenshot = await save_screenshot(page, screenshots_dir, screenshot_filename, frame_counter)
        result["screenshot"] = screenshot
        
    except Exception as e:
        logging.error(f"Error testing key {key}: {e}")
        result["error"] = str(e)
        
    return result

async def run_game_start_test(page: Page, screenshots_dir: str, frame_counter: int, 
                            result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the game start test by pressing Enter.
    
    Args:
        page: Playwright page
        screenshots_dir: Directory to save screenshots
        frame_counter: Frame counter
        result: Results dictionary
        
    Returns:
        Updated results dictionary
    """
    # Store errors count before Enter press
    errors_before_enter = len(result["console_logs"]["error"])
    exceptions_before_enter = len(result["js_exceptions"])
    network_errors_before = len(result["network_errors"])
    resource_errors_before = len(result["resource_errors"])
    parse_errors_before = len(result["parse_errors"])
    
    # Press Enter to start the game
    logging.info("Running game start test (pressing Enter)")
    key_mapping = {"Enter": 13}
    start_test = await test_key_press(page, "Enter", "start_game", screenshots_dir, frame_counter, key_mapping)
    result["key_tests"] = [start_test]
    
    # Capture new errors that occurred during Enter press
    enter_console_errors = result["console_logs"]["error"][errors_before_enter:]
    enter_js_exceptions = result["js_exceptions"][exceptions_before_enter:]
    enter_network_errors = result["network_errors"][network_errors_before:]
    enter_resource_errors = result["resource_errors"][resource_errors_before:]
    enter_parse_errors = result["parse_errors"][parse_errors_before:]
    
    # Log all console messages during game start
    logging.info("All console messages during game start (Enter press):")
    for msg_type, messages in result["console_logs"].items():
        # Get only messages added after pressing Enter
        new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
        for msg in new_messages:
            logging.info(f"  - [{msg_type}] {msg}")
    
    # Collect all error messages
    enter_error_messages = []
    for msg in enter_console_errors:
        if "error" in msg.lower():
            enter_error_messages.append(msg)
    
    # Also add all specialized error types to error messages
    enter_error_messages.extend(enter_js_exceptions)
    enter_error_messages.extend(enter_network_errors)
    enter_error_messages.extend(enter_resource_errors)
    enter_error_messages.extend(enter_parse_errors)
    
    # Check for any errors in non-error console messages
    for msg_type, messages in result["console_logs"].items():
        if msg_type == "error":
            continue
        # Get only messages added after pressing Enter
        new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
        for msg in new_messages:
            if "error" in msg.lower():
                enter_error_messages.append(msg)
    
    # If we found any errors, fail the test
    if enter_error_messages:
        result["game_start_test"]["test_result"] = False
        result["game_start_test"]["no_error_messages"] = False
        result["error"] = f"Game start test failed: {len(enter_error_messages)} error messages detected in console after pressing ENTER."
        result["console_error_message"] = "\n".join(enter_error_messages)
        result["test_result"] = False
        return result
    
    # Check for game phase after Enter press
    game_phase_after_enter = None
    game_phase_check_passed = False
    
    try:
        # First check if getGameState function exists
        has_game_state_function = await page.evaluate(r"""() => {
            return typeof getGameState === 'function';
        }""")
        
        if not has_game_state_function:
            logging.warning("getGameState function not found in the game")
            game_phase_check_passed = True
            game_phase_after_enter = "ERROR: getGameState function not found"
        else:
            game_state = await page.evaluate("getGameState()")
            if game_state and isinstance(game_state, dict):
                game_phase_after_enter = game_state.get("gamePhase")
                if game_phase_after_enter == "PLAYING":
                    game_phase_check_passed = True
                else:
                    logging.warning(f"Game phase after Enter is '{game_phase_after_enter}', expected 'PLAYING'")
            else:
                logging.warning(f"getGameState() did not return a valid dictionary. Returned: {game_state}")
                game_phase_after_enter = f"ERROR: Invalid gameState: {game_state}"
    except Exception as e:
        logging.error(f"Error evaluating getGameState(): {e}")
        game_phase_after_enter = f"ERROR: {str(e)}"
    
    result["game_start_test"]["game_phase_after_enter"] = game_phase_after_enter
    result["game_start_test"]["game_phase_check_passed"] = game_phase_check_passed
    
    # Get the diff score if a previous screenshot is provided
    if "initial_screenshot" in result and start_test.get("screenshot"):
        diff_score = compare_screenshots(result["initial_screenshot"], start_test.get("screenshot"))
        start_test["diff_score"] = diff_score
        result["game_start_test"]["diff_score"] = diff_score
        result["game_start_test"]["screenshot"] = start_test.get("screenshot")
        
        # Game start test passes if:
        # 1. Visual changes were detected (diff_score > 0.001)
        # 2. Game phase is correct 
        # 3. No error messages appeared (already checked above)
        result["game_start_test"]["no_error_messages"] = True  # We already checked for errors earlier
        result["game_start_test"]["test_result"] = (
            (diff_score > 0.001) and 
            game_phase_check_passed
        )
        
        if diff_score > 0.001:
            result["visual_changes"] = [{
                "key": "Enter",
                "diff_score": diff_score
            }]
    
    # If game start test failed, set the error message
    if not result["game_start_test"]["test_result"]:
        error_message = "Game did not start on pressing ENTER."
        if "diff_score" in result["game_start_test"] and not (result["game_start_test"]["diff_score"] > 0.001):
            error_message += " No visual change detected after pressing ENTER."
        if not game_phase_check_passed:
            error_message += f" gamePhase was '{game_phase_after_enter}', expected 'PLAYING'."
        result["error"] = error_message.strip()
        result["test_result"] = False
    
    return result

async def run_gameplay_test(page: Page, screenshots_dir: str, frame_counter: int, 
                          result: Dict[str, Any], gameplay_keys: List[str], 
                          key_mapping: Dict[str, int], num_actions: int = 16) -> Dict[str, Any]:
    """
    Run the gameplay test with random key presses.
    
    Args:
        page: Playwright page
        screenshots_dir: Directory to save screenshots
        frame_counter: Frame counter
        result: Results dictionary
        gameplay_keys: List of valid gameplay keys
        key_mapping: Mapping of keys to key codes
        num_actions: Number of random actions to perform
        
    Returns:
        Updated results dictionary
    """
    logging.info(f"Running gameplay test (random key presses, {num_actions} actions)")
    random_action_results = []
    result["gameplay_test"]["diff_scores"] = []
    result["gameplay_test"]["screenshots"] = []
    
    # Get the last screenshot from game start test
    prev_screenshot = result["game_start_test"]["screenshot"]
    
    for i in range(num_actions):
        # Choose a random key from gameplay keys
        random_key = random.choice(gameplay_keys)
        logging.info(f"Random action {i+1}/{num_actions}: Pressing key {random_key}")
        
        # Store previous errors count to check for new ones
        errors_before = len(result["console_logs"]["error"])
        exceptions_before = len(result["js_exceptions"])
        network_errors_before = len(result["network_errors"])
        resource_errors_before = len(result["resource_errors"])
        parse_errors_before = len(result["parse_errors"])
        
        # Test key press
        key_test = await test_key_press(page, random_key, f"random_{i}_{random_key}", 
                                       screenshots_dir, frame_counter + i + 1, key_mapping)
        
        # Calculate diff with previous screenshot
        if prev_screenshot and key_test.get("screenshot"):
            diff_score = compare_screenshots(prev_screenshot, key_test.get("screenshot"))
            key_test["diff_score"] = diff_score
            
            # Add to gameplay test results
            result["gameplay_test"]["diff_scores"].append(diff_score)
            result["gameplay_test"]["screenshots"].append(key_test.get("screenshot"))
            
            if diff_score > 0.001:
                result["visual_changes"].append({
                    "key": random_key,
                    "diff_score": diff_score
                })
            
            # Update previous screenshot for next comparison
            prev_screenshot = key_test.get("screenshot")
        
        # Check game phase after key press
        try:
            # First check if getGameState function exists
            has_game_state_function = await page.evaluate(r"""() => {
                return typeof getGameState === 'function';
            }""")
            
            if has_game_state_function:
                game_state = await page.evaluate("getGameState()")
                if game_state and isinstance(game_state, dict):
                    game_phase = game_state.get("gamePhase")
                    logging.info(f"Current game phase after key {random_key}: {game_phase}")
                    
                    # If game is over, restart it by pressing R followed by Enter
                    if game_phase in ["GAME_OVER_WIN", "GAME_OVER_LOSS"]:
                        logging.info(f"Game over detected ({game_phase}), restarting game...")
                        
                        # Press R to restart
                        await test_key_press(page, "r", f"restart_r_{i}", 
                                            screenshots_dir, frame_counter + i + 2, key_mapping)
                        await page.wait_for_timeout(50)
                        
                        # Press Enter to confirm restart
                        restart_key_test = await test_key_press(page, "Enter", f"restart_enter_{i}", 
                                                              screenshots_dir, frame_counter + i + 3, key_mapping)
                        await page.wait_for_timeout(100)
                        
                        # Update previous screenshot after restart
                        if restart_key_test.get("screenshot"):
                            prev_screenshot = restart_key_test.get("screenshot")
                        
                        # Record this restart action
                        random_action_info = {
                            "action_index": i,
                            "key": f"{random_key} (triggered game over: {game_phase})",
                            "restart_performed": True,
                            "screenshot": key_test.get("screenshot"),
                            "diff_score": key_test.get("diff_score", 0),
                            "new_errors": [],
                            "has_errors": False
                        }
                        random_action_results.append(random_action_info)
                        
                        # Continue to next random action
                        continue
        except Exception as e:
            # Just log the error and continue with testing if game state check fails
            logging.warning(f"Error checking game phase: {e}")
        
        # Check for new errors of all types
        new_errors = result["console_logs"]["error"][errors_before:]
        new_exceptions = result["js_exceptions"][exceptions_before:]
        new_network_errors = result["network_errors"][network_errors_before:]
        new_resource_errors = result["resource_errors"][resource_errors_before:]
        new_parse_errors = result["parse_errors"][parse_errors_before:]
        
        has_new_errors = (
            len(new_errors) > 0 or 
            len(new_exceptions) > 0 or
            len(new_network_errors) > 0 or
            len(new_resource_errors) > 0 or
            len(new_parse_errors) > 0
        )
        
        # Log new errors for debugging
        if has_new_errors:
            logging.info(f"Console messages and errors during key press '{random_key}':")
            for msg in new_errors:
                logging.info(f"  - [error] {msg}")
            for msg in new_exceptions:
                logging.error(f"  - [exception] {msg}")
            for msg in new_network_errors:
                logging.error(f"  - [network] {msg}")
            for msg in new_resource_errors:
                logging.error(f"  - [resource] {msg}")
            for msg in new_parse_errors:
                logging.error(f"  - [parse] {msg}")
        
        # Combine all errors for this action
        all_new_errors = (
            new_errors + 
            new_exceptions + 
            new_network_errors + 
            new_resource_errors + 
            new_parse_errors
        )
        
        # Add to action results
        random_action_info = {
            "action_index": i,
            "key": random_key,
            "screenshot": key_test.get("screenshot"),
            "diff_score": key_test.get("diff_score", 0),
            "new_errors": all_new_errors,
            "has_errors": has_new_errors
        }
        
        # If this key press generated errors, mark it as failed and log the errors
        if has_new_errors:
            error_messages = []
            for msg in new_errors:
                if "error" in msg.lower():
                    error_messages.append(msg)
            # Add all specialized error types
            error_messages.extend(new_exceptions)
            error_messages.extend(new_network_errors)
            error_messages.extend(new_resource_errors)
            error_messages.extend(new_parse_errors)
            
            if error_messages:
                random_action_info["test_result"] = False
                random_action_info["console_error_message"] = "\n".join(error_messages)
                logging.error(f"Errors detected during key press '{random_key}':")
                for err in error_messages:
                    logging.error(f"  - {err}")
        
        random_action_results.append(random_action_info)
        
        # Wait between actions
        await page.wait_for_timeout(50)
    
    # Add random action results to the overall results
    result["random_actions"] = random_action_results
    
    # Determine if gameplay test passed (any key press caused visual change)
    non_zero_diffs = [score for score in result["gameplay_test"]["diff_scores"] if score > 0.001]
    result["gameplay_test"]["test_result"] = len(non_zero_diffs) > 0
    
    if not result["gameplay_test"]["test_result"]:
        result["error"] = "Gameplay test failed: No key presses produced visual changes during gameplay"
        result["test_result"] = False
        
        # Include all error types if available
        all_errors = (
            result["console_logs"]["error"] + 
            result["js_exceptions"] + 
            result["network_errors"] + 
            result["resource_errors"] + 
            result["parse_errors"]
        )
        
        if all_errors:
            result["console_error_message"] = "\n".join(all_errors)
    
    # Find key presses that generated errors
    key_presses_with_errors = [action for action in random_action_results if action.get("has_errors", False)]
    
    # If there were any errors during key presses, mark the test as failed
    if key_presses_with_errors:
        result["error"] = f"Errors detected during {len(key_presses_with_errors)} key press(es)"
        result["test_result"] = False
        
        # Add information about key presses that caused errors
        result["key_presses_with_errors"] = [
            {"key": action["key"], "index": action["action_index"]} 
            for action in key_presses_with_errors
        ]
    else:
        # Check if there are any console errors overall
        console_errors = []
        for msg_type, messages in result["console_logs"].items():
            for msg in messages:
                if "error" in msg.lower():
                    console_errors.append(msg)
        
        # Add all specialized error types
        console_errors.extend(result["js_exceptions"])
        console_errors.extend(result["network_errors"])
        console_errors.extend(result["resource_errors"])
        console_errors.extend(result["parse_errors"])
        
        no_console_errors = len(console_errors) == 0
        
        # Overall test passes if both game start and gameplay tests pass and there are no errors
        result["test_result"] = (
            no_console_errors and 
            result["game_start_test"]["test_result"] and 
            result["gameplay_test"]["test_result"]
        )
    
        # If test failed due to errors, include them in dedicated field
        if not result["test_result"] and not no_console_errors:
            result["console_error_message"] = "\n".join(console_errors)
    
    # Add summary information
    result["summary"] = {
        "game_start_test": result["game_start_test"]["test_result"],
        "gameplay_test": result["gameplay_test"]["test_result"],
        "no_console_errors": not bool(console_errors if 'console_errors' in locals() else []),
        "overall_result": result["test_result"]
    }
    
    return result 
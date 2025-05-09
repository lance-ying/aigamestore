import os
import time
import logging
import asyncio
import subprocess
import random
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image, ImageChops

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright, Page, ConsoleMessage

    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False


class GameBrowserController:
    """
    Class to manage headless browser interactions for game testing.
    """
    def __init__(self, game_path: str, port: int = 8000):
        self.game_path = game_path
        self.port = port
        self.server_process = None
        self.enabled = HEADLESS_BROWSER_ENABLED
        self.is_html_file = os.path.isfile(game_path) and game_path.lower().endswith('.html')
        self.frame_counter = 0  # Add frame counter for screenshots
        self.allowed_keys = {
            "Arrow": [37, 38, 39, 40],  # Left, Up, Right, Down
            "Space": [32],
            "Shift": [16],
            "KeyZ": [90],
            "Enter": [13],
            "KeyR": [82]
        }
        self.key_mapping = {
            "ArrowLeft": 37,
            "ArrowUp": 38,
            "ArrowRight": 39,
            "ArrowDown": 40,
            " ": 32,
            "Shift": 16,
            "z": 90,
            "Enter": 13,
            "r": 82
        }
        # List of gameplay keys (all allowed keys except 'r' and 'Enter')
        self.gameplay_keys = [
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            " ", "Shift", "z"
        ]
        
    async def __aenter__(self):
        if not self.enabled:
            logging.warning("Headless browser is not enabled. Install playwright with: "
                           "pip install playwright && python -m playwright install --with-deps chromium")
            return self
            
        try:
            # If it's a single HTML file, we don't need to start a server
            if self.is_html_file:
                logging.info(f"Game path is a single HTML file: {self.game_path}")
                return self
                
            # Start a simple HTTP server to serve the game files
            self.server_process = subprocess.Popen(
                ["python", "-m", "http.server", str(self.port)],
                cwd=self.game_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            logging.info(f"Started HTTP server on port {self.port}")
            
            # Allow server to start
            await asyncio.sleep(1)
            return self
        except Exception as e:
            logging.error(f"Error starting server: {e}")
            if self.server_process:
                self.server_process.terminate()
                self.server_process = None
            raise
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.server_process:
            self.server_process.terminate()
            logging.info("HTTP server terminated")
    
    async def check_game_loads(self) -> Dict[str, Any]:
        """
        Checks if the game loads correctly without errors.
        
        Returns:
            Dictionary with test results
        """
        if not self.enabled:
            return {
                "test_result": False,
                "error": "Headless browser not enabled. Install playwright."
            }
            
        if not self.is_html_file and not self.server_process:
            return {
                "test_result": False,
                "error": "Server not running. Use within 'async with' context."
            }
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        load_results = await self._run_load_check(url)
        
        # Format the results to be more consistent with interaction test
        final_results = {
            "test_result": load_results["test_result"],
            "load_test": {
                "test_result": load_results["test_result"],
                "canvas_found": load_results["canvas_found"],
                "canvas_count": load_results.get("canvas_count", 0),
                "page_title": load_results.get("page_title", "")
            },
            "console_logs": load_results["console_logs"],
            "console_errors": load_results["console_errors"],  # For backwards compatibility
            "screenshots": load_results["screenshots"],
            "error": load_results.get("error", None)
        }
        
        # Add console error message if present
        if "console_error_message" in load_results:
            final_results["console_error_message"] = load_results["console_error_message"]
            
        return final_results
            
    async def _run_load_check(self, url: str) -> Dict[str, Any]:
        """
        Loads the game and checks for console errors.
        
        Args:
            url: URL to the game
            
        Returns:
            Dictionary with test results
        """
        result = {
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
            "canvas_found": False,
            "screenshots": []
        }
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(os.path.dirname(self.game_path), "game_check_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            
            # Capture console logs and errors
            page = await context.new_page()
            
            # Listen for all console messages
            async def handle_console(msg: ConsoleMessage):
                msg_type = msg.type.lower()
                msg_text = f"{msg.text}"
                
                # Store in the appropriate category
                if msg_type in result["console_logs"]:
                    result["console_logs"][msg_type].append(msg_text)
                else:
                    result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
                
                # Also store errors in the legacy field for backwards compatibility
                if msg_type == "error":
                    result["console_errors"].append(f"error: {msg_text}")
                
                # Log to Python console for debugging
                log_level = logging.INFO if msg_type != "error" else logging.ERROR
                logging.log(log_level, f"Browser console {msg_type}: {msg_text}")
            
            page.on("console", handle_console)
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                screenshot_path = await self._save_screenshot(page, screenshots_dir, "state_initial_load.png")
                if screenshot_path:
                    result["screenshots"].append(screenshot_path)
                
                # Check for canvas elements
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                result["canvas_found"] = canvas_count > 0
                result["canvas_count"] = canvas_count
                
                # Look for "error" in any console message type
                has_error_messages = False
                error_messages = []
                
                for msg_type, messages in result["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            has_error_messages = True
                            error_messages.append(msg)
                
                # Test passes if there are no errors and at least one canvas is found
                result["test_result"] = not has_error_messages and result["canvas_found"]
                
                # If test failed due to console errors, include them in a dedicated field
                if not result["test_result"] and has_error_messages:
                    result["console_error_message"] = "\n".join(error_messages)
                    result["error"] = f"Game load test failed: {len(error_messages)} error messages detected in console."
                    
                    # Log the errors
                    logging.error("Console errors during game load:")
                    for err in error_messages:
                        logging.error(f"  - {err}")
                elif not result["test_result"] and not result["canvas_found"]:
                    result["error"] = "Game load test failed: No canvas element found."
                
                # Add additional information
                result["page_title"] = await page.title()
                
            except Exception as e:
                logging.error(f"Error in browser interaction: {e}")
                result["error"] = f"Browser interaction error: {e}"
            finally:
                await browser.close()
                
        return result
    
    async def _save_screenshot(self, page: Page, directory: str, filename: str) -> str:
        """Save a screenshot and return the path."""
        try:
            # Add frame prefix to filename
            prefixed_filename = filename
            self.frame_counter += 1  # Increment frame counter
            
            # Capture full page screenshot to a temporary file
            temp_path = os.path.join(directory, "temp_screenshot.png")
            await page.screenshot(path=temp_path, full_page=True)
            
            # Resize the image to save space (by a factor of 4)
            full_path = os.path.join(directory, prefixed_filename)
            with Image.open(temp_path) as img:
                # Calculate new size (1/4 of original)
                new_width = img.width // 4
                new_height = img.height // 4
                # Resize the image
                resized_img = img.resize((new_width, new_height), Image.LANCZOS)
                # Save resized image
                resized_img.save(full_path)
                
            # Remove temporary file
            os.remove(temp_path)
            
            logging.info(f"Screenshot saved to {full_path} (resized by factor of 4)")
            return full_path
        except Exception as e:
            logging.error(f"Error saving screenshot: {e}")
            return ""
    
    async def test_game_interaction(self) -> Dict[str, Any]:
        """
        Tests game interaction by starting the game and performing random actions.
        
        Returns:
            Dictionary with test results
        """
        if not self.enabled:
            return {
                "test_result": False,
                "error": "Headless browser not enabled. Install playwright."
            }
            
        if not self.is_html_file and not self.server_process:
            return {
                "test_result": False,
                "error": "Server not running. Use within 'async with' context."
            }
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        interaction_results = await self._test_interaction(url)
        
        # Structure the final results to show game start and random action tests separately
        final_results = {
            "test_result": interaction_results["test_result"],
            "interaction_test": {
                "overall_result": interaction_results["test_result"],
                "game_start_test": {
                    "test_result": interaction_results["game_start_test"]["test_result"],
                    "diff_score": interaction_results["game_start_test"]["diff_score"],
                    "screenshot": interaction_results["game_start_test"]["screenshot"]
                },
                "gameplay_test": {
                    "test_result": interaction_results["gameplay_test"]["test_result"],
                    "key_changes_detected": len([score for score in interaction_results["gameplay_test"]["diff_scores"] if score > 0.001]),
                    "total_actions": len(interaction_results["gameplay_test"]["diff_scores"]),
                    "max_diff_score": max(interaction_results["gameplay_test"]["diff_scores"]) if interaction_results["gameplay_test"]["diff_scores"] else 0
                }
            },
            "console_logs": interaction_results["console_logs"],
            "console_errors": interaction_results["console_errors"],  # For backwards compatibility
            "screenshots": interaction_results["screenshots"],
            "error": interaction_results.get("error", None)
        }
        
        # Add console error message if present
        if "console_error_message" in interaction_results:
            final_results["console_error_message"] = interaction_results["console_error_message"]
        
        # Add key presses with errors information if available
        if "key_presses_with_errors" in interaction_results:
            final_results["key_presses_with_errors"] = interaction_results["key_presses_with_errors"]
        
        # Add game phase information to game_start_test results if available
        if "game_phase_after_enter" in interaction_results["game_start_test"]:
            final_results["interaction_test"]["game_start_test"]["game_phase_after_enter"] = interaction_results["game_start_test"]["game_phase_after_enter"]
            final_results["interaction_test"]["game_start_test"]["game_phase_check_passed"] = interaction_results["game_start_test"]["game_phase_check_passed"]
        
        # Add the detailed results if available
        if "random_actions" in interaction_results:
            final_results["interaction_test"]["gameplay_test"]["detailed_actions"] = interaction_results["random_actions"]
        
        return final_results
    
    async def _test_interaction(self, url: str) -> Dict[str, Any]:
        """
        Tests game interaction with ENTER and random key presses.
        
        Args:
            url: URL to the game
            
        Returns:
            Dictionary with test results
        """
        result = {
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
            "visual_changes": [],
            "key_tests": [],
            "screenshots": [],
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
        }
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(os.path.dirname(self.game_path), "game_check_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Listen for all console messages
            async def handle_console(msg: ConsoleMessage):
                msg_type = msg.type.lower()
                msg_text = f"{msg.text}"
                
                # Store in the appropriate category
                if msg_type in result["console_logs"]:
                    result["console_logs"][msg_type].append(msg_text)
                else:
                    result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
                
                # Also store errors in the legacy field for backwards compatibility
                if msg_type == "error":
                    result["console_errors"].append(f"error: {msg_text}")
                
                # Log to Python console for debugging
                log_level = logging.INFO if msg_type != "error" else logging.ERROR
                logging.log(log_level, f"Browser console {msg_type}: {msg_text}")
            
            page.on("console", handle_console)
            
            try:
                # Navigate to the page and wait for network to be idle
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_filename = f"frame_{self.frame_counter:05d}_initial.png"
                initial_screenshot = await self._save_screenshot(page, screenshots_dir, initial_filename)
                if initial_screenshot:
                    result["screenshots"].append(initial_screenshot)
                
                # Store previous screenshot for diff computation
                prev_screenshot = initial_screenshot
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if canvas_count == 0:
                    result["error"] = "No canvas element found"
                    result["test_result"] = False
                    return result
                
                # --- GAME START TEST ---
                logging.info("Running game start test (pressing Enter)")
                
                # Store logs count before Enter press to check for new ones
                errors_before_enter = len(result["console_logs"]["error"])
                
                # Start game with ENTER key
                start_test = await self._test_key_press(page, "Enter", "start_game", screenshots_dir)
                result["key_tests"].append(start_test)
                
                # Capture new console errors that occurred during Enter press
                enter_console_errors = result["console_logs"]["error"][errors_before_enter:]
                
                # Check for error messages during game start
                enter_error_messages = []
                for msg in enter_console_errors:
                    if "error" in msg.lower():
                        enter_error_messages.append(msg)
                
                # Check for error messages in any console logs (not just error type)
                for msg_type, messages in result["console_logs"].items():
                    # Skip the error type as we already processed it above
                    if msg_type == "error":
                        continue
                    # Get only messages added after pressing Enter
                    new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
                    for msg in new_messages:
                        if "error" in msg.lower():
                            enter_error_messages.append(msg)
                
                # If we found any errors during Enter press, fail the test immediately
                if enter_error_messages:
                    result["game_start_test"]["test_result"] = False
                    result["game_start_test"]["no_error_messages"] = False
                    result["error"] = f"Game start test failed: {len(enter_error_messages)} error messages detected in console after pressing ENTER."
                    result["console_error_message"] = "\n".join(enter_error_messages)
                    logging.error("Console errors during game start:")
                    for err in enter_error_messages:
                        logging.error(f"  - {err}")
                    result["test_result"] = False
                    return result
                
                game_phase_after_enter = None
                game_phase_check_passed = False
                
                # Calculate diff with previous screenshot
                if prev_screenshot and start_test.get("screenshot"):
                    diff_score = self._compare_screenshots(prev_screenshot, start_test.get("screenshot"))
                    start_test["diff_score"] = diff_score
                    
                    # Update game start test results
                    result["game_start_test"]["diff_score"] = diff_score
                    result["game_start_test"]["screenshot"] = start_test.get("screenshot")
                    
                    # Check gamePhase after pressing Enter
                    try:
                        # First check if getGameState function exists
                        has_game_state_function = await page.evaluate("""() => {
                            return typeof getGameState === 'function';
                        }""")
                        
                        if not has_game_state_function:
                            logging.error("getGameState function not found in the game")
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
                        result["visual_changes"].append({
                            "key": "Enter",
                            "diff_score": diff_score
                        })
                    
                    # Update previous screenshot for next comparison
                    prev_screenshot = start_test.get("screenshot")
                
                # Update the conditional that checks if game started successfully
                if not result["game_start_test"]["test_result"]:
                    error_message = "Game start test failed:"
                    if not (diff_score > 0.001):
                        error_message += " No visual change detected after pressing ENTER."
                    if not game_phase_check_passed:
                        error_message += f" gamePhase was '{game_phase_after_enter}', expected 'PLAYING'."
                    result["error"] = error_message.strip()
                    
                    result["test_result"] = False
                    return result
                
                # --- GAMEPLAY TEST ---
                logging.info("Running gameplay test (random key presses)")
                
                # Now perform random actions for gameplay test
                logging.info("Starting random action sequence (16 actions)")
                random_action_results = []
                
                for i in range(16):
                    # Choose a random key from gameplay keys
                    random_key = random.choice(self.gameplay_keys)
                    logging.info(f"Random action {i+1}/16: Pressing key {random_key}")
                    
                    # Store previous errors count to check for new ones
                    errors_before = len(result["console_logs"]["error"])
                    
                    # Test key press
                    key_test = await self._test_key_press(page, random_key, f"random_{i}_{random_key}", screenshots_dir)
                    
                    # Calculate diff with previous screenshot
                    if prev_screenshot and key_test.get("screenshot"):
                        diff_score = self._compare_screenshots(prev_screenshot, key_test.get("screenshot"))
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
                    
                    # Check for new console errors
                    new_errors = result["console_logs"]["error"][errors_before:]
                    has_new_errors = len(new_errors) > 0
                    
                    # Add to action results
                    random_action_info = {
                        "action_index": i,
                        "key": random_key,
                        "screenshot": key_test.get("screenshot"),
                        "diff_score": key_test.get("diff_score", 0),
                        "new_errors": new_errors,
                        "has_errors": has_new_errors
                    }
                    
                    # If this key press generated console errors, mark it as failed and log the errors
                    if has_new_errors:
                        error_messages = []
                        for msg in new_errors:
                            if "error" in msg.lower():
                                error_messages.append(msg)
                        
                        if error_messages:
                            random_action_info["test_result"] = False
                            random_action_info["console_error_message"] = "\n".join(error_messages)
                            logging.error(f"Console errors detected during key press '{random_key}':")
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
                    
                    # Include console error messages if available
                    if result["console_logs"]["error"]:
                        result["console_error_message"] = "\n".join(result["console_logs"]["error"])
                
                # Check for console errors in the entire test
                console_errors = []
                for msg_type, messages in result["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            console_errors.append(msg)
                
                no_console_errors = len(console_errors) == 0
                
                # Find key presses that generated errors
                key_presses_with_errors = [action for action in random_action_results if action.get("has_errors", False)]
                
                # If there were any console errors during key presses, mark the test as failed
                if key_presses_with_errors:
                    result["error"] = f"Console errors detected during {len(key_presses_with_errors)} key press(es)"
                    result["test_result"] = False
                    
                    # Include all console error messages
                    if console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                    
                    # Add information about key presses that caused errors
                    result["key_presses_with_errors"] = [
                        {"key": action["key"], "index": action["action_index"]} 
                        for action in key_presses_with_errors
                    ]
                else:
                    # Overall test passes if both game start and gameplay tests pass and there are no console errors
                    result["test_result"] = (
                        no_console_errors and 
                        result["game_start_test"]["test_result"] and 
                        result["gameplay_test"]["test_result"]
                    )
                
                    # If test failed due to console errors, include them in dedicated field
                    if not result["test_result"] and not no_console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                
                # Add summary information
                result["summary"] = {
                    "game_start_test": result["game_start_test"]["test_result"],
                    "gameplay_test": result["gameplay_test"]["test_result"],
                    "no_console_errors": no_console_errors,
                    "overall_result": result["test_result"]
                }
                
            except Exception as e:
                logging.error(f"Error in game interaction test: {e}")
                result["error"] = f"Game interaction test error: {e}"
            finally:
                await browser.close()
                
        return result
    
    async def _test_key_press(self, page: Page, key: str, test_name: str, screenshots_dir: str) -> Dict[str, Any]:
        """
        Test a single key press and capture the resulting state
        
        Args:
            page: Playwright page
            key: Key to press
            test_name: Name of the test
            screenshots_dir: Directory to save screenshots
            
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
            await page.evaluate("""() => {
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
            key_code = self.key_mapping.get(key, 0)
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
            screenshot_filename = f"frame_{self.frame_counter:05d}_action_{key}.png"
            screenshot = await self._save_screenshot(page, screenshots_dir, screenshot_filename)
            result["screenshot"] = screenshot
            
        except Exception as e:
            logging.error(f"Error testing key {key}: {e}")
            result["error"] = str(e)
            
        return result
    
    def _compare_screenshots(self, before_path: str, after_path: str) -> float:
        """
        Compare two screenshots and calculate a difference score.
        
        Args:
            before_path: Path to before screenshot
            after_path: Path to after screenshot
            
        Returns:
            diff_score: float between 0 and 1, where 0 is no difference and 1 is completely different
        """
        try:
            # Open images
            before_img = Image.open(before_path)
            after_img = Image.open(after_path)
            
            # Ensure same size for comparison
            if before_img.size != after_img.size:
                # Resize the smaller image to match the larger one
                if before_img.size[0] * before_img.size[1] < after_img.size[0] * after_img.size[1]:
                    before_img = before_img.resize(after_img.size, Image.Resampling.LANCZOS)
                else:
                    after_img = after_img.resize(before_img.size, Image.Resampling.LANCZOS)
            
            # Calculate difference
            diff_img = ImageChops.difference(before_img, after_img)
            
            # Calculate difference score (0 to 1)
            diff_gray = diff_img.convert('L')  # Convert to grayscale
            total_pixels = diff_gray.size[0] * diff_gray.size[1]
            diff_pixels = sum(1 for pixel in diff_gray.getdata() if pixel > 0)
            diff_score = diff_pixels / total_pixels
            
            return diff_score
            
        except Exception as e:
            logging.error(f"Error comparing screenshots: {e}")
            return 0 
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
    from playwright.async_api import async_playwright, Page

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
            "KeyQ": [81],
            "KeyZ": [90],
            "KeyX": [88],
            "KeyC": [67],
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
            "q": 81,
            "z": 90,
            "x": 88,
            "c": 67,
            "Enter": 13,
            "r": 82
        }
        # List of gameplay keys (all allowed keys except 'r' and 'Enter')
        self.gameplay_keys = [
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            " ", "Shift", "q", "z", "x", "c"
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
            
        return await self._run_load_check(url)
    
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
            "console_errors": [],
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
            
            # Listen for console messages
            page.on("console", lambda msg: result["console_errors"].append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=30000)
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
                
                # Test is successful if there are no console errors and at least one canvas is found
                result["test_result"] = len([err for err in result["console_errors"] if "error" in err.lower()]) == 0 and result["canvas_found"]
                
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
            "console_errors": interaction_results["console_errors"],
            "screenshots": interaction_results["screenshots"],
            "error": interaction_results.get("error", None)
        }
        
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
            "console_errors": [],
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
            
            # Listen for console messages
            page.on("console", lambda msg: result["console_errors"].append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            
            try:
                # Navigate to the page and wait for network to be idle
                await page.goto(url, wait_until="networkidle", timeout=30000)
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
                
                # Start game with ENTER key
                start_test = await self._test_key_press(page, "Enter", "start_game", screenshots_dir)
                result["key_tests"].append(start_test)
                
                # Calculate diff with previous screenshot
                if prev_screenshot and start_test.get("screenshot"):
                    diff_score = self._compare_screenshots(prev_screenshot, start_test.get("screenshot"))
                    start_test["diff_score"] = diff_score
                    
                    # Update game start test results
                    result["game_start_test"]["diff_score"] = diff_score
                    result["game_start_test"]["screenshot"] = start_test.get("screenshot")
                    result["game_start_test"]["test_result"] = diff_score > 0.001
                    
                    if diff_score > 0.001:
                        result["visual_changes"].append({
                            "key": "Enter",
                            "diff_score": diff_score
                        })
                    
                    # Update previous screenshot for next comparison
                    prev_screenshot = start_test.get("screenshot")
                
                # Check if game started successfully
                if not result["game_start_test"]["test_result"]:
                    result["error"] = "Game start test failed: No visual change detected after pressing ENTER"
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
                    errors_before = len(result["console_errors"])
                    
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
                    new_errors = result["console_errors"][errors_before:]
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
                    
                    random_action_results.append(random_action_info)
                    
                    # Wait between actions
                    await page.wait_for_timeout(30)
                
                # Add random action results to the overall results
                result["random_actions"] = random_action_results
                
                # Determine if gameplay test passed (any key press caused visual change)
                non_zero_diffs = [score for score in result["gameplay_test"]["diff_scores"] if score > 0.001]
                result["gameplay_test"]["test_result"] = len(non_zero_diffs) > 0
                
                if not result["gameplay_test"]["test_result"]:
                    result["error"] = "Gameplay test failed: No key presses produced visual changes during gameplay"
                    result["test_result"] = False
                    return result
                
                # Check for console errors
                no_console_errors = len([err for err in result["console_errors"] if "error" in err.lower()]) == 0
                
                # Overall test passes if both game start and gameplay tests pass and there are no console errors
                result["test_result"] = (
                    no_console_errors and 
                    result["game_start_test"]["test_result"] and 
                    result["gameplay_test"]["test_result"]
                )
                
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
            await page.wait_for_timeout(30)
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
            await page.wait_for_timeout(30)
            
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
"""
Main controller for browser-based game testing.
"""

import os
import asyncio
import subprocess
import logging
from typing import Dict, Any

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright, Page

    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False

from .utils import setup_screenshots_dir, get_url_for_game, initialize_results_dict, initialize_interaction_results_dict
from .error_handlers import setup_page_error_handlers, inject_error_detection_script, early_error_detection_script
from .error_handlers import syntax_check_script, collect_javascript_errors, check_for_error_messages
from .screenshot import save_screenshot, compare_screenshots
from .interaction import test_key_press, run_game_start_test, run_gameplay_test

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

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
        
        # Key mappings for game controls
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
    
    def _prepare_feedback_data(self, load_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepares the feedback dictionary with stack traces for BasicTesting class.
        
        Args:
            load_results: Results dictionary from the test
            
        Returns:
            Updated dictionary with feedback field containing stack traces
        """
        # Initialize feedback field if not present
        if "feedback" not in load_results:
            load_results["feedback"] = {}
            
        # Create load_test feedback section
        if "load_test" not in load_results["feedback"]:
            load_results["feedback"]["load_test"] = {}
            
        # Add stack traces to feedback
        if "stack_traces" in load_results and load_results["stack_traces"]:
            load_results["feedback"]["load_test"]["stack_traces"] = load_results["stack_traces"]
            
        # Add any module errors if available
        if "module_errors" in load_results:
            load_results["feedback"]["load_test"]["module_errors"] = load_results["module_errors"]
            
        # Add any undefined vars if available
        if "undefined_vars" in load_results:
            load_results["feedback"]["load_test"]["undefined_vars"] = load_results["undefined_vars"]
            
        # Add errors from console logs
        if "console_logs" in load_results and "error" in load_results["console_logs"]:
            load_results["feedback"]["load_test"]["errors"] = load_results["console_logs"]["error"]
            
        # Add any syntax errors
        if "parse_errors" in load_results and load_results["parse_errors"]:
            load_results["feedback"]["load_test"]["syntax_errors"] = load_results["parse_errors"]
            
        return load_results
    
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
            
        # Get URL based on game path
        url = get_url_for_game(self.game_path, self.port, self.is_html_file)
        
        # Run the load check
        load_results = await self._run_load_check(url)
        
        # Prepare feedback data for BasicTesting class
        load_results = self._prepare_feedback_data(load_results)
        
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
            "error": load_results.get("error", None),
            "feedback": load_results.get("feedback", {})
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
        # Initialize results dictionary
        result = initialize_results_dict()
        
        # Set up screenshots directory
        screenshots_dir = setup_screenshots_dir(self.game_path)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            
            # Add a special route to intercept HTML and inject early error detection
            async def intercept_html(route, request):
                response = await route.fetch()
                content_type = response.headers.get('content-type', '')
                
                if 'text/html' in content_type:
                    # Get original HTML content
                    html = await response.text()
                    
                    # Insert our script for early error detection
                    head_pos = html.find('<head>')
                    if head_pos >= 0:
                        html = html[:head_pos+6] + f'<script>{early_error_detection_script()}</script>' + html[head_pos+6:]
                    else:
                        # If no head tag, try to insert at the start of body or html
                        body_pos = html.find('<body>')
                        if body_pos >= 0:
                            html = html[:body_pos+6] + f'<script>{early_error_detection_script()}</script>' + html[body_pos+6:]
                        else:
                            html_pos = html.find('<html>')
                            if html_pos >= 0:
                                html = html[:html_pos+6] + f'<script>{early_error_detection_script()}</script>' + html[html_pos+6:]
                    
                    await route.fulfill(
                        status=response.status,
                        headers={**response.headers, 'content-length': str(len(html))},
                        body=html
                    )
                else:
                    await route.continue_()
            
            # Apply the HTML interception
            await context.route('**/*.html', intercept_html)
            await context.route(url, intercept_html)
            
            # Create a new page
            page = await context.new_page()
            
            # Enable verbose logging for all browser operations
            page.on("console", lambda msg: logging.info(f"CONSOLE: {msg.type} - {msg.text}"))
            
            # Set up all error handlers
            await setup_page_error_handlers(page, result)
            
            # Inject custom error detection script
            await page.evaluate(inject_error_detection_script())
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded and run our custom error checker
                await page.wait_for_timeout(2000)
                
                # Run syntax check script
                await page.evaluate(syntax_check_script())
                
                # Take initial screenshot
                screenshot_path = await save_screenshot(
                    page, screenshots_dir, "state_initial_load.png", self.frame_counter)
                if screenshot_path:
                    result["screenshots"].append(screenshot_path)
                
                # Check for canvas elements
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                result["canvas_found"] = canvas_count > 0
                result["canvas_count"] = canvas_count
                
                # Collect any JavaScript errors that occurred
                await collect_javascript_errors(page, result)
                
                # Check if there were any error messages
                has_error_messages = check_for_error_messages(result)
                
                # Test passes if there are no errors and at least one canvas is found
                result["test_result"] = not has_error_messages and result["canvas_found"]
                
                # If test failed, add appropriate error message
                if not result["test_result"]:
                    if has_error_messages:
                        result["error"] = f"Game load test failed: Errors detected during load."
                    elif not result["canvas_found"]:
                        result["error"] = "Game load test failed: No canvas element found."
                
                # Add additional information
                result["page_title"] = await page.title()
                
            except Exception as e:
                logging.error(f"Error in browser interaction: {e}")
                result["error"] = f"Browser interaction error: {e}"
            finally:
                await browser.close()
                
        return result
    
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
            
        # Get URL based on game path
        url = get_url_for_game(self.game_path, self.port, self.is_html_file)
        
        # Initialize interaction results dictionary
        result = initialize_interaction_results_dict()
        
        # Set up screenshots directory
        screenshots_dir = setup_screenshots_dir(self.game_path)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Set up all error handlers
            await setup_page_error_handlers(page, result)
            
            # Inject custom error detection script
            await page.evaluate(inject_error_detection_script())
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_filename = f"frame_{self.frame_counter:05d}_initial.png"
                initial_screenshot = await save_screenshot(
                    page, screenshots_dir, initial_filename, self.frame_counter)
                if initial_screenshot:
                    result["screenshots"].append(initial_screenshot)
                    result["initial_screenshot"] = initial_screenshot
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if canvas_count == 0:
                    result["error"] = "No canvas element found"
                    result["test_result"] = False
                    return result
                
                # Run game start test (press Enter)
                self.frame_counter += 1
                await run_game_start_test(page, screenshots_dir, self.frame_counter, result)
                
                # If game start test failed, return now
                if not result["game_start_test"]["test_result"]:
                    # Prepare feedback data before returning
                    result = self._prepare_interaction_feedback(result)
                    return result
                
                # Run gameplay test with random actions
                self.frame_counter += 1
                await run_gameplay_test(
                    page, screenshots_dir, self.frame_counter, result, 
                    self.gameplay_keys, self.key_mapping)
                
                # Collect any JavaScript errors that occurred
                await collect_javascript_errors(page, result)
                
                # Prepare feedback data before returning
                result = self._prepare_interaction_feedback(result)
                return result
                
            except Exception as e:
                logging.error(f"Error in game interaction test: {e}")
                result["error"] = f"Game interaction test error: {e}"
                return result
            finally:
                await browser.close()
    
    def _prepare_interaction_feedback(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepares the interaction feedback data for BasicTesting class.
        
        Args:
            result: Result dictionary from interaction test
            
        Returns:
            Updated result dictionary with feedback field
        """
        # Initialize feedback field if not present
        if "feedback" not in result:
            result["feedback"] = {}
            
        # Create interaction_test feedback section
        if "interaction_test" not in result["feedback"]:
            result["feedback"]["interaction_test"] = {}
            
        # Add stack traces to feedback
        if "stack_traces" in result and result["stack_traces"]:
            result["feedback"]["interaction_test"]["stack_traces"] = result["stack_traces"]
            
        # Add any module errors if available
        if "module_errors" in result:
            result["feedback"]["interaction_test"]["module_errors"] = result["module_errors"]
            
        # Add any undefined vars if available
        if "undefined_vars" in result:
            result["feedback"]["interaction_test"]["undefined_vars"] = result["undefined_vars"]
            
        # Add errors from console logs
        if "console_logs" in result and "error" in result["console_logs"]:
            result["feedback"]["interaction_test"]["errors"] = result["console_logs"]["error"]
            
        # Add any syntax errors
        if "parse_errors" in result and result["parse_errors"]:
            result["feedback"]["interaction_test"]["syntax_errors"] = result["parse_errors"]
            
        return result
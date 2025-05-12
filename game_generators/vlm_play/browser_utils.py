import os
import logging
import asyncio
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

# Import Playwright
try:
    from playwright.async_api import async_playwright, Page, ElementHandle, Browser, BrowserContext, ConsoleMessage
    PLAYWRIGHT_ENABLED = True
except ImportError:
    logging.error(
        "Playwright not found. Install with: pip install playwright && python -m playwright install firefox"
    )
    PLAYWRIGHT_ENABLED = False


class BrowserManager:
    """Class to manage browser interactions for game evaluation."""
    
    def __init__(self, game_path: str):
        """
        Initialize the browser manager.
        
        Args:
            game_path: Path to the game directory or HTML file
        """
        self.game_path = os.path.abspath(game_path)
        
        # Game controls
        self.game_keys = {
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            " ",  # Space
            "Shift",
            "z",
            "Enter",
            "r",  # For restarting games
        }
        
        # HTTP server process
        self.server_process = None
        
        # Console logs storage
        self.console_logs = {
            "error": [],
            "warning": [],
            "info": [],
            "log": [],
            "debug": [],
            "other": []
        }
        self.js_exceptions = []
        self.network_errors = []
        self.resource_errors = []
        self.parse_errors = []
        
    async def setup_browser(self) -> Tuple[Browser, str]:
        """
        Set up the browser and return the URL to access the game.
        
        Returns:
            Tuple of (browser instance, URL to access the game)
        """
        if not PLAYWRIGHT_ENABLED:
            raise ImportError("Playwright is not installed or properly configured")
            
        # Setup browser
        playwright = await async_playwright().start()
        browser = await playwright.firefox.launch(headless=False)
        
        # Determine URL based on game path
        if os.path.isdir(self.game_path):
            # Find HTML file
            html_files = list(Path(self.game_path).glob("*.html"))
            if not html_files:
                raise FileNotFoundError(f"No HTML file found in {self.game_path}")
                
            # Default to index.html if it exists
            html_file = next(
                (f for f in html_files if f.name.lower() == "index.html"),
                html_files[0],
            )
            
            # Use local HTTP server to serve the directory
            self.server_process = await asyncio.create_subprocess_exec(
                "python",
                "-m",
                "http.server",
                "8000",
                cwd=self.game_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            # Wait for server to start
            await asyncio.sleep(1)
            url = f"http://localhost:8000/{html_file.name}"
        else:
            # Direct file path
            url = f"file://{self.game_path}"
            
        return browser, url
        
    async def find_game_test_buttons(self, page: Page) -> List[Dict[str, Any]]:
        """
        Find all TEST buttons on the page with the new format.
        
        Args:
            page: Playwright page object
            
        Returns:
            List of button information dictionaries
        """
        # Check for canvas
        canvas_count = await page.evaluate(
            "document.querySelectorAll('canvas').length"
        )
        if not canvas_count:
            raise ValueError("No canvas element found on the page")
            
        # Find all test buttons with the new format
        test_buttons = await page.evaluate(
            """
            () => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                return buttons
                    .filter(btn => btn.id && btn.id.toLowerCase().includes('test_') && btn.id.toLowerCase().includes('modebtn'))
                    .map(btn => ({
                        id: btn.id,
                        text: btn.innerText || btn.value || '',
                        testMode: (btn.onclick && btn.onclick.toString().match(/setControlMode\\(['"]([^'"]+)['"]\\)/)?.[1]) || ''
                    }))
                    .sort((a, b) => {
                        // Sort by test number if available
                        const numA = parseInt(a.id.match(/test_(\d+)/i)?.[1] || '0');
                        const numB = parseInt(b.id.match(/test_(\d+)/i)?.[1] || '0');
                        return numA - numB;
                    });
            }
            """
        )
        
        if not test_buttons:
            logging.warning(
                "No buttons with id containing 'test_' found. Looking for any buttons..."
            )
            
            # Try to find any buttons as a fallback
            test_buttons = await page.evaluate(
                """
                () => {
                    const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                    return buttons.map((btn, index) => ({
                        id: btn.id || `button_${index}`,
                        text: btn.innerText || btn.value || '',
                        testMode: (btn.onclick && btn.onclick.toString().match(/setControlMode\\(['"]([^'"]+)['"]\\)/)?.[1]) || ''
                    }));
                }
                """
            )
            
        return test_buttons
        
    async def perform_automated_gameplay(self, page: Page, duration: int = 30) -> None:
        """
        Perform automated gameplay by sending random key presses.
        
        Args:
            page: Playwright page object
            duration: Duration in seconds to play the game
        """
        import random
        
        logging.info(f"Starting automated gameplay for {duration} seconds")
        
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + duration
        
        try:
            while asyncio.get_event_loop().time() < end_time:
                # Press a random key from the game keys
                key = random.choice(list(self.game_keys))
                
                # Decide between key press or key hold
                if random.random() < 0.7:
                    # Short press
                    await page.keyboard.press(key)
                else:
                    # Hold for a short time
                    await page.keyboard.down(key)
                    await page.wait_for_timeout(random.randint(100, 500))
                    await page.keyboard.up(key)
                    
                # Wait a short time between inputs
                await page.wait_for_timeout(random.randint(50, 200))
                
        except Exception as e:
            logging.error(f"Error during automated gameplay: {str(e)}")
            
    async def verify_mode_change(self, page: Page, button_id: str) -> bool:
        """
        Verify that clicking a button changes the game mode.
        
        Args:
            page: Playwright page object
            button_id: ID of the button to click
            
        Returns:
            True if mode change was successful, False otherwise
        """
        try:
            # Get a snapshot of the canvas before clicking
            before_snapshot = await self._get_canvas_snapshot(page)
            
            # Click the button
            logging.info(f"Clicking button: {button_id}")
            button = await page.query_selector(f"#{button_id}")
            
            if not button:
                logging.error(f"Button with ID '{button_id}' not found")
                return False
                
            await button.click()
            
            # Wait for canvas to update
            await page.wait_for_timeout(2000)
            
            # Get a snapshot after clicking
            after_snapshot = await self._get_canvas_snapshot(page)
            
            # Compare snapshots to see if something changed
            if before_snapshot != after_snapshot:
                logging.info(f"Button {button_id} successfully changed the game state")
                return True
                
            logging.warning(f"Button {button_id} click did not appear to change the game state")
            return False
            
        except Exception as e:
            logging.error(f"Error verifying mode change: {str(e)}")
            return False
            
    async def _get_canvas_snapshot(self, page: Page) -> str:
        """
        Get a snapshot of the canvas as a data URL.
        
        Args:
            page: Playwright page object
            
        Returns:
            Canvas snapshot as a string
        """
        return await page.evaluate(
            """
            () => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return '';
                
                try {
                    return canvas.toDataURL('image/png');
                } catch (e) {
                    return '';
                }
            }
            """
        )
        
    async def close(self) -> None:
        """Clean up resources, including HTTP server if running."""
        if self.server_process:
            self.server_process.terminate()
            await self.server_process.wait()
            self.server_process = None

    async def setup_console_error_tracking(self, page: Page):
        """
        Set up tracking of console errors in the browser.
        
        Args:
            page: Playwright page object
        """
        # Reset console logs
        self.console_logs = {
            "error": [],
            "warning": [],
            "info": [],
            "log": [],
            "debug": [],
            "other": []
        }
        self.js_exceptions = []
        self.network_errors = []
        self.resource_errors = []
        self.parse_errors = []
        
        # Listen for console messages
        page.on("console", lambda msg: self._handle_console_message(msg))
        
        # Listen for page errors
        page.on("pageerror", lambda err: self._handle_page_error(err))
        
        # Listen for request failures
        page.on("requestfailed", lambda request: self._handle_request_failed(request))
    
    def _handle_console_message(self, msg: ConsoleMessage):
        """
        Handle console messages from the browser.
        
        Args:
            msg: Console message object
        """
        msg_type = msg.type.lower()
        msg_text = f"{msg.text}"
        
        # Store in the appropriate category
        if msg_type in self.console_logs:
            self.console_logs[msg_type].append(msg_text)
        else:
            self.console_logs["other"].append(f"{msg_type}: {msg_text}")
        
        # Check for specific error patterns
        lower_text = msg_text.lower()
        
        # Debug log for all error messages
        if msg_type == "error" or "error" in lower_text:
            logging.error(f"BROWSER ERROR: {msg_text}")
        
        # Check for network errors
        if "failed to load resource" in lower_text or "net::" in lower_text:
            self.network_errors.append(msg_text)
        
        # Check for syntax errors
        syntax_error_patterns = [
            "parseerror", 
            "syntax error", 
            "syntaxerror", 
            "unexpected token", 
            "is an invalid identifier",
            "invalid identifier", 
            "unexpected identifier", 
            "unexpected end of input", 
            "missing )", 
            "missing }", 
            "missing ]"
        ]
        
        if any(pattern in lower_text for pattern in syntax_error_patterns):
            self.parse_errors.append(msg_text)
            logging.error(f"Syntax error detected: {msg_text}")
    
    def _handle_page_error(self, error):
        """
        Handle page errors from the browser.
        
        Args:
            error: Error object
        """
        error_str = str(error)
        
        # Format the error message
        error_msg = f"Page error: {error}"
        
        self.js_exceptions.append(error_msg)
        logging.error(f"PAGE ERROR: {error}")
        
        # Add to console_logs error category
        self.console_logs["error"].append(error_msg)
    
    def _handle_request_failed(self, request):
        """
        Handle failed network requests.
        
        Args:
            request: Failed request object
        """
        failure = request.failure()
        url = request.url
        
        error_msg = f"Request failed: {url} - {failure}"
        self.network_errors.append(error_msg)
        self.console_logs["error"].append(error_msg)
    
    def get_console_errors_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all console errors captured.
        
        Returns:
            Dictionary with console error information
        """
        # Gather all error messages from different sources
        all_errors = []
        
        # Add explicit error logs
        all_errors.extend(self.console_logs["error"])
        
        # Add JS exceptions
        all_errors.extend(self.js_exceptions)
        
        # Add network errors
        all_errors.extend(self.network_errors)
        
        # Add resource errors
        all_errors.extend(self.resource_errors)
        
        # Add parse errors
        all_errors.extend(self.parse_errors)
        
        # Check for error text in other message types
        for msg_type, messages in self.console_logs.items():
            if msg_type != "error":  # Skip error type as we already processed it
                for msg in messages:
                    if "error" in msg.lower():
                        all_errors.append(msg)
        
        # Remove duplicates while preserving order
        unique_errors = []
        for error in all_errors:
            if error not in unique_errors:
                unique_errors.append(error)
        
        return {
            "has_errors": len(unique_errors) > 0,
            "error_count": len(unique_errors),
            "errors": unique_errors,
            "console_logs": self.console_logs,
            "js_exceptions": self.js_exceptions,
            "network_errors": self.network_errors,
            "parse_errors": self.parse_errors
        } 
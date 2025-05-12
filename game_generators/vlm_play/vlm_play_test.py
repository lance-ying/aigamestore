#!/usr/bin/env python3
"""
VLM Play Testing module for evaluating games using AI.

This module provides functionality to:
1. Record gameplay videos of a game
2. Capture console errors during gameplay
3. Use Gemini to evaluate the game and provide improvement feedback.
"""

import os
import sys
import json
import logging
import asyncio
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import time

# Fix imports to handle both direct execution and module import
if __name__ == "__main__" or not __package__:
    # Add parent directory to path for direct execution
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    # Import local modules without relative imports
    from vlm_play.browser_utils import BrowserManager
    from vlm_play.video_processing import VideoRecorder
    from vlm_play.gemini_api import GeminiEvaluator
    from vlm_play.test_ai_modes import AIModeTester
else:
    # Regular relative imports for module usage
    from .browser_utils import BrowserManager
    from .video_processing import VideoRecorder
    from .gemini_api import GeminiEvaluator
    from .test_ai_modes import AIModeTester

class VLMPlayEvaluation:
    """Class to evaluate games using video recording and LLM analysis."""
    
    def __init__(self,
                 game_path: str, 
                 output_dir: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize the VLM Play Evaluation.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save recorded videos and evaluation results
            api_key: Google API key for Gemini access
        """
        # Check if the game_path is a directory and find the index.html
        self.original_path = os.path.abspath(game_path)
        
        if os.path.isdir(self.original_path):
            # Look for index.html first
            index_html = os.path.join(self.original_path, "index.html")
            if os.path.exists(index_html):
                self.game_path = index_html
                logging.info(f"Found index.html in directory: {self.game_path}")
            else:
                # Look for any HTML file
                html_files = [f for f in os.listdir(self.original_path) if f.endswith('.html')]
                if html_files:
                    self.game_path = os.path.join(self.original_path, html_files[0])
                    logging.info(f"Using HTML file found in directory: {self.game_path}")
                else:
                    # No HTML file found, just use the directory
                    self.game_path = self.original_path
                    logging.warning(f"No HTML files found in directory: {self.original_path}")
        else:
            self.game_path = self.original_path
            
        print(f"Game path: {self.game_path}")
        
        # Setup output directory
        if output_dir:
            self.output_dir = output_dir
        else:
            # Use the original path (directory) for output if it's a directory
            if os.path.isdir(self.original_path):
                self.output_dir = os.path.join(self.original_path, "vlm_evaluation")
            else:
                self.output_dir = os.path.join(os.path.dirname(self.game_path), "vlm_evaluation")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize components
        self.video_recorder = VideoRecorder(self.output_dir)
        self.gemini_evaluator = GeminiEvaluator(api_key)
        
        # Load metadata if available
        self.metadata = self._load_metadata()
        print(f"Metadata: {self.metadata}")
        self.game_description = self.metadata['game_info']['description']
        self.game_controls = self.metadata['game_info']['controls']
        # self.game_code = self.metadata['game_info']['game_code']
        # Parse automated testing info from metadata
        self.test_info = self._parse_automated_testing_info()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata.json file if it exists in the game path."""
        # Try to find metadata.json in the original path first (directory)
        if hasattr(self, 'original_path') and os.path.isdir(self.original_path):
            metadata_path = os.path.join(self.original_path, "metadata.json")
        else:
            # Fallback to game path directory
            metadata_path = os.path.join(os.path.dirname(self.game_path), "metadata.json")
            
        logging.info(f"Looking for metadata at: {metadata_path}")
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    logging.info(f"Loaded metadata from: {metadata_path}")
                    return metadata
            except Exception as e:
                logging.warning(f"Failed to load metadata.json: {str(e)}")
        else:
            logging.warning(f"Metadata file not found at: {metadata_path}")
            
        return {}
    
    def _parse_automated_testing_info(self) -> Dict[str, Dict[str, str]]:
        """Parse automated testing info from metadata."""
        test_info = {}
        
        if not self.metadata or 'game_info' not in self.metadata or 'automated_testing' not in self.metadata['game_info']:
            logging.warning(f"No automated testing info found in metadata: {self.metadata}")
            return test_info
        game_info = self.metadata['game_info']
        game_description = game_info['description']
        game_controls = game_info['controls']

        # TODO: Add code to the input to the LLM to include the game description and controls
        automated_testing = game_info['automated_testing']
        
        try:
            # Check if the XML is properly formatted
            if not automated_testing.strip().startswith("<TEST_"):
                logging.warning("Automated testing info does not start with <TEST_. Format may be incorrect.")
                
            # Parse the XML-formatted automated testing information
            # First, clean up the string to ensure it's valid XML
            # Remove any potential extra whitespace between tags
            xml_str = f"<root>{automated_testing}</root>"
            
            try:
                # First try standard XML parsing
                root = ET.fromstring(xml_str)
                
                # Process each test
                for test_elem in root.findall("./TEST_*"):
                    test_name = test_elem.tag
                    
                    test_description = test_elem.find("test_description")
                    strategy_description = test_elem.find("strategy_description")
                    expected_outcome = test_elem.find("expected_outcome")
                    
                    test_info[test_name] = {
                        "test_description": test_description.text.strip() if test_description is not None and test_description.text else "",
                        "strategy_description": strategy_description.text.strip() if strategy_description is not None and strategy_description.text else "",
                        "expected_outcome": expected_outcome.text.strip() if expected_outcome is not None and expected_outcome.text else ""
                    }
            except ET.ParseError as xml_error:
                # If standard parsing fails, try manual parsing
                logging.warning(f"XML parsing failed: {str(xml_error)}. Trying manual parsing...")
                
                # Manual parsing for format like:
                # <TEST_1>
                # <test_description>...</test_description>
                # <strategy_description>...</strategy_description>
                # <expected_outcome>...</expected_outcome>
                # </TEST_1>
                
                import re
                
                # Find all TEST blocks
                test_blocks = re.findall(r'<(TEST_\d+)>(.*?)</\1>', automated_testing, re.DOTALL)
                
                for test_name, test_content in test_blocks:
                    # Extract the inner content
                    test_description_match = re.search(r'<test_description>(.*?)</test_description>', test_content, re.DOTALL)
                    strategy_match = re.search(r'<strategy_description>(.*?)</strategy_description>', test_content, re.DOTALL)
                    outcome_match = re.search(r'<expected_outcome>(.*?)</expected_outcome>', test_content, re.DOTALL)
                    
                    test_info[test_name] = {
                        "test_description": test_description_match.group(1).strip() if test_description_match else "",
                        "strategy_description": strategy_match.group(1).strip() if strategy_match else "",
                        "expected_outcome": outcome_match.group(1).strip() if outcome_match else ""
                    }
                
        except Exception as e:
            logging.error(f"Error parsing automated testing info: {str(e)}")
        
        return test_info
    
    async def evaluate_game(self) -> Dict[str, Any]:
        """
        Evaluate the game by recording gameplay videos and analyzing them with Gemini.
        
        Returns:
            Dictionary with evaluation results
        """
        results = {
            "game_path": self.game_path,
            "evaluations": [],
            "errors": [],
            "console_errors": {},
            "success": False,
            "aggregated_feedback": None
        }
        
        try:
            # Setup browser to find TEST buttons
            browser_manager = BrowserManager(self.game_path)
            # Store as instance attribute for later use
            self.browser_manager = browser_manager
            browser, url = await browser_manager.setup_browser()
            context = await browser.new_context()
            page = await context.new_page()
            
            # Set up console error tracking
            await browser_manager.setup_console_error_tracking(page)
            
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            # JavaScript code for first button detection approach
            first_button_detection_js = """
            () => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                return buttons
                    .filter(btn => {
                        if (!btn.id) return false;
                        const id = btn.id.toLowerCase();
                        // Look for patterns like test_1_modebtn, test_2_modebtn, etc.
                        return id.includes('test_') && id.includes('modebtn');
                    })
                    .map(btn => {
                        let testMode = '';
                        if (btn.onclick) {
                            const onclickStr = btn.onclick.toString();
                            const match = onclickStr.match(/setControlMode\\(['"]([^'"]+)['"]\)/);
                            if (match) {
                                testMode = match[1];
                            }
                        }
                        return {
                            id: btn.id,
                            text: btn.innerText || btn.value || '',
                            testMode: testMode
                        };
                    });
            }
            """
            
            # Find all TEST buttons with the new format
            test_buttons = await page.evaluate(first_button_detection_js)
            
            logging.info(f"Button search results: {test_buttons}")
            
            # JavaScript code for lenient button detection approach
            lenient_button_detection_js = """
            () => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                return buttons
                    .filter(btn => {
                        if (!btn.id) return false;
                        const id = btn.id.toLowerCase();
                        // More lenient pattern matching
                        return id.includes('test');
                    })
                    .map(btn => {
                        // Try to extract test mode from onclick attribute or button ID
                        let testMode = '';
                        if (btn.onclick) {
                            const onclickStr = btn.onclick.toString();
                            const match = onclickStr.match(/setControlMode\\(['"]([^'"]+)['"]\)/);
                            if (match) {
                                testMode = match[1];
                            }
                        }
                        
                        // If no testMode found from onclick, try to derive from ID
                        if (!testMode && btn.id) {
                            const idMatch = btn.id.match(/test_?(\\d+)/i);
                            if (idMatch) {
                                testMode = 'TEST_' + idMatch[1];
                            }
                        }
                        
                        return {
                            id: btn.id,
                            text: btn.innerText || btn.value || '',
                            testMode: testMode
                        };
                    })
                    .filter(btn => btn.testMode); // Only include buttons with a testMode
            }
            """
            
            # If no test buttons found with the first attempt, try a more lenient approach
            if not test_buttons:
                logging.warning("No TEST buttons found with the first approach, trying a more lenient search")
                test_buttons = await page.evaluate(lenient_button_detection_js)
                
                logging.info(f"Lenient button search results: {test_buttons}")
            
            await context.close()
            
            # Get console errors before closing browser
            console_errors = browser_manager.get_console_errors_summary()
            results["console_errors"]["initial_page_load"] = console_errors
            
            # Log any errors from initial page load
            if console_errors["has_errors"]:
                logging.error(f"Console errors during initial page load: {json.dumps(console_errors, indent=2)}")
                
            await browser.close()
            
            if not test_buttons:
                error_msg = "No TEST buttons found on the page"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                return results
            
            logging.info(f"Found {len(test_buttons)} TEST buttons: {test_buttons}")
            
            # Record videos for all test buttons in parallel (keeping this part parallel for efficiency)
            logging.info(f"Starting parallel recording of {len(test_buttons)} test buttons")
            start_time = asyncio.get_event_loop().time()
            video_paths = await self._record_test_videos_parallel(test_buttons)
            end_time = asyncio.get_event_loop().time()
            recording_time = end_time - start_time
            
            num_videos = len(video_paths)
            if num_videos > 0:
                logging.info(f"Successfully recorded {num_videos}/{len(test_buttons)} videos in {recording_time:.2f} seconds")
            else:
                # If parallel approach failed completely, try sequential as fallback
                logging.warning("Parallel recording failed. Falling back to sequential recording")
                video_paths = await self._record_test_videos_sequential(test_buttons)
                num_videos = len(video_paths)
                
                if num_videos == 0:
                    error_msg = "No gameplay videos were recorded after both parallel and sequential attempts"
                    logging.error(error_msg)
                    results["errors"].append(error_msg)
                    return results
                    
                logging.info(f"Sequential recording produced {num_videos}/{len(test_buttons)} videos")
            
            # Process each test video sequentially to avoid parallel Gemini API calls
            logging.info("Starting sequential evaluation of recorded videos with Gemini")
            evaluations = []
            
            # Process each video one by one (sequentially)
            for button_id, (button_info, video_path) in video_paths.items():
                if not os.path.exists(video_path):
                    logging.warning(f"Video file does not exist: {video_path}")
                    continue
                
                test_mode = button_info["testMode"]
                test_id = button_info["id"]
                
                logging.info(f"Evaluating gameplay for mode: {test_mode} (Button ID: {test_id})")
                
                # Get test information from metadata and evaluate each video independently
                evaluation = await self._evaluate_test_video(
                    video_path=video_path,
                    test_mode=test_mode,
                    button_info=button_info
                )
                
                if evaluation:
                    evaluations.append(evaluation)
                    results["evaluations"].append(evaluation)
                    
                    # Save individual evaluation to file
                    eval_file_path = os.path.join(self.output_dir, f"{test_id}_evaluation.json")
                    with open(eval_file_path, "w") as f:
                        json.dump(evaluation, f, indent=2)
                    
                    logging.info(f"Saved evaluation to {eval_file_path}")
            
            # Generate aggregated feedback only after all individual evaluations are complete
            if evaluations:
                logging.info(f"Generating aggregated feedback from {len(evaluations)} evaluations")
                
                # Make a separate aggregation call with all the collected evaluations
                aggregated_feedback = await self._generate_aggregated_feedback(evaluations)
                results["aggregated_feedback"] = aggregated_feedback
                
                # Save aggregated feedback to file
                feedback_file_path = os.path.join(self.output_dir, "aggregated_feedback.json")
                with open(feedback_file_path, "w") as f:
                    json.dump(aggregated_feedback, f, indent=2)
                
                logging.info(f"Saved aggregated feedback to {feedback_file_path}")
            
            # Generate a combined report
            self._generate_combined_report(results)
            
            # Set success flag if we have at least one evaluation
            results["success"] = len(results["evaluations"]) > 0
            
        except Exception as e:
            error_msg = f"Error during game evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
        
        return results
    
    async def _record_test_videos_parallel(self, test_buttons: List[Dict[str, Any]]) -> Dict[str, Tuple[Dict[str, Any], str]]:
        """Record videos for all test buttons in parallel, focusing only on the canvas."""
        video_paths = {}  # Use button_id as key instead of button_info dictionary
        tasks = []
        temp_dirs = []  # Store temporary directories for cleanup
        
        # Setup browser once
        browser_manager = BrowserManager(self.game_path)
        browser, url = await browser_manager.setup_browser()
        
        try:
            # Create tasks for each button with unique temporary directories
            for button_info in test_buttons:
                # Create a unique temporary directory for each recording
                temp_dir = os.path.join(self.output_dir, f"temp_{button_info['id']}_{int(time.time() * 1000)}")
                os.makedirs(temp_dir, exist_ok=True)
                temp_dirs.append(temp_dir)
                
                task = self._record_single_video(browser, url, button_info, temp_dir)
                tasks.append(task)
            
            # Run tasks with a limit on concurrency to avoid overwhelming the system
            # Use smaller batches to reduce potential resource contention
            batch_size = min(3, len(tasks))  # Process at most 3 recordings at once
            results = []
            
            for i in range(0, len(tasks), batch_size):
                batch_tasks = tasks[i:i+batch_size]
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                results.extend(batch_results)
                # Add a small delay between batches to let system resources settle
                if i + batch_size < len(tasks):
                    await asyncio.sleep(1)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logging.error(f"Error recording video for button {test_buttons[i]['id']}: {str(result)}")
                    continue
                
                button_info, video_path = result
                button_id = button_info["id"]
                if video_path and os.path.exists(video_path):
                    video_paths[button_id] = (button_info, video_path)
                    logging.info(f"Successfully recorded video for {button_id}: {video_path}")
                else:
                    # If video path is None or file doesn't exist, retry once with sequential approach
                    if i < len(test_buttons):
                        logging.warning(f"Retrying video recording for {button_id} with sequential approach")
                        try:
                            # Create new browser for retry to avoid context issues
                            retry_browser_manager = BrowserManager(self.game_path)
                            retry_browser, _ = await retry_browser_manager.setup_browser()
                            
                            # Retry recording
                            button_info, video_path = await self._record_single_video(
                                retry_browser, 
                                url, 
                                test_buttons[i],
                                os.path.join(self.output_dir, f"retry_{test_buttons[i]['id']}")
                            )
                            
                            if video_path and os.path.exists(video_path):
                                video_paths[button_id] = (button_info, video_path)
                                logging.info(f"Successfully recorded video on retry for {button_id}: {video_path}")
                            else:
                                logging.warning(f"Failed to record video for {button_id} even after retry")
                            
                            # Close retry browser
                            await retry_browser.close()
                            await retry_browser_manager.close()
                            
                        except Exception as retry_error:
                            logging.error(f"Retry recording failed for {button_id}: {str(retry_error)}")
                    else:
                        logging.warning(f"Failed to record video for {button_id}")
        
        finally:
            # Close browser
            await browser.close()
            await browser_manager.close()
            
            # Clean up temporary directories
            for temp_dir in temp_dirs:
                try:
                    # Only remove if it exists and is a directory
                    if os.path.exists(temp_dir) and os.path.isdir(temp_dir):
                        # Only remove empty directories
                        if not os.listdir(temp_dir):
                            os.rmdir(temp_dir)
                except Exception as e:
                    logging.warning(f"Failed to clean up temporary directory {temp_dir}: {str(e)}")
        
        return video_paths
    
    async def _record_single_video(self, browser, url, button_info, temp_dir) -> Tuple[Dict[str, Any], Optional[str]]:
        """Record a single video for a test button, focusing only on the canvas."""
        button_id = button_info["id"]
        test_mode = button_info.get("testMode", "")
        test_name = test_mode or button_id
        
        # Create new context for this recording
        context = await browser.new_context()
        page = await context.new_page()
        
        # Set up console error tracking
        browser_manager = BrowserManager(self.game_path)
        # Save this as an instance attribute for later use in evaluation
        self.browser_manager = browser_manager
        await browser_manager.setup_console_error_tracking(page)
        
        try:
            # 1. Wait for the page to load
            await page.goto(url, wait_until="networkidle", timeout=15000)
            logging.info(f"Page loaded for test button: {button_id}")
            await page.wait_for_timeout(2000)
            
            # 2. Try to find and focus on the canvas with multiple approaches and retries
            canvas_found = False
            retry_count = 0
            max_retries = 3
            
            while not canvas_found and retry_count < max_retries:
                canvas_found = await page.evaluate("""
                    () => {
                        // Try multiple ways to find canvas
                        let canvas = document.querySelector('canvas');
                        
                        // If not found, try other common patterns
                        if (!canvas) {
                            // Try by ID
                            const possibleIds = ['gameCanvas', 'game-canvas', 'canvas', 'mainCanvas'];
                            for (const id of possibleIds) {
                                const byId = document.getElementById(id);
                                if (byId && byId.tagName === 'CANVAS') {
                                    canvas = byId;
                                    break;
                                }
                            }
                            
                            // Try by class
                            if (!canvas) {
                                const possibleClasses = ['game-canvas', 'main-canvas', 'canvas'];
                                for (const className of possibleClasses) {
                                    const byClass = document.getElementsByClassName(className)[0];
                                    if (byClass && byClass.tagName === 'CANVAS') {
                                        canvas = byClass;
                                        break;
                                    }
                                }
                            }
                            
                            // Last resort: any canvas in the DOM
                            if (!canvas) {
                                const allCanvases = document.getElementsByTagName('canvas');
                                if (allCanvases.length > 0) {
                                    canvas = allCanvases[0];
                                }
                            }
                        }
                        
                        if (!canvas) return false;
                        
                        // Make sure canvas is visible and focused
                        canvas.scrollIntoView();
                        canvas.focus();
                        
                        // Apply styling to only show the canvas
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                        document.body.style.overflow = 'hidden';
                        document.body.style.background = '#000';
                        
                        // Hide all other elements
                        Array.from(document.body.children).forEach(el => {
                            if (el !== canvas && !el.contains(canvas)) {
                                el.style.visibility = 'hidden';
                            }
                        });
                        
                        // Center the canvas
                        canvas.style.position = 'absolute';
                        canvas.style.left = '50%';
                        canvas.style.top = '50%';
                        canvas.style.transform = 'translate(-50%, -50%)';
                        
                        return true;
                    }
                """)
                
                if not canvas_found:
                    retry_count += 1
                    if retry_count < max_retries:
                        logging.warning(f"Canvas not found on attempt {retry_count}, waiting and retrying...")
                        # Wait a bit longer for possible dynamic canvas creation
                        await page.wait_for_timeout(2000)
            
            if not canvas_found:
                logging.error("Canvas element not found on the page after multiple attempts")
                # Get console errors
                console_errors = browser_manager.get_console_errors_summary()
                logging.error(f"Console errors for {test_mode}: {json.dumps(console_errors, indent=2)}")
                return button_info, None
            
            # 3. Try to activate the test mode using multiple approaches
            test_mode_set = False
            
            # Get initial control mode
            initial_mode = await page.evaluate("""
                () => {
                    if (typeof window.getGameState === 'function') {
                        const state = window.getGameState();
                        if (state) return state.controlMode;
                    } else if (window.gameState) {
                        return window.gameState.controlMode;
                    }
                    return null;
                }
            """)
            
            logging.info(f"Initial control mode: {initial_mode}")
            
            # Try to click the button via JavaScript first (most reliable approach)
            try:
                button_clicked = await page.evaluate(f"""
                    () => {{
                        // Find button by id
                        let button = document.getElementById('{button_id}');
                        
                        // If not found, try other selectors
                        if (!button) {{
                            // Try by any button containing the test mode in its onclick
                            const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                            button = buttons.find(b => 
                                b.id === '{button_id}' || 
                                (b.onclick && b.onclick.toString().includes('{test_mode}'))
                            );
                        }}
                        
                        if (button) {{
                            // Click the button programmatically
                            button.click();
                            return true;
                        }}
                        return false;
                    }}
                """)
                
                if button_clicked:
                    logging.info(f"Clicked button {button_id} via JavaScript")
                else:
                    logging.warning(f"Could not find button {button_id} via JavaScript")
                
                # Wait for mode change
                await page.wait_for_timeout(1000)
            except Exception as e:
                logging.warning(f"JavaScript click attempt failed: {str(e)}")
            
            # Check if control mode was set (case-insensitive comparison)
            control_mode_info = await page.evaluate(f"""
                () => {{
                    let currentMode = null;
                    let source = null;
                    
                    if (typeof window.getGameState === 'function') {{
                        const state = window.getGameState();
                        if (state) {{
                            currentMode = state.controlMode;
                            source = 'getGameState()';
                        }}
                    }} else if (window.gameState) {{
                        currentMode = window.gameState.controlMode;
                        source = 'window.gameState';
                    }}
                    
                    return {{
                        currentMode,
                        source,
                        expectedMode: '{test_mode}'
                    }};
                }}
            """)
            
            logging.info(f"Control mode after click: {json.dumps(control_mode_info, indent=2)}")
            
            # Check if we have the expected control mode (case-insensitive)
            current_mode = control_mode_info.get('currentMode')
            if current_mode and isinstance(current_mode, str):
                if current_mode.upper() == test_mode.upper():
                    test_mode_set = True
                    logging.info(f"Control mode successfully set to {current_mode}")
            
            # If mode not set, try direct setting
            if not test_mode_set:
                try:
                    direct_set = await page.evaluate(f"""
                        () => {{
                            try {{
                                // Try direct setting
                                if (typeof window.setControlMode === 'function') {{
                                    window.setControlMode('{test_mode}');
                                    return true;
                                }} else if (window.gameState) {{
                                    window.gameState.controlMode = '{test_mode}';
                                    return true;
                                }}
                                return false;
                            }} catch (e) {{
                                console.error("Error setting control mode:", e);
                                return false;
                            }}
                        }}
                    """)
                    
                    if direct_set:
                        logging.info(f"Directly set control mode to {test_mode}")
                        test_mode_set = True
                except Exception as e:
                    logging.warning(f"Direct control mode setting failed: {str(e)}")
            
            # 4. Press ENTER to start the game (continue even if control mode not set)
            logging.info("Pressing ENTER to start the game")
            await page.keyboard.press("Enter")
            
            # 5. Start recording - simplify by just recording what happens regardless of control mode
            logging.info(f"Starting to record for test: {test_name}")
            
            # Create a new recording context
            await page.close()
            await context.close()
            
            # Record at a reasonable size
            recording_context = await browser.new_context(
                viewport={"width": 800, "height": 600},
                record_video_dir=temp_dir,
                record_video_size={"width": 800, "height": 600}
            )
            
            recording_page = await recording_context.new_page()
            
            try:
                await recording_page.goto(url, wait_until="networkidle", timeout=15000)
                
                # Hide everything except canvas
                await recording_page.evaluate("""
                    () => {
                        const canvas = document.querySelector('canvas');
                        if (!canvas) return;
                        
                        // Style canvas
                        canvas.style.position = 'absolute';
                        canvas.style.left = '50%';
                        canvas.style.top = '50%';
                        canvas.style.transform = 'translate(-50%, -50%)';
                        
                        // Hide other elements for clean recording
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                        document.body.style.background = '#000';
                        
                        Array.from(document.body.children).forEach(el => {
                            if (el !== canvas && !el.contains(canvas)) {
                                el.style.display = 'none';
                            }
                        });
                    }
                """)
                
                # Set the control mode in this new context
                await recording_page.evaluate(f"""
                    () => {{
                        try {{
                            // Try setting control mode via function call first
                            if (typeof window.setControlMode === 'function') {{
                                window.setControlMode('{test_mode}');
                            }}
                            // Try direct setting if function not available
                            else if (window.gameState) {{
                                window.gameState.controlMode = '{test_mode}';
                            }}
                            // Try clicking button if available
                            else {{
                                const button = document.getElementById('{button_id}');
                                if (button) button.click();
                            }}
                        }} catch (e) {{
                            console.error("Error setting test mode:", e);
                        }}
                    }}
                """)
                
                # Press ENTER again to start the game
                await recording_page.keyboard.press("Enter")
                
                # Record for 10 seconds
                logging.info(f"Recording for {test_name} for 10 seconds")
                
                # Check game phase every second and restart if needed
                start_time = asyncio.get_event_loop().time()
                end_time = start_time + 10
                
                while asyncio.get_event_loop().time() < end_time:
                    # Check game phase
                    game_phase = await recording_page.evaluate("""
                        () => {
                            try {
                                // Try to get game state via getGameState function
                                if (typeof window.getGameState === 'function') {
                                    const state = window.getGameState();
                                    if (state && state.gamePhase) {
                                        return state.gamePhase;
                                    }
                                }
                                // Fall back to direct gameState access
                                else if (window.gameState && window.gameState.gamePhase) {
                                    return window.gameState.gamePhase;
                                }
                                return 'unknown';
                            } catch (e) {
                                console.error('Error checking game phase:', e);
                                return 'error';
                            }
                        }
                    """)
                    
                    # If game is not in playing phase, restart it
                    if game_phase and game_phase.lower() != 'playing':
                        logging.info(f"Game phase is {game_phase}, restarting game...")
                        
                        # Press R to restart
                        await recording_page.keyboard.press('r')
                        await recording_page.wait_for_timeout(500)
                        
                        # Press ENTER to confirm restart
                        await recording_page.keyboard.press('Enter')
                        await recording_page.wait_for_timeout(500)
                        
                        # Reset test mode again in case it was lost
                        await recording_page.evaluate(f"""
                            () => {{
                                try {{
                                    if (typeof window.setControlMode === 'function') {{
                                        window.setControlMode('{test_mode}');
                                    }} else if (window.gameState) {{
                                        window.gameState.controlMode = '{test_mode}';
                                    }}
                                }} catch (e) {{
                                    console.error('Error resetting test mode:', e);
                                }}
                            }}
                        """)
                    
                    # Wait a second before checking again
                    await recording_page.wait_for_timeout(1000)
                
            except Exception as e:
                logging.error(f"Error during recording: {str(e)}")
            finally:
                # Close recording context to finalize the video
                await recording_context.close()
            
            # 6. Process the recorded video with improved error handling
            video_files = [f for f in os.listdir(temp_dir) if f.endswith(".webm")]
            if video_files:
                latest_video = max(video_files, key=lambda f: os.path.getmtime(os.path.join(temp_dir, f)))
                webm_path = os.path.join(temp_dir, latest_video)
                
                # Ensure the webm file actually has content
                webm_size = os.path.getsize(webm_path)
                if webm_size < 1000:  # Less than 1KB is probably empty/invalid
                    logging.error(f"Recorded webm file is too small ({webm_size} bytes), likely invalid")
                    return button_info, None
                
                # Generate a unique filename for the final MP4 in the output dir
                final_mp4_path = os.path.join(self.output_dir, f"{test_name}_{int(time.time())}.mp4")
                
                # First convert to a temp location
                mp4_path = os.path.join(temp_dir, f"{test_name}.mp4")
                
                # Use FFmpeg to convert with better parameters for reliability
                ffmpeg_cmd = [
                    "ffmpeg", "-y", "-i", webm_path, 
                    "-c:v", "libx264", "-crf", "23", "-preset", "ultrafast",  # Use ultrafast preset for speed
                    "-pix_fmt", "yuv420p",  # Ensure compatibility
                    mp4_path
                ]
                
                try:
                    process = await asyncio.create_subprocess_exec(
                        *ffmpeg_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode == 0 and os.path.exists(mp4_path) and os.path.getsize(mp4_path) > 0:
                        # Copy the temp MP4 to final location
                        import shutil
                        shutil.copy2(mp4_path, final_mp4_path)
                        logging.info(f"Successfully converted video to {final_mp4_path}")
                        
                        # Delete the webm file to save space
                        try:
                            os.remove(webm_path)
                        except Exception as e:
                            logging.warning(f"Failed to delete webm file: {str(e)}")
                            
                        return button_info, final_mp4_path
                    else:
                        logging.error(f"FFmpeg conversion failed with return code {process.returncode}")
                        logging.error(f"FFmpeg stderr: {stderr.decode()}")
                        
                        # Try alternative conversion approach if main one fails
                        logging.warning("Trying alternative FFmpeg conversion approach")
                        alt_ffmpeg_cmd = [
                            "ffmpeg", "-y", "-i", webm_path,
                            "-vcodec", "copy",  # Just copy the video stream without re-encoding
                            final_mp4_path
                        ]
                        
                        alt_process = await asyncio.create_subprocess_exec(
                            *alt_ffmpeg_cmd,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE
                        )
                        
                        alt_stdout, alt_stderr = await alt_process.communicate()
                        
                        if alt_process.returncode == 0 and os.path.exists(final_mp4_path) and os.path.getsize(final_mp4_path) > 0:
                            logging.info(f"Alternative conversion succeeded for {final_mp4_path}")
                            return button_info, final_mp4_path
                        else:
                            logging.error(f"Alternative FFmpeg conversion also failed: {alt_stderr.decode()}")
                            
                            # As a last resort, just copy the webm file to output as is
                            webm_output = os.path.join(self.output_dir, f"{test_name}.webm")
                            import shutil
                            shutil.copy2(webm_path, webm_output)
                            logging.warning(f"Copied webm file as-is to {webm_output}")
                            return button_info, webm_output
                except Exception as ffmpeg_error:
                    logging.error(f"Error during FFmpeg conversion: {str(ffmpeg_error)}")
                    
                    # As a last resort, just copy the webm file to output
                    try:
                        webm_output = os.path.join(self.output_dir, f"{test_name}.webm")
                        import shutil
                        shutil.copy2(webm_path, webm_output)
                        logging.warning(f"Copied webm file as-is to {webm_output}")
                        return button_info, webm_output
                    except Exception as copy_error:
                        logging.error(f"Failed to copy webm file: {str(copy_error)}")
                    
                    return button_info, None
            else:
                logging.error("No recorded video file found")
                # Get console errors
                console_errors = browser_manager.get_console_errors_summary()
                logging.error(f"Console errors for {test_mode}: {json.dumps(console_errors, indent=2)}")
                return button_info, None
            
        except Exception as e:
            logging.error(f"Error recording video for {button_id}: {str(e)}")
            return button_info, None
        
        finally:
            # Make sure all contexts are closed
            try:
                if 'recording_context' in locals() and recording_context:
                    await recording_context.close()
            except:
                pass
    
    async def _record_test_videos_sequential(self, test_buttons: List[Dict[str, Any]]) -> Dict[str, Tuple[Dict[str, Any], str]]:
        """Record videos for all test buttons sequentially as a fallback approach."""
        video_paths = {}  # Use button_id as key
        
        # Create a new browser for sequential recording
        browser_manager = BrowserManager(self.game_path)
        browser, url = await browser_manager.setup_browser()
        
        try:
            # Process each button sequentially
            for button_info in test_buttons:
                button_id = button_info["id"]
                logging.info(f"Sequential recording for button {button_id}")
                
                # Create a unique temporary directory
                temp_dir = os.path.join(self.output_dir, f"seq_{button_id}_{int(time.time() * 1000)}")
                os.makedirs(temp_dir, exist_ok=True)
                
                try:
                    # Record single video with longer timeouts
                    button_info, video_path = await self._record_single_video(browser, url, button_info, temp_dir)
                    
                    if video_path and os.path.exists(video_path):
                        video_paths[button_id] = (button_info, video_path)
                        logging.info(f"Sequential recording successful for {button_id}: {video_path}")
                    else:
                        logging.warning(f"Sequential recording failed for {button_id}")
                        
                    # Add a delay between recordings to ensure resources are freed
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logging.error(f"Error in sequential recording for {button_id}: {str(e)}")
                
                # Clean up temp dir if empty
                try:
                    if os.path.exists(temp_dir) and os.path.isdir(temp_dir) and not os.listdir(temp_dir):
                        os.rmdir(temp_dir)
                except Exception as e:
                    logging.warning(f"Failed to clean up temporary directory {temp_dir}: {str(e)}")
        
        finally:
            # Close browser
            await browser.close()
            await browser_manager.close()
        
        return video_paths
    
    async def _evaluate_test_video(self, 
                                 video_path: str, 
                                 test_mode: str,
                                 button_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Evaluate a test video using Gemini with information from metadata.
        
        Args:
            video_path: Path to the gameplay video
            test_mode: Test mode name (e.g., TEST_1)
            button_info: Button information dictionary
            
        Returns:
            Dictionary with evaluation results or None if failed
        """
        try:
            # Get test information from metadata
            test_info = self.test_info.get(test_mode, {})
            test_description = test_info.get("test_description", "")
            strategy_description = test_info.get("strategy_description", "")
            expected_outcome = test_info.get("expected_outcome", "")
            instructions = self.get_instructions()
            
            # If no test info found in metadata, use button text as a fallback
            if not test_description:
                test_description = f"Testing {button_info.get('text', test_mode)}"
            
            # Create prompt for Gemini using test information
            prompt = f"""
{instructions}

<task>
You are evaluating a video of a gameplay video where the player is trying to test the game for the following: {test_description}. 
They followed the following strategy: {strategy_description}. 
They expected the following would happen: {expected_outcome}.
</task>
Can you evaluate the video and answer the following questions to provide feedback to the game developer:
1. Was the expected outcome reached? If not, do you think the player was making progress towards the intended goal for the test?
2. What is your evaluation of the testing strategy? How can they improve their strategy?
3. What do you think can be improved in the game based on this test?
4. What is your overall assessment of the game based on this test?
5. What else do you think the game developer can do to make the game better?
Output your response in the following format:
<outcome_reached>Your detailed answer about whether the expected outcome was reached</outcome_reached>
<strategy_evaluation>Your detailed evaluation of the testing strategy</strategy_evaluation>
<improvements>Your detailed suggestions on what is broken and how to improve the game</improvements>
<overall_assessment>Your overall assessment of the game</overall_assessment>
<other_feedback>Any other feedback you think is important for the game developer</other_feedback>
"""
            
            # Send video to Gemini for evaluation using the synchronous method
            # This avoids the error with generate_content_async
            response = self.gemini_evaluator.evaluate_video_with_custom_prompt_sync(video_path, prompt)
            
            if not response:
                logging.error(f"Failed to get evaluation for {test_mode}")
                return None
            
            # Parse the response
            evaluation = self._parse_test_evaluation_response(response)
            print(f"Evaluation: {evaluation}")
            
            # Add mode and button information
            evaluation["test_mode"] = test_mode
            evaluation["button_id"] = button_info["id"]
            evaluation["button_text"] = button_info.get("text", "")
            evaluation["video_path"] = video_path
            
            # Add test information from metadata
            evaluation["test_description"] = test_description
            evaluation["strategy_description"] = strategy_description
            evaluation["expected_outcome"] = expected_outcome
            
            # Find console errors for this test from global results
            # Retrieve from parent's browser_manager if available
            if hasattr(self, 'browser_manager') and hasattr(self.browser_manager, 'get_console_errors_summary'):
                evaluation["console_errors"] = self.browser_manager.get_console_errors_summary()
            
            return evaluation
            
        except Exception as e:
            logging.error(f"Error evaluating video {video_path}: {str(e)}")
            return None
    
    def _parse_test_evaluation_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the XML response from Gemini for test evaluation.
        
        Args:
            response_text: Raw XML response from Gemini
            
        Returns:
            Dictionary with parsed sections
        """
        result = {}
        
        # Define the sections to extract
        sections = [
            "outcome_reached",
            "strategy_evaluation",
            "improvements",
            "overall_assessment",
            "other_feedback"
        ]
        
        # Helper function to extract XML tags content
        def extract_section(content, tag):
            start_tag = f"<{tag}>"
            end_tag = f"</{tag}>"
            
            start_pos = content.find(start_tag)
            if start_pos == -1:
                return None
                
            start_pos += len(start_tag)
            end_pos = content.find(end_tag, start_pos)
            
            if end_pos == -1:
                return None
                
            return content[start_pos:end_pos].strip()
        
        # Extract each section
        for section in sections:
            section_content = extract_section(response_text, section)
            if section_content:
                result[section] = section_content
            else:
                result[section] = ""
                
        return result
    
    async def _generate_aggregated_feedback(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate aggregated feedback from all test evaluations.
        
        Args:
            evaluations: List of all test evaluations
            
        Returns:
            Dictionary with aggregated feedback
        """
        try:
            # Create a summary of all evaluations
            test_summaries = []
            
            # Collect all console errors
            all_console_errors = []
            
            # Check if we have console errors in the main results
            if hasattr(self, 'browser_manager') and hasattr(self.browser_manager, 'get_console_errors_summary'):
                main_errors = self.browser_manager.get_console_errors_summary()
                if main_errors and main_errors.get("has_errors", False):
                    all_console_errors.extend(main_errors.get("errors", []))
            
            # Process each evaluation
            for eval in evaluations:
                test_mode = eval.get("test_mode", "")
                test_description = eval.get("test_description", "")
                outcome_reached = eval.get("outcome_reached", "")
                improvements = eval.get("improvements", "")
                overall_assessment = eval.get("overall_assessment", "")
                
                # Get console errors specific to this test if available
                console_errors = ""
                if "console_errors" in eval and eval["console_errors"]:
                    errors = eval["console_errors"]
                    if isinstance(errors, dict) and errors.get("has_errors", False):
                        console_errors = f"Console errors: {errors.get('error_count', 0)} errors detected."
                        if errors.get("errors"):
                            error_list = [f"- {err}" for err in errors.get("errors", [])[:5]]  # Limit to first 5 errors
                            console_errors += "\n" + "\n".join(error_list)
                            if len(errors.get("errors", [])) > 5:
                                console_errors += f"\n(+ {len(errors.get('errors', [])) - 5} more errors)"
                            all_console_errors.extend(errors.get("errors", []))
                
                summary = f"Test: {test_mode} - {test_description}\n"
                summary += f"Outcome: {outcome_reached}\n"
                summary += f"Improvements: {improvements}\n"
                summary += f"Assessment: {overall_assessment}\n"
                if console_errors:
                    summary += f"{console_errors}\n"
                
                test_summaries.append(summary)
            
            all_tests_summary = "\n\n".join(test_summaries)
            
            # Add a summary of all console errors found
            if all_console_errors:
                # Count error frequency
                error_counts = {}
                for error in all_console_errors:
                    error_str = str(error)
                    if error_str in error_counts:
                        error_counts[error_str] += 1
                    else:
                        error_counts[error_str] = 1
                
                # Sort by frequency
                sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
                
                # Add to the summary
                console_summary = "\n\nAggregated Console Errors:\n"
                console_summary += f"Total unique errors: {len(sorted_errors)}\n"
                console_summary += f"Total error instances: {sum(error_counts.values())}\n"
                
                # Add most frequent errors
                if sorted_errors:
                    console_summary += "\nMost frequent errors:\n"
                    for error, count in sorted_errors[:5]:  # Top 5 most frequent errors
                        console_summary += f"- ({count}x) {error}\n"
                    
                    if len(sorted_errors) > 5:
                        console_summary += f"(+ {len(sorted_errors) - 5} more unique errors)"
                
                all_tests_summary += console_summary
            
            instructions = self.get_instructions()
            # Create prompt for Gemini to aggregate feedback
            prompt = f"""
{instructions}

<task>
You are reviewing multiple gameplay testing videos of a JavaScript game to provide comprehensive feedback for improvement.
</task>

<tests_summary>
{all_tests_summary}
</tests_summary>

Please aggregate this feedback into comprehensive actionable feedback for the game developer based on all gameplay testing videos.
Focus on the most important issues that need to be fixed and provide actionable recommendations.

Format your response using these XML tags:
<critical_issues>List and explain the most important issues that need immediate attention</critical_issues>
<game_progression>Assessment of game flow, level design, difficulty progression, and player engagement</game_progression>
<game_mechanics>Evaluation of core gameplay mechanics, controls responsiveness, physics, and player interaction</game_mechanics>
<graphics_and_animation>Assessment of visual elements, animations, effects, and overall aesthetic quality</graphics_and_animation>
<console_errors>Analysis of any JavaScript errors or performance issues observed during testing</console_errors>
<recommendations>Prioritized list of actionable recommendations for the developer</recommendations>
<other_feedback>Any additional observations or suggestions not covered in the previous sections</other_feedback>
<conclusion>Brief overall conclusion about the game's state and potential</conclusion>
"""
            
            # Use Gemini to generate the aggregated feedback
            response = self.gemini_evaluator.generate_text(prompt)
            
            if not response:
                logging.error("Failed to generate aggregated feedback")
                return {}
            
            # Parse the XML response
            aggregated_feedback = {}
            sections = [
                "critical_issues", 
                "game_progression", 
                "game_mechanics", 
                "graphics_and_animation", 
                "console_errors",
                "recommendations", 
                "other_feedback",
                "conclusion"
            ]
            
            # Helper function to extract XML tags content
            def extract_section(content, tag):
                start_tag = f"<{tag}>"
                end_tag = f"</{tag}>"
                
                start_pos = content.find(start_tag)
                if start_pos == -1:
                    return None
                    
                start_pos += len(start_tag)
                end_pos = content.find(end_tag, start_pos)
                
                if end_pos == -1:
                    return None
                    
                return content[start_pos:end_pos].strip()
            
            # Extract each section
            for section in sections:
                section_content = extract_section(response, section)
                if section_content:
                    aggregated_feedback[section] = section_content
                else:
                    aggregated_feedback[section] = ""
            
            return aggregated_feedback
            
        except Exception as e:
            logging.error(f"Error generating aggregated feedback: {str(e)}")
            return {}
    
    def _generate_combined_report(self, results: Dict[str, Any]) -> None:
        """
        Generate a combined HTML report with all evaluations.
        
        Args:
            results: Evaluation results dictionary
        """
        report_path = os.path.join(self.output_dir, "evaluation_report.html")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Game Evaluation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
                .video-container {{ margin: 10px 0; }}
                .error-container {{ margin: 10px 0; background: #fff8f8; padding: 10px; border-left: 3px solid #f00; }}
                .evaluation-section {{ margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; }}
                .aggregated-feedback {{ margin: 20px 0; padding: 15px; background: #f0f7ff; border-left: 3px solid #0066cc; }}
                .console-errors {{ margin: 15px 0; padding: 10px; background: #fff8f8; border-left: 3px solid #f00; font-family: monospace; }}
                pre {{ background-color: #f3f3f3; padding: 8px; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <h1>Game Evaluation Report</h1>
            <p>Game path: {results["game_path"]}</p>
            
            <h2>Summary</h2>
            <p>Status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failed'
            }</span></p>
            <p>Total evaluations: {len(results["evaluations"])}</p>
            
            <!-- Console Errors Section -->
            <h2>Console Errors</h2>
        """
        
        # Add console errors if available
        if results.get("console_errors"):
            for context, errors in results["console_errors"].items():
                if errors.get("has_errors"):
                    html_content += f"""
                    <div class="console-errors">
                        <h3>Errors from {context}</h3>
                        <p>Error count: {errors.get("error_count", 0)}</p>
                        <pre>{json.dumps(errors.get("errors", []), indent=2)}</pre>
                    </div>
                    """
                else:
                    html_content += f"<p>No console errors from {context}.</p>"
        else:
            html_content += "<p>No console errors recorded.</p>"
            
        # Add aggregated feedback if available
        html_content += """
            <!-- Aggregated Feedback Section -->
            <h2>Aggregated Feedback</h2>
        """
        
        # Add aggregated feedback if available
        if results.get("aggregated_feedback"):
            aggregated = results["aggregated_feedback"]
            html_content += f"""
            <div class="aggregated-feedback">
                <h3>Critical Issues</h3>
                <div>{aggregated.get("critical_issues", "")}</div>
                
                <h3>Game Progression</h3>
                <div>{aggregated.get("game_progression", "")}</div>
                
                <h3>Game Mechanics</h3>
                <div>{aggregated.get("game_mechanics", "")}</div>
                
                <h3>Graphics and Animation</h3>
                <div>{aggregated.get("graphics_and_animation", "")}</div>
                
                <h3>Console Errors Analysis</h3>
                <div>{aggregated.get("console_errors", "")}</div>
                
                <h3>Recommendations</h3>
                <div>{aggregated.get("recommendations", "")}</div>
                
                <h3>Other Feedback</h3>
                <div>{aggregated.get("other_feedback", "")}</div>
                
                <h3>Conclusion</h3>
                <div>{aggregated.get("conclusion", "")}</div>
            </div>
            """
        else:
            html_content += "<p>No aggregated feedback available.</p>"
        
        # Add evaluations
        html_content += "<h2>Individual Test Evaluations</h2>"
        
        for eval in results["evaluations"]:
            button_id = eval.get("button_id", "")
            button_text = eval.get("button_text", "")
            test_mode = eval.get("test_mode", "")
            video_path = eval.get("video_path", "")
            
            rel_video_path = os.path.relpath(video_path, self.output_dir) if video_path else ""
            
            video_html = f"<video width=\"640\" height=\"480\" controls><source src=\"{rel_video_path}\" type=\"video/mp4\">Your browser does not support the video tag.</video>" if rel_video_path else "<p>No video available</p>"
            
            html_content += f"""
            <div class="evaluation-section">
                <h3>Test: {test_mode} ({button_text})</h3>
                <p>Button ID: {button_id}</p>
                
                <h4>Test Information</h4>
                <p><strong>What:</strong> {eval.get("test_description", "")}</p>
                <p><strong>How:</strong> {eval.get("strategy_description", "")}</p>
                <p><strong>Expected Outcome:</strong> {eval.get("expected_outcome", "")}</p>
                
                <h4>Evaluation</h4>
                <p><strong>Outcome Reached:</strong> {eval.get("outcome_reached", "")}</p>
                <p><strong>Strategy Evaluation:</strong> {eval.get("strategy_evaluation", "")}</p>
                <p><strong>Improvements:</strong> {eval.get("improvements", "")}</p>
                <p><strong>Overall Assessment:</strong> {eval.get("overall_assessment", "")}</p>
                <p><strong>Other Feedback:</strong> {eval.get("other_feedback", "")}</p>
                
                <div class="video-container">
                    <h4>Gameplay Video</h4>
                    {video_html}
                </div>
            </div>
            """
        
        # Add errors if any
        if results["errors"]:
            html_content += "<h2>Errors</h2><div class='error-container'><ul>"
            for error in results["errors"]:
                html_content += f"<li>{error}</li>"
            html_content += "</ul></div>"
        
        html_content += """
        </body>
        </html>
        """
        
        with open(report_path, "w") as f:
            f.write(html_content)
        
        logging.info(f"Generated evaluation report: {report_path}")

    def get_instructions(self) -> str:
        """
        Get the instructions for the game play tester.
        """
        return f"""
You are a professional JavaScript game developer and game tester known for providing precise feedback by evaluating gameplay videos of 2D video games made using p5.js.
You are evaluating a game developed in JavaScript with the following description and controls:
<game_description>
{self.game_description}
</game_description>
<game_controls>
{self.game_controls}
</game_controls>

Following were the constraints on the game development team:
<game_development_constraints>
- Use keyboard keys for controls. No mouse controls. Only allowed keys: [Arrow keys (37-40), SPACE (32), Z (90), SHIFT (16), ENTER to start the game (13), R to restart the game after a win/loss (82), ESC to pause the game (27).]
- The game should be playable in a web browser.
- The game must start on pressing ENTER key, pauses when ESC key is pressed, and restart on pressing R key at the end of the game.
- No external images, sprites, or assets. No sound or music effects.
- All graphics and animations are created using p5.js.
</game_development_constraints>
"""

# Async function for easy API
async def evaluate_game_async(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game asynchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = VLMPlayEvaluation(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()

# Sync wrapper for easier use
def evaluate_game(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game synchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    print(f"Evaluating game: {game_path}")
    return asyncio.run(evaluate_game_async(game_path, output_dir, api_key))


# CLI entrypoint
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate games using VLM.")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument("--output", "-o", help="Directory to save recorded videos and evaluation results")
    parser.add_argument("--api-key", help="Google API key for Gemini access")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run evaluation
    results = evaluate_game(args.game_path, args.output, args.api_key)
    
    if results["success"]:
        print(f"Evaluation completed successfully. See results in {args.output or os.path.join(os.path.dirname(args.game_path), 'vlm_evaluation')}")
        sys.exit(0)
    else:
        print(f"Evaluation failed: {results.get('errors', ['Unknown error'])}")
        sys.exit(1)

if __name__ == "__main__":
    main()

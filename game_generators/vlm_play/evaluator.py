import os
import sys
import logging
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List

# Import from our modules
from .browser_utils import BrowserManager, PLAYWRIGHT_ENABLED
from .gemini_api import GeminiEvaluator
from .video_processing import VideoRecorder


class GameEvaluator:
    """Main class to coordinate game evaluation process."""
    
    def __init__(
        self, game_path: str, api_key: Optional[str] = None, verbose: bool = True
    ):
        """
        Initialize the game evaluator.
        
        Args:
            game_path: Path to the game directory or HTML file
            api_key: Google API key for Gemini access
            verbose: Whether to enable verbose logging
        """
        self.game_path = os.path.abspath(game_path)
        self.verbose = verbose
        
        # Check if game_path is valid
        if not os.path.exists(self.game_path):
            raise FileNotFoundError(f"Game path does not exist: {self.game_path}")
            
        # Setup output directory
        self.output_dir = os.path.join(
            os.path.dirname(os.path.abspath(self.game_path)), "evaluation_results"
        )
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize modules
        self.browser_manager = BrowserManager(self.game_path)
        self.gemini_evaluator = GeminiEvaluator(api_key)
        self.video_recorder = VideoRecorder(self.output_dir)
        
    async def evaluate_all_modes(self) -> Dict[str, Any]:
        """
        Main method to evaluate all modes of the game with focus on recording only the canvas.
        
        Returns:
            Dictionary with evaluation results
        """
        if not PLAYWRIGHT_ENABLED:
            return {
                "success": False,
                "error": "Playwright not installed. Install with: pip install playwright && python -m playwright install firefox",
            }
            
        results = {
            "success": False,
            "game_path": self.game_path,
            "video_paths": [],
            "evaluations": [],
            "error": None,
        }
        
        try:
            # Setup browser
            browser, url = await self.browser_manager.setup_browser()
            
            try:
                # Create a new context and page
                context = await browser.new_context()
                page = await context.new_page()
                
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=15000)
                logging.info(f"Page loaded: {self.game_path}")
                
                # Wait for page to stabilize
                await page.wait_for_timeout(2000)
                
                # Find all test buttons
                test_buttons = await self.browser_manager.find_game_test_buttons(page)
                
                if not test_buttons:
                    results["error"] = "No test buttons found on the page"
                    return results
                    
                logging.info(f"Found {len(test_buttons)} test buttons: {test_buttons}")
                
                # Process each button sequentially
                for button_info in test_buttons:
                    button_id = button_info["id"]
                    
                    # Check if MP4 already exists for this mode
                    mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                    
                    if os.path.exists(mp4_path):
                        logging.info(f"Found existing MP4 for {button_id}, skipping video generation")
                        video_path = mp4_path
                    else:
                        # Record gameplay using the new canvas-focused approach
                        logging.info(f"Recording gameplay for button: {button_id}")
                        video_path = await self.record_specific_mode(browser, context, page, button_id)
                        
                        if not video_path:
                            logging.error(f"Failed to record video for {button_id}")
                            continue
                    
                    # Add to results
                    results["video_paths"].append(video_path)
                    
                    # Evaluate the video
                    evaluation = await self._evaluate_game_mode(
                        video_path=video_path,
                        button_id=button_id,
                    )
                    
                    if evaluation:
                        # Save mode-specific evaluation
                        results["evaluations"].append(evaluation)
                        
                # Set success if we have at least one evaluation
                results["success"] = len(results["evaluations"]) > 0
                
            finally:
                # Clean up browser
                await browser.close()
                await self.browser_manager.close()
                
        except Exception as e:
            results["error"] = str(e)
            logging.error(f"Error during evaluation: {str(e)}")
            
        return results
        
    async def _evaluate_game_mode(
        self, video_path: str, button_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluate a specific game mode using Gemini.
        
        Args:
            video_path: Path to the recorded video
            button_id: ID of the button/mode being evaluated
            
        Returns:
            Dictionary with evaluation results or None if failed
        """
        try:
            # Send video to Gemini for evaluation
            response_text = await self.gemini_evaluator.evaluate_video(video_path)
            
            if not response_text:
                logging.error(f"Failed to get evaluation for {button_id}")
                return None
                
            # Parse the response
            evaluation = self.gemini_evaluator.parse_evaluation_response(response_text)
            
            # Add metadata
            evaluation["button_id"] = button_id
            evaluation["video_path"] = video_path
            evaluation["raw_response"] = response_text
            
            # Save to JSON file
            json_path = os.path.join(self.output_dir, f"{button_id}_evaluation.json")
            with open(json_path, "w") as f:
                json.dump(evaluation, f, indent=2)
                
            logging.info(f"Saved evaluation to {json_path}")
            return evaluation
            
        except Exception as e:
            logging.error(f"Error evaluating game mode {button_id}: {str(e)}")
            return None
            
    async def record_specific_mode(self, browser, context, page, button_id: str) -> Optional[str]:
        """
        Record gameplay for a specific mode with focus on the canvas.
        
        Args:
            browser: Browser instance
            context: Browser context
            page: Page instance
            button_id: ID of the button/mode to record
            
        Returns:
            Path to recorded video or None if failed
        """
        try:
            # 1. Navigate to canvas and ensure it's the focus
            canvas_found = await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
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
                logging.error("Canvas element not found on the page")
                return None
            
            # 2. Get canvas dimensions
            canvas_dimensions = await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return null;
                    return {
                        width: canvas.width || canvas.clientWidth,
                        height: canvas.height || canvas.clientHeight
                    };
                }
            """)
            
            if not canvas_dimensions:
                logging.error("Could not determine canvas dimensions")
                return None
            
            # 3. Press the test button to activate the test mode
            button = await page.query_selector(f"#{button_id}")
            if button:
                await button.click()
                logging.info(f"Clicked test button: {button_id}")
                await page.wait_for_timeout(1000)  # Wait for mode to change
            else:
                # Try alternative approach to find and click the button
                button_found = await page.evaluate(f"""
                    () => {{
                        const button = document.getElementById('{button_id}');
                        if (button) {{
                            button.click();
                            return true;
                        }}
                        return false;
                    }}
                """)
                
                if not button_found:
                    logging.error(f"Button {button_id} not found")
                    return None
            
            # 4. Create a new context with recording enabled
            recording_context = await browser.new_context(
                viewport=canvas_dimensions,
                record_video_dir=self.output_dir,
                record_video_size=canvas_dimensions
            )
            
            try:
                recording_page = await recording_context.new_page()
                
                # Go to the page
                await recording_page.goto(page.url, wait_until="networkidle", timeout=15000)
                
                # Hide everything except canvas
                await recording_page.evaluate("""
                    () => {
                        // Style body and hide everything else
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                        document.body.style.overflow = 'hidden';
                        document.body.style.background = '#000';
                        
                        const canvas = document.querySelector('canvas');
                        if (!canvas) return;
                        
                        // Position canvas at center of viewport
                        canvas.style.position = 'absolute';
                        canvas.style.left = '50%';
                        canvas.style.top = '50%';
                        canvas.style.transform = 'translate(-50%, -50%)';
                        
                        // Hide everything else
                        Array.from(document.body.children).forEach(el => {
                            if (el !== canvas && !el.contains(canvas)) {
                                el.style.display = 'none';
                            }
                        });
                    }
                """)
                
                # Click the button again in this new context
                await recording_page.evaluate(f"""
                    () => {{
                        const button = document.getElementById('{button_id}');
                        if (button) button.click();
                    }}
                """)
                await recording_page.wait_for_timeout(1000)
                
                # 5. Press ENTER to start the game
                logging.info("Pressing ENTER to start the game")
                await recording_page.keyboard.press("Enter")
                
                # Record for 30 seconds
                logging.info(f"Recording canvas for {button_id} for 30 seconds")
                await recording_page.wait_for_timeout(30000)
                
                # Close the recording context
                await recording_context.close()
                
                # Find the recorded video file
                video_files = [f for f in os.listdir(self.output_dir) if f.endswith(".webm")]
                if video_files:
                    latest_video = max(video_files, key=lambda f: os.path.getmtime(os.path.join(self.output_dir, f)))
                    webm_path = os.path.join(self.output_dir, latest_video)
                    
                    # Convert to MP4
                    mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                    
                    # Use FFmpeg to convert
                    ffmpeg_cmd = [
                        "ffmpeg", "-y", "-i", webm_path, 
                        "-c:v", "libx264", "-crf", "23", "-preset", "medium",
                        mp4_path
                    ]
                    
                    process = await asyncio.create_subprocess_exec(
                        *ffmpeg_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode == 0 and os.path.exists(mp4_path):
                        logging.info(f"Successfully converted video to {mp4_path}")
                        
                        # Delete the webm file
                        os.remove(webm_path)
                        
                        return mp4_path
                    else:
                        logging.error(f"Failed to convert video: {stderr.decode()}")
                else:
                    logging.error("No recorded video file found")
                    
                return None
                
            finally:
                # Ensure recording context is closed
                if 'recording_context' in locals():
                    await recording_context.close()
                
        except Exception as e:
            logging.error(f"Error recording mode {button_id}: {str(e)}")
            return None

    async def record_and_evaluate_game(self) -> Dict[str, Any]:
        """
        Record gameplay videos and evaluate them for all modes.
        
        Returns:
            Dictionary with evaluation results
        """
        return await self.evaluate_all_modes()

# Async function for easy API
async def evaluate_game_original_async(
    game_path: str, api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluate a game asynchronously using the original evaluator.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = GameEvaluator(game_path, api_key)
    return await evaluator.evaluate_all_modes()

# Sync wrapper for easier use
def evaluate_game_original(game_path: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game synchronously using the original evaluator.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    return asyncio.run(evaluate_game_original_async(game_path, api_key)) 
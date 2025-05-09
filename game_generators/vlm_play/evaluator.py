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
        Main method to evaluate all modes of the game.
        
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
                
                # Log any console errors
                page.on(
                    "console",
                    lambda msg: (
                        logging.warning(f"Console {msg.type}: {msg.text}")
                        if msg.type == "error"
                        else None
                    ),
                )
                
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=15000)
                logging.info(f"Page loaded: {self.game_path}")
                
                # Wait for page to stabilize
                await page.wait_for_timeout(5000)
                
                # Find all test buttons
                ai_test_buttons = await self.browser_manager.find_game_test_buttons(page)
                
                if not ai_test_buttons:
                    results["error"] = "No buttons found on the page"
                    return results
                    
                logging.info(
                    f"Found {len(ai_test_buttons)} test buttons: {ai_test_buttons}"
                )
                
                # Process each button sequentially
                for button_info in ai_test_buttons:
                    button_id = button_info["id"]
                    
                    # Check if MP4 already exists for this mode
                    mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                    
                    if os.path.exists(mp4_path):
                        logging.info(
                            f"Found existing MP4 for {button_id}, skipping video generation"
                        )
                        video_path = mp4_path
                        
                        # Add to results
                        results["video_paths"].append(video_path)
                        
                        # Evaluate existing video
                        evaluation = await self._evaluate_game_mode(
                            video_path=video_path,
                            button_id=button_id,
                        )
                        
                        if evaluation:
                            # Save mode-specific evaluation
                            results["evaluations"].append(evaluation)
                        continue
                        
                    # Start a new context and page for each button
                    mode_context = await browser.new_context()
                    mode_page = await mode_context.new_page()
                    
                    try:
                        # Load the page
                        await mode_page.goto(url, wait_until="networkidle", timeout=15000)
                        await mode_page.wait_for_timeout(2000)
                        
                        # Click the button to activate the mode if needed
                        mode_changed = await self.browser_manager.verify_mode_change(
                            mode_page, button_id
                        )
                        
                        if not mode_changed:
                            logging.warning(
                                f"Button {button_id} did not change the game state, proceeding anyway"
                            )
                            
                        # Record gameplay
                        recording_success, video_path = await self.video_recorder.record_gameplay(
                            mode_page, button_id, duration=30
                        )
                        
                        if recording_success and video_path:
                            # Add to results
                            results["video_paths"].append(video_path)
                            
                            # Clean up temp files
                            await self.video_recorder.cleanup_video_files(button_id)
                            
                            # Evaluate the video
                            evaluation = await self._evaluate_game_mode(
                                video_path=video_path,
                                button_id=button_id,
                            )
                            
                            if evaluation:
                                # Save mode-specific evaluation
                                results["evaluations"].append(evaluation)
                                
                    except Exception as e:
                        logging.error(f"Error processing mode {button_id}: {str(e)}")
                    finally:
                        # Close the mode context
                        await mode_context.close()
                        
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
            
    async def record_and_evaluate_game(self) -> Dict[str, Any]:
        """
        Record and evaluate the game.
        
        Returns:
            Dictionary with evaluation results
        """
        return await self.evaluate_all_modes()


async def evaluate_game_async(
    game_path: str, api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Asynchronous function to evaluate a game.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = GameEvaluator(game_path, api_key)
    return await evaluator.record_and_evaluate_game()


def evaluate_game(game_path: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronous function to evaluate a game.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    return asyncio.run(evaluate_game_async(game_path, api_key)) 
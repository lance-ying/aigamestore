"""
Enhanced version of the VLMPlayEvaluationGuided class using the improved BrowserManager.
This provides the same interface as the original VLMPlayEvaluationGuided, but with
enhanced error handling and game state validation from the game_check controller.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import asyncio

# Import the enhanced BrowserManager
from .browser_utils_updated import BrowserManager as EnhancedBrowserManager

# Import original components to integrate with
from .vlm_eval_guided import VLMPlayEvaluationGuided
from .video_processing import VideoRecorder
from .gemini_api import GeminiEvaluator


class EnhancedVLMEvaluationGuided:
    """
    Enhanced version of VLMPlayEvaluationGuided with improved error handling.
    """
    
    def __init__(self, game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize with the same parameters as the original VLMPlayEvaluationGuided.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save outputs
            api_key: Optional API key for Gemini
        """
        # Create the original evaluator
        self.original_evaluator = VLMPlayEvaluationGuided(game_path, output_dir, api_key)
        
        # Store key paths and objects
        self.game_path = self.original_evaluator.game_path
        self.output_dir = self.original_evaluator.output_dir
        self.gemini_evaluator = self.original_evaluator.gemini_evaluator
        self.metadata = self.original_evaluator.metadata
        self.test_info = self.original_evaluator.test_info
        
        # Store any game info from the original evaluator
        if hasattr(self.original_evaluator, 'game_concept'):
            self.game_concept = self.original_evaluator.game_concept
        if hasattr(self.original_evaluator, 'game_description'):
            self.game_description = self.original_evaluator.game_description
        if hasattr(self.original_evaluator, 'game_controls'):
            self.game_controls = self.original_evaluator.game_controls
            
        # Create our enhanced browser manager
        self._browser_manager = None
        
    async def evaluate_game(self) -> Dict[str, Any]:
        """
        Evaluate the game using the enhanced browser manager but keeping original flow.
        
        Returns:
            Results dictionary from evaluation
        """
        # Create a new results dict
        results = {
            "success": False,
            "game_path": self.game_path,
            "evaluations": [],
            "videos": {},
            "errors": [],
            "console_errors": {},
            "aggregated_feedback": {},
            "enhanced": True
        }
        
        try:
            # Log start of evaluation
            logging.info(f"Starting enhanced VLM guided evaluation for game: {self.game_path}")
            
            # Temporarily replace the _record_test_videos method on the original evaluator
            # with our enhanced version that uses the updated BrowserManager
            original_record_method = self.original_evaluator._record_test_videos
            self.original_evaluator._record_test_videos = self._enhanced_record_test_videos
            
            # Call the original evaluate_game method
            original_results = await self.original_evaluator.evaluate_game()
            
            # Restore original method
            self.original_evaluator._record_test_videos = original_record_method
            
            # Copy over the results
            results.update(original_results)
            
            # Add enhanced information if available
            if hasattr(self, '_browser_manager') and self._browser_manager:
                # Add structured error information
                if hasattr(self._browser_manager, 'structured_errors'):
                    structured_errors = self._browser_manager.structured_errors
                    results["structured_errors"] = structured_errors
                    
                    # Add deduplicated errors if available
                    if hasattr(self._browser_manager, '_deduplicate_errors'):
                        results["deduplicated_errors"] = self._browser_manager._deduplicate_errors(structured_errors)
            
            # Mark success based on having evaluations and no critical errors
            results["success"] = len(results.get("evaluations", [])) > 0 and not any(
                "critical" in err.lower() for err in results.get("errors", [])
            )
            
        except Exception as e:
            error_msg = f"Error during enhanced guided evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
            
            # Include any structured errors we collected before the error
            if hasattr(self, '_browser_manager') and self._browser_manager:
                if hasattr(self._browser_manager, 'structured_errors'):
                    results["structured_errors"] = self._browser_manager.structured_errors
        
        return results
    
    async def _enhanced_record_test_videos(self) -> Dict[str, str]:
        """
        Enhanced version of _record_test_videos that uses the updated BrowserManager.
        
        Returns:
            Dictionary mapping test modes to video file paths
        """
        video_paths = {}
        
        # Create directories
        test_videos_dir = os.path.join(self.output_dir, "test_videos")
        os.makedirs(test_videos_dir, exist_ok=True)
        
        # Setup enhanced browser manager
        self._browser_manager = EnhancedBrowserManager(self.game_path)
        browser, url = await self._browser_manager.setup_browser()
        
        try:
            # Get all test buttons
            context = await browser.new_context()
            page = await context.new_page()
            
            # Set up console error tracking
            await self._browser_manager.setup_console_error_tracking(page)
            
            # Navigate to the page
            try:
                await page.goto(url, wait_until="networkidle", timeout=15000)
                await page.wait_for_timeout(2000)
                
                # Find all test buttons
                test_buttons = await self._browser_manager.find_game_test_buttons(page)
                logging.info(f"Found {len(test_buttons)} test buttons")
                
                # Save this as instance attribute for later use in evaluation
                self.original_evaluator.browser_manager = self._browser_manager
                
            except Exception as e:
                logging.error(f"Error navigating to game: {str(e)}")
                
                # Get console errors
                console_errors = self._browser_manager.get_console_errors_summary()
                logging.error(f"Console errors: {json.dumps(console_errors, indent=2)}")
                
                # Add structured error
                if hasattr(self._browser_manager, '_create_structured_error'):
                    error = self._browser_manager._create_structured_error(
                        message=f"Failed to navigate to game: {str(e)}",
                        error_type="navigation_error",
                        context="game_evaluation"
                    )
                    self._browser_manager.structured_errors.append(error)
            
            finally:
                await context.close()
            
            # If we found buttons, process them
            if test_buttons:
                # Process each button sequentially
                for button_info in test_buttons:
                    button_id = button_info["id"]
                    test_mode = button_info.get("testMode", "") or button_id
                    
                    logging.info(f"Processing button {button_id} for mode {test_mode}")
                    
                    try:
                        # Create a video recorder
                        video_recorder = VideoRecorder(self.output_dir)
                        
                        # Set up a new context
                        context = await browser.new_context()
                        page = await context.new_page()
                        await self._browser_manager.setup_console_error_tracking(page)
                        
                        # Navigate to the page
                        await page.goto(url, wait_until="networkidle", timeout=15000)
                        
                        # Click the button to set the test mode
                        button = await page.query_selector(f"#{button_id}")
                        if button:
                            await button.click()
                            logging.info(f"Clicked button {button_id}")
                        else:
                            logging.error(f"Button {button_id} not found")
                            continue
                        
                        # Press ENTER to start the game
                        await page.keyboard.press("Enter")
                        logging.info("Pressed ENTER to start the game")
                        
                        # Close this context before recording
                        await context.close()
                        
                        # Record the gameplay
                        video_path = await video_recorder.record_gameplay(
                            url=url,
                            duration=20,
                            title=f"Test mode: {test_mode}",
                            filename=f"{test_mode.lower()}.webm"
                        )
                        
                        if video_path and os.path.exists(video_path):
                            video_paths[test_mode] = video_path
                            logging.info(f"Successfully recorded video for {test_mode}: {video_path}")
                        else:
                            logging.warning(f"Failed to record video for {test_mode}")
                        
                    except Exception as e:
                        logging.error(f"Error processing button {button_id}: {str(e)}")
                        
                        # Add structured error
                        if hasattr(self._browser_manager, '_create_structured_error'):
                            error = self._browser_manager._create_structured_error(
                                message=f"Error processing test mode {test_mode}: {str(e)}",
                                error_type="test_processing_error",
                                context=f"button_{button_id}"
                            )
                            self._browser_manager.structured_errors.append(error)
            else:
                logging.warning("No test buttons found")
                
                # Try recording default gameplay without clicking any button
                try:
                    video_recorder = VideoRecorder(self.output_dir)
                    
                    video_path = await video_recorder.record_gameplay(
                        url=url,
                        duration=20,
                        title="Default gameplay",
                        filename="default.webm"
                    )
                    
                    if video_path and os.path.exists(video_path):
                        video_paths["default"] = video_path
                        logging.info(f"Recorded default gameplay video: {video_path}")
                except Exception as e:
                    logging.error(f"Error recording default gameplay: {str(e)}")
        
        except Exception as e:
            logging.error(f"Error in enhanced recording: {str(e)}")
            
            # Add structured error
            if hasattr(self._browser_manager, '_create_structured_error'):
                error = self._browser_manager._create_structured_error(
                    message=f"Error in test recording process: {str(e)}",
                    error_type="recording_error",
                    context="game_evaluation"
                )
                self._browser_manager.structured_errors.append(error)
        
        finally:
            # Close browser
            await browser.close()
            await self._browser_manager.close()
        
        return video_paths
        

async def evaluate_game_guided_enhanced(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game using the enhanced browser controller with guided VLM evaluation.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save outputs
        api_key: Optional API key for Gemini
        
    Returns:
        Results dictionary from evaluation
    """
    evaluator = EnhancedVLMEvaluationGuided(game_path, output_dir, api_key)
    return await evaluator.evaluate_game() 
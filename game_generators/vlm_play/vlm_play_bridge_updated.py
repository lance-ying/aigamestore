"""
Bridge module to use the enhanced BrowserManager in VLM play evaluations.
This file provides functions to seamlessly integrate the enhanced error handling
from game_check into the vlm_play modules without modifying the original files.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

# Import the enhanced BrowserManager
from .browser_utils_updated import BrowserManager as EnhancedBrowserManager

# Import original components to integrate with
from .vlm_play_test import VLMPlayEvaluation
from .video_processing import VideoRecorder


class EnhancedVLMEvaluation:
    """
    Wrapper class that enhances VLMPlayEvaluation with improved error handling.
    Uses the standard VLMPlayEvaluation interface but with enhanced browser controller.
    """
    
    def __init__(self, game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize with the same parameters as VLMPlayEvaluation.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save outputs
            api_key: Optional API key for Gemini
        """
        # Create the original evaluator
        self.original_evaluator = VLMPlayEvaluation(game_path, output_dir, api_key)
        
        # Store key paths
        self.game_path = self.original_evaluator.game_path
        self.output_dir = self.original_evaluator.output_dir
        
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
            "aggregated_feedback": {}
        }
        
        try:
            # Log start of evaluation
            logging.info(f"Starting enhanced VLM evaluation for game: {self.game_path}")
            
            # Use our original evaluator, but replace its _record_test_videos method
            # with our enhanced version that uses the updated BrowserManager
            original_record_videos_method = self.original_evaluator._record_test_videos_parallel
            self.original_evaluator._record_test_videos_parallel = self._enhanced_record_test_videos
            
            # Call the original evaluate_game method
            original_results = await self.original_evaluator.evaluate_game()
            
            # Restore original method
            self.original_evaluator._record_test_videos_parallel = original_record_videos_method
            
            # Combine results
            results.update(original_results)
            
            # Add structured error information if available
            if hasattr(self, '_browser_manager') and self._browser_manager:
                # Get all structured errors
                if hasattr(self._browser_manager, 'structured_errors'):
                    structured_errors = self._browser_manager.structured_errors
                    results["structured_errors"] = structured_errors
                    
                    # Add deduplicated errors
                    if hasattr(self._browser_manager, '_deduplicate_errors'):
                        results["deduplicated_errors"] = self._browser_manager._deduplicate_errors(structured_errors)
            
            # Mark success based on having evaluations and no critical errors
            results["success"] = len(results.get("evaluations", [])) > 0 and not any(
                "critical" in err.lower() for err in results.get("errors", [])
            )
            
        except Exception as e:
            error_msg = f"Error during enhanced game evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
            
            # Try to include any structured errors we collected before the exception
            if hasattr(self, '_browser_manager') and self._browser_manager and hasattr(self._browser_manager, 'structured_errors'):
                results["structured_errors"] = self._browser_manager.structured_errors
        
        return results
    
    async def _enhanced_record_test_videos(self, test_buttons: List[Dict[str, Any]]) -> Dict[str, Tuple[Dict[str, Any], str]]:
        """
        Enhanced version of _record_test_videos_parallel that uses the updated BrowserManager.
        
        Args:
            test_buttons: List of test button information
            
        Returns:
            Dictionary mapping button IDs to (button_info, video_path) tuples
        """
        video_paths = {}  # Use button_id as key
        
        # Create a single test_videos directory for all recordings
        test_videos_dir = os.path.join(self.output_dir, "test_videos")
        os.makedirs(test_videos_dir, exist_ok=True)
        
        # Setup enhanced browser manager
        self._browser_manager = EnhancedBrowserManager(self.game_path)
        browser, url = await self._browser_manager.setup_browser()
        
        try:
            # Process each button sequentially (more stable than parallel)
            for button_info in test_buttons:
                button_id = button_info["id"]
                logging.info(f"Enhanced recording for button {button_id}")
                
                try:
                    # Use the original recording method but with our enhanced browser
                    button_info, video_path = await self.original_evaluator._record_single_video(
                        browser, url, button_info, test_videos_dir
                    )
                    
                    # Save this as instance attribute for usage in evaluation
                    self.original_evaluator.browser_manager = self._browser_manager
                    
                    if video_path and os.path.exists(video_path):
                        video_paths[button_id] = (button_info, video_path)
                        logging.info(f"Enhanced recording successful for {button_id}: {video_path}")
                    else:
                        logging.warning(f"Enhanced recording failed for {button_id}")
                        
                    # Add a delay between recordings to ensure resources are freed
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logging.error(f"Error in enhanced recording for {button_id}: {str(e)}")
        
        finally:
            # Close browser
            await browser.close()
            await self._browser_manager.close()
        
        return video_paths


async def evaluate_game_enhanced(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game using the enhanced browser controller.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save outputs
        api_key: Optional API key for Gemini
        
    Returns:
        Results dictionary from evaluation
    """
    evaluator = EnhancedVLMEvaluation(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()


async def test_record_only_enhanced(game_path: str, output_dir: Optional[str] = None, only_button: Optional[str] = None):
    """
    Enhanced version of test_record_only function with improved error handling.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save outputs
        only_button: Optional button ID to test
        
    Returns:
        Results dictionary
    """
    results = {
        "success": False,
        "game_path": game_path,
        "video_paths": [],
        "errors": [],
        "structured_errors": []
    }
    
    try:
        # Setup browser to find TEST buttons
        browser_manager = EnhancedBrowserManager(game_path)
        browser, url = await browser_manager.setup_browser()
        
        # Create a context and page
        context = await browser.new_context()
        page = await context.new_page()
        
        # Set up console error tracking
        await browser_manager.setup_console_error_tracking(page)
        
        # Navigate to the page
        await page.goto(url, wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Find all TEST buttons with the new format
        test_buttons = await browser_manager.find_game_test_buttons(page)
        
        # Close the context as we'll create new ones for recording
        await context.close()
        
        if not test_buttons:
            error_msg = "No TEST buttons found on the page"
            print(f"Error: {error_msg}")
            results["errors"].append(error_msg)
            return results
        
        print(f"Found {len(test_buttons)} TEST buttons:")
        for i, btn in enumerate(test_buttons):
            print(f"  {i+1}. ID: {btn['id']}, Text: {btn['text']}, Mode: {btn['testMode']}")
        
        # Filter by only_button if provided
        if only_button:
            test_buttons = [btn for btn in test_buttons if btn["id"] == only_button]
            if not test_buttons:
                error_msg = f"Button with ID '{only_button}' not found"
                print(f"Error: {error_msg}")
                results["errors"].append(error_msg)
                return results
        
        # Create output directory
        if output_dir:
            output_path = output_dir
        else:
            output_path = os.path.join(os.path.dirname(game_path), "vlm_evaluation")
        
        os.makedirs(output_path, exist_ok=True)
        
        # Create video recorder
        video_recorder = VideoRecorder(output_path)
        
        # Record videos for each button
        for button_info in test_buttons:
            button_id = button_info["id"]
            test_mode = button_info.get("testMode", "")
            button_text = button_info.get("text", "")
            
            print(f"Recording for button {button_id} (Mode: {test_mode}, Text: {button_text})")
            
            # Create new context for this recording
            context = await browser.new_context()
            page = await context.new_page()
            await browser_manager.setup_console_error_tracking(page)
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=15000)
                
                # Wait for canvas
                canvas_found = False
                retry_count = 0
                max_retries = 3
                
                while not canvas_found and retry_count < max_retries:
                    canvas_found = await page.evaluate("""
                        () => {
                            const canvas = document.querySelector('canvas');
                            return !!canvas;
                        }
                    """)
                    
                    if not canvas_found:
                        retry_count += 1
                        print(f"Canvas not found on attempt {retry_count}, waiting and retrying...")
                        await page.wait_for_timeout(2000)
                
                if not canvas_found:
                    print("Error: Canvas element not found on the page after multiple attempts")
                    # Get console errors
                    console_errors = browser_manager.get_console_errors_summary()
                    print(f"Console errors: {console_errors['errors']}")
                    
                    # Add structured errors if available
                    if hasattr(browser_manager, 'structured_errors'):
                        results["structured_errors"].extend(browser_manager.structured_errors)
                    
                    continue
                
                # Try to click the button
                try:
                    button = await page.query_selector(f"#{button_id}")
                    if button:
                        await button.click()
                        print(f"Clicked button: {button_id}")
                    else:
                        print(f"Error: Button '{button_id}' not found")
                        continue
                except Exception as e:
                    print(f"Error clicking button: {str(e)}")
                    continue
                
                # Press ENTER to start the game
                await page.keyboard.press("Enter")
                
                # Create a new recording context
                await context.close()
                
                try:
                    # Record 20 seconds of gameplay
                    video_path = await video_recorder.record_gameplay(
                        url=url,
                        duration=20,
                        title=f"Test: {test_mode or button_id}",
                        filename=f"{button_id.lower()}.webm"
                    )
                    
                    if video_path and os.path.exists(video_path):
                        print(f"Successfully recorded video: {video_path}")
                        results["video_paths"].append(video_path)
                    else:
                        print(f"Failed to record video for {button_id}")
                        
                except Exception as e:
                    print(f"Error during video recording: {str(e)}")
                
            except Exception as e:
                print(f"Error processing button {button_id}: {str(e)}")
            
            finally:
                # Ensure context is closed
                if context:
                    try:
                        await context.close()
                    except:
                        pass
        
        # Update results
        results["success"] = len(results["video_paths"]) > 0
        
        # Include structured error information
        if hasattr(browser_manager, 'structured_errors'):
            results["structured_errors"] = browser_manager.structured_errors
            
            # Add deduplicated errors if available
            if hasattr(browser_manager, '_deduplicate_errors'):
                results["deduplicated_errors"] = browser_manager._deduplicate_errors(
                    browser_manager.structured_errors
                )
        
        # Include error summary
        error_summary = browser_manager.get_console_errors_summary()
        results["console_errors_summary"] = error_summary
    
    except Exception as e:
        error_msg = f"Error in record_only: {str(e)}"
        print(f"Error: {error_msg}")
        results["errors"].append(error_msg)
    
    finally:
        # Close browser if it was created
        if 'browser' in locals():
            await browser.close()
        
        if 'browser_manager' in locals():
            await browser_manager.close()
            
            # Include any structured errors in the results
            if hasattr(browser_manager, 'structured_errors'):
                results["structured_errors"] = browser_manager.structured_errors
    
    return results 
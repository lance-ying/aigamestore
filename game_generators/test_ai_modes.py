#!/usr/bin/env python3
"""
Test script to automate gameplay testing with different AI modes.
This script:
1. Cycles through each AI test mode
2. Records 30 seconds of gameplay for each mode
3. Restarts the browser between tests
"""

import os
import sys
import logging
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional

# Import from vlm_play package directly instead of relative imports
from vlm_play.browser_utils import BrowserManager
from vlm_play.video_processing import VideoRecorder

class AIModeTester:
    """Class to test different AI modes and record videos."""
    
    def __init__(self, game_path: str, output_dir: Optional[str] = None):
        """
        Initialize the AI mode tester.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save recorded videos
        """
        self.game_path = os.path.abspath(game_path)
        
        # Setup output directory
        if output_dir:
            self.output_dir = output_dir
        else:
            self.output_dir = os.path.join(os.path.dirname(self.game_path), "ai_mode_tests")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Define AI test modes
        self.ai_modes = [
            {"id": "ai_test_1ModeBtn", "name": "AI_Win"},
            {"id": "ai_test_2ModeBtn", "name": "AI_Movement_Test"},
            {"id": "ai_test_3ModeBtn", "name": "AI_Collision_Test"},
            {"id": "ai_test_4ModeBtn", "name": "AI_PowerUp_Test"}
        ]
        
        # Initialize video recorder
        self.video_recorder = VideoRecorder(self.output_dir)
    
    async def test_all_modes(self) -> Dict[str, Any]:
        """
        Test all AI modes and record videos.
        
        Returns:
            Dictionary with results
        """
        results = {
            "success": False,
            "game_path": self.game_path,
            "video_paths": [],
            "errors": []
        }
        
        for mode in self.ai_modes:
            mode_id = mode["id"]
            mode_name = mode["name"]
            
            logging.info(f"Testing AI mode: {mode_name} (Button ID: {mode_id})")
            
            # Create new browser manager for each test
            browser_manager = BrowserManager(self.game_path)
            
            try:
                # Setup browser
                browser, url = await browser_manager.setup_browser()
                
                try:
                    # Create a new context and page
                    context = await browser.new_context()
                    page = await context.new_page()
                    
                    # Navigate to the page
                    await page.goto(url, wait_until="networkidle", timeout=15000)
                    logging.info(f"Page loaded: {self.game_path}")
                    
                    # Wait for page to stabilize
                    await page.wait_for_timeout(2000)
                    
                    # Press Enter to start the game
                    logging.info("Pressing Enter to start the game")
                    await page.keyboard.press("Enter")
                    await page.wait_for_timeout(2000)
                    
                    # Click the button to activate the mode
                    button = await page.query_selector(f"#{mode_id}")
                    if button:
                        await button.click()
                        logging.info(f"Clicked button: {mode_id}")
                        await page.wait_for_timeout(1000)  # Wait for mode to change
                        
                        # Record gameplay for 30 seconds
                        recording_success, video_path = await self.video_recorder.record_gameplay(
                            page, mode_name, duration=30
                        )
                        
                        if recording_success and video_path:
                            logging.info(f"Successfully recorded {mode_name} to {video_path}")
                            results["video_paths"].append(video_path)
                        else:
                            error_msg = f"Failed to record video for {mode_name}"
                            logging.error(error_msg)
                            results["errors"].append(error_msg)
                    else:
                        error_msg = f"Button {mode_id} not found"
                        logging.error(error_msg)
                        results["errors"].append(error_msg)
                        
                        # Try to find button by alternative means
                        logging.info("Attempting to find button using JavaScript")
                        button_found = await page.evaluate(f"""
                            () => {{
                                const buttons = Array.from(document.querySelectorAll('button'));
                                const button = buttons.find(b => 
                                    b.id === '{mode_id}' || 
                                    b.onclick && b.onclick.toString().includes('AI_TEST_{mode_id.replace("ai_test_", "").replace("ModeBtn", "")}')
                                );
                                if (button) {{
                                    button.click();
                                    return true;
                                }}
                                return false;
                            }}
                        """)
                        
                        if button_found:
                            logging.info(f"Found and clicked button for {mode_name} using JavaScript")
                            await page.wait_for_timeout(1000)  # Wait for mode to change
                            
                            # Record gameplay
                            recording_success, video_path = await self.video_recorder.record_gameplay(
                                page, mode_name, duration=30
                            )
                            
                            if recording_success and video_path:
                                logging.info(f"Successfully recorded {mode_name} to {video_path}")
                                results["video_paths"].append(video_path)
                            else:
                                error_msg = f"Failed to record video for {mode_name} after finding button"
                                logging.error(error_msg)
                                results["errors"].append(error_msg)
                        else:
                            error_msg = f"Could not find button for {mode_name} using alternative methods"
                            logging.error(error_msg)
                            results["errors"].append(error_msg)
                
                finally:
                    # Clean up
                    await context.close()
                    await browser.close()
                    await browser_manager.close()
                    
            except Exception as e:
                error_msg = f"Error testing mode {mode_name}: {str(e)}"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                
                # Make sure to clean up browser
                await browser_manager.close()
        
        # Set success if we have at least one video
        results["success"] = len(results["video_paths"]) > 0
        
        return results

async def test_ai_modes_async(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Asynchronous function to test AI modes and record videos.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with results
    """
    tester = AIModeTester(game_path, output_dir)
    return await tester.test_all_modes()

def test_ai_modes(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronous wrapper for test_ai_modes_async.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with results
    """
    return asyncio.run(test_ai_modes_async(game_path, output_dir))

def main():
    """Parse command line arguments and test AI modes."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Test different AI modes and record gameplay videos"
    )
    
    parser.add_argument(
        "--game_path", required=True, help="Path to the game directory or HTML file to test"
    )
    
    parser.add_argument(
        "--output-dir",
        help="Directory to save output videos (defaults to 'ai_mode_tests' in game directory)",
    )
    
    parser.add_argument(
        "--verbose", action="store_true", help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logging.basicConfig(level=logging.INFO, 
                          format='%(asctime)s - %(levelname)s - %(message)s')
    else:
        logging.basicConfig(level=logging.WARNING,
                          format='%(asctime)s - %(levelname)s - %(message)s')
    
    try:
        # Test AI modes and record videos
        results = test_ai_modes(args.game_path, args.output_dir)
        
        # Print summary
        print("\n===== AI Mode Testing Summary =====")
        print(f"Game: {args.game_path}")
        if results["success"]:
            print(f"Status: Success - Recorded {len(results['video_paths'])} AI mode videos")
            
            # Print video paths
            for video_path in results["video_paths"]:
                print(f"  Video: {video_path}")
        else:
            print(f"Status: Failed - No videos were recorded")
            
        # Print errors if any
        if results["errors"]:
            print(f"\nErrors encountered ({len(results['errors'])}):")
            for error in results["errors"]:
                print(f"  - {error}")
            
        # Return success status
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during AI mode testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
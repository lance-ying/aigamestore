#!/usr/bin/env python3
"""
Command line interface to run gameplay sessions with different AI modes and record videos.
"""

import os
import sys
import argparse
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional

# Import from our modules using relative imports
from .browser_utils import BrowserManager, PLAYWRIGHT_ENABLED
from .video_processing import VideoRecorder


class GamePlayer:
    """Class to play and record gameplay for different AI modes."""
    
    def __init__(self, game_path: str, output_dir: Optional[str] = None):
        """
        Initialize the game player.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save recorded videos
        """
        self.game_path = os.path.abspath(game_path)
        
        # Setup output directory
        if output_dir:
            self.output_dir = output_dir
        else:
            self.output_dir = os.path.join(self.game_path, "vlm_eval")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize modules
        self.browser_manager = BrowserManager(self.game_path)
        self.video_recorder = VideoRecorder(self.output_dir)
    
    async def play_all_modes(self) -> Dict[str, Any]:
        """
        Main method to play and record all AI modes of the game.
        
        Returns:
            Dictionary with results
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
                await page.wait_for_timeout(2000)
                
                # Press Enter to start the game
                logging.info("Pressing Enter to start the game")
                await page.keyboard.press("Enter")
                await page.wait_for_timeout(2000)
                
                # Define the AI mode buttons based on the user's request
                ai_test_buttons = [
                    {"id": "ai_test_1ModeBtn", "text": "AI (Win)"},
                    {"id": "ai_test_2ModeBtn", "text": "AI (Movement Test)"},
                    {"id": "ai_test_3ModeBtn", "text": "AI (Vine Swinging)"},
                    {"id": "ai_test_4ModeBtn", "text": "AI (Hazard Avoidance)"},
                    {"id": "ai_test_5ModeBtn", "text": "AI (Power-up Test)"}
                ]
                
                logging.info(f"Found {len(ai_test_buttons)} test buttons")
                
                # Process each button sequentially
                for button_info in ai_test_buttons:
                    button_id = button_info["id"]
                    button_text = button_info["text"]
                    
                    logging.info(f"Processing mode: {button_text} (Button ID: {button_id})")
                    
                    # Check if MP4 already exists for this mode
                    mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                    
                    if os.path.exists(mp4_path):
                        logging.info(f"Found existing MP4 for {button_id}, skipping recording")
                        results["video_paths"].append(mp4_path)
                        continue
                    
                    try:
                        # Click the button to activate the mode
                        button = await page.query_selector(f"#{button_id}")
                        if button:
                            await button.click()
                            logging.info(f"Clicked button: {button_id}")
                            await page.wait_for_timeout(1000)  # Wait for mode to change
                        else:
                            logging.warning(f"Button {button_id} not found")
                            # Try to find the button using alternative selectors
                            try:
                                button = await page.query_selector(f"button[onclick*='{button_id.replace('ModeBtn', '')}']")
                                if button:
                                    await button.click()
                                    logging.info(f"Clicked button with alternative selector for: {button_id}")
                                    await page.wait_for_timeout(1000)  # Wait for mode to change
                                else:
                                    logging.warning(f"Button {button_id} not found with alternative selectors")
                                    continue
                            except Exception as btn_err:
                                logging.error(f"Error finding button {button_id} with alternative selectors: {str(btn_err)}")
                                continue
                        
                        # Record gameplay
                        recording_success, video_path = await self.video_recorder.record_gameplay(
                            page, button_id, duration=30
                        )
                        
                        if recording_success and video_path:
                            logging.info(f"Successfully recorded {button_text} to {video_path}")
                            results["video_paths"].append(video_path)
                            
                            # Clean up temp files
                            await self.video_recorder.cleanup_video_files(button_id)
                    
                    except Exception as e:
                        logging.error(f"Error processing mode {button_id}: {str(e)}")
                
                # Set success if we have at least one video
                results["success"] = len(results["video_paths"]) > 0
                
            finally:
                # Clean up browser
                await browser.close()
                await self.browser_manager.close()
                
        except Exception as e:
            results["error"] = str(e)
            logging.error(f"Error during gameplay recording: {str(e)}")
            
        return results

async def play_game_async(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Asynchronous function to play and record a game.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with results
    """
    player = GamePlayer(game_path, output_dir)
    return await player.play_all_modes()

def play_game(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronous wrapper for play_game_async.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with results
    """
    return asyncio.run(play_game_async(game_path, output_dir))

def main():
    """Parse command line arguments and play a game."""
    parser = argparse.ArgumentParser(
        description="Play games with different AI modes and record gameplay videos"
    )
    
    parser.add_argument(
        "--game_path", required=True, help="Path to the game directory or HTML file to play"
    )
    
    parser.add_argument(
        "--output-dir",
        help="Directory to save output videos (defaults to 'vlm_eval' in game directory)",
    )
    
    parser.add_argument(
        "--verbose", action="store_true", help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.INFO, 
                           format='%(asctime)s - %(levelname)s - %(message)s')
    else:
        logging.basicConfig(level=logging.WARNING,
                           format='%(asctime)s - %(levelname)s - %(message)s')
    
    try:
        # Play the game and record videos
        output_dir = args.output_dir
        if not output_dir:
            output_dir = os.path.join(args.game_path, "vlm_eval")
            
        results = play_game(args.game_path, output_dir)
        
        # Print summary
        print("\n===== Game Recording Summary =====")
        print(f"Game: {args.game_path}")
        if results["success"]:
            print(f"Status: Success - Recorded {len(results['video_paths'])} gameplay videos")
            
            # Print video paths
            for video_path in results["video_paths"]:
                print(f"  Video: {video_path}")
                
        else:
            print(f"Status: Failed - {results.get('error', 'Unknown error')}")
            
        # Return success status
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during gameplay recording: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
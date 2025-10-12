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
from .vlm_play_test import VLMPlayEvaluation, evaluate_game as vlm_evaluate_game


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
            self.output_dir = os.path.join(os.path.dirname(self.game_path), "vlm_eval")
        
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
                
                # Find all test buttons with the new format
                test_buttons = await self.browser_manager.find_game_test_buttons(page)
                
                logging.info(f"Found {len(test_buttons)} test buttons")
                
                # Process each button sequentially
                for button_info in test_buttons:
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
    """Parse command line arguments and play or evaluate a game."""
    parser = argparse.ArgumentParser(
        description="Play and evaluate games with automated testing"
    )
    
    # Main argument group
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Play command
    play_parser = subparsers.add_parser("play", help="Play and record gameplay videos")
    play_parser.add_argument("game_path", help="Path to the game directory or HTML file")
    play_parser.add_argument("--output", "-o", help="Directory to save recorded videos")
    
    # Evaluate command
    evaluate_parser = subparsers.add_parser("evaluate", help="Evaluate game with VLM")
    evaluate_parser.add_argument("game_path", help="Path to the game directory or HTML file")
    evaluate_parser.add_argument("--output", "-o", help="Directory to save evaluation results")
    evaluate_parser.add_argument("--api-key", help="Google API key for Gemini access")
    
    # Common options
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # If no command specified, show help
    if not args.command:
        parser.print_help()
        return 1
    
    # Execute command
    if args.command == "play":
        results = play_game(args.game_path, args.output)
        
        if results["success"]:
            print(f"Recording completed successfully. Recorded {len(results['video_paths'])} videos.")
            print(f"See results in {args.output or os.path.join(os.path.dirname(args.game_path), 'vlm_eval')}")
            return 0
        else:
            print(f"Recording failed: {results.get('error', 'Unknown error')}")
            return 1
            
    elif args.command == "evaluate":
        results = vlm_evaluate_game(args.game_path, args.output, args.api_key)
        
        if results["success"]:
            print(f"Evaluation completed successfully. See results in {args.output or os.path.join(os.path.dirname(args.game_path), 'vlm_evaluation')}")
            return 0
        else:
            print(f"Evaluation failed: {', '.join(results.get('errors', ['Unknown error']))}")
            return 1

if __name__ == "__main__":
    sys.exit(main()) 
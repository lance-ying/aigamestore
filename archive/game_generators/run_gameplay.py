#!/usr/bin/env python3
"""
Helper script to run the VLM gameplay recorder.
"""

import os
import sys
import logging
import asyncio

# Import the modules directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlm_play.browser_utils import BrowserManager
from vlm_play.video_processing import VideoRecorder

async def play_game_async(game_path, output_dir=None):
    """Run the gameplay recording for the specified game path."""
    # Setup output directory
    if not output_dir:
        output_dir = os.path.join(game_path, "vlm_eval")
    os.makedirs(output_dir, exist_ok=True)
    
    browser_manager = BrowserManager(game_path)
    video_recorder = VideoRecorder(output_dir)
    
    results = {
        "success": False,
        "video_paths": [],
        "error": None
    }
    
    try:
        # Setup browser
        browser, url = await browser_manager.setup_browser()
        
        try:
            # Create page
            context = await browser.new_context()
            page = await context.new_page()
            
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=15000)
            logging.info(f"Page loaded: {game_path}")
            
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
            
            for button_info in ai_test_buttons:
                button_id = button_info["id"]
                button_text = button_info["text"]
                
                logging.info(f"Processing mode: {button_text} (Button ID: {button_id})")
                
                # Check if MP4 already exists for this mode
                mp4_path = os.path.join(output_dir, f"{button_id}.mp4")
                
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
                        logging.warning(f"Button {button_id} not found, trying alternative selector")
                        # Try with alternative selector
                        button = await page.query_selector(f"button[onclick*='{button_id.replace('ModeBtn', '')}']")
                        if button:
                            await button.click()
                            logging.info(f"Clicked button with alternative selector for: {button_id}")
                            await page.wait_for_timeout(1000)
                        else:
                            logging.warning(f"Button {button_id} not found with alternative selectors")
                            continue
                    
                    # Record gameplay
                    recording_success, video_path = await video_recorder.record_gameplay(
                        page, button_id, duration=30
                    )
                    
                    if recording_success and video_path:
                        logging.info(f"Successfully recorded {button_text} to {video_path}")
                        results["video_paths"].append(video_path)
                        
                        # Clean up temp files
                        await video_recorder.cleanup_video_files(button_id)
                
                except Exception as e:
                    logging.error(f"Error processing mode {button_id}: {str(e)}")
            
            results["success"] = len(results["video_paths"]) > 0
            
        finally:
            # Clean up browser
            await browser.close()
            await browser_manager.close()
            
    except Exception as e:
        results["error"] = str(e)
        logging.error(f"Error during gameplay recording: {str(e)}")
        
    return results

def main():
    """Run the gameplay recorder."""
    import argparse
    
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
        # Run the gameplay recorder
        results = asyncio.run(play_game_async(args.game_path, args.output_dir))
        
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
        
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during gameplay recording: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
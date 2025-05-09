#!/usr/bin/env python3
"""
Standalone script to record gameplay for different AI modes.
This doesn't depend on any existing modules to avoid import errors.
"""

import os
import sys
import asyncio
import logging
import tempfile
from pathlib import Path

# Import Playwright
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_ENABLED = True
except ImportError:
    logging.error("Playwright not installed. Install with: pip install playwright && python -m playwright install firefox")
    PLAYWRIGHT_ENABLED = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def setup_browser(game_path):
    """Set up the browser and return the URL to access the game."""
    if not PLAYWRIGHT_ENABLED:
        raise ImportError("Playwright is not installed or properly configured")
        
    game_path = os.path.abspath(game_path)
    
    # Setup browser
    playwright = await async_playwright().start()
    browser = await playwright.firefox.launch(headless=False)
    
    # Determine URL based on game path
    if os.path.isdir(game_path):
        # Find HTML file
        html_files = list(Path(game_path).glob("*.html"))
        if not html_files:
            raise FileNotFoundError(f"No HTML file found in {game_path}")
            
        # Default to index.html if it exists
        html_file = next(
            (f for f in html_files if f.name.lower() == "index.html"),
            html_files[0],
        )
        
        # Use local HTTP server to serve the directory
        server_process = await asyncio.create_subprocess_exec(
            "python",
            "-m",
            "http.server",
            "8000",
            cwd=game_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        # Wait for server to start
        await asyncio.sleep(1)
        url = f"http://localhost:8000/{html_file.name}"
    else:
        # Direct file path
        url = f"file://{game_path}"
        server_process = None
        
    return browser, url, server_process

async def record_gameplay(page, button_id, output_dir, duration=30):
    """Record gameplay video."""
    try:
        # Create a temporary directory for the recording
        with tempfile.TemporaryDirectory() as temp_dir:
            # Start recording
            await page.context.tracing.start(
                screenshots=True,
                snapshots=True,
                sources=False,
                title=f"Game Recording - {button_id}",
            )

            # Capture for duration
            await asyncio.sleep(duration)
            
            # Stop recording
            trace_path = os.path.join(temp_dir, "trace.zip")
            await page.context.tracing.stop(path=trace_path)
            
            # Convert to MP4
            mp4_path = os.path.join(output_dir, f"{button_id}.mp4")
            success = await convert_trace_to_mp4(trace_path, mp4_path)
            
            return success, mp4_path if success else None
            
    except Exception as e:
        logging.error(f"Error recording gameplay: {str(e)}")
        return False, None

async def convert_trace_to_mp4(trace_path, output_path):
    """Convert Playwright trace to MP4 video using ffmpeg."""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Export frames from the trace
            frames_dir = os.path.join(temp_dir, "frames")
            os.makedirs(frames_dir, exist_ok=True)
            
            # Use the playwright cli to export frames
            process = await asyncio.create_subprocess_exec(
                "playwright",
                "trace",
                "export",
                "--output",
                frames_dir,
                trace_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logging.error(f"Error exporting frames: {stderr.decode()}")
                return False
                
            # Use ffmpeg to convert frames to video
            cmd = [
                "ffmpeg",
                "-i",
                os.path.join(frames_dir, "frame-%d.png"),
                "-c:v",
                "libx264",
                "-vf",
                "fps=30",
                "-pix_fmt",
                "yuv420p",
                "-y",
                output_path,
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=60
                )
                
                if process.returncode != 0:
                    logging.error(f"Error converting to MP4: {stderr.decode()}")
                    return False
                    
                return os.path.exists(output_path)
                
            except asyncio.TimeoutError:
                process.kill()
                logging.error("FFMPEG conversion timed out")
                return False
                
    except Exception as e:
        logging.error(f"Error in trace to MP4 conversion: {str(e)}")
        return False

async def main_async():
    """Main async function to run the recording process."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Record gameplay videos for different AI modes"
    )
    
    parser.add_argument(
        "--game_path", required=True, help="Path to the game directory or HTML file"
    )
    
    parser.add_argument(
        "--output-dir",
        help="Directory to save output videos (defaults to 'vlm_eval' in game directory)",
    )
    
    args = parser.parse_args()
    
    # Setup output directory
    if args.output_dir:
        output_dir = args.output_dir
    else:
        output_dir = os.path.join(args.game_path, "vlm_eval")
    os.makedirs(output_dir, exist_ok=True)
    
    results = {
        "success": False,
        "video_paths": [],
        "error": None
    }
    
    browser = None
    server_process = None
    
    try:
        # Setup browser
        browser, url, server_process = await setup_browser(args.game_path)
        
        try:
            # Create page
            context = await browser.new_context()
            page = await context.new_page()
            
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=15000)
            logging.info(f"Page loaded: {args.game_path}")
            
            # Wait for page to stabilize
            await page.wait_for_timeout(2000)
            
            # Press Enter to start the game
            logging.info("Pressing Enter to start the game")
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(2000)
            
            # Define the AI mode buttons
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
                    recording_success, video_path = await record_gameplay(
                        page, button_id, output_dir, duration=30
                    )
                    
                    if recording_success and video_path:
                        logging.info(f"Successfully recorded {button_text} to {video_path}")
                        results["video_paths"].append(video_path)
                
                except Exception as e:
                    logging.error(f"Error processing mode {button_id}: {str(e)}")
            
            results["success"] = len(results["video_paths"]) > 0
            
        finally:
            # Clean up browser
            if browser:
                await browser.close()
            
    except Exception as e:
        results["error"] = str(e)
        logging.error(f"Error during gameplay recording: {str(e)}")
    
    finally:
        # Clean up server process if it exists
        if server_process:
            server_process.terminate()
            try:
                await server_process.wait()
            except:
                pass
    
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

def main():
    """Run the main async function."""
    return asyncio.run(main_async())

if __name__ == "__main__":
    sys.exit(main()) 
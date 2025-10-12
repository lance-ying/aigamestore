import os
import logging
import asyncio
import tempfile
from typing import Optional, Tuple

# Import Playwright
try:
    from playwright.async_api import Page, Browser, BrowserContext
except ImportError:
    pass  # Already handled in browser_utils.py

# FFMPEG timeout constant
FFMPEG_TIMEOUT = 60  # seconds


class VideoRecorder:
    """Class to handle video recording and processing for game evaluation."""
    
    def __init__(self, output_dir: str):
        """
        Initialize the video recorder.
        
        Args:
            output_dir: Directory to save recorded videos
        """
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create a dedicated directory for test videos
        self.test_videos_dir = os.path.join(self.output_dir, "test_videos")
        os.makedirs(self.test_videos_dir, exist_ok=True)
        
    async def record_gameplay(
        self, page: Page, button_id: str, duration: int = 10
    ) -> Tuple[bool, Optional[str]]:
        """
        Record gameplay video by focusing on and capturing only the canvas element.
        
        Args:
            page: Playwright page object
            button_id: ID of the button/mode being recorded
            duration: Duration in seconds to record
            
        Returns:
            Tuple of (success, video path)
        """
        try:
            # Get the browser and create a new context
            browser = page.context.browser
            
            # First close the existing context/page
            context = page.context
            url = page.url
            await context.close()
            
            # Use fixed canvas dimensions of 600x400
            canvas_width = 600
            canvas_height = 400
            
            # Add some padding to ensure we capture the full canvas
            padding = 10
            viewport_width = canvas_width + padding * 2
            viewport_height = canvas_height + padding * 2
            
            # Create a new context with video recording enabled
            # Set viewport size to match canvas size plus padding
            recording_context = await browser.new_context(
                record_video_dir=self.test_videos_dir,
                record_video_size={"width": viewport_width, "height": viewport_height},
                viewport={"width": viewport_width, "height": viewport_height}
            )
            
            # Create a new page in the recording context
            recording_page = await recording_context.new_page()
            
            # Navigate to the same URL as the original page
            await recording_page.goto(url, wait_until="networkidle", timeout=15000)
            
            # Apply CSS to center the canvas in the viewport and hide other elements
            await recording_page.evaluate("""
                () => {
                    // Reset body and html styling
                    document.documentElement.style.margin = '0';
                    document.documentElement.style.padding = '0';
                    document.documentElement.style.overflow = 'hidden';
                    
                    document.body.style.margin = '0';
                    document.body.style.padding = '0';
                    document.body.style.overflow = 'hidden';
                    document.body.style.display = 'flex';
                    document.body.style.justifyContent = 'center';
                    document.body.style.alignItems = 'center';
                    document.body.style.background = '#000';
                    
                    // Get the canvas element
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return;
                    
                    // Set the fixed canvas size
                    canvas.width = 600;
                    canvas.height = 400;
                    
                    // Position the canvas in the center of the viewport
                    canvas.style.position = 'absolute';
                    canvas.style.left = '50%';
                    canvas.style.top = '50%';
                    canvas.style.transform = 'translate(-50%, -50%)';
                    canvas.style.margin = '0';
                    canvas.style.padding = '0';
                    canvas.style.zIndex = '9999';
                    
                    // Hide all other elements except the canvas
                    Array.from(document.body.children).forEach(el => {
                        if (el !== canvas && !el.contains(canvas)) {
                            el.style.visibility = 'hidden';
                        }
                    });
                }
            """)
            
            # Wait for page to stabilize
            await recording_page.wait_for_timeout(1000)
            
            # Try to click the same button that was clicked in the original page
            try:
                button = await recording_page.query_selector(f"#{button_id}")
                if button:
                    await button.click()
                    logging.info(f"Clicked button: {button_id}")
                    await recording_page.wait_for_timeout(1000)  # Wait for mode to change
                else:
                    logging.warning(f"Button {button_id} not found in recording page")
                    
                    # Try alternative approach to find and click the button
                    button_found = await recording_page.evaluate(f"""
                        () => {{
                            // Try by ID
                            let button = document.getElementById('{button_id}');
                            
                            // Try by class if ID not found
                            if (!button) {{
                                const buttons = Array.from(document.querySelectorAll('button'));
                                button = buttons.find(b => 
                                    b.id === '{button_id}' || 
                                    (b.onclick && b.onclick.toString().includes('{button_id}'))
                                );
                            }}
                            
                            if (button) {{
                                button.click();
                                return true;
                            }}
                            return false;
                        }}
                    """)
                    
                    if button_found:
                        logging.info(f"Found and clicked button {button_id} using JavaScript")
                        await recording_page.wait_for_timeout(1000)
            except Exception as e:
                logging.warning(f"Error clicking button: {e}")
            
            # Press Enter to start the game
            await recording_page.keyboard.press("Enter")
            await recording_page.wait_for_timeout(1000)
            
            # Apply CSS again to ensure canvas is the only visible element
            await recording_page.evaluate("""
                () => {
                    // Hide everything except the canvas
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return;
                    
                    // Set the fixed canvas size
                    canvas.width = 600;
                    canvas.height = 400;
                    
                    // Hide all elements except canvas
                    document.querySelectorAll('body > *:not(canvas)').forEach(el => {
                        if (el !== canvas && !el.contains(canvas)) {
                            el.style.display = 'none';
                        }
                    });
                    
                    // Make sure canvas is visible and centered
                    canvas.style.display = 'block';
                    canvas.style.position = 'absolute';
                    canvas.style.left = '50%';
                    canvas.style.top = '50%';
                    canvas.style.transform = 'translate(-50%, -50%)';
                }
            """)
            
            # Record for specified duration with active game state monitoring
            logging.info(f"Recording gameplay for {duration} seconds with game state monitoring")
            
            # Perform some keyboard inputs to ensure game is running
            for key in ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "]:
                await recording_page.keyboard.press(key)
                await recording_page.wait_for_timeout(200)
            
            # Start recording timer
            start_time = asyncio.get_event_loop().time()
            end_time = start_time + duration
            
            # Monitor game state during recording
            while asyncio.get_event_loop().time() < end_time:
                # Check game state every second
                try:
                    game_phase = await recording_page.evaluate("""
                        () => {
                            try {
                                // Try multiple ways to get the game state
                                if (window.getGameState) {
                                    return window.getGameState().gamePhase || 'UNKNOWN';
                                } else if (window.game && window.game.state) {
                                    return window.game.state.gamePhase || 'UNKNOWN';
                                } else {
                                    // Search for common patterns
                                    for (const key in window) {
                                        const obj = window[key];
                                        if (obj && typeof obj === 'object') {
                                            if (obj.gamePhase) return obj.gamePhase;
                                            if (obj.state && obj.state.gamePhase) return obj.state.gamePhase;
                                        }
                                    }
                                    return 'UNKNOWN';
                                }
                            } catch (e) {
                                console.error("Error getting game state:", e);
                                return 'ERROR';
                            }
                        }
                    """)
                    
                    logging.info(f"Current game phase: {game_phase}")
                    
                    # If game over, restart
                    if game_phase in ["GAME_OVER_WIN", "GAME_OVER_LOSE"]:
                        logging.info(f"Game over detected ({game_phase}). Restarting...")
                        await recording_page.keyboard.press("r")
                        await recording_page.wait_for_timeout(500)
                        await recording_page.keyboard.press("Enter")
                        await recording_page.wait_for_timeout(500)
                        
                        # Perform some gameplay actions after restart
                        for key in ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "]:
                            await recording_page.keyboard.press(key)
                            await recording_page.wait_for_timeout(100)
                        
                    # If not playing or at start, press enter
                    elif game_phase in ["START", "PAUSED"]:
                        logging.info("Game paused or at start. Pressing Enter to continue...")
                        await recording_page.keyboard.press("Enter")
                        await recording_page.wait_for_timeout(500)
                        
                    # If playing, press some keys to ensure interaction
                    elif game_phase == "PLAYING":
                        # Press a random key to simulate gameplay
                        for key in ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "]:
                            await recording_page.keyboard.press(key)
                            await recording_page.wait_for_timeout(100)
                            break  # Only press one key
                            
                except Exception as e:
                    logging.warning(f"Error checking game phase: {e}")
                
                # Wait before checking again (but not a full second to avoid missing the end time)
                await recording_page.wait_for_timeout(500)
                
            # Close context to finalize the recording
            await recording_context.close()
            
            # Find the most recently created video file
            video_files = []
            for file in os.listdir(self.test_videos_dir):
                if file.endswith(".webm"):
                    video_files.append(os.path.join(self.test_videos_dir, file))
            
            if not video_files:
                logging.error("No video files found after recording")
                return False, None
            
            # Get the most recent video file
            latest_video = max(video_files, key=os.path.getctime)
            
            # Rename to our standard format
            webm_path = os.path.join(self.test_videos_dir, f"{button_id}.webm")
            if os.path.exists(webm_path):
                os.remove(webm_path)
            os.rename(latest_video, webm_path)
            
            # Convert to MP4
            mp4_path = os.path.join(self.test_videos_dir, f"{button_id}.mp4")
            success = await self._convert_to_mp4(webm_path, mp4_path)
            
            if success:
                # Remove the webm file after successful conversion
                try:
                    os.remove(webm_path)
                    logging.info(f"Removed original webm file: {webm_path}")
                except Exception as e:
                    logging.warning(f"Failed to remove webm file: {e}")
                    
                return True, mp4_path
            else:
                # Return the webm path if conversion failed
                return True, webm_path
                
        except Exception as e:
            logging.error(f"Error recording gameplay: {str(e)}")
            return False, None
            
    async def _convert_to_mp4(self, input_path: str, output_path: str) -> bool:
        """
        Convert webm to MP4 video using ffmpeg.
        
        Args:
            input_path: Path to the input webm file
            output_path: Path to save the output MP4 file
            
        Returns:
            True if conversion was successful, False otherwise
        """
        try:
            logging.info(f"Converting video to MP4: {input_path} -> {output_path}")
            
            # Use ffmpeg to convert webm to MP4
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-y", output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=FFMPEG_TIMEOUT
                )
                
                if process.returncode == 0:
                    if os.path.exists(output_path):
                        logging.info(f"Successfully converted video to MP4: {output_path}")
                        return True
                    else:
                        logging.error(f"Output MP4 file not found after conversion")
                else:
                    logging.error(f"Error converting to MP4: {stderr.decode()}")
                    
                    # If conversion fails, try again with more permissive options
                    logging.info("Attempting conversion with alternate ffmpeg settings...")
                    
                    alt_cmd = [
                        "ffmpeg",
                        "-i", input_path,
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-crf", "30",  # Lower quality but more likely to succeed
                        "-vf", "scale=640:-2",  # Reduce resolution
                        "-pix_fmt", "yuv420p",
                        "-y", output_path
                    ]
                    
                    alt_process = await asyncio.create_subprocess_exec(
                        *alt_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    
                    stdout, stderr = await asyncio.wait_for(
                        alt_process.communicate(), timeout=FFMPEG_TIMEOUT
                    )
                    
                    if alt_process.returncode == 0 and os.path.exists(output_path):
                        logging.info(f"Successfully converted video with alternate settings: {output_path}")
                        return True
                    else:
                        logging.error(f"Error in alternate conversion: {stderr.decode()}")
                        return False
                    
            except asyncio.TimeoutError:
                process.kill()
                logging.error(f"Video conversion timed out after {FFMPEG_TIMEOUT} seconds")
                return False
                
        except Exception as e:
            logging.error(f"Error in video conversion: {str(e)}")
            return False
            
    async def cleanup_video_files(self, button_id: str) -> None:
        """
        Clean up temporary video files.
        
        Args:
            button_id: ID of the button/mode to clean up files for
        """
        try:
            # Clean up any temporary files
            for ext in ["webm", "tmp"]:
                temp_file = os.path.join(self.test_videos_dir, f"{button_id}.{ext}")
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    logging.info(f"Removed temp file: {temp_file}")
                    
            # Clean up any other webm files that might be left over
            for file in os.listdir(self.test_videos_dir):
                if file.endswith(".webm") and not file.startswith(button_id):
                    os.remove(os.path.join(self.test_videos_dir, file))
                    logging.info(f"Removed temporary webm file: {file}")
        except Exception as e:
            logging.warning(f"Error cleaning up video files: {str(e)}")
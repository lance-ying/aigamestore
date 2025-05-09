import os
import logging
import asyncio
import tempfile
from typing import Optional, Tuple

# Import Playwright
try:
    from playwright.async_api import Page
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
        
    async def record_gameplay(
        self, page: Page, button_id: str, duration: int = 30
    ) -> Tuple[bool, Optional[str]]:
        """
        Record gameplay video using Playwright's video recording feature.
        
        Args:
            page: Playwright page object
            button_id: ID of the button/mode being recorded
            duration: Duration in seconds to record
            
        Returns:
            Tuple of (success, video path)
        """
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
                mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                success = await self._convert_trace_to_mp4(trace_path, mp4_path)
                
                return success, mp4_path if success else None
                
        except Exception as e:
            logging.error(f"Error recording gameplay: {str(e)}")
            return False, None
            
    async def _convert_trace_to_mp4(self, trace_path: str, output_path: str) -> bool:
        """
        Convert Playwright trace to MP4 video using ffmpeg.
        
        Args:
            trace_path: Path to the Playwright trace file
            output_path: Path to save the output MP4 file
            
        Returns:
            True if conversion was successful, False otherwise
        """
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
                        process.communicate(), timeout=FFMPEG_TIMEOUT
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
            
    async def cleanup_video_files(self, button_id: str) -> None:
        """
        Clean up temporary video files.
        
        Args:
            button_id: ID of the button/mode to clean up files for
        """
        try:
            # Clean up any temporary files (like raw trace files)
            for ext in ["trace", "zip"]:
                temp_file = os.path.join(self.output_dir, f"{button_id}.{ext}")
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    logging.info(f"Removed temp file: {temp_file}")
        except Exception as e:
            logging.warning(f"Error cleaning up video files: {str(e)}") 
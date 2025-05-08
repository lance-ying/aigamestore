#!/usr/bin/env python3
"""
Evaluate games by recording gameplay and analyzing using Gemini 2.0 Flash.
"""

import os
import sys
import time
import logging
import asyncio
import argparse
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List

import google.generativeai as genai
from google.generativeai.types import content_types as types

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Import Playwright
try:
    from playwright.async_api import async_playwright, Page, ElementHandle
    PLAYWRIGHT_ENABLED = True
except ImportError:
    logging.error("Playwright not found. Install with: pip install playwright && python -m playwright install firefox")
    PLAYWRIGHT_ENABLED = False


class GameEvaluator:
    """Class to manage browser interactions and game evaluation."""
    
    def __init__(self, game_path: str, api_key: Optional[str] = None):
        self.game_path = os.path.abspath(game_path)
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError("Google API key is required. Set GOOGLE_API_KEY environment variable or pass it as a parameter.")
        
        # Setup Gemini API
        genai.configure(api_key=self.api_key)
        
        # Check if game_path is valid
        if not os.path.exists(self.game_path):
            raise FileNotFoundError(f"Game path does not exist: {self.game_path}")
        
        # Setup output directory
        self.output_dir = os.path.join(os.path.dirname(os.path.abspath(self.game_path)), "evaluation_results")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Game controls
        self.game_keys = {
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            " ", "Shift", "z", "Enter"
        }
    
    async def record_and_evaluate_game(self) -> Dict[str, Any]:
        """
        Main method to record gameplay video and evaluate using Gemini.
        
        Returns:
            Dictionary with evaluation results
        """
        if not PLAYWRIGHT_ENABLED:
            return {
                "success": False,
                "error": "Playwright not installed. Install with: pip install playwright && python -m playwright install firefox"
            }
        
        results = {
            "success": False,
            "game_path": self.game_path,
            "video_paths": [],
            "evaluations": [],
            "error": None
        }
        
        async with async_playwright() as playwright:
            try:
                # Setup browser
                browser = await playwright.firefox.launch(headless=True)
                
                # Navigate to the game
                if os.path.isdir(self.game_path):
                    # Find HTML file
                    html_files = list(Path(self.game_path).glob("*.html"))
                    if not html_files:
                        results["error"] = f"No HTML file found in {self.game_path}"
                        return results
                    
                    # Default to index.html if it exists
                    html_file = next((f for f in html_files if f.name.lower() == "index.html"), html_files[0])
                    
                    # Use local HTTP server to serve the directory
                    server_process = await asyncio.create_subprocess_exec(
                        "python", "-m", "http.server", "8000",
                        cwd=self.game_path,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    try:
                        # Wait for server to start
                        await asyncio.sleep(1)
                        url = f"http://localhost:8000/{html_file.name}"
                    finally:
                        # Keep server running until we're done; will clean up in outer exception handler
                        pass
                else:
                    # Direct file path
                    url = f"file://{self.game_path}"
                
                # Find all ai_test buttons and process them one by one
                context = await browser.new_context()
                page = await context.new_page()
                
                # Log any console errors
                page.on("console", lambda msg: logging.warning(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
                
                # Load the page first to get the buttons
                await page.goto(url, wait_until="networkidle", timeout=15000)
                logging.info(f"Page loaded: {self.game_path}")
                
                # Wait for page to stabilize
                await page.wait_for_timeout(5000)
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if not canvas_count:
                    results["error"] = "No canvas element found on the page"
                    return results
                
                # Find all ai_test buttons
                ai_test_buttons = await page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                    return buttons
                        .filter(btn => btn.id && btn.id.startsWith('ai_test_'))
                        .map(btn => ({
                            id: btn.id,
                            text: btn.innerText || btn.value || '',
                            index: parseInt(btn.id.replace('ai_test_', '')) || 0
                        }))
                        .sort((a, b) => a.index - b.index); // Sort by index if available
                }
                """)
                
                if not ai_test_buttons:
                    logging.warning("No buttons with id starting with 'ai_test_' found. Looking for any buttons...")
                    
                    # Try to find any buttons as a fallback
                    ai_test_buttons = await page.evaluate("""
                    () => {
                        const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                        return buttons.map((btn, index) => ({
                            id: btn.id || `button_${index}`,
                            text: btn.innerText || btn.value || '',
                            index: index
                        }));
                    }
                    """)
                
                # Close the initial context
                await context.close()
                
                if not ai_test_buttons:
                    results["error"] = "No buttons found on the page"
                    return results
                
                logging.info(f"Found {len(ai_test_buttons)} AI test buttons: {ai_test_buttons}")
                
                # Process each button sequentially
                for button_info in ai_test_buttons:
                    button_id = button_info['id']
                    logging.info(f"Processing button with ID: {button_id}")
                    
                    # Create a new context for each button to get a fresh recording
                    video_path = os.path.join(self.output_dir, f"{button_id}.webm")
                    context = await browser.new_context(
                        record_video_dir=self.output_dir,
                        record_video_size={"width": 1280, "height": 720}
                    )
                    page = await context.new_page()
                    
                    # Navigate to the game again
                    await page.goto(url, wait_until="networkidle", timeout=15000)
                    await page.wait_for_timeout(3000)
                    
                    # Click the button
                    try:
                        if button_id.startswith('button_'):  # For buttons without ids
                            await page.evaluate(f"document.querySelectorAll('button, input[type=\"button\"]')[{button_info['index']}].click()")
                        else:
                            await page.click(f"#{button_id}")
                        logging.info(f"Clicked button: {button_id}")
                        
                        # Press ENTER to start the game
                        await page.keyboard.press("Enter")
                        logging.info("Pressed ENTER to start the game")
                        
                        # Focus on canvas
                        await page.evaluate("document.querySelector('canvas').focus()")
                        
                        # Record for up to 30 seconds, checking game state every second
                        recording_start_time = time.time()
                        game_phase = "UNKNOWN"
                        
                        while time.time() - recording_start_time < 30:  # 30 seconds max
                            # Check game state
                            try:
                                game_phase = await page.evaluate("""
                                () => {
                                    try {
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
                                
                                logging.info(f"Game phase: {game_phase}")
                                
                                # If game over, restart
                                if game_phase in ["GAME_OVER_WIN", "GAME_OVER_LOSE"]:
                                    logging.info(f"Game over detected ({game_phase}). Restarting...")
                                    await page.keyboard.press("r")
                                    await page.wait_for_timeout(1000)
                                    await page.keyboard.press("Enter")
                                    await page.wait_for_timeout(1000)
                                
                                # If not playing or at start, press enter
                                if game_phase in ["START", "PAUSED"]:
                                    await page.keyboard.press("Enter")
                                    await page.wait_for_timeout(500)
                                
                            except Exception as e:
                                logging.warning(f"Error checking game phase: {e}")
                            
                            # Wait a second before checking again
                            await page.wait_for_timeout(1000)
                        
                        # Wait for any final animations
                        await page.wait_for_timeout(1000)
                        
                        # Close context to finalize the recording
                        await context.close()
                        
                        # Find the video file that was just created
                        video_files = list(Path(self.output_dir).glob("*.webm"))
                        if video_files:
                            latest_video = max(video_files, key=lambda f: f.stat().st_mtime)
                            
                            # Rename the video file to include the button ID
                            new_video_path = os.path.join(self.output_dir, f"{button_id}.webm")
                            if os.path.exists(new_video_path):
                                os.remove(new_video_path)  # Remove existing file if present
                            os.rename(latest_video, new_video_path)
                            logging.info(f"Renamed video to: {new_video_path}")
                            
                            # Convert to MP4
                            mp4_path = os.path.join(self.output_dir, f"{button_id}.mp4")
                            try:
                                process = await asyncio.create_subprocess_exec(
                                    "ffmpeg", "-i", new_video_path, "-c:v", "libx264", mp4_path,
                                    stdout=asyncio.subprocess.PIPE,
                                    stderr=asyncio.subprocess.PIPE
                                )
                                stdout, stderr = await process.communicate()
                                
                                if process.returncode == 0 and os.path.exists(mp4_path):
                                    video_path = mp4_path
                                    logging.info(f"Converted video to MP4: {mp4_path}")
                                else:
                                    video_path = new_video_path
                                    logging.warning(f"Failed to convert video: {stderr.decode()}")
                            except Exception as e:
                                video_path = new_video_path
                                logging.warning(f"Error converting video to MP4: {e}")
                            
                            # Add to results
                            results["video_paths"].append(video_path)
                            
                            # Evaluate each video
                            evaluation = await self._evaluate_video_with_gemini(video_path)
                            if evaluation:
                                # Save button-specific evaluation
                                eval_path = os.path.join(self.output_dir, f"{button_id}_evaluation.txt")
                                with open(eval_path, "w") as f:
                                    f.write(evaluation)
                                
                                results["evaluations"].append({
                                    "button_id": button_id,
                                    "video_path": video_path,
                                    "evaluation": evaluation
                                })
                        else:
                            logging.warning(f"No video file found for button {button_id}")
                    except Exception as e:
                        logging.error(f"Error processing button {button_id}: {e}")
                
                # Set success if we have at least one evaluation
                results["success"] = len(results["evaluations"]) > 0
                
                # Create a combined evaluation if multiple videos were processed
                if len(results["evaluations"]) > 1:
                    combined_text = "# Combined Game Evaluation\n\n"
                    for eval_data in results["evaluations"]:
                        combined_text += f"## Button: {eval_data['button_id']}\n\n"
                        combined_text += eval_data['evaluation'] + "\n\n"
                        combined_text += "---\n\n"
                    
                    combined_path = os.path.join(self.output_dir, "combined_evaluation.txt")
                    with open(combined_path, "w") as f:
                        f.write(combined_text)
                    
                    logging.info(f"Saved combined evaluation to: {combined_path}")
                
                await browser.close()
                
            except Exception as e:
                logging.error(f"Error during evaluation: {e}")
                results["error"] = str(e)
                
                # Ensure server is terminated if it exists
                if 'server_process' in locals() and server_process:
                    try:
                        server_process.terminate()
                        logging.info("HTTP server terminated after error")
                    except:
                        pass
        
        return results
    
    async def _perform_manual_gameplay(self, page: Page) -> None:
        """Simulate gameplay by pressing random keys."""
        logging.info("Performing manual gameplay simulation")
        
        # Gameplay keys sequence
        key_sequence = [
            "ArrowRight", "ArrowRight", "ArrowUp", "ArrowRight", 
            " ", "ArrowLeft", "ArrowDown", "z", "ArrowRight",
            "ArrowUp", "ArrowUp", " ", "ArrowRight", "Shift",
            "ArrowRight", "ArrowRight", "z", "ArrowDown"
        ]
        
        # Press each key with a short delay
        for key in key_sequence:
            await page.keyboard.press(key)
            # Random delay between 100-300ms
            delay = 100 + (200 * (time.time() % 1.0))
            await page.wait_for_timeout(delay)
            
        # One more check of game state
        try:
            game_phase = await page.evaluate("(() => { try { return window.getGameState()?.gamePhase || 'UNKNOWN'; } catch(e) { return 'ERROR'; }})()")
            logging.info(f"Game state after manual gameplay: {game_phase}")
            
            # If game not in PLAYING state, try to restart
            if game_phase not in ["PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE"]:
                await page.keyboard.press("Enter")
                await page.wait_for_timeout(500)
                # Try a few more key presses
                for _ in range(10):
                    key = key_sequence[int(time.time() * 10) % len(key_sequence)]
                    await page.keyboard.press(key)
                    await page.wait_for_timeout(200)
        except Exception as e:
            logging.warning(f"Error checking game state: {e}")
        
        # Let the game run for a bit longer
        await page.wait_for_timeout(5000)
    
    async def _evaluate_video_with_gemini(self, video_path: str) -> Optional[str]:
        """
        Evaluate game video using Gemini 2.0 Flash.
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Evaluation text or None if failed
        """
        try:
            # Check if file exists and is not too large
            if not os.path.exists(video_path):
                logging.error(f"Video file not found: {video_path}")
                return None
            
            # Check file size (max 20MB)
            file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
            if file_size_mb > 20:
                logging.error(f"Video file too large: {file_size_mb:.2f}MB (max 20MB)")
                
                # Try to compress the video to reduce size
                logging.info("Attempting to compress video to reduce file size...")
                compressed_path = video_path.replace(".mp4", "_compressed.mp4").replace(".webm", "_compressed.webm")
                
                try:
                    process = await asyncio.create_subprocess_exec(
                        "ffmpeg", "-i", video_path, "-vcodec", "libx264", "-crf", "30", 
                        # Add scaling to reduce resolution as well
                        "-vf", "scale=640:-1",
                        compressed_path,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode == 0 and os.path.exists(compressed_path):
                        new_size_mb = os.path.getsize(compressed_path) / (1024 * 1024)
                        logging.info(f"Compressed video from {file_size_mb:.2f}MB to {new_size_mb:.2f}MB")
                        
                        if new_size_mb <= 20:
                            video_path = compressed_path
                            file_size_mb = new_size_mb
                        else:
                            logging.error(f"Compressed video still too large: {new_size_mb:.2f}MB (max 20MB)")
                            
                            # Try even more aggressive compression
                            extra_compressed_path = compressed_path.replace(".mp4", "_extra.mp4").replace(".webm", "_extra.webm")
                            try:
                                process = await asyncio.create_subprocess_exec(
                                    "ffmpeg", "-i", compressed_path, "-vcodec", "libx264", 
                                    "-crf", "35", "-vf", "scale=480:-1", 
                                    "-r", "15", # Lower framerate
                                    extra_compressed_path,
                                    stdout=asyncio.subprocess.PIPE,
                                    stderr=asyncio.subprocess.PIPE
                                )
                                stdout, stderr = await process.communicate()
                                
                                if process.returncode == 0 and os.path.exists(extra_compressed_path):
                                    final_size_mb = os.path.getsize(extra_compressed_path) / (1024 * 1024)
                                    logging.info(f"Extra compressed video to {final_size_mb:.2f}MB")
                                    
                                    if final_size_mb <= 20:
                                        video_path = extra_compressed_path
                                        file_size_mb = final_size_mb
                                    else:
                                        return None
                                else:
                                    return None
                            except Exception as e:
                                logging.warning(f"Error during extra compression: {e}")
                                return None
                    else:
                        logging.warning(f"Failed to compress video: {stderr.decode()}")
                        return None
                except Exception as e:
                    logging.warning(f"Error compressing video: {e}")
                    return None
            
            # Read video file
            with open(video_path, 'rb') as f:
                video_bytes = f.read()
            
            # Determine MIME type based on extension
            mime_type = "video/mp4" if video_path.endswith(".mp4") else "video/webm"
            
            # Prepare the prompt
            prompt = "What do you think about this game? Can you comment about what can be improved in the game mechanics, game aesthetics, and the AI game play strategy?"
            
            # Generate response
            logging.info(f"Sending video to Gemini for evaluation...")
            response = genai.generate_content(
                model='models/gemini-2.0-flash',
                contents=[
                    types.Content(
                        parts=[
                            types.Part(
                                inline_data=types.Blob(data=video_bytes, mime_type=mime_type)
                            ),
                            types.Part(text=prompt)
                        ]
                    )
                ]
            )
            
            # Get evaluation text
            evaluation_text = response.text
            return evaluation_text
            
        except Exception as e:
            logging.error(f"Error evaluating video with Gemini: {e}")
            return None


async def evaluate_game_async(game_path: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game by recording gameplay and analyzing with Gemini.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key (optional, can use GOOGLE_API_KEY env var)
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = GameEvaluator(game_path, api_key)
    return await evaluator.record_and_evaluate_game()


def evaluate_game(game_path: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronous wrapper for evaluate_game_async.
    
    Args:
        game_path: Path to the game directory or HTML file
        api_key: Google API key (optional, can use GOOGLE_API_KEY env var)
        
    Returns:
        Dictionary with evaluation results
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(evaluate_game_async(game_path, api_key))


def main():
    parser = argparse.ArgumentParser(description="Evaluate games with Gemini 2.0 Flash")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument("--api-key", help="Google API key (or use GOOGLE_API_KEY env var)")
    
    args = parser.parse_args()
    
    # Evaluate the game
    results = evaluate_game(args.game_path, args.api_key)
    
    # Print results
    if results["success"]:
        print("\n" + "="*50)
        print("GAME EVALUATION RESULTS")
        print("="*50)
        print(f"Game path: {results['game_path']}")
        print(f"Videos recorded: {len(results['video_paths'])}")
        for i, eval_data in enumerate(results["evaluations"]):
            print(f"\n--- Button: {eval_data['button_id']} ---")
            print(f"Video: {eval_data['video_path']}")
            print("Evaluation summary: " + eval_data['evaluation'][:100] + "...")
        print("="*50)
        print(f"Full evaluations saved in: {os.path.join(os.path.dirname(results['game_path']), 'evaluation_results')}")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("GAME EVALUATION FAILED")
        print("="*50)
        print(f"Error: {results['error']}")
        print("="*50)
    
    # Return success status
    return 0 if results["success"] else 1


if __name__ == "__main__":
    sys.exit(main())

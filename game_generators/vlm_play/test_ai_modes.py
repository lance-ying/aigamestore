#!/usr/bin/env python3
"""
Test script to automate gameplay testing with different AI modes.
This script:
1. Cycles through each TEST button
2. Records 30 seconds of gameplay for each mode
3. Restarts the browser between tests
4. Captures console errors during the session
"""

import os
import sys
import logging
import asyncio
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from .browser_utils import BrowserManager
from .video_processing import VideoRecorder

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
        
        # Initialize video recorder
        self.video_recorder = VideoRecorder(self.output_dir)
    
    async def test_all_modes(self) -> Dict[str, Any]:
        """
        Test all TEST modes and record videos.
        
        Returns:
            Dictionary with results
        """
        results = {
            "success": False,
            "game_path": self.game_path,
            "video_paths": [],
            "errors": [],
            "console_errors": {}
        }
        
        # Setup browser to find TEST buttons
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
                
                # Find all TEST buttons with the new format
                test_buttons = await page.evaluate(
                    """
                    () => {
                        const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                        return buttons
                            .filter(btn => btn.id && btn.id.toLowerCase().includes('test_') && btn.id.toLowerCase().includes('modebtn'))
                            .map(btn => ({
                                id: btn.id,
                                text: btn.innerText || btn.value || '',
                                testMode: (btn.onclick && btn.onclick.toString().match(/setControlMode\\(['"]([^'"]+)['"]\\)/)?.[1]) || ''
                            }));
                    }
                    """
                )
                
                if not test_buttons:
                    error_msg = "No TEST buttons found on the page"
                    logging.error(error_msg)
                    results["errors"].append(error_msg)
                    await context.close()
                    return results
                
                logging.info(f"Found {len(test_buttons)} TEST buttons: {test_buttons}")
                
                # Close this context as we'll create new ones for each test
                await context.close()
                
                # Test each button sequentially
                for button_info in test_buttons:
                    button_id = button_info["id"]
                    test_mode = button_info["testMode"] or button_id
                    button_text = button_info["text"]
                    
                    logging.info(f"Testing mode: {test_mode} (Button ID: {button_id}, Text: {button_text})")
                    
                    # Create new browser manager for each test
                    test_browser_manager = BrowserManager(self.game_path)
                    
                    try:
                        # Setup browser
                        test_browser, test_url = await test_browser_manager.setup_browser()
                        
                        try:
                            # Create a new context and page
                            test_context = await test_browser.new_context()
                            test_page = await test_context.new_page()
                            
                            # Setup console error tracking
                            await test_browser_manager.setup_console_error_tracking(test_page)
                            
                            # Navigate to the page
                            await test_page.goto(test_url, wait_until="networkidle", timeout=15000)
                            logging.info(f"Page loaded for {test_mode}")
                            
                            # Wait for page to stabilize
                            await test_page.wait_for_timeout(2000)
                            
                            # Press Enter to start the game
                            logging.info("Pressing Enter to start the game")
                            await test_page.keyboard.press("Enter")
                            await test_page.wait_for_timeout(2000)
                            
                            # Click the button to activate the mode
                            button = await test_page.query_selector(f"#{button_id}")
                            if button:
                                await button.click()
                                logging.info(f"Clicked button: {button_id}")
                                await test_page.wait_for_timeout(1000)  # Wait for mode to change
                                
                                # Record gameplay
                                recording_success, video_path = await self.video_recorder.record_gameplay(
                                    test_page, test_mode, duration=30
                                )
                                
                                if recording_success and video_path:
                                    logging.info(f"Successfully recorded {test_mode} to {video_path}")
                                    results["video_paths"].append(video_path)
                                else:
                                    error_msg = f"Failed to record video for {test_mode}"
                                    logging.error(error_msg)
                                    results["errors"].append(error_msg)
                            else:
                                error_msg = f"Button {button_id} not found"
                                logging.error(error_msg)
                                results["errors"].append(error_msg)
                                
                                # Try to find button by alternative means
                                logging.info("Attempting to find button using JavaScript")
                                button_found = await test_page.evaluate(f"""
                                    () => {{
                                        const buttons = Array.from(document.querySelectorAll('button'));
                                        const button = buttons.find(b => 
                                            b.id === '{button_id}' || 
                                            b.onclick && b.onclick.toString().includes('{test_mode}')
                                        );
                                        if (button) {{
                                            button.click();
                                            return true;
                                        }}
                                        return false;
                                    }}
                                """)
                                
                                if button_found:
                                    logging.info(f"Found and clicked button for {test_mode} using JavaScript")
                                    await test_page.wait_for_timeout(1000)  # Wait for mode to change
                                    
                                    # Record gameplay
                                    recording_success, video_path = await self.video_recorder.record_gameplay(
                                        test_page, test_mode, duration=30
                                    )
                                    
                                    if recording_success and video_path:
                                        logging.info(f"Successfully recorded {test_mode} to {video_path}")
                                        results["video_paths"].append(video_path)
                                    else:
                                        error_msg = f"Failed to record video for {test_mode} after finding button"
                                        logging.error(error_msg)
                                        results["errors"].append(error_msg)
                                else:
                                    error_msg = f"Could not find button for {test_mode} using alternative methods"
                                    logging.error(error_msg)
                                    results["errors"].append(error_msg)
                            
                            # Capture console errors
                            console_errors = test_browser_manager.get_console_errors_summary()
                            
                            # Save console errors to file
                            errors_file_path = os.path.join(self.output_dir, f"{test_mode}_console_errors.json")
                            with open(errors_file_path, 'w') as f:
                                json.dump(console_errors, f, indent=2)
                            
                            logging.info(f"Saved console errors to {errors_file_path}")
                            
                            # Add console errors to results
                            results["console_errors"][test_mode] = {
                                "has_errors": console_errors["has_errors"],
                                "error_count": console_errors["error_count"],
                                "errors_file": errors_file_path
                            }
                            
                            # If errors were found, log them
                            if console_errors["has_errors"]:
                                logging.warning(f"Found {console_errors['error_count']} console errors during {test_mode} test")
                                for error in console_errors["errors"][:5]:  # Log first 5 errors
                                    logging.warning(f"  - {error}")
                                if len(console_errors["errors"]) > 5:
                                    logging.warning(f"  ... and {len(console_errors['errors']) - 5} more errors")
                        
                        finally:
                            # Clean up
                            await test_browser_manager.close()
                    
                    except Exception as e:
                        error_msg = f"Error testing mode {test_mode}: {str(e)}"
                        logging.error(error_msg)
                        results["errors"].append(error_msg)
                
                # Set success if we have at least one video
                results["success"] = len(results["video_paths"]) > 0
                
                # Create summary report
                if results["success"]:
                    self._create_summary_report(results)
            
            finally:
                # Clean up
                await browser_manager.close()
        
        except Exception as e:
            error_msg = f"Error during AI mode testing: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
        
        return results
    
    def _create_summary_report(self, results: Dict[str, Any]):
        """
        Create a summary HTML report of the test results.
        
        Args:
            results: Dictionary with test results
        """
        report_path = os.path.join(self.output_dir, "test_summary.html")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Game Test Summary</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
                .video-container {{ margin: 10px 0; }}
                .error-container {{ margin: 10px 0; background: #fff8f8; padding: 10px; border-left: 3px solid #f00; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
            </style>
        </head>
        <body>
            <h1>Game Test Summary</h1>
            <p>Game path: {results["game_path"]}</p>
            <p>Status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failed'}</span></p>
            
            <h2>Video Recordings</h2>
            <table>
                <tr>
                    <th>Mode</th>
                    <th>Video</th>
                </tr>
        """
        
        for video_path in results["video_paths"]:
            mode_name = os.path.basename(video_path).split('.')[0]
            html_content += f"""
                <tr>
                    <td>{mode_name}</td>
                    <td>
                        <a href="{os.path.basename(video_path)}">{os.path.basename(video_path)}</a>
                        <div class="video-container">
                            <video width="320" height="240" controls>
                                <source src="{os.path.basename(video_path)}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </td>
                </tr>
            """
        
        html_content += """
            </table>
            
            <h2>Console Errors</h2>
            <table>
                <tr>
                    <th>Mode</th>
                    <th>Has Errors</th>
                    <th>Error Count</th>
                    <th>Details</th>
                </tr>
        """
        
        for mode_name, error_info in results["console_errors"].items():
            html_content += f"""
                <tr>
                    <td>{mode_name}</td>
                    <td class="{'failure' if error_info['has_errors'] else 'success'}">{
                        'Yes' if error_info['has_errors'] else 'No'}</td>
                    <td>{error_info['error_count']}</td>
                    <td><a href="{os.path.basename(error_info['errors_file'])}">View Details</a></td>
                </tr>
            """
        
        html_content += """
            </table>
        """
        
        if results["errors"]:
            html_content += """
                <h2>Errors</h2>
                <div class="error-container">
                    <ul>
            """
            
            for error in results["errors"]:
                html_content += f"<li>{error}</li>"
            
            html_content += """
                    </ul>
                </div>
            """
        
        html_content += """
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        logging.info(f"Created test summary report at {report_path}")


# Async function for easy API
async def test_ai_modes_async(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Test all AI modes asynchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with test results
    """
    tester = AIModeTester(game_path, output_dir)
    return await tester.test_all_modes()

# Sync wrapper for easier use
def test_ai_modes(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Test all AI modes synchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos
        
    Returns:
        Dictionary with test results
    """
    return asyncio.run(test_ai_modes_async(game_path, output_dir))

# CLI entrypoint
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Test games with different AI modes.")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument("--output", "-o", help="Directory to save recorded videos")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run tests
    results = test_ai_modes(args.game_path, args.output)
    
    if results["success"]:
        print(f"Testing completed successfully. Recorded {len(results['video_paths'])} videos.")
        print(f"See results in {args.output or os.path.join(os.path.dirname(args.game_path), 'ai_mode_tests')}")
        sys.exit(0)
    else:
        print(f"Testing failed: {results.get('errors', ['Unknown error'])}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
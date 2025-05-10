#!/usr/bin/env python3
"""
Test script to automate gameplay testing with different AI modes.
This script:
1. Cycles through each AI test mode
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
            "errors": [],
            "console_errors": {}
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
                    
                    # Setup console error tracking
                    await browser_manager.setup_console_error_tracking(page)
                    
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
                        
                        # Record gameplay for 10 seconds
                        recording_success, video_path = await self.video_recorder.record_gameplay(
                            page, mode_name, duration=10
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
                            
                            # Record gameplay using new recording method
                            recording_success, video_path = await self.video_recorder.record_gameplay(
                                page, mode_name, duration=10
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
                    
                    # Try pressing 'R' to restart the game and capture console errors
                    try:
                        logging.info("Pressing 'R' to restart the game")
                        await page.keyboard.press("r")
                        await page.wait_for_timeout(1000)  # Wait for game to restart
                    except Exception as e:
                        logging.warning(f"Error pressing 'R' key: {str(e)}")
                    
                    # Capture console errors
                    console_errors = browser_manager.get_console_errors_summary()
                    
                    # Save console errors to file
                    errors_file_path = os.path.join(self.output_dir, f"{mode_name}_console_errors.json")
                    with open(errors_file_path, 'w') as f:
                        json.dump(console_errors, f, indent=2)
                    
                    logging.info(f"Saved console errors to {errors_file_path}")
                    
                    # Add console errors to results
                    results["console_errors"][mode_name] = {
                        "has_errors": console_errors["has_errors"],
                        "error_count": console_errors["error_count"],
                        "errors_file": errors_file_path
                    }
                    
                    # If errors were found, log them
                    if console_errors["has_errors"]:
                        logging.warning(f"Found {console_errors['error_count']} console errors during {mode_name} test")
                        for error in console_errors["errors"][:5]:  # Log first 5 errors
                            logging.warning(f"  - {error}")
                        if len(console_errors["errors"]) > 5:
                            logging.warning(f"  ... and {len(console_errors['errors']) - 5} more errors")
                
                finally:
                    # Clean up
                    await browser_manager.close()
                    
            except Exception as e:
                error_msg = f"Error testing mode {mode_name}: {str(e)}"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                
                # Make sure to clean up browser
                await browser_manager.close()
        
        # Set success if we have at least one video
        results["success"] = len(results["video_paths"]) > 0
        
        # Create a summary report
        self._create_summary_report(results)
        
        return results
    
    def _create_summary_report(self, results: Dict[str, Any]):
        """
        Create a summary HTML report of the test results.
        
        Args:
            results: Test results dictionary
        """
        report_path = os.path.join(self.output_dir, "summary_report.html")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Mode Testing Report</title>
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
            <h1>AI Mode Testing Report</h1>
            <p>Game path: {results["game_path"]}</p>
            <p>Overall status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failure'}</span></p>
            
            <h2>Video Recordings</h2>
            <p>Recorded {len(results["video_paths"])} videos:</p>
            <ul>
        """
        
        for video_path in results["video_paths"]:
            video_name = os.path.basename(video_path)
            html_content += f"""
                <li>
                    <div class="video-container">
                        <a href="{video_name}">{video_name}</a>
                    </div>
                </li>
            """
        
        html_content += """
            </ul>
            
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
            
            <h2>Errors</h2>
        """
        
        if results["errors"]:
            html_content += """
                <div class="error-container">
                    <ul>
            """
            
            for error in results["errors"]:
                html_content += f"<li>{error}</li>"
            
            html_content += """
                    </ul>
                </div>
            """
        else:
            html_content += "<p>No errors encountered during testing.</p>"
        
        html_content += """
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        logging.info(f"Created summary report at {report_path}")

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
            
            # Print console error summary
            print("\nConsole Error Summary:")
            for mode_name, error_info in results["console_errors"].items():
                status = "❌" if error_info["has_errors"] else "✓"
                print(f"  {status} {mode_name}: {error_info['error_count']} errors")
                if error_info["has_errors"]:
                    print(f"     Details: {error_info['errors_file']}")
        else:
            print(f"Status: Failed - No videos were recorded")
            
        # Print errors if any
        if results["errors"]:
            print(f"\nErrors encountered ({len(results['errors'])}):")
            for error in results["errors"]:
                print(f"  - {error}")
        
        # Print report location
        report_path = os.path.join(results["console_errors"].get(list(results["console_errors"].keys())[0], {}).get("errors_file", ""), "..", "summary_report.html")
        if os.path.exists(report_path):
            print(f"\nDetailed report: {os.path.abspath(report_path)}")
            
        # Return success status
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during AI mode testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
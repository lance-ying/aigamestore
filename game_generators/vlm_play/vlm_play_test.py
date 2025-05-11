#!/usr/bin/env python3
"""
VLM Play Testing module for evaluating games using AI.

This module provides functionality to:
1. Record gameplay videos of a game
2. Capture console errors during gameplay
3. Use Gemini to evaluate the game and provide improvement feedback.
"""

import os
import sys
import json
import logging
import asyncio
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

# Fix imports to handle both direct execution and module import
if __name__ == "__main__" or not __package__:
    # Add parent directory to path for direct execution
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    # Import local modules without relative imports
    from vlm_play.browser_utils import BrowserManager
    from vlm_play.video_processing import VideoRecorder
    from vlm_play.gemini_api import GeminiEvaluator
    from vlm_play.test_ai_modes import AIModeTester
else:
    # Regular relative imports for module usage
    from .browser_utils import BrowserManager
    from .video_processing import VideoRecorder
    from .gemini_api import GeminiEvaluator
    from .test_ai_modes import AIModeTester

class VLMPlayEvaluation:
    """Class to evaluate games using video recording and LLM analysis."""
    
    def __init__(self,
                 game_path: str, 
                 output_dir: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize the VLM Play Evaluation.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save recorded videos and evaluation results
            api_key: Google API key for Gemini access
        """
        self.game_path = os.path.abspath(game_path)
        
        # Setup output directory
        if output_dir:
            self.output_dir = output_dir
        else:
            self.output_dir = os.path.join(os.path.dirname(self.game_path), "vlm_evaluation")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize components
        self.video_recorder = VideoRecorder(self.output_dir)
        self.gemini_evaluator = GeminiEvaluator(api_key)
        
        # Load metadata if available
        self.metadata = self._load_metadata()
        
        # Parse automated testing info from metadata
        self.test_info = self._parse_automated_testing_info()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata.json file if it exists in the game path."""
        metadata_path = os.path.join(os.path.dirname(self.game_path), "metadata.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"Failed to load metadata.json: {str(e)}")
        return {}
    
    def _parse_automated_testing_info(self) -> Dict[str, Dict[str, str]]:
        """Parse automated testing info from metadata."""
        test_info = {}
        
        if not self.metadata or 'game_info' not in self.metadata or 'automated_testing' not in self.metadata['game_info']:
            logging.warning("No automated testing info found in metadata")
            return test_info
        
        automated_testing = self.metadata['game_info']['automated_testing']
        
        try:
            # Parse the XML-formatted automated testing information
            xml_str = f"<root>{automated_testing}</root>"
            root = ET.fromstring(xml_str)
            
            # Process each test
            for test_elem in root.findall("./TEST_*"):
                test_name = test_elem.tag
                
                test_description = test_elem.find("test_description")
                strategy_description = test_elem.find("strategy_description")
                expected_outcome = test_elem.find("expected_outcome")
                
                test_info[test_name] = {
                    "test_description": test_description.text.strip() if test_description is not None and test_description.text else "",
                    "strategy_description": strategy_description.text.strip() if strategy_description is not None and strategy_description.text else "",
                    "expected_outcome": expected_outcome.text.strip() if expected_outcome is not None and expected_outcome.text else ""
                }
                
        except Exception as e:
            logging.error(f"Error parsing automated testing info: {str(e)}")
        
        return test_info
    
    async def evaluate_game(self) -> Dict[str, Any]:
        """
        Evaluate the game by recording gameplay videos and analyzing them with Gemini.
        
        Returns:
            Dictionary with evaluation results
        """
        results = {
            "game_path": self.game_path,
            "evaluations": [],
            "errors": [],
            "console_errors": {},
            "success": False,
            "aggregated_feedback": None
        }
        
        try:
            # Setup browser to find TEST buttons
            browser_manager = BrowserManager(self.game_path)
            browser, url = await browser_manager.setup_browser()
            context = await browser.new_context()
            page = await context.new_page()
            
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=15000)
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
            
            await context.close()
            await browser.close()
            
            if not test_buttons:
                error_msg = "No TEST buttons found on the page"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                return results
            
            logging.info(f"Found {len(test_buttons)} TEST buttons: {test_buttons}")
            
            # Record videos for all test buttons in parallel
            logging.info(f"Starting parallel recording of {len(test_buttons)} test buttons")
            start_time = asyncio.get_event_loop().time()
            video_paths = await self._record_test_videos_parallel(test_buttons)
            end_time = asyncio.get_event_loop().time()
            recording_time = end_time - start_time
            
            num_videos = len(video_paths)
            if num_videos > 0:
                logging.info(f"Successfully recorded {num_videos}/{len(test_buttons)} videos in {recording_time:.2f} seconds")
            else:
                error_msg = "No gameplay videos were recorded"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                return results
            
            # For each recorded video, run Gemini evaluation
            logging.info("Starting Gemini evaluation of recorded videos")
            evaluations = []
            for button_info, video_path in video_paths.items():
                if not os.path.exists(video_path):
                    logging.warning(f"Video file does not exist: {video_path}")
                    continue
                
                test_mode = button_info["testMode"]
                test_id = button_info["id"]
                
                logging.info(f"Evaluating gameplay for mode: {test_mode} (Button ID: {test_id})")
                
                # Get test information from metadata
                evaluation = await self._evaluate_test_video(
                    video_path=video_path,
                    test_mode=test_mode,
                    button_info=button_info
                )
                
                if evaluation:
                    evaluations.append(evaluation)
                    results["evaluations"].append(evaluation)
                    
                    # Save evaluation to file
                    eval_file_path = os.path.join(self.output_dir, f"{test_id}_evaluation.json")
                    with open(eval_file_path, "w") as f:
                        json.dump(evaluation, f, indent=2)
                    
                    logging.info(f"Saved evaluation to {eval_file_path}")
            
            # Generate aggregated feedback if we have evaluations
            if evaluations:
                logging.info(f"Generating aggregated feedback from {len(evaluations)} evaluations")
                aggregated_feedback = await self._generate_aggregated_feedback(evaluations)
                results["aggregated_feedback"] = aggregated_feedback
                
                # Save aggregated feedback to file
                feedback_file_path = os.path.join(self.output_dir, "aggregated_feedback.json")
                with open(feedback_file_path, "w") as f:
                    json.dump(aggregated_feedback, f, indent=2)
                
                logging.info(f"Saved aggregated feedback to {feedback_file_path}")
            
            # Generate a combined report
            self._generate_combined_report(results)
            
            # Set success flag if we have at least one evaluation
            results["success"] = len(results["evaluations"]) > 0
            
        except Exception as e:
            error_msg = f"Error during game evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
        
        return results
    
    async def _record_test_videos_parallel(self, test_buttons: List[Dict[str, Any]]) -> Dict[Dict[str, Any], str]:
        """Record videos for all test buttons in parallel, focusing only on the canvas."""
        video_paths = {}
        tasks = []
        
        # Setup browser once
        browser_manager = BrowserManager(self.game_path)
        browser, url = await browser_manager.setup_browser()
        
        try:
            # Create tasks for each button
            for button_info in test_buttons:
                task = self._record_single_video(browser, url, button_info)
                tasks.append(task)
            
            # Run all tasks in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logging.error(f"Error recording video for button {test_buttons[i]['id']}: {str(result)}")
                    continue
                
                button_info, video_path = result
                if video_path and os.path.exists(video_path):
                    video_paths[button_info] = video_path
                    logging.info(f"Successfully recorded video for {button_info['id']}: {video_path}")
                else:
                    logging.warning(f"Failed to record video for {button_info['id']}")
        
        finally:
            # Close browser
            await browser.close()
            await browser_manager.close()
        
        return video_paths
    
    async def _record_single_video(self, browser, url, button_info) -> Tuple[Dict[str, Any], Optional[str]]:
        """Record a single video for a test button, focusing only on the canvas."""
        button_id = button_info["id"]
        
        # Create new context for this recording
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # 1. Wait for the page to load
            await page.goto(url, wait_until="networkidle", timeout=15000)
            logging.info(f"Page loaded for test button: {button_id}")
            await page.wait_for_timeout(2000)
            
            # 2. Navigate to canvas and ensure it's the focus
            canvas_found = await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return false;
                    
                    // Make sure canvas is visible and focused
                    canvas.scrollIntoView();
                    canvas.focus();
                    
                    // Apply styling to only show the canvas
                    document.body.style.margin = '0';
                    document.body.style.padding = '0';
                    document.body.style.overflow = 'hidden';
                    document.body.style.background = '#000';
                    
                    // Hide all other elements
                    Array.from(document.body.children).forEach(el => {
                        if (el !== canvas && !el.contains(canvas)) {
                            el.style.visibility = 'hidden';
                        }
                    });
                    
                    // Center the canvas
                    canvas.style.position = 'absolute';
                    canvas.style.left = '50%';
                    canvas.style.top = '50%';
                    canvas.style.transform = 'translate(-50%, -50%)';
                    
                    return true;
                }
            """)
            
            if not canvas_found:
                logging.error("Canvas element not found on the page")
                return button_info, None
            
            # 3. Press the test button to activate the test mode
            button = await page.query_selector(f"#{button_id}")
            if button:
                await button.click()
                logging.info(f"Clicked test button: {button_id}")
                await page.wait_for_timeout(1000)  # Wait for mode to change
            else:
                # Try alternative approach to find and click the button
                button_found = await page.evaluate(f"""
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
                
                if not button_found:
                    logging.error(f"Button {button_id} not found and could not be clicked")
                    return button_info, None
                
                logging.info(f"Found and clicked test button: {button_id} using JavaScript")
                await page.wait_for_timeout(1000)
            
            # Ensure canvas is still focused and visible after button click
            await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return;
                    
                    // Ensure canvas is still visible and other elements are hidden
                    canvas.scrollIntoView();
                    Array.from(document.body.children).forEach(el => {
                        if (el !== canvas && !el.contains(canvas)) {
                            el.style.display = 'none';
                        }
                    });
                }
            """)
            
            # 4. Start recording the canvas
            test_name = button_info["testMode"] or button_id
            logging.info(f"Starting to record canvas for test: {test_name}")
            
            # Create a new recording context with viewport matching canvas size
            canvas_dimensions = await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return null;
                    return {
                        width: canvas.width || canvas.clientWidth,
                        height: canvas.height || canvas.clientHeight
                    };
                }
            """)
            
            if not canvas_dimensions:
                logging.error("Could not determine canvas dimensions")
                return button_info, None
            
            # Close current page/context
            await page.close()
            await context.close()
            
            # Create a new context with recording enabled and viewport matching canvas
            recording_context = await browser.new_context(
                viewport=canvas_dimensions,
                record_video_dir=self.output_dir,
                record_video_size=canvas_dimensions
            )
            
            recording_page = await recording_context.new_page()
            await recording_page.goto(url, wait_until="networkidle", timeout=15000)
            
            # Hide everything except canvas
            await recording_page.evaluate("""
                () => {
                    // Style body and hide everything else
                    document.body.style.margin = '0';
                    document.body.style.padding = '0';
                    document.body.style.overflow = 'hidden';
                    document.body.style.background = '#000';
                    
                    const canvas = document.querySelector('canvas');
                    if (!canvas) return;
                    
                    // Position canvas at center of viewport
                    canvas.style.position = 'absolute';
                    canvas.style.left = '50%';
                    canvas.style.top = '50%';
                    canvas.style.transform = 'translate(-50%, -50%)';
                    
                    // Hide everything else
                    Array.from(document.body.children).forEach(el => {
                        if (el !== canvas && !el.contains(canvas)) {
                            el.style.display = 'none';
                        }
                    });
                }
            """)
            
            # Click the test button again in this new context
            await recording_page.evaluate(f"""
                () => {{
                    const button = document.getElementById('{button_id}');
                    if (button) button.click();
                }}
            """)
            await recording_page.wait_for_timeout(1000)
            
            # 5. Press ENTER to start the game
            logging.info("Pressing ENTER to start the game")
            await recording_page.keyboard.press("Enter")
            
            # Record for 30 seconds
            logging.info(f"Recording canvas for {test_name} for 30 seconds")
            await recording_page.wait_for_timeout(30000)
            
            # Stop recording by closing the context
            video_path = None
            await recording_context.close()
            
            # Find the recorded video file
            video_files = [f for f in os.listdir(self.output_dir) if f.endswith(".webm")]
            if video_files:
                latest_video = max(video_files, key=lambda f: os.path.getmtime(os.path.join(self.output_dir, f)))
                webm_path = os.path.join(self.output_dir, latest_video)
                
                # Convert to MP4
                mp4_path = os.path.join(self.output_dir, f"{test_name}.mp4")
                
                # Use FFmpeg to convert
                ffmpeg_cmd = [
                    "ffmpeg", "-y", "-i", webm_path, 
                    "-c:v", "libx264", "-crf", "23", "-preset", "medium",
                    mp4_path
                ]
                
                process = await asyncio.create_subprocess_exec(
                    *ffmpeg_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0 and os.path.exists(mp4_path):
                    video_path = mp4_path
                    logging.info(f"Successfully converted video to {mp4_path}")
                    
                    # Delete the webm file
                    os.remove(webm_path)
                else:
                    logging.error(f"Failed to convert video: {stderr.decode()}")
            else:
                logging.error("No recorded video file found")
            
            return button_info, video_path
        
        except Exception as e:
            logging.error(f"Error recording video for {button_id}: {str(e)}")
            return button_info, None
        
        finally:
            # Make sure all contexts are closed
            try:
                if 'recording_context' in locals() and recording_context:
                    await recording_context.close()
            except:
                pass
    
    async def _evaluate_test_video(self, 
                                 video_path: str, 
                                 test_mode: str,
                                 button_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Evaluate a test video using Gemini with information from metadata.
        
        Args:
            video_path: Path to the gameplay video
            test_mode: Test mode name (e.g., TEST_1)
            button_info: Button information dictionary
            
        Returns:
            Dictionary with evaluation results or None if failed
        """
        try:
            # Get test information from metadata
            test_info = self.test_info.get(test_mode, {})
            test_description = test_info.get("test_description", "")
            strategy_description = test_info.get("strategy_description", "")
            expected_outcome = test_info.get("expected_outcome", "")
            
            # If no test info found in metadata, use button text as a fallback
            if not test_description:
                test_description = f"Testing {button_info.get('text', test_mode)}"
            
            # Create prompt for Gemini using test information
            prompt = f"""
            Here is a video of a game made in JavaScript. The player is trying to test the game for the following: {test_description}. 
            Following was their strategy: {strategy_description}. 
            They expected the following would happen: {expected_outcome}.
            
            Can you evaluate the video and answer the following questions:
            
            1. Was the expected outcome reached? If not, do you think the player was making progress towards the intended goal for the test?
            2. Do you think that their strategy is bad?
            3. If not, what is broken in the game and can be improved based on this test?
            
            Format your response using XML tags for each answer:
            <outcome_reached>Your detailed answer about whether the expected outcome was reached</outcome_reached>
            <strategy_evaluation>Your detailed evaluation of the testing strategy</strategy_evaluation>
            <improvements>Your detailed suggestions on what is broken and how to improve the game</improvements>
            """
            
            # Send video to Gemini for evaluation
            response = await self.gemini_evaluator.evaluate_video_with_custom_prompt(video_path, prompt)
            
            if not response:
                logging.error(f"Failed to get evaluation for {test_mode}")
                return None
            
            # Parse the response
            evaluation = self._parse_test_evaluation_response(response)
            
            # Add mode and button information
            evaluation["test_mode"] = test_mode
            evaluation["button_id"] = button_info["id"]
            evaluation["button_text"] = button_info.get("text", "")
            evaluation["video_path"] = video_path
            
            # Add test information from metadata
            evaluation["test_description"] = test_description
            evaluation["strategy_description"] = strategy_description
            evaluation["expected_outcome"] = expected_outcome
            
            return evaluation
            
        except Exception as e:
            logging.error(f"Error evaluating video {video_path}: {str(e)}")
            return None
    
    def _parse_test_evaluation_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the XML response from Gemini for test evaluation.
        
        Args:
            response_text: Raw XML response from Gemini
            
        Returns:
            Dictionary with parsed sections
        """
        result = {}
        
        # Define the sections to extract
        sections = [
            "outcome_reached",
            "strategy_evaluation",
            "improvements"
        ]
        
        # Helper function to extract XML tags content
        def extract_section(content, tag):
            start_tag = f"<{tag}>"
            end_tag = f"</{tag}>"
            
            start_pos = content.find(start_tag)
            if start_pos == -1:
                return None
                
            start_pos += len(start_tag)
            end_pos = content.find(end_tag, start_pos)
            
            if end_pos == -1:
                return None
                
            return content[start_pos:end_pos].strip()
        
        # Extract each section
        for section in sections:
            section_content = extract_section(response_text, section)
            if section_content:
                result[section] = section_content
            else:
                result[section] = ""
                
        return result
    
    async def _generate_aggregated_feedback(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate aggregated feedback from all test evaluations.
        
        Args:
            evaluations: List of all test evaluations
            
        Returns:
            Dictionary with aggregated feedback
        """
        try:
            # Create a summary of all evaluations
            test_summaries = []
            for eval in evaluations:
                test_mode = eval.get("test_mode", "")
                test_description = eval.get("test_description", "")
                outcome_reached = eval.get("outcome_reached", "")
                improvements = eval.get("improvements", "")
                
                summary = f"Test: {test_mode} - {test_description}\n"
                summary += f"Outcome: {outcome_reached}\n"
                summary += f"Improvements: {improvements}\n"
                
                test_summaries.append(summary)
            
            all_tests_summary = "\n\n".join(test_summaries)
            
            # Create prompt for Gemini to aggregate feedback
            prompt = f"""
            Here are the evaluations of several automated tests for a JavaScript game:
            
            {all_tests_summary}
            
            As a game development expert, please aggregate all this feedback into a comprehensive assessment for the game developer.
            Focus on the most important issues that need to be fixed and provide actionable recommendations.
            
            Format your response using XML tags:
            <critical_issues>List and explain the most important issues that need immediate attention</critical_issues>
            <gameplay_assessment>Overall assessment of game mechanics and player experience</gameplay_assessment>
            <technical_assessment>Technical issues that need to be addressed</technical_assessment>
            <recommendations>Prioritized list of actionable recommendations for the developer</recommendations>
            <conclusion>Brief overall conclusion about the game's state and potential</conclusion>
            """
            
            # Use Gemini to generate the aggregated feedback
            response = await self.gemini_evaluator.model_api.generate_text_async(prompt)
            
            if not response:
                logging.error("Failed to generate aggregated feedback")
                return {}
            
            # Parse the XML response
            aggregated_feedback = {}
            sections = ["critical_issues", "gameplay_assessment", "technical_assessment", "recommendations", "conclusion"]
            
            # Helper function to extract XML tags content
            def extract_section(content, tag):
                start_tag = f"<{tag}>"
                end_tag = f"</{tag}>"
                
                start_pos = content.find(start_tag)
                if start_pos == -1:
                    return None
                    
                start_pos += len(start_tag)
                end_pos = content.find(end_tag, start_pos)
                
                if end_pos == -1:
                    return None
                    
                return content[start_pos:end_pos].strip()
            
            # Extract each section
            for section in sections:
                section_content = extract_section(response, section)
                if section_content:
                    aggregated_feedback[section] = section_content
                else:
                    aggregated_feedback[section] = ""
            
            return aggregated_feedback
            
        except Exception as e:
            logging.error(f"Error generating aggregated feedback: {str(e)}")
            return {}
    
    def _generate_combined_report(self, results: Dict[str, Any]) -> None:
        """
        Generate a combined HTML report with all evaluations.
        
        Args:
            results: Evaluation results dictionary
        """
        report_path = os.path.join(self.output_dir, "evaluation_report.html")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Game Evaluation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
                .video-container {{ margin: 10px 0; }}
                .error-container {{ margin: 10px 0; background: #fff8f8; padding: 10px; border-left: 3px solid #f00; }}
                .evaluation-section {{ margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; }}
                .aggregated-feedback {{ margin: 20px 0; padding: 15px; background: #f0f7ff; border-left: 3px solid #0066cc; }}
            </style>
        </head>
        <body>
            <h1>Game Evaluation Report</h1>
            <p>Game path: {results["game_path"]}</p>
            
            <h2>Summary</h2>
            <p>Status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failed'
            }</span></p>
            <p>Total evaluations: {len(results["evaluations"])}</p>
            
            <!-- Aggregated Feedback Section -->
            <h2>Aggregated Feedback</h2>
            """
        
        # Add aggregated feedback if available
        if results.get("aggregated_feedback"):
            aggregated = results["aggregated_feedback"]
            html_content += f"""
            <div class="aggregated-feedback">
                <h3>Critical Issues</h3>
                <div>{aggregated.get("critical_issues", "")}</div>
                
                <h3>Gameplay Assessment</h3>
                <div>{aggregated.get("gameplay_assessment", "")}</div>
                
                <h3>Technical Assessment</h3>
                <div>{aggregated.get("technical_assessment", "")}</div>
                
                <h3>Recommendations</h3>
                <div>{aggregated.get("recommendations", "")}</div>
                
                <h3>Conclusion</h3>
                <div>{aggregated.get("conclusion", "")}</div>
            </div>
            """
        else:
            html_content += "<p>No aggregated feedback available.</p>"
        
        # Add evaluations
        html_content += "<h2>Individual Test Evaluations</h2>"
        
        for eval in results["evaluations"]:
            button_id = eval.get("button_id", "")
            button_text = eval.get("button_text", "")
            test_mode = eval.get("test_mode", "")
            video_path = eval.get("video_path", "")
            
            rel_video_path = os.path.relpath(video_path, self.output_dir) if video_path else ""
            
            html_content += f"""
            <div class="evaluation-section">
                <h3>Test: {test_mode} ({button_text})</h3>
                <p>Button ID: {button_id}</p>
                
                <h4>Test Information</h4>
                <p><strong>What:</strong> {eval.get("test_description", "")}</p>
                <p><strong>How:</strong> {eval.get("strategy_description", "")}</p>
                <p><strong>Expected Outcome:</strong> {eval.get("expected_outcome", "")}</p>
                
                <h4>Evaluation</h4>
                <p><strong>Outcome Reached:</strong> {eval.get("outcome_reached", "")}</p>
                <p><strong>Strategy Evaluation:</strong> {eval.get("strategy_evaluation", "")}</p>
                <p><strong>Improvements:</strong> {eval.get("improvements", "")}</p>
                
                <div class="video-container">
                    <h4>Gameplay Video</h4>
                    <video width="640" height="480" controls>
                        <source src="{rel_video_path}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
            """
        
        # Add errors if any
        if results["errors"]:
            html_content += "<h2>Errors</h2><div class='error-container'><ul>"
            for error in results["errors"]:
                html_content += f"<li>{error}</li>"
            html_content += "</ul></div>"
        
        html_content += """
        </body>
        </html>
        """
        
        with open(report_path, "w") as f:
            f.write(html_content)
        
        logging.info(f"Generated evaluation report: {report_path}")

# Async function for easy API
async def evaluate_game_async(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game asynchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = VLMPlayEvaluation(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()

# Sync wrapper for easier use
def evaluate_game(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game synchronously.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    return asyncio.run(evaluate_game_async(game_path, output_dir, api_key))

# CLI entrypoint
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate games using VLM.")
    parser.add_argument("game_path", help="Path to the game directory or HTML file")
    parser.add_argument("--output", "-o", help="Directory to save recorded videos and evaluation results")
    parser.add_argument("--api-key", help="Google API key for Gemini access")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run evaluation
    results = evaluate_game(args.game_path, args.output, args.api_key)
    
    if results["success"]:
        print(f"Evaluation completed successfully. See results in {args.output or os.path.join(os.path.dirname(args.game_path), 'vlm_evaluation')}")
        sys.exit(0)
    else:
        print(f"Evaluation failed: {results.get('errors', ['Unknown error'])}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
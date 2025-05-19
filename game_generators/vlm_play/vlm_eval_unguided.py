#!/usr/bin/env python3
"""
VLM Play Unguided Evaluation module.

This module provides a more free-form approach to evaluate games using VLM with:
- Minimal output structure
- Focus on making the game more fun
- General feedback rather than specific categories
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

# Fix imports to handle both direct execution and module import
if __name__ == "__main__" or not __package__:
    # Add parent directory to path for direct execution
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    # Import local modules without relative imports
    from vlm_play.browser_utils import BrowserManager
    from vlm_play.video_processing import VideoRecorder
    from vlm_play.gemini_api import GeminiEvaluator
else:
    # Regular relative imports for module usage
    from .browser_utils import BrowserManager
    from .video_processing import VideoRecorder
    from .gemini_api import GeminiEvaluator

class VLMPlayEvaluationUnguided:
    """Class to evaluate games using video recording and unstructured LLM analysis."""
    
    def __init__(self,
                 game_path: str, 
                 output_dir: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize the VLM Play Unguided Evaluation.
        
        Args:
            game_path: Path to the game directory or HTML file
            output_dir: Directory to save recorded videos and evaluation results
            api_key: Google API key for Gemini access
        """
        # Check if the game_path is a directory and find the index.html
        self.original_path = os.path.abspath(game_path)
        
        if os.path.isdir(self.original_path):
            # Look for index.html first
            index_html = os.path.join(self.original_path, "index.html")
            if os.path.exists(index_html):
                self.game_path = index_html
                logging.info(f"Found index.html in directory: {self.game_path}")
            else:
                # Look for any HTML file
                html_files = [f for f in os.listdir(self.original_path) if f.endswith('.html')]
                if html_files:
                    self.game_path = os.path.join(self.original_path, html_files[0])
                    logging.info(f"Using HTML file found in directory: {self.game_path}")
                else:
                    # No HTML file found, just use the directory
                    self.game_path = self.original_path
                    logging.warning(f"No HTML files found in directory: {self.original_path}")
        else:
            self.game_path = self.original_path
            
        print(f"Game path: {self.game_path}")
        
        # Setup output directory
        if output_dir:
            self.output_dir = output_dir
        else:
            # Use the original path (directory) for output if it's a directory
            if os.path.isdir(self.original_path):
                self.output_dir = os.path.join(self.original_path, "vlm_evaluation_unguided")
            else:
                self.output_dir = os.path.join(os.path.dirname(self.game_path), "vlm_evaluation_unguided")
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize components
        self.video_recorder = VideoRecorder(self.output_dir)
        self.gemini_evaluator = GeminiEvaluator(api_key)
        
        # Load metadata if available
        self.metadata = self._load_metadata()
        print(f"Metadata: {self.metadata}")
        
        if self.metadata and 'game_info' in self.metadata:
            self.game_concept = self.metadata['game_info'].get('concept', '')
            self.game_description = self.metadata['game_info'].get('description', '')
            self.game_controls = self.metadata['game_info'].get('controls', '')
        else:
            self.game_concept = ''
            self.game_description = ''
            self.game_controls = ''
            
        # Parse automated testing info from metadata
        self.test_info = self._parse_automated_testing_info()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata.json file if it exists in the game path."""
        # Try to find metadata.json in the original path first (directory)
        if hasattr(self, 'original_path') and os.path.isdir(self.original_path):
            metadata_path = os.path.join(self.original_path, "metadata.json")
        else:
            # Fallback to game path directory
            metadata_path = os.path.join(os.path.dirname(self.game_path), "metadata.json")
            
        logging.info(f"Looking for metadata at: {metadata_path}")
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    logging.info(f"Loaded metadata from: {metadata_path}")
                    return metadata
            except Exception as e:
                logging.warning(f"Failed to load metadata.json: {str(e)}")
        else:
            logging.warning(f"Metadata file not found at: {metadata_path}")
            
        return {}
    
    def _parse_automated_testing_info(self) -> Dict[str, Dict[str, str]]:
        """Parse automated testing info from metadata."""
        test_info = {}
        
        if not self.metadata or 'game_info' not in self.metadata or 'automated_testing' not in self.metadata['game_info']:
            logging.warning(f"No automated testing info found in metadata: {self.metadata}")
            return test_info
        
        game_info = self.metadata['game_info']
        automated_testing = game_info['automated_testing']
        
        try:
            # Check if the XML is properly formatted
            if not automated_testing.strip().startswith("<TEST_"):
                logging.warning("Automated testing info does not start with <TEST_. Format may be incorrect.")
                
            # Parse the XML-formatted automated testing information
            # First, clean up the string to ensure it's valid XML
            # Remove any potential extra whitespace between tags
            xml_str = f"<root>{automated_testing}</root>"
            
            try:
                # First try standard XML parsing
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
            except ET.ParseError as xml_error:
                # If standard parsing fails, try manual parsing
                logging.warning(f"XML parsing failed: {str(xml_error)}. Trying manual parsing...")
                
                # Manual parsing for format like:
                # <TEST_1>
                # <test_description>...</test_description>
                # <strategy_description>...</strategy_description>
                # <expected_outcome>...</expected_outcome>
                # </TEST_1>
                
                import re
                
                # Find all TEST blocks
                test_blocks = re.findall(r'<(TEST_\d+)>(.*?)</\1>', automated_testing, re.DOTALL)
                
                for test_name, test_content in test_blocks:
                    # Extract the inner content
                    test_description_match = re.search(r'<test_description>(.*?)</test_description>', test_content, re.DOTALL)
                    strategy_match = re.search(r'<strategy_description>(.*?)</strategy_description>', test_content, re.DOTALL)
                    outcome_match = re.search(r'<expected_outcome>(.*?)</expected_outcome>', test_content, re.DOTALL)
                    
                    test_info[test_name] = {
                        "test_description": test_description_match.group(1).strip() if test_description_match else "",
                        "strategy_description": strategy_match.group(1).strip() if strategy_match else "",
                        "expected_outcome": outcome_match.group(1).strip() if outcome_match else ""
                    }
                
        except Exception as e:
            logging.error(f"Error parsing automated testing info: {str(e)}")
        
        return test_info
    
    async def evaluate_game(self) -> Dict[str, Any]:
        """
        Evaluate the game by recording gameplay videos and analyzing them with unstructured prompts.
        
        Returns:
            Dictionary with evaluation results
        """
        results = {
            "game_path": self.game_path,
            "evaluations": [],
            "errors": [],
            "console_errors": {},
            "success": False,
            "aggregated_feedback": None,
            "token_usage": None  # Will store token usage data
        }
        
        try:
            # Reuse most of the recording logic from the standard evaluation
            # but with a different prompt and result parsing for unstructured feedback
            
            # Setup browser to find TEST buttons
            browser_manager = BrowserManager(self.game_path)
            # Store as instance attribute for later use
            self.browser_manager = browser_manager
            browser, url = await browser_manager.setup_browser()
            context = await browser.new_context()
            page = await context.new_page()
            
            # Set up console error tracking
            await browser_manager.setup_console_error_tracking(page)
            
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            # JavaScript code for finding test buttons
            button_detection_js = """
            () => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                return buttons
                    .filter(btn => {
                        if (!btn.id) return false;
                        const id = btn.id.toLowerCase();
                        // Look for patterns like test_1_modebtn, test_2_modebtn, etc.
                        return id.includes('test_') && id.includes('modebtn');
                    })
                    .map(btn => {
                        let testMode = '';
                        if (btn.onclick) {
                            const onclickStr = btn.onclick.toString();
                            const match = onclickStr.match(/setControlMode\\(['"]([^'"]+)['"]\)/);
                            if (match) {
                                testMode = match[1];
                            }
                        }
                        return {
                            id: btn.id,
                            text: btn.innerText || btn.value || '',
                            testMode: testMode
                        };
                    });
            }
            """
            
            # Find all TEST buttons
            test_buttons = await page.evaluate(button_detection_js)
            
            logging.info(f"Button search results: {test_buttons}")
            
            # If no buttons found with the first approach, try a more lenient approach
            if not test_buttons:
                lenient_button_detection_js = """
                () => {
                    const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
                    return buttons
                        .filter(btn => {
                            if (!btn.id) return false;
                            const id = btn.id.toLowerCase();
                            // More lenient pattern matching
                            return id.includes('test');
                        })
                        .map(btn => {
                            // Try to extract test mode from onclick attribute or button ID
                            let testMode = '';
                            if (btn.onclick) {
                                const onclickStr = btn.onclick.toString();
                                const match = onclickStr.match(/setControlMode\\(['"]([^'"]+)['"]\)/);
                                if (match) {
                                    testMode = match[1];
                                }
                            }
                            
                            // If no testMode found from onclick, try to derive from ID
                            if (!testMode && btn.id) {
                                const idMatch = btn.id.match(/test_?(\\d+)/i);
                                if (idMatch) {
                                    testMode = 'TEST_' + idMatch[1];
                                }
                            }
                            
                            return {
                                id: btn.id,
                                text: btn.innerText || btn.value || '',
                                testMode: testMode
                            };
                        })
                        .filter(btn => btn.testMode); // Only include buttons with a testMode
                }
                """
                
                logging.warning("No TEST buttons found with the first approach, trying a more lenient search")
                test_buttons = await page.evaluate(lenient_button_detection_js)
                
                logging.info(f"Lenient button search results: {test_buttons}")
            
            await context.close()
            
            # Get console errors before closing browser
            console_errors = browser_manager.get_console_errors_summary()
            results["console_errors"]["initial_page_load"] = console_errors
            
            # Log any errors from initial page load
            if console_errors["has_errors"]:
                logging.error(f"Console errors during initial page load: {json.dumps(console_errors, indent=2)}")
                
            await browser.close()
            
            if not test_buttons:
                error_msg = "No TEST buttons found on the page"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                return results
            
            logging.info(f"Found {len(test_buttons)} TEST buttons: {test_buttons}")
            
            # Record videos for test buttons
            from .vlm_play_test import VLMPlayEvaluation
            
            # Create temporary evaluator to reuse the video recording functions
            temp_evaluator = VLMPlayEvaluation(
                game_path=self.game_path,
                output_dir=self.output_dir,
                api_key=self.gemini_evaluator.api_key
            )
            
            # Record videos for all test buttons in parallel (keeping this part parallel for efficiency)
            logging.info(f"Starting parallel recording of {len(test_buttons)} test buttons")
            start_time = asyncio.get_event_loop().time()
            video_paths = await temp_evaluator._record_test_videos_parallel(test_buttons)
            end_time = asyncio.get_event_loop().time()
            recording_time = end_time - start_time
            
            num_videos = len(video_paths)
            if num_videos > 0:
                logging.info(f"Successfully recorded {num_videos}/{len(test_buttons)} videos in {recording_time:.2f} seconds")
            else:
                # If parallel approach failed completely, try sequential as fallback
                logging.warning("Parallel recording failed. Falling back to sequential recording")
                video_paths = await temp_evaluator._record_test_videos_sequential(test_buttons)
                num_videos = len(video_paths)
                
                if num_videos == 0:
                    error_msg = "No gameplay videos were recorded after both parallel and sequential attempts"
                    logging.error(error_msg)
                    results["errors"].append(error_msg)
                    return results
                    
                logging.info(f"Sequential recording produced {num_videos}/{len(test_buttons)} videos")
            
            # Process each test video with unstructured prompts
            logging.info("Starting evaluation of recorded videos with unstructured approach")
            evaluations = []
            
            # Process each video one by one
            for button_id, (button_info, video_path) in video_paths.items():
                if not os.path.exists(video_path):
                    logging.warning(f"Video file does not exist: {video_path}")
                    continue
                
                test_mode = button_info["testMode"]
                test_id = button_info["id"]
                
                logging.info(f"Evaluating gameplay for mode: {test_mode} (Button ID: {test_id})")
                
                # Get test information from metadata and evaluate with unstructured prompt
                evaluation = await self._evaluate_test_video_unstructured(
                    video_path=video_path,
                    test_mode=test_mode,
                    button_info=button_info
                )
                
                if evaluation:
                    evaluations.append(evaluation)
                    results["evaluations"].append(evaluation)
                    
                    # Save individual evaluation to file
                    eval_file_path = os.path.join(self.output_dir, f"{test_id}_evaluation.json")
                    with open(eval_file_path, "w") as f:
                        json.dump(evaluation, f, indent=2)
                    
                    logging.info(f"Saved evaluation to {eval_file_path}")
            
            # Generate aggregated feedback with unstructured approach
            if evaluations:
                logging.info(f"Generating aggregated feedback from {len(evaluations)} evaluations")
                
                # Generate aggregated feedback
                aggregated_feedback = await self._generate_aggregated_feedback_unstructured(evaluations)
                results["aggregated_feedback"] = aggregated_feedback
                
                # Save aggregated feedback to file
                feedback_file_path = os.path.join(self.output_dir, "aggregated_feedback.json")
                with open(feedback_file_path, "w") as f:
                    json.dump(aggregated_feedback, f, indent=2)
                
                logging.info(f"Saved aggregated feedback to {feedback_file_path}")
            
            # Save token usage and conversation logs
            token_usage = self.gemini_evaluator.get_token_usage()
            results["token_usage"] = token_usage
            
            # Save token usage separately
            token_usage_path = os.path.join(self.output_dir, "token_usage.json")
            with open(token_usage_path, 'w') as f:
                json.dump(token_usage, f, indent=2)
            
            logging.info(f"Saved token usage to {token_usage_path}")
            
            # Save conversation log
            conversation_log_path = self.gemini_evaluator.save_conversation_log(self.output_dir)
            results["conversation_log_path"] = conversation_log_path
            
            # Generate a combined report
            self._generate_combined_report(results)
            
            # Set success flag if we have at least one evaluation
            results["success"] = len(results["evaluations"]) > 0
            
        except Exception as e:
            error_msg = f"Error during game evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
        
        return results
    
    async def _evaluate_test_video_unstructured(self, 
                                             video_path: str, 
                                             test_mode: str,
                                             button_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Evaluate a test video using Gemini with an unstructured approach focused on fun.
        
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
            instructions = self.get_instructions()
            
            # If no test info found in metadata, use button text as a fallback
            if not test_description:
                test_description = f"Testing {button_info.get('text', test_mode)}"
            
            # Create unstructured prompt for Gemini focused on improving fun
            prompt = f"""{instructions}

<task>
You are evaluating a gameplay video where the player is testing the game for the following: {test_description}. 
They followed the following strategy: {strategy_description}. 
They expected the following would happen: {expected_outcome}.

Analyze this video and provide feedback to make the game more fun, entertaining, and engaging for players.
</task>
"""
            
            # Send video to Gemini for evaluation
            response = self.gemini_evaluator.evaluate_video_with_custom_prompt_sync(video_path, prompt)
            
            if not response:
                logging.error(f"Failed to get evaluation for {test_mode}")
                return None
            
            # For unstructured approach, we keep the response as-is
            evaluation = {
                "test_mode": test_mode,
                "button_id": button_info["id"],
                "button_text": button_info.get("text", ""),
                "video_path": video_path,
                "test_description": test_description,
                "strategy_description": strategy_description,
                "expected_outcome": expected_outcome,
                "unstructured_feedback": response
            }
            
            # Find console errors for this test
            if hasattr(self, 'browser_manager') and hasattr(self.browser_manager, 'get_console_errors_summary'):
                evaluation["console_errors"] = self.browser_manager.get_console_errors_summary()
            
            return evaluation
            
        except Exception as e:
            logging.error(f"Error evaluating video {video_path}: {str(e)}")
            return None
    
    async def _generate_aggregated_feedback_unstructured(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate aggregated feedback from all test evaluations using an unstructured approach.
        
        Args:
            evaluations: List of all test evaluations
            
        Returns:
            Dictionary with aggregated feedback
        """
        try:
            # Create a summary of all evaluations
            test_summaries = []
            
            # Collect all console errors
            all_console_errors = []
            
            # Check if we have console errors in the main results
            if hasattr(self, 'browser_manager') and hasattr(self.browser_manager, 'get_console_errors_summary'):
                main_errors = self.browser_manager.get_console_errors_summary()
                if main_errors and main_errors.get("has_errors", False):
                    all_console_errors.extend(main_errors.get("errors", []))
            
            # Process each evaluation
            for eval in evaluations:
                test_mode = eval.get("test_mode", "")
                test_description = eval.get("test_description", "")
                unstructured_feedback = eval.get("unstructured_feedback", "")
                
                # Get console errors specific to this test if available
                console_errors = ""
                if "console_errors" in eval and eval["console_errors"]:
                    errors = eval["console_errors"]
                    if isinstance(errors, dict) and errors.get("has_errors", False):
                        console_errors = f"Console errors: {errors.get('error_count', 0)} errors detected."
                        if errors.get("errors"):
                            error_list = [f"- {err}" for err in errors.get("errors", [])[:5]]  # Limit to first 5 errors
                            console_errors += "\n" + "\n".join(error_list)
                            if len(errors.get("errors", [])) > 5:
                                console_errors += f"\n(+ {len(errors.get('errors', [])) - 5} more errors)"
                            all_console_errors.extend(errors.get("errors", []))
                
                summary = f"Test: {test_mode} - {test_description}\n"
                summary += f"Feedback: \n{unstructured_feedback}\n"
                if console_errors:
                    summary += f"{console_errors}\n"
                
                test_summaries.append(summary)
            
            all_tests_summary = "\n\n".join(test_summaries)
            
            # Add a summary of all console errors found
            if all_console_errors:
                # Count error frequency
                error_counts = {}
                for error in all_console_errors:
                    error_str = str(error)
                    if error_str in error_counts:
                        error_counts[error_str] += 1
                    else:
                        error_counts[error_str] = 1
                
                # Sort by frequency
                sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
                
                # Add to the summary
                console_summary = "\n\nAggregated Console Errors:\n"
                console_summary += f"Total unique errors: {len(sorted_errors)}\n"
                console_summary += f"Total error instances: {sum(error_counts.values())}\n"
                
                # Add most frequent errors
                if sorted_errors:
                    console_summary += "\nMost frequent errors:\n"
                    for error, count in sorted_errors[:5]:  # Top 5 most frequent errors
                        console_summary += f"- ({count}x) {error}\n"
                    
                    if len(sorted_errors) > 5:
                        console_summary += f"(+ {len(sorted_errors) - 5} more unique errors)"
                
                all_tests_summary += console_summary
            
            instructions = self.get_instructions()
            
            # Create unstructured prompt for Gemini to aggregate feedback
            prompt = f"""
{instructions}

<task>
Here are your feedbacks from all gameplay testing videos.
<tests_summary>
{all_tests_summary}
</tests_summary>

Please aggregate this feedback into actionable feedback for the game developer based on all gameplay testing videos.
</task>
"""
            
            # Use Gemini to generate the aggregated feedback
            response = self.gemini_evaluator.generate_text(prompt)
            
            if not response:
                logging.error("Failed to generate aggregated feedback")
                return {}
            
            # For unstructured approach, we return the response as-is
            aggregated_feedback = {
                "unstructured_aggregated_feedback": response
            }
            
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
            <title>Game Evaluation Report (Unguided)</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
                .video-container {{ margin: 10px 0; }}
                .error-container {{ margin: 10px 0; background: #fff8f8; padding: 10px; border-left: 3px solid #f00; }}
                .evaluation-section {{ margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; }}
                .aggregated-feedback {{ margin: 20px 0; padding: 15px; background: #f0f7ff; border-left: 3px solid #0066cc; }}
                .console-errors {{ margin: 15px 0; padding: 10px; background: #fff8f8; border-left: 3px solid #f00; font-family: monospace; }}
                .token-usage {{ margin: 20px 0; padding: 15px; background: #f0fff0; border-left: 3px solid #00cc66; }}
                pre {{ background-color: #f3f3f3; padding: 8px; overflow-x: auto; }}
                table {{ border-collapse: collapse; width: 100%; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
            </style>
        </head>
        <body>
            <h1>Game Evaluation Report (Unguided Approach)</h1>
            <p>Game path: {results["game_path"]}</p>
            
            <h2>Summary</h2>
            <p>Status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failed'
            }</span></p>
            <p>Total evaluations: {len(results["evaluations"])}</p>
            
            <!-- Token Usage Section -->
            <h2>Token Usage</h2>
        """
        
        # Add token usage if available
        if results.get("token_usage"):
            token_usage = results["token_usage"]
            html_content += f"""
            <div class="token-usage">
                <h3>Gemini API Token Usage</h3>
                <p>Total tokens used: {token_usage.get("total_tokens", 0)}</p>
                <p>Prompt tokens: {token_usage.get("total_prompt_tokens", 0)}</p>
                <p>Completion tokens: {token_usage.get("total_completion_tokens", 0)}</p>
                
                <h4>Request Details</h4>
                <table>
                    <tr>
                        <th>Timestamp</th>
                        <th>Request Type</th>
                        <th>Prompt Tokens</th>
                        <th>Completion Tokens</th>
                        <th>Total</th>
                    </tr>
            """
            
            # Add each request
            for request in token_usage.get("requests", []):
                html_content += f"""
                    <tr>
                        <td>{request.get("timestamp", "")}</td>
                        <td>{request.get("request_type", "")}</td>
                        <td>{request.get("prompt_tokens", 0)}</td>
                        <td>{request.get("completion_tokens", 0)}</td>
                        <td>{request.get("total_tokens", 0)}</td>
                    </tr>
                """
            
            html_content += """
                </table>
                <p>Full token usage data saved in token_usage.json</p>
                <p>Full conversation log saved in gemini_conversation_log.json</p>
            </div>
            """
        else:
            html_content += "<p>No token usage information recorded.</p>"
            
        # Add console errors section
        html_content += """
            <!-- Console Errors Section -->
            <h2>Console Errors</h2>
        """
        
        # Add console errors if available
        if results.get("console_errors"):
            for context, errors in results["console_errors"].items():
                if errors.get("has_errors"):
                    html_content += f"""
                    <div class="console-errors">
                        <h3>Errors from {context}</h3>
                        <p>Error count: {errors.get("error_count", 0)}</p>
                        <pre>{json.dumps(errors.get("errors", []), indent=2)}</pre>
                    </div>
                    """
                else:
                    html_content += f"<p>No console errors from {context}.</p>"
        else:
            html_content += "<p>No console errors recorded.</p>"
            
        # Add aggregated feedback if available
        html_content += """
            <!-- Aggregated Feedback Section -->
            <h2>Aggregated Feedback</h2>
        """
        
        # Add aggregated feedback for unstructured approach
        if results.get("aggregated_feedback") and "unstructured_aggregated_feedback" in results["aggregated_feedback"]:
            aggregated = results["aggregated_feedback"]["unstructured_aggregated_feedback"]
            html_content += f"""
            <div class="aggregated-feedback">
                <p>{aggregated}</p>
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
            unstructured_feedback = eval.get("unstructured_feedback", "")
            
            rel_video_path = os.path.relpath(video_path, self.output_dir) if video_path else ""
            
            video_html = f"<video width=\"640\" height=\"480\" controls><source src=\"{rel_video_path}\" type=\"video/mp4\">Your browser does not support the video tag.</video>" if rel_video_path else "<p>No video available</p>"
            
            html_content += f"""
            <div class="evaluation-section">
                <h3>Test: {test_mode} ({button_text})</h3>
                <p>Button ID: {button_id}</p>
                
                <h4>Test Information</h4>
                <p><strong>Test Description:</strong> {eval.get("test_description", "")}</p>
                <p><strong>Strategy Description:</strong> {eval.get("strategy_description", "")}</p>
                <p><strong>Expected Outcome:</strong> {eval.get("expected_outcome", "")}</p>
                
                <h4>Unstructured Feedback</h4>
                <p>{unstructured_feedback}</p>
                
                <div class="video-container">
                    <h4>Gameplay Video</h4>
                    {video_html}
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

    def get_instructions(self) -> str:
        """
        Get the instructions for the game play tester.
        """
        return f"""
You are a professional JavaScript game developer and tester known for providing precise feedback by evaluating gameplay videos of 2D video games.
The game developer developed for the following input game concept: {self.game_concept}
Please suggest improvements, updates, and additions to the game including all aspects of the game, its description, and controls.
Game iterated with your feedback must respect the game concept and improves the game to make it more fun, interesting, and playable for a general audience with varied gaming experience with no prior knowledge of this game.

The game is explained to the player as follows: {self.game_description}
It is played with the following controls:
{self.game_controls}

Following were the constraints on the game development:
- Use keyboard keys for controls. No mouse controls. Only allowed keys: [Arrow keys (37-40), SPACE (32), Z (90), SHIFT (16), ENTER to start the game (13), R to restart the game after a win/loss (82), ESC to pause the game (27).]
- The game must start on pressing ENTER key, pauses when ESC key is pressed, and restart on pressing R key at the end of the game.
- No external images, sprites, or assets. No sound or music effects.
- All graphics and animations are created using p5.js primitives.
"""

# Async function for easy API
async def evaluate_game_async(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game asynchronously using unguided approach focused on fun.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = VLMPlayEvaluationUnguided(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()

# Sync wrapper for easier use
def evaluate_game(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game synchronously using unguided approach focused on fun.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    print(f"Evaluating game with unguided approach: {game_path}")
    return asyncio.run(evaluate_game_async(game_path, output_dir, api_key)) 
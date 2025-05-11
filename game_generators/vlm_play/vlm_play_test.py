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
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Import local modules
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
        
        # Define default test modes
        # TODO: these modes should be automatically parsed from the metadata. Check 
        self.ai_modes = [
            {"id": "ai_test_1ModeBtn", "name": "AI_Win"},
            {"id": "ai_test_2ModeBtn", "name": "AI_Movement_Test"},
            {"id": "ai_test_3ModeBtn", "name": "AI_Collision_Test"},
            {"id": "ai_test_4ModeBtn", "name": "AI_PowerUp_Test"}
        ]
    
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
            "success": False
        }
        
        # First, use AIModeTester to record videos and collect console errors
        try:
            tester = AIModeTester(self.game_path, self.output_dir)
            test_results = await tester.test_all_modes()
            
            # Extract video paths and console errors from test results
            results["console_errors"] = test_results.get("console_errors", {})
            video_paths = test_results.get("video_paths", [])
            
            if not video_paths:
                error_msg = "No gameplay videos were recorded"
                logging.error(error_msg)
                results["errors"].append(error_msg)
                return results
                
            # For each recorded video, run Gemini evaluation
            for video_path in video_paths:
                mode_name = os.path.basename(video_path).split('.')[0]
                logging.info(f"Evaluating gameplay for mode: {mode_name}")
                
                # Get console errors for this mode if available
                mode_errors = results["console_errors"].get(mode_name, {})
                has_errors = mode_errors.get("has_errors", False)
                error_file = mode_errors.get("errors_file", "")
                
                # Read error file content if it exists
                error_content = None
                if has_errors and error_file and os.path.exists(error_file):
                    try:
                        with open(error_file, "r") as f:
                            error_content = json.load(f)
                    except Exception as e:
                        logging.warning(f"Failed to read error file {error_file}: {str(e)}")
                
                # Prepare prompt with error information
                evaluation = await self._evaluate_video_with_errors(
                    video_path=video_path,
                    mode_name=mode_name,
                    error_content=error_content
                )
                
                if evaluation:
                    results["evaluations"].append({
                        "mode": mode_name,
                        "video_path": video_path,
                        "evaluation": evaluation
                    })
                    
                    # Save evaluation to file
                    eval_file_path = os.path.join(self.output_dir, f"{mode_name}_evaluation.json")
                    with open(eval_file_path, "w") as f:
                        json.dump(evaluation, f, indent=2)
                    
                    logging.info(f"Saved evaluation to {eval_file_path}")
            
            # Generate a combined report
            self._generate_combined_report(results)
            
            # Set success flag if we have at least one evaluation
            results["success"] = len(results["evaluations"]) > 0
            
        except Exception as e:
            error_msg = f"Error during game evaluation: {str(e)}"
            logging.error(error_msg)
            results["errors"].append(error_msg)
        
        return results
    
    async def _evaluate_video_with_errors(self, 
                                         video_path: str, 
                                         mode_name: str,
                                         error_content: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Evaluate a gameplay video with Gemini, incorporating console error information.
        
        Args:
            video_path: Path to the gameplay video
            mode_name: Name of the game mode
            error_content: Dictionary containing console errors
            
        Returns:
            Dictionary with evaluation results or None if failed
        """
        try:
            # Create a specialized prompt that includes error information
            error_prompt = ""
            if error_content and error_content.get("has_errors", False):
                error_count = error_content.get("error_count", 0)
                errors = error_content.get("errors", [])
                
                error_prompt = f"""
                CONSOLE ERRORS INFORMATION:
                The game has {error_count} console errors during gameplay.
                
                Here are the first few errors (if any):
                """
                
                # Include up to 10 errors for context
                for i, error in enumerate(errors[:10]):
                    error_prompt += f"{i+1}. {error}\n"
                
                if len(errors) > 10:
                    error_prompt += f"... and {len(errors) - 10} more errors\n"
            
            # Prepare prompt with error information
            prompt = f"""
            You are a game tester evaluating an HTML5/JavaScript game (mode: {mode_name}).
            Your task is to analyze this gameplay video and provide comprehensive feedback on the following aspects:
            
            {error_prompt}
            
            1. Gameplay: Describe the basic mechanics and goal of the game based on what you observe.
            2. User Experience: Comment on the game's controls, responsiveness, and overall playability.
            3. Visual Design: Evaluate the visual aesthetics, clarity, and appeal.
            4. Bugs & Issues: Note any glitches, unexpected behaviors, or potential problems.
            5. Strengths & Weaknesses: Identify what works well and what could be improved.
            6. Improvement Suggestions: Provide specific, actionable feedback on how to improve the game.
            7. Technical Improvements: If console errors were detected, suggest how to fix them.
            8. Overall Assessment: Rate the game on a scale of 1-10 and explain your rating.
            
            Format your response using XML tags for each section:
            <gameplay>Your analysis here</gameplay>
            <user_experience>Your analysis here</user_experience>
            <visual_design>Your analysis here</visual_design>
            <bugs_issues>Your analysis here</bugs_issues>
            <strengths_weaknesses>Your analysis here</strengths_weaknesses>
            <improvement_suggestions>Your suggestions here</improvement_suggestions>
            <technical_improvements>Your technical suggestions here</technical_improvements>
            <overall_assessment>Your rating and explanation</overall_assessment>
            """
            
            # Send video to Gemini for evaluation
            response = await self.gemini_evaluator.evaluate_video_with_custom_prompt(video_path, prompt)
            
            if not response:
                logging.error(f"Failed to get evaluation for {mode_name}")
                return None
            
            # Parse the response
            parsed_evaluation = self.gemini_evaluator.parse_evaluation_response(response)
            
            # Add mode information
            parsed_evaluation["mode"] = mode_name
            
            return parsed_evaluation
            
        except Exception as e:
            logging.error(f"Error evaluating video {video_path}: {str(e)}")
            return None
    
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
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
            </style>
        </head>
        <body>
            <h1>Game Evaluation Report</h1>
            <p>Game path: {results["game_path"]}</p>
            <p>Status: <span class="{'success' if results['success'] else 'failure'}">{
                'Success' if results['success'] else 'Failure'}</span></p>
            
            <h2>Evaluations</h2>
        """
        
        for eval_data in results["evaluations"]:
            mode_name = eval_data["mode"]
            video_path = os.path.basename(eval_data["video_path"])
            evaluation = eval_data["evaluation"]
            
            # Try to get a rating if available
            rating = evaluation.get("rating", "N/A")
            if isinstance(rating, (int, float)):
                rating_display = f"{rating}/10"
            else:
                rating_display = "N/A"
            
            html_content += f"""
            <div class="evaluation-section">
                <h3>Mode: {mode_name} (Rating: {rating_display})</h3>
                
                <div class="video-container">
                    <p>Gameplay Video: <a href="{video_path}">{video_path}</a></p>
                    <video width="320" height="240" controls>
                        <source src="{video_path}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                
                <h4>Gameplay</h4>
                <p>{evaluation.get("gameplay", "")}</p>
                
                <h4>User Experience</h4>
                <p>{evaluation.get("user_experience", "")}</p>
                
                <h4>Visual Design</h4>
                <p>{evaluation.get("visual_design", "")}</p>
                
                <h4>Bugs & Issues</h4>
                <p>{evaluation.get("bugs_issues", "")}</p>
                
                <h4>Strengths & Weaknesses</h4>
                <p>{evaluation.get("strengths_weaknesses", "")}</p>
                
                <h4>Improvement Suggestions</h4>
                <p>{evaluation.get("improvement_suggestions", "")}</p>
                
                <h4>Technical Improvements</h4>
                <p>{evaluation.get("technical_improvements", "")}</p>
                
                <h4>Overall Assessment</h4>
                <p>{evaluation.get("overall_assessment", "")}</p>
            </div>
            """
        
        html_content += """
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
            html_content += "<p>No errors encountered during evaluation.</p>"
        
        html_content += """
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        logging.info(f"Created evaluation report at {report_path}")

async def evaluate_game_async(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Asynchronous function to evaluate a game.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = VLMPlayEvaluation(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()

def evaluate_game(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronous wrapper for evaluate_game_async.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    return asyncio.run(evaluate_game_async(game_path, output_dir, api_key))

def main():
    """Parse command line arguments and evaluate the game."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Evaluate games using VLM (Video Language Model) analysis"
    )
    
    parser.add_argument(
        "--game_path", required=True, help="Path to the game directory or HTML file to evaluate"
    )
    
    parser.add_argument(
        "--output-dir",
        help="Directory to save evaluation results (defaults to 'vlm_evaluation' in game directory)",
    )
    
    parser.add_argument(
        "--api-key",
        help="Google API key for Gemini access (defaults to GOOGLE_API_KEY environment variable)",
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
        # Evaluate the game
        results = evaluate_game(args.game_path, args.output_dir, args.api_key)
        
        # Print summary
        print("\n===== Game Evaluation Summary =====")
        print(f"Game: {args.game_path}")
        
        # Print evaluation summary
        if results["success"]:
            print(f"Status: Success - Generated {len(results['evaluations'])} evaluations")
            
            # Print evaluation ratings
            for eval_data in results["evaluations"]:
                mode = eval_data["mode"]
                rating = eval_data["evaluation"].get("rating", "N/A")
                print(f"  Mode: {mode} - Rating: {rating}/10")
            
            # Print console error summary
            print("\nConsole Error Summary:")
            for mode_name, error_info in results["console_errors"].items():
                status = "❌" if error_info["has_errors"] else "✓"
                print(f"  {status} {mode_name}: {error_info['error_count']} errors")
            
            # Print report location
            report_path = os.path.join(args.output_dir or os.path.join(os.path.dirname(args.game_path), "vlm_evaluation"), 
                                     "evaluation_report.html")
            if os.path.exists(report_path):
                print(f"\nDetailed report: {os.path.abspath(report_path)}")
        else:
            print(f"Status: Failed - No evaluations were generated")
            
        # Print errors if any
        if results["errors"]:
            print(f"\nErrors encountered ({len(results['errors'])}):")
            for error in results["errors"]:
                print(f"  - {error}")
            
        # Return success status
        return 0 if results["success"] else 1
        
    except Exception as e:
        logging.error(f"Error during game evaluation: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
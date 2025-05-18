#!/usr/bin/env python3
"""
VLM Play Guided Evaluation module.

This module provides a structured approach to evaluate games using VLM with:
- Structured output format with specific evaluation sections
- Clear criteria for assessment
- Consistent format for aggregating feedback
"""

import os
import sys
import json
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import xml.etree.ElementTree as ET

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

class VLMPlayEvaluationGuided:
    """Class to evaluate games using video recording and structured LLM analysis."""
    
    def __init__(self,
                 game_path: str, 
                 output_dir: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize the VLM Play Guided Evaluation.
        
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
                self.output_dir = os.path.join(self.original_path, "vlm_evaluation")
            else:
                self.output_dir = os.path.join(os.path.dirname(self.game_path), "vlm_evaluation")
        
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
        Evaluate the game by recording gameplay videos and analyzing them with structured prompts.
        
        Returns:
            Dictionary with evaluation results
        """
        from .vlm_play_test import VLMPlayEvaluation
        
        # Use the original VLMPlayEvaluation to handle the evaluation
        # This reuses the recording and evaluation logic from the original class
        evaluator = VLMPlayEvaluation(
            game_path=self.game_path,
            output_dir=self.output_dir,
            api_key=self.gemini_evaluator.api_key
        )
        
        # Evaluate the game using the structured approach
        results = await evaluator.evaluate_game()
        
        return results
    
    def get_instructions(self) -> str:
        """
        Get the instructions for the game play tester.
        """
        return f"""
You are an expert JavaScript game developer and game tester who is known for making games more fun, interesting, and playable for a general audience with varied gaming experience with no prior knowledge of this game.
You will be analyzing games developed by a game developer for a given game concept. Provide actionable feedback by evaluating gameplay videos of 2D video games to the game developer who will improve the game based on your feedback.

The game developer developed for the following input game concept: {self.game_concept}
Suggest changes and additions to the game including all aspects of the game, its description, and controls.

# Game information presented to the player:
Game description: {self.game_description}
Game controls:
{self.game_controls}

# Hard constraints on the game developer when implementing the game code:
- Keyboard inputs only. No mouse control. Allowed keyboard keys:
  - Allowed gameplay control keys: Arrow keys (37-40), SPACE (32), SHIFT (16), Z (90)
  - Game phase specific controls: 
    - ENTER (13) to start the game at the start screen
    - ESC (27) to pause the game
    - R (82) to restart the game. Pressing R takes you back to the start screen when the game is over so that the game can be played again.
- Allowed libraries: p5.js, p5.collide2D.
- Graphics and animations only using p5.
- No external images, sprites, fonts, or other assets. 
- No audio or sound effects.
"""
# Async function for easy API
async def evaluate_game_async(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game asynchronously using guided structured approach.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    evaluator = VLMPlayEvaluationGuided(game_path, output_dir, api_key)
    return await evaluator.evaluate_game()

# Sync wrapper for easier use
def evaluate_game(game_path: str, output_dir: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate a game synchronously using guided structured approach.
    
    Args:
        game_path: Path to the game directory or HTML file
        output_dir: Directory to save recorded videos and evaluation results
        api_key: Google API key for Gemini access
        
    Returns:
        Dictionary with evaluation results
    """
    print(f"Evaluating game with guided approach: {game_path}")
    return asyncio.run(evaluate_game_async(game_path, output_dir, api_key)) 
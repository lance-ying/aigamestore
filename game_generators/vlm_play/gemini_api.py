import os
import logging
import json
from typing import Dict, Any, Optional, List
import sys
sys.path.append("../")

import google.generativeai as genai
from google.generativeai.types import content_types as types

from game_generators.utils import ModelAPI


class GeminiEvaluator:
    """Class to handle interactions with Gemini API for game evaluation."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini API client.
        
        Args:
            api_key: Google API key for Gemini access
        """
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Google API key is required. Set GOOGLE_API_KEY environment variable or pass it as a parameter."
            )
            
        # Setup Gemini API
        genai.configure(api_key=self.api_key)
        
        # Initialize ModelAPI
        self.model_api = ModelAPI("google:gemini-2.0-flash")
        
    async def evaluate_video(self, video_path: str) -> Optional[str]:
        """
        Evaluate a game video using Gemini Vision.
        
        Args:
            video_path: Path to the MP4 video file
            
        Returns:
            Gemini's evaluation response or None if failed
        """
        if not os.path.exists(video_path):
            logging.error(f"Video file not found: {video_path}")
            return None
            
        try:
            logging.info(f"Sending video to Gemini for evaluation: {video_path}")
            
            with open(video_path, "rb") as f:
                video_data = f.read()
                
            # Prepare prompt for evaluation
            prompt = """
            You are a game tester evaluating an HTML5/JavaScript game.
            Your task is to analyze this gameplay video and provide comprehensive feedback on the following aspects:
            
            1. Gameplay: Describe the basic mechanics and goal of the game based on what you observe.
            2. User Experience: Comment on the game's controls, responsiveness, and overall playability.
            3. Visual Design: Evaluate the visual aesthetics, clarity, and appeal.
            4. Bugs & Issues: Note any glitches, unexpected behaviors, or potential problems.
            5. Strengths & Weaknesses: Identify what works well and what could be improved.
            6. Overall Assessment: Rate the game on a scale of 1-10 and explain your rating.
            
            Format your response using XML tags for each section:
            <gameplay>Your analysis here</gameplay>
            <user_experience>Your analysis here</user_experience>
            <visual_design>Your analysis here</visual_design>
            <bugs_issues>Your analysis here</bugs_issues>
            <strengths_weaknesses>Your analysis here</strengths_weaknesses>
            <overall_assessment>Your rating and explanation</overall_assessment>
            """
            
            # Create the content parts list with the prompt and video
            parts = [
                types.Part(text=prompt),
                types.Part(inline_data=types.Blob(
                    mime_type="video/mp4",
                    data=video_data
                ))
            ]
            
            # Create the final content
            content = types.Content(parts=parts, role="user")
            
            # Call Gemini
            response = await self.model_api.generate_content_async(
                contents=[content],
                stream=False,
                system_instruction="Analyze the provided game video and give detailed, accurate feedback."
            )
            
            # Check if we got a valid response
            if not response or not response.candidates or not response.candidates[0].content:
                logging.error("No valid response from Gemini API")
                return None
                
            response_text = response.candidates[0].content.parts[0].text
            return response_text
            
        except Exception as e:
            logging.error(f"Error evaluating video with Gemini: {str(e)}")
            return None
    
    async def evaluate_video_with_custom_prompt(self, video_path: str, custom_prompt: str) -> Optional[str]:
        """
        Evaluate a game video using Gemini Vision with a custom prompt.
        
        Args:
            video_path: Path to the MP4 video file
            custom_prompt: Custom prompt to send to Gemini
            
        Returns:
            Gemini's evaluation response or None if failed
        """
        if not os.path.exists(video_path):
            logging.error(f"Video file not found: {video_path}")
            return None
            
        try:
            logging.info(f"Sending video to Gemini for evaluation with custom prompt: {video_path}")
            
            with open(video_path, "rb") as f:
                video_data = f.read()
                
            # Create the content parts list with the custom prompt and video
            parts = [
                types.Part(text=custom_prompt),
                types.Part(inline_data=types.Blob(
                    mime_type="video/mp4",
                    data=video_data
                ))
            ]
            
            # Create the final content
            content = types.Content(parts=parts, role="user")
            
            # Call Gemini
            response = await self.model_api.generate_content_async(
                contents=[content],
                stream=False,
                system_instruction="Analyze the provided game video and give detailed, accurate feedback based on the specific instructions."
            )
            
            # Check if we got a valid response
            if not response or not response.candidates or not response.candidates[0].content:
                logging.error("No valid response from Gemini API")
                return None
                
            response_text = response.candidates[0].content.parts[0].text
            return response_text
            
        except Exception as e:
            logging.error(f"Error evaluating video with custom prompt: {str(e)}")
            return None
            
    def parse_evaluation_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the XML response from Gemini into a structured dictionary.
        
        Args:
            response_text: Raw XML response from Gemini
            
        Returns:
            Dictionary with parsed sections
        """
        result = {}
        
        # Define the sections to extract
        sections = [
            "gameplay",
            "user_experience",
            "visual_design",
            "bugs_issues",
            "strengths_weaknesses",
            "improvement_suggestions",
            "technical_improvements",
            "overall_assessment"
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
                
        # Try to extract numerical rating from overall assessment
        try:
            assessment = result.get("overall_assessment", "")
            import re
            rating_match = re.search(r"(\d+(\.\d+)?)/10", assessment)
            if rating_match:
                result["rating"] = float(rating_match.group(1))
            else:
                # Try to find just a number from 1-10
                rating_match = re.search(r"(?:rating|rate|score|give).*?(\d+)(?:/10)?", 
                                         assessment.lower())
                if rating_match:
                    rating = int(rating_match.group(1))
                    if 1 <= rating <= 10:
                        result["rating"] = rating
        except Exception as e:
            logging.warning(f"Failed to extract rating: {str(e)}")
            
        return result 
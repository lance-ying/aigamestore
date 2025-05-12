import os
import logging
import json
import time
from typing import Dict, Any, Optional, List
import sys
sys.path.append("../")

# Update imports to use the newer google-genai package
from google import genai
from google.genai import types

class GeminiEvaluator:
    """Class to handle interactions with Gemini API for game evaluation."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini API client.
        
        Args:
            api_key: Google API key for Gemini access
        """
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Google API key is required. Set GOOGLE_API_KEY environment variable or pass it as a parameter."
            )
            
        # Initialize the Gemini client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-2.0-flash"  # Use the latest available model
    
    def wait_for_file_processing(self, uploaded_file):
        """
        Wait until the file is processed and in ACTIVE state.
        
        Args:
            uploaded_file: The file object returned from the upload method
            
        Returns:
            The file object in ACTIVE state
            
        Raises:
            Exception: If file processing fails
        """
        logging.info(f"Waiting for file {uploaded_file.name} to be processed...")
        
        # Wait for the file to be processed
        while uploaded_file.state == "PROCESSING":
            logging.info(f"File is still processing: {uploaded_file.name}")
            # Wait before checking again
            time.sleep(5)
            # Get the updated file status
            uploaded_file = self.client.files.get(name=uploaded_file.name)
        
        # Check final state
        if uploaded_file.state == "ACTIVE":
            logging.info(f"File {uploaded_file.name} is now ACTIVE and ready for use")
            return uploaded_file
        elif uploaded_file.state == "FAILED":
            error_msg = f"File processing failed: {getattr(uploaded_file, 'error', 'Unknown error')}"
            logging.error(error_msg)
            raise Exception(error_msg)
        else:
            error_msg = f"File is in unexpected state: {uploaded_file.state}"
            logging.error(error_msg)
            raise Exception(error_msg)
        
    def evaluate_video(self, video_path: str) -> Optional[str]:
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
            
            # Prepare prompt for evaluation
            prompt = """
            You are a game tester evaluating an HTML5/JavaScript gameplay video.
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
            
            # Upload the video file to the API
            logging.info(f"Uploading video file: {video_path}")
            video_file = self.client.files.upload(file=video_path)
            logging.info(f"Video file uploaded with URI: {video_file.uri}, State: {video_file.state}")
            
            # Wait for the file to be processed before using it
            video_file = self.wait_for_file_processing(video_file)
            
            # Prepare content with video and prompt
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=video_file.uri,
                            mime_type=video_file.mime_type,
                        ),
                        types.Part.from_text(text=prompt),
                    ],
                ),
            ]
            
            # Configure response format
            generate_content_config = types.GenerateContentConfig(
                response_mime_type="text/plain",
            )
            
            # Generate content using the model
            logging.info(f"Generating content with model: {self.model_name}")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_content_config,
            )
            
            if not response or not hasattr(response, 'text'):
                logging.error("No valid response from Gemini API")
                return None
                
            return response.text
            
        except Exception as e:
            logging.error(f"Error evaluating video with Gemini: {str(e)}")
            return None
    
    def evaluate_video_with_custom_prompt(self, video_path: str, custom_prompt: str) -> Optional[str]:
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
            
            # Upload the video file to the API
            logging.info(f"Uploading video file: {video_path}")
            video_file = self.client.files.upload(file=video_path)
            logging.info(f"Video file uploaded with URI: {video_file.uri}, State: {video_file.state}")
            
            # Wait for the file to be processed before using it
            video_file = self.wait_for_file_processing(video_file)
            
            # Prepare content with video and prompt
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=video_file.uri,
                            mime_type=video_file.mime_type,
                        ),
                        types.Part.from_text(text=custom_prompt),
                    ],
                ),
            ]
            
            # Configure response format
            generate_content_config = types.GenerateContentConfig(
                response_mime_type="text/plain",
            )
            
            # Generate content using the model
            logging.info(f"Generating content with model: {self.model_name}")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_content_config,
            )
            
            if not response or not hasattr(response, 'text'):
                logging.error("No valid response from Gemini API")
                return None
                
            return response.text
            
        except Exception as e:
            logging.error(f"Error evaluating video with custom prompt: {str(e)}")
            return None
            
    # Keep the evaluate_video_with_custom_prompt_sync method for backward compatibility
    def evaluate_video_with_custom_prompt_sync(self, video_path: str, custom_prompt: str) -> Optional[str]:
        """
        Evaluate a game video using Gemini Vision with a custom prompt.
        
        Args:
            video_path: Path to the MP4 video file
            custom_prompt: Custom prompt to send to Gemini
            
        Returns:
            Gemini's evaluation response or None if failed
        """
        return self.evaluate_video_with_custom_prompt(video_path, custom_prompt)
            
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
        
    def generate_text(self, prompt: str) -> Optional[str]:
        """
        Generate text using Gemini with a text-only prompt.
        
        Args:
            prompt: Text prompt to send to Gemini
            
        Returns:
            Gemini's response text or None if failed
        """
        try:
            logging.info(f"Sending text prompt to Gemini")
            
            # Create content with prompt only
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt),
                    ],
                ),
            ]
            
            # Configure response format
            generate_content_config = types.GenerateContentConfig(
                response_mime_type="text/plain",
            )
            
            # Generate content using the model
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_content_config,
            )
            
            if not response or not hasattr(response, 'text'):
                logging.error("No valid response from Gemini API")
                return None
                
            return response.text
            
        except Exception as e:
            logging.error(f"Error generating text with Gemini: {str(e)}")
            return None
    
    # Keep the generate_text_sync method for backward compatibility
    def generate_text_sync(self, prompt: str) -> Optional[str]:
        """
        Generate text using Gemini with a text-only prompt (synchronous version).
        
        Args:
            prompt: Text prompt to send to Gemini
            
        Returns:
            Gemini's response text or None if failed
        """
        return self.generate_text(prompt) 
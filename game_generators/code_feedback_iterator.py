from typing import Dict, Any, Optional, List, Tuple
import json
import os
import glob

from gamegen_methods.game_generator_base import GameGenerator


class CodeFeedbackIterator(GameGenerator):
    """
    A class that iterates on game code based on feedback using LLM calls.
    """

    def __init__(self, *args, mode: str = "guided_iteration", **kwargs):
        super().__init__(*args, **kwargs)
        self.mode = mode

    def read_js_files(self, game_dir: str) -> List[Tuple[str, str]]:
        """
        Read all JavaScript files from the given directory
        
        Args:
            game_dir: Path to the game directory
            
        Returns:
            List of tuples containing filename and code content
        """
        js_files = []
        file_paths = glob.glob(os.path.join(game_dir, "*.js"))
        
        for file_path in file_paths:
            filename = os.path.basename(file_path)
            with open(file_path, 'r') as f:
                content = f.read()
            js_files.append((filename, content))
            
        return js_files

    def read_metadata(self, game_dir: str) -> Dict[str, Any]:
        """
        Read metadata.json file from the game directory
        
        Args:
            game_dir: Path to the game directory
            
        Returns:
            Dictionary containing metadata information
        """
        metadata_path = os.path.join(game_dir, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            return metadata
        return {}

    def format_code_for_prompt(self, js_files: List[Tuple[str, str]]) -> str:
        """
        Format JavaScript files for the prompt
        
        Args:
            js_files: List of tuples containing filename and code content
            
        Returns:
            Formatted code string for the prompt
        """
        formatted_code = ""
        for filename, content in js_files:
            formatted_code += f"<code filename=\"{filename}\">\n{content}\n</code>\n\n"
        
        return formatted_code

    def generate_user_prompt(self, game_dir: str, feedback: str) -> str:
        """
        Generate user prompt with code and feedback
        
        Args:
            game_dir: Path to the game directory
            feedback: Feedback to improve the code
            
        Returns:
            User prompt for the LLM
        """
        js_files = self.read_js_files(game_dir)
        formatted_code = self.format_code_for_prompt(js_files)
        
        # Read metadata for game description and controls
        metadata = self.read_metadata(game_dir)
        game_description = metadata.get("game_info", {}).get("description", "")
        game_controls = metadata.get("game_info", {}).get("controls", "")
        
        if self.mode == "vibe_coding":
            feedback = self.get_vibe_coding_feedback()

        prompt = f"""
<task>
{feedback}
</task>

<game_description>
{game_description}
</game_description>

<game_controls>
{game_controls}
</game_controls>

<current_code>
{formatted_code}
</current_code>

<output_instructions>
Output the code with the same filenames in the following format without any additional text:

<code filename="filename.js">
// Improved code here
</code>
</output_instructions>
"""
        return prompt

    def extract_updated_code(self, response: str) -> Dict[str, str]:
        """
        Extract updated code from LLM response
        
        Args:
            response: LLM response
            
        Returns:
            Dictionary mapping filenames to updated code
        """
        updated_files = {}
        
        # Use the extract_code_block method inherited from GameGenerator
        code_blocks = self.extract_code_block(response, "javascript")
        
        for filename, code in code_blocks.items():
            updated_files[filename] = code
            
        return updated_files

    def save_updated_code(self, game_dir: str, updated_files: Dict[str, str]) -> None:
        """
        Save updated code to files
        
        Args:
            game_dir: Path to the game directory
            updated_files: Dictionary mapping filenames to updated code
        """
        for filename, code in updated_files.items():
            file_path = os.path.join(game_dir, filename)
            with open(file_path, 'w') as f:
                f.write(code)
                
        if self.verbose:
            print(f"Updated {len(updated_files)} files in {game_dir}")

    def iterate_code(self, game_dir: str, feedback: Optional[str] = None) -> Dict[str, Any]:
        """
        Iterate on game code based on feedback
        
        Args:
            game_dir: Path to the game directory
            feedback: Feedback to improve the code (required for guided_iteration mode)
            
        Returns:
            Dictionary containing updated files and any intermediate outputs
        """
        try:
            if self.mode == "guided_iteration" and not feedback:
                raise ValueError("Feedback is required for guided_iteration mode")
                
            # Generate user prompt
            user_prompt = self.generate_user_prompt(game_dir, feedback)
            system_prompt = self.get_system_prompt()
            
            # Call the LLM
            if self.verbose:
                print(f"Calling LLM to improve code using {self.mode} mode...")
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                verbose=self.verbose,
                temperature=0.2,  # Lower temperature for more consistent code fixes
                top_p=0.9,
            )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract updated code from response
            updated_files = self.extract_updated_code(response)
            
            # Save the updated code
            self.save_updated_code(game_dir, updated_files)
            
            # Save the conversation log
            log_path = os.path.join(game_dir, f"code_iteration_{self.mode}.json")
            with open(log_path, 'w') as f:
                json.dump(conversation_log, f, indent=2)
            
            if self.verbose:
                print(f"Code updated successfully in: {game_dir}")
            
            return {
                "game_dir": game_dir,
                "updated_files": list(updated_files.keys()),
                "conversation_log": conversation_log,
                "mode": self.mode
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in code iteration: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise
    
    def get_system_prompt(self) -> str:
        """
        Get the system prompt for code fixing
        """
        system_prompt = open("system_prompts/code_feedback_iterator_instructions.txt", "r").read()
        return system_prompt
    
    def get_user_instructions(self) -> str:
        """
        Get the user instructions for code fixing
        """
        user_instructions = open("system_prompts/code_feedback_iterator_instructions.txt", "r").read()
        return user_instructions

    def get_vibe_coding_feedback(self) -> str:
        """
        Get the vibe coding feedback
        """
        vibe_coding_feedback = "Please improve the game while being consistent with the game description and controls. Do not add new game elements or change the game objective and design. It should still be following the same game description, characters, controls, action mappings, and have the same aesthetic design. Fix any bugs in the code. Output the code with the same filenames."
        return vibe_coding_feedback

    def get_output_instructions(self) -> str:
        """
        Get the output instructions for code fixing
        """
        output_instructions = open("system_prompts/code_feedback_iterator_output_instructions.txt", "r").read()
        return output_instructions

from typing import Dict, Any, Optional, List, Tuple
import json
import os
import glob
import datetime
import shutil
from pathlib import Path
import re

from gamegen_methods.game_generator_base import GameGenerator

class CodeFeedbackIterator(GameGenerator):
    """
    A class that iterates on game code based on feedback using LLM calls.
    """

    def __init__(self, *args, mode: str = "guided_iteration", temperature: float = 0.6, **kwargs):
        super().__init__(*args, **kwargs)
        self.mode = mode
        self.temperature = temperature

    def generate_game(self, game_description: str = "", game_controls: str = "", **kwargs) -> Dict[str, Any]:
        """
        Implements the abstract method from GameGenerator.
        This class focuses on iterating existing games rather than generating new ones,
        so this method delegates to iterate_code if a game_dir is provided.
        
        Args:
            game_description: Description of the game (not used directly in this implementation)
            game_controls: Controls for the game (not used directly in this implementation)
            **kwargs: Additional arguments including game_dir and feedback
            
        Returns:
            Dictionary containing updated files and any intermediate outputs
        """
        NotImplementedError("CodeFeedbackIterator cannot generate a game from scratch")

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
        # Read metadata for game description and controls
        metadata = self.read_metadata(game_dir)
        game_description = metadata.get("game_info", {}).get("description", "")
        game_controls = metadata.get("game_info", {}).get("controls", "")
        
        # Read all JS files
        js_files = self.read_js_files(game_dir)
        
        # Sort JS files according to the order in metadata if available
        if "game_files" in metadata and "javascript" in metadata["game_files"]:
            js_file_order = metadata["game_files"]["javascript"]
            # Create a dictionary for quick lookup
            js_files_dict = {filename: content for filename, content in js_files}
            # Create a new sorted list based on metadata order
            sorted_js_files = []
            # First add files in the order specified in metadata
            for filename in js_file_order:
                if filename in js_files_dict:
                    sorted_js_files.append((filename, js_files_dict[filename]))
                    js_files_dict.pop(filename)
            # Then add any remaining files not in metadata
            for filename, content in js_files:
                if filename in js_files_dict:
                    sorted_js_files.append((filename, content))
            js_files = sorted_js_files
            
        formatted_code = self.format_code_for_prompt(js_files)
        
        if self.mode == "vibe_coding":
            feedback = self.get_vibe_coding_feedback()
        elif self.mode == "basic_test_fix":
            # For basic_test_fix mode, use the provided feedback directly
            # The feedback string is expected to come from another program
            pass  # No need to modify the feedback
        prompt = f"""
<task>
Please update the current game code based on the feedback.
{feedback}
</task>

Game description:
<game_description>
{game_description}
</game_description>

Game controls:
<game_controls>
{game_controls}
</game_controls>

Current code:
<current_code>
{formatted_code}
</current_code>

<output_instructions>
Output the <code_change_plan>, <updated_code filename="filename.js">, and <explain_edits> sections that require changes to address the feedback. 
You can update the structure of the code or file structure if you think it helps in addressing the feedback. 
Do not rewrite files that don't need.

<code_change_plan>
... // Explain your plan for the code changes specifically for each file in a few sentences. Mention no changes if the feedback is not related to the current code.
</code_change_plan>

<updated_code filename="filename.js">
... // Improved code here
</updated_code>

<explain_edits>
... // Explain the changes made to the code.
</explain_edits>
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
        # Extract code blocks using the format specified in the system prompt
        code_blocks = re.findall(
            r"<updated_code filename=\"(.*?)\">(.*?)</updated_code>", response, re.DOTALL
        )
        
        js_files = {}
        for filename, code in code_blocks:
            if filename.endswith(".js"):
                # Clean up code block markers
                code = re.sub("```(javascript|js)?", "", code)
                # Normalize path separators to use forward slashes
                normalized_filename = filename.replace("\\", "/")
                js_files[normalized_filename] = code.strip()
            
            # If no JS files found, create a default game.js
            if not js_files:
                if self.verbose:
                    print("Warning: No JS files found, creating default game.js")
                js_files["game.js"] = "// Default game.js - Generated empty file\n"
                
        return js_files

    def extract_explanation_sections(self, response: str) -> Dict[str, str]:
        """
        Extract code_change_plan and explain_edits sections from LLM response
        
        Args:
            response: LLM response
            
        Returns:
            Dictionary containing code_change_plan and explain_edits
        """
        sections = {}
        
        # Extract code_change_plan
        if "<code_change_plan>" in response and "</code_change_plan>" in response:
            start_idx = response.find("<code_change_plan>") + len("<code_change_plan>")
            end_idx = response.find("</code_change_plan>")
            if start_idx < end_idx:
                sections["code_change_plan"] = response[start_idx:end_idx].strip()
        
        # Extract explain_edits
        if "<explain_edits>" in response and "</explain_edits>" in response:
            start_idx = response.find("<explain_edits>") + len("<explain_edits>")
            end_idx = response.find("</explain_edits>")
            if start_idx < end_idx:
                sections["explain_edits"] = response[start_idx:end_idx].strip()
        
        return sections

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

    def save_file(
        self,
        game_dir: str,
        updated_files: Dict[str, str],
        feedback: str,
        metadata: Optional[Dict[str, Any]] = None,
        conversation_log: Optional[List[Dict[str, str]]] = None,
        explanation_sections: Optional[Dict[str, str]] = None,
        output_dir: Optional[str] = None
    ) -> str:
        """
        Save the updated game files and metadata in a new folder structure
        
        Args:
            game_dir: Path to the original game directory
            updated_files: Dictionary of updated files (filename -> content)
            feedback: The feedback used for improvement
            metadata: Original game metadata if available
            conversation_log: Conversation log of the iteration
            explanation_sections: Dictionary containing code_change_plan and explain_edits sections
            output_dir: Optional directory to save all files (overrides default behavior)
            
        Returns:
            Path to the saved game directory
        """
        # If output_dir is provided, use it directly
        if output_dir:
            iteration_dir = Path(output_dir)
            # Create all parent directories if they don't exist
            iteration_dir.mkdir(parents=True, exist_ok=True)
            
            # First, copy specific files from the source game directory
            if self.verbose:
                print(f"Copying necessary files from {game_dir} to {iteration_dir}")
            
            # Get list of filenames that will be updated
            updated_filenames = set(updated_files.keys())
            
            # Copy only specific files from source directory, excluding those that will be updated
            for item in os.listdir(game_dir):
                source = os.path.join(game_dir, item)
                destination = os.path.join(iteration_dir, item)
                
                # Skip directories like vibe_coding_updates to avoid recursive copying
                if item.endswith("_updates") or item.endswith("_orig_files"):
                    continue
                    
                if os.path.isdir(source):
                    # Copy directories recursively
                    if not os.path.exists(destination):
                        shutil.copytree(source, destination)
                elif item not in updated_filenames:
                    # Only copy HTML files and other non-JS, non-JSON files (assets)
                    # Skip JSON files as we'll generate new metadata
                    _, ext = os.path.splitext(item)
                    if ext.lower() != '.json':  # Skip JSON files
                        shutil.copy2(source, destination)
            
            # Save the updated JavaScript files
            for filename, content in updated_files.items():
                file_path = iteration_dir / filename
                # Ensure the parent directory exists
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            if self.verbose:
                print(f"Updated game saved to: {iteration_dir}")
            
            return str(iteration_dir)
            
        # Otherwise use the original folder structure logic
        game_dir_path = Path(game_dir)
        input_folder_name = game_dir_path.name
        
        # Special handling for vibe_coding mode
        if self.mode == "vibe_coding":
            # Check if the path already contains vibe_coding
            if "vibe_coding" in str(game_dir_path):
                # Extract the base folder name and current iteration
                base_folder_name = None
                current_iteration = 0
                
                # Look for folder_*_vibe_coding_iter_* pattern
                pattern = r"(folder_\d+)_vibe_coding_iter_(\d+)"
                match = re.search(pattern, input_folder_name)
                if match:
                    base_folder_name = match.group(1)
                    current_iteration = int(match.group(2))
                else:
                    # Fallback: just use the current folder name as base
                    base_folder_name = input_folder_name
                
                # Use the parent directory (which should be the vibe_coding dir)
                updates_dir = game_dir_path.parent
                
                # Determine the next iteration number
                next_iteration = current_iteration + 1
                
                # Create the new directory for this iteration
                iteration_dir = updates_dir / f"{base_folder_name}_vibe_coding_iter_{next_iteration}"
            else:
                # This is the first vibe_coding iteration
                # Create the vibe_coding directory in the same location as the game folder
                updates_dir = game_dir_path.parent / "vibe_coding"
                updates_dir.mkdir(parents=True, exist_ok=True)
                
                # Use folder_1 as the base name
                base_folder_name = input_folder_name.split("/")[-1]
                next_iteration = 1
                
                # Create the new directory for this iteration
                iteration_dir = updates_dir / f"{base_folder_name}_vibe_coding_iter_{next_iteration}"
        else:
            # Original code for other modes
            # Check if the input folder is already an iteration with format sample_0000_mode_1
            base_folder_name = input_folder_name
            current_iteration = 0
            
            # Pattern to look for: _mode_number at the end of the folder name
            pattern = f"_{self.mode}_"
            if pattern in input_folder_name:
                parts = input_folder_name.split(pattern)
                if len(parts) == 2 and parts[1].isdigit():
                    base_folder_name = parts[0]
                    current_iteration = int(parts[1])
            
            # Create the MODE_updates directory in the parent folder
            parent_dir = game_dir_path.parent
            # If already in a MODE_updates directory, use the same directory
            if parent_dir.name == f"{self.mode}_updates":
                updates_dir = parent_dir
            else:
                updates_dir = parent_dir / f"{self.mode}_updates"
                updates_dir.mkdir(parents=True, exist_ok=True)
            
            # Determine the next iteration number
            existing_iterations = [
                int(d.name.split(f"_{self.mode}_")[1])
                for d in updates_dir.iterdir()
                if d.is_dir() and f"_{self.mode}_" in d.name and d.name.split(f"_{self.mode}_")[0] == base_folder_name
            ]
            # Include current iteration if found
            if current_iteration > 0:
                existing_iterations.append(current_iteration)
                
            next_iteration = max(existing_iterations, default=0) + 1
            
            # Create the new directory for this iteration
            iteration_dir = updates_dir / f"{base_folder_name}_{self.mode}_{next_iteration}"
        
        # Create the directory if it doesn't exist
        iteration_dir.mkdir(parents=True, exist_ok=True)
        
        # First, copy all files from the source game directory to preserve assets and other files
        if self.verbose:
            print(f"Copying all files from {game_dir_path} to {iteration_dir}")
        
        # Get list of filenames that will be updated (to exclude them from copying)
        updated_filenames = set(updated_files.keys())
        
        # Copy all files from source directory, excluding those that will be updated
        for item in os.listdir(game_dir_path):
            source = game_dir_path / item
            destination = iteration_dir / item
            
            # Skip directories like vibe_coding_updates to avoid recursive copying
            if item.endswith("_updates") or item.endswith("_orig_files"):
                continue
                
            if os.path.isdir(source):
                # Copy directories recursively
                if not os.path.exists(destination):
                    shutil.copytree(source, destination)
            elif item not in updated_filenames and item != "index.html" and item != "metadata.json":
                # Copy files that aren't being updated and aren't special files
                shutil.copy2(source, destination)
        
        # Copy any needed files from the original directory
        if not metadata:
            metadata_path = game_dir_path / "metadata.json"
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
        
        # Read the original index.html if it exists and copy it without modification
        html_code = ""
        html_path = game_dir_path / "index.html"
        if os.path.exists(html_path):
            with open(html_path, 'r') as f:
                html_code = f.read()
        
        # Save the updated JavaScript files
        js_filenames = []
        for filename, content in updated_files.items():
            file_path = iteration_dir / filename
            # Ensure the parent directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            js_filenames.append(filename)
        
        # Save the HTML file (copy it without modification)
        with open(iteration_dir / "index.html", 'w', encoding='utf-8') as f:
            f.write(html_code)
        
        # Create or update metadata
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if metadata:
            # Update the existing metadata
            updated_metadata = metadata.copy()
            
            # Check if there's already iteration info and preserve previous iterations
            if "iteration_info" in updated_metadata:
                # If there's already an iterations list, append to it
                if "iterations" not in updated_metadata:
                    updated_metadata["iterations"] = []
                # Move the existing iteration info to the iterations list
                if updated_metadata["iteration_info"] not in updated_metadata["iterations"]:
                    updated_metadata["iterations"].append(updated_metadata["iteration_info"])
            
            # Add new iteration info
            updated_metadata["iteration_info"] = {
                "iteration_number": next_iteration,
                "mode": self.mode,
                "feedback": feedback,
                "timestamp": timestamp
            }
            
            # Add explanation sections if available
            if explanation_sections:
                if "code_change_plan" in explanation_sections:
                    updated_metadata["iteration_info"]["code_change_plan"] = explanation_sections["code_change_plan"]
                if "explain_edits" in explanation_sections:
                    updated_metadata["iteration_info"]["explain_edits"] = explanation_sections["explain_edits"]
            
            # Update file list if needed
            if "game_files" in updated_metadata:
                updated_metadata["game_files"]["javascript"] = js_filenames
                
        else:
            # Create new basic metadata
            updated_metadata = {
                "iteration_info": {
                    "iteration_number": next_iteration,
                    "mode": self.mode,
                    "feedback": feedback,
                    "timestamp": timestamp
                },
                "iterations": [],
                "game_files": {
                    "html": "index.html",
                    "javascript": js_filenames,
                    "log": "iteration_log.json",
                }
            }
            
            # Add explanation sections if available
            if explanation_sections:
                if "code_change_plan" in explanation_sections:
                    updated_metadata["iteration_info"]["code_change_plan"] = explanation_sections["code_change_plan"]
                if "explain_edits" in explanation_sections:
                    updated_metadata["iteration_info"]["explain_edits"] = explanation_sections["explain_edits"]
        
        # Save the updated metadata
        with open(iteration_dir / "metadata.json", 'w', encoding='utf-8') as f:
            json.dump(updated_metadata, f, indent=2)
        
        # Save conversation log if provided
        if conversation_log:
            with open(iteration_dir / "iteration_log.json", 'w', encoding='utf-8') as f:
                json.dump(conversation_log, f, indent=2)
        
        if self.verbose:
            print(f"Updated game saved to: {iteration_dir}")
        
        return str(iteration_dir)

    def iterate_code(self, game_dir: str, feedback: Optional[str] = None, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Iterate on game code based on feedback
        
        Args:
            game_dir: Path to the game directory
            feedback: Feedback to improve the code (required for guided_iteration and basic_test_fix modes)
            output_dir: Optional directory to save all files (overrides default behavior)
            
        Returns:
            Dictionary containing updated files and any intermediate outputs
        """
        try:
            if (self.mode == "guided_iteration" or self.mode == "basic_test_fix") and not feedback:
                raise ValueError(f"Feedback is required for {self.mode} mode")
                
            # Generate user prompt
            user_prompt = self.generate_user_prompt(game_dir, feedback)
            print(feedback)
            system_prompt = self.get_system_prompt()
            
            # Call the LLM
            if self.verbose:
                print(f"Calling LLM to improve code using {self.mode} mode...")
            
            # Determine temperature based on mode
            temperature = self.temperature
            if self.mode == "basic_test_fix":
                temperature = 0.1  # Fixed lower temperature for basic_test_fix mode
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                verbose=True,
                temperature=temperature,
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
            
            # Extract explanation sections
            explanation_sections = self.extract_explanation_sections(response)
            
            # Special handling for basic_test_fix mode: backup original files before replacing
            backup_folder = None
            if self.mode == "basic_test_fix":
                # Get the input folder name
                game_dir_path = Path(game_dir)
                input_folder_name = game_dir_path.name
                
                # Create backup folder for original code
                backup_folder = os.path.join(game_dir, f"{input_folder_name}_orig_files")
                
                # Remove the backup folder if it already exists
                if os.path.exists(backup_folder):
                    shutil.rmtree(backup_folder)
                
                # Create the backup folder
                os.makedirs(backup_folder, exist_ok=True)
                
                if self.verbose:
                    print(f"Backing up all original files and folders to {backup_folder}")
                
                # Copy all files and folders from the original directory to the backup folder
                for item in os.listdir(game_dir):
                    source = os.path.join(game_dir, item)
                    # Skip the backup folder itself to avoid recursive copying
                    if os.path.abspath(source) == os.path.abspath(backup_folder):
                        continue
                    destination = os.path.join(backup_folder, item)
                    
                    if os.path.isdir(source):
                        shutil.copytree(source, destination, dirs_exist_ok=True)
                    else:
                        shutil.copy2(source, destination)
            
            # Save the updated code in the original location (except when output_dir is specified)
            if not output_dir:
                self.save_updated_code(game_dir, updated_files)
            
            # Read metadata from the original game directory
            metadata_path = os.path.join(game_dir, "metadata.json")
            metadata = None
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            
            # Save files in the new structure (or in output_dir if specified)
            iteration_dir = None
            if self.mode != "basic_test_fix" or output_dir:
                iteration_dir = self.save_file(
                    game_dir,
                    updated_files,
                    feedback or self.get_vibe_coding_feedback(),
                    metadata,
                    conversation_log,
                    explanation_sections,
                    output_dir
                )
            
            # Save the conversation log in the original directory too (unless output_dir is specified)
            if not output_dir:
                log_path = os.path.join(game_dir, f"code_iteration_{self.mode}.json")
                with open(log_path, 'w') as f:
                    json.dump(conversation_log, f, indent=2)
            
            if self.verbose:
                print(f"Code updated successfully in: {output_dir or game_dir}")
            
            return {
                "game_dir": game_dir,
                "iteration_dir": iteration_dir,
                "updated_files": list(updated_files.keys()),
                "conversation_log": conversation_log,
                "mode": self.mode,
                "backup_folder": backup_folder
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in code iteration: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise

    def get_input_instructions(self) -> str:
        """
        Get the input instructions for code fixing
        """
        input_instructions = open("game_generators/system_prompts/code_feedback_iterator_input_instructions.txt", "r").read()
        return input_instructions

    def get_system_prompt(self) -> str:
        """
        Get the system prompt for code fixing
        """
        system_prompt = open("game_generators/system_prompts/code_feedback_iterator_sysprompt.txt", "r").read()
        return system_prompt
    
    def get_user_instructions(self) -> str:
        """
        Get the user instructions for code fixing
        """
        user_instructions = open("game_generators/system_prompts/code_feedback_iterator_instructions.txt", "r").read()
        return user_instructions

    def get_vibe_coding_feedback(self) -> str:
        """
        Get the vibe coding feedback
        """
        vibe_coding_feedback = "Improve the game code. Ensure the game loads, start on pressing ENTER, key inputs work, and the game is still playable."
        return vibe_coding_feedback

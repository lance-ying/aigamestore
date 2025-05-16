from abc import ABC, abstractmethod
import os
import json
import re
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List, Union

from utils import ModelAPI

class GameGenerator(ABC):
    """Abstract base class for game generation methods"""

    def __init__(
        self,
        model_name: str = "anthropic:claude-3.7-sonnet",
        temperature: float = 0.7,
        verbose: bool = False,
        use_ecs: bool = True,
        use_baseline: bool = False,
        use_basic: bool = False,
        game_design_system_prompt_path: str = "game_generators/system_prompts/game_design.txt",
        game_design_withai_system_prompt_path: str = "game_generators/system_prompts/game_design_withai.txt",
        code_generation_system_prompt_path: str = "game_generators/system_prompts/code_generation.txt",
        code_generation_nonecs_system_prompt_path: str = "game_generators/system_prompts/code_generation_nonecs.txt",
        code_generation_withai_system_prompt_path: str = "game_generators/system_prompts/code_generation_withai.txt",
        code_generation_withai_nonecs_system_prompt_path: str = "game_generators/system_prompts/code_generation_withai_nonecs.txt",
        generate_with_ai: Optional[bool] = False,
    ):
        """
        Initialize the game generator

        Args:
            model_name: Name of the LLM model to use
            verbose: Whether to print verbose output
            use_ecs: Whether to use ECS architecture for game generation
            use_baseline: Whether to use baseline architecture for game generation
            use_basic: Whether to use basic instructions which include automated testing and user logging but no game design specifications for game generation
            game_design_system_prompt_path: Path to the game design system prompt
            code_generation_system_prompt_path: Path to the code generation system prompt
            code_generation_nonecs_system_prompt_path: Path to the code generation system prompt for non-ECS games
        """
        self.model_name = model_name
        self.verbose = verbose
        self.temperature = temperature
        self.use_ecs = use_ecs
        self.use_baseline = use_baseline
        self.use_basic = use_basic
        self.generate_with_ai = generate_with_ai
        # Load system prompts
        with open(game_design_system_prompt_path, "r") as f:
            self.game_design_system_prompt = f.read()
            
        if use_ecs:
            with open(code_generation_system_prompt_path, "r") as f:
                self.code_generation_system_prompt = f.read()
        else:
            with open(code_generation_nonecs_system_prompt_path, "r") as f:
                self.code_generation_system_prompt = f.read()

        if self.generate_with_ai is True:
            with open(game_design_withai_system_prompt_path, "r") as f:
                self.game_design_system_prompt = f.read()
            if use_ecs:
                with open(code_generation_withai_system_prompt_path, "r") as f:
                    self.code_generation_system_prompt = f.read()
            else:
                with open(code_generation_withai_nonecs_system_prompt_path, "r") as f:
                    self.code_generation_system_prompt = f.read()

        # Initialize the model API
        self.model_api = ModelAPI(model_name)

    @abstractmethod
    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept

        Args:
            game_concept: The game concept in natural language

        Returns:
            User prompt for the LLM
        """
        pass


    @abstractmethod
    def generate_game(self, game_concept: str) -> Dict[str, Any]:
        """
        Generate a game from the given concept

        Args:
            game_concept: The game concept in natural language

        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        pass

    def parse_intermediate_outputs(self, outputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse intermediate outputs and prepare them for logging

        Args:
            outputs: Dictionary of intermediate outputs

        Returns:
            Processed outputs ready for logging
        """
        # Default implementation - subclasses can override this
        return outputs
    
    def extract_game_design(self, text: str) -> str:
        """
        Extract game design from text
        """
        pattern = r"<game_design>\s*(.*?)\s*</game_design>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
    
    def extract_automated_testing_code(self, text: str) -> str:
        """
        Extract automated testing code from text
        """
        pattern = r"<automated_testing_code>\s*(.*?)\s*</automated_testing_code>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
    
    def extract_code_block(self, text: str, language: str = "javascript") -> Union[str, Dict[str, str]]:
        """
        Extract code blocks from text output

        Args:
            text: The text containing code blocks
            language: The language to extract (javascript or html)

        Returns:
            Dictionary of filenames and their contents for JavaScript,
            or a string for HTML
        """
        # Extract code blocks using the format specified in the system prompt
        code_blocks = re.findall(
            r"<code filename=\"(.*?)\">(.*?)</code>", text, re.DOTALL
        )
        
        if language == "javascript":
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
        else:
            # For HTML, find the first HTML file
            for filename, code in code_blocks:
                if filename.endswith(".html"):
                    code = re.sub("```(html|xml)?", "", code)
                    return code.strip()
            return ""

    def extract_title(self, text: str) -> str:
        """
        Extract game title from text

        Args:
            text: The text containing the game title

        Returns:
            The extracted game title
        """
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fallback patterns if new format not found
        fallback_patterns = [
            r"GAME TITLE:\s*(.*?)(?:\n|$)",
            r"title:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in fallback_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return "Untitled Game"

    def extract_game_description(self, text: str) -> str:
        """
        Extract game description from text

        Args:
            text: The text containing the game description

        Returns:
            The extracted game description
        """
        pattern = r"<game_description>\s*(.*?)\s*</game_description>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
    
    def extract_game_plan(self, text: str) -> str:
        """
        Extract game plan from text
        """
        pattern = r"<plan>\s*(.*?)\s*</plan>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
    
    def extract_game_controls(self, text: str) -> str:
        """
        Extract game controls from text
        """
        pattern = r"<game_controls>\s*(.*?)\s*</game_controls>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
    
    def extract_automated_testing(self, text: str) -> str:
        """
        Extract automated testing from text
        """
        pattern = r"<automated_testing>\s*(.*?)\s*</automated_testing>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def save_games(
        self,
        title: str,
        html_code: str,
        js_files: List[Tuple[str, str]],
        game_description: str,
        game_controls: str,
        game_concept: str,
        game_plan: str,
        use_ecs: bool = True,
        use_baseline: bool = False,
        game_design: Optional[str] = None,
        automated_testing: Optional[str] = None,
        concept_path: Optional[str] = None,
        genre: Optional[str] = None,
        intermediate_outputs: Optional[Dict[str, Any]] = None,
        conversation_log: Optional[List[Dict[str, str]]] = None,
    ) -> Path:
        """
        Save generated game files and metadata

        Args:
            title: Game title
            html_code: HTML code for the game
            js_files: List of tuples (filename, content) for JavaScript files
            game_instructions: Game instructions for the player
            game_concept: Original game concept
            concept_path: Path to the original concept file
            genre: Game genre if available
            intermediate_outputs: Intermediate outputs to save as logs
            conversation_log: Log of prompts and responses
            use_ecs: Whether to use ECS architecture for game generation
            use_baseline: Whether to use baseline architecture for game generation

        Returns:
            Path to the saved game directory
        """
        # Create game directory with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Determine game directory based on the concept path
        if concept_path:
            if self.generate_with_ai is True:
                with_ai = "_WITHAI"
            else:
                with_ai = ""

            if use_baseline:
                game_dir = (
                    Path("games")
                    / self.model_name.split(":")[1]
                    / "Baseline"
                    / concept_path.split("/")[-1]
                    .replace(".json", "")
                )
            elif self.use_basic:
                game_dir = (
                    Path("games")
                    / self.model_name.split(":")[1]
                    / "Single_Prompt_Basic"
                    / concept_path.split("/")[-1]
                    .replace(".json", "")
                )
            elif use_ecs:
                game_dir = (
                    Path("games")
                    / self.model_name.split(":")[1]
                    / (self.__class__.__name__ + with_ai)
                    / concept_path.split("/")[-1]
                    .replace(".json", "")
                )
            else:
                game_dir = (
                    Path("games")
                    / self.model_name.split(":")[1]
                    / (self.__class__.__name__ + "_NOECS" + with_ai)
                    / concept_path.split("/")[-1]
                    .replace(".json", "")
                )

        else:
            game_dir = Path("games") / self.model_name.split(":")[1] / self.__class__.__name__

        game_dir.mkdir(parents=True, exist_ok=True)

        # Find next sample number
        existing_samples = [
            int(d.name.split("_")[1])
            for d in game_dir.iterdir()
            if d.is_dir() and d.name.startswith("sample_")
        ]
        next_sample = max(existing_samples, default=-1) + 1

        # Create new sample directory with the next sequential number
        game_dir = game_dir / f"sample_{next_sample}"
        game_dir.mkdir(parents=True, exist_ok=True)

        # Save HTML
        with open(game_dir / "index.html", "w", encoding="utf-8") as f:
            f.write(html_code)

        # Save JavaScript files
        js_filenames = []
        for filename, content in js_files:
            # Create the full path including any nested directories
            file_path = game_dir / filename
            # Ensure the parent directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
                js_filenames.append(filename)

        # Save metadata with comprehensive information
        metadata = {
            "game_info": {
                "title": title,
                "concept": game_concept,
                "concept_path": concept_path if concept_path else "None",
                "genre": genre if genre else "None",
                "game_design": game_design,
                "description": game_description,
                "controls": game_controls,
                "playability": False,
                "plan": game_plan,
                "automated_testing": automated_testing,
            },
            "generation_info": {
                "method": self.__class__.__name__,
                "model": self.model_name,
                "timestamp": timestamp,
                "sample_index": f"sample_{next_sample}",
                "temperature": self.temperature,
                "top_p": self.top_p
            },
            "game_files": {
                "html": "index.html",
                "javascript": js_filenames,
                "log": "generation_log.json",
            },
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # Save conversation history log and intermediate outputs
        self.output_summary(game_dir, conversation_log, intermediate_outputs)
        return game_dir

    def output_summary(
        self, 
        game_dir: Path, 
        conversation_log: Optional[List[Dict[str, str]]] = None,
        intermediate_outputs: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Save the log of the game generation process

        Args:
            game_dir: Directory to save logs
            conversation_log: Log of prompts and responses
            intermediate_outputs: Intermediate outputs to save as logs
        """
        # Save conversation history from the provided log
        if conversation_log:
            with open(game_dir / "generation_log.json", "w", encoding="utf-8") as f:
                json.dump(conversation_log, f, indent=2)
        
        # Save any intermediate outputs if provided
        if intermediate_outputs:
            with open(game_dir / "intermediate_outputs.json", "w", encoding="utf-8") as f:
                json.dump(intermediate_outputs, f, indent=2) 
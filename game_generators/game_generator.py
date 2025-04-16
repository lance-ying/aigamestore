import os
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
import datetime
import json

from game_generators.utils import (
    ModelAPI,
)
from game_generators.prompts import (
    GREEN,
    YELLOW,
    RED,
    BLUE,
    RESET,
    GAME_DESIGN_SYSTEM_PROMPT,
    CODE_GENERATION_SYSTEM_PROMPT,
)
from game_generators.game_designer.simple_designer import SimpleDesigner
from game_generators.game_designer.instruction_simple_designer import (
    InstructionSimpleDesigner,
)
from game_generators.game_designer.conversational_designer import ConversationalDesigner
from game_generators.game_designer.complexity_guide_designer import (
    ComplexityGuideDesigner,
)
from game_generators.game_designer.template_designer import TemplateDesigner
from game_generators.game_designer.judge_designer import JudgeDesigner
from game_generators.code_generator.p5js_generator import P5JSGenerator


class GameGenerator:
    """Controller class for game generation process"""

    VALID_METHODS = {
        "conversation": {
            "designer": ConversationalDesigner,
            "code_generator": P5JSGenerator,
        },
        "judge": {
            "designer": JudgeDesigner,
            "code_generator": P5JSGenerator,
        },
        "simple_prompt": {
            "designer": SimpleDesigner,
            "code_generator": None,
        },
        "instruction_simple_prompt": {
            "designer": InstructionSimpleDesigner,
            "code_generator": None,
        },
        "complexity_guide": {
            "designer": ComplexityGuideDesigner,
            "code_generator": P5JSGenerator,
        },
        "template": {
            "designer": TemplateDesigner,
            "code_generator": P5JSGenerator,
        },
    }

    def __init__(
        self,
        method_name: str,
        model_name: str = "openai:gpt-3.5-turbo",
        verbose: bool = False,
    ):
        """
        Initialize the game generator

        Args:
            method_name: Name of the game generation method to use
            model_name: Name of the AI model to use
            verbose: Whether to print verbose information
        """
        if method_name not in self.VALID_METHODS:
            raise ValueError(
                f"Invalid method name. Choose from: {list(self.VALID_METHODS.keys())}"
            )

        self.method_name = method_name
        self.model_name = model_name
        self.verbose = verbose
        # Initialize model API
        self.model_api = ModelAPI(model_name)

        # Initialize appropriate designer
        if method_name in ["instruction_simple_prompt", "simple_prompt"]:
            self.designer = self.VALID_METHODS[method_name]["designer"](
                model_api=self.model_api,
                system_prompt=CODE_GENERATION_SYSTEM_PROMPT,
                verbose=self.verbose,
            )
        else:
            self.designer = self.VALID_METHODS[method_name]["designer"](
                model_api=self.model_api,
                system_prompt=GAME_DESIGN_SYSTEM_PROMPT,
                verbose=self.verbose,
            )

        # Initialize code generator
        if self.VALID_METHODS[method_name]["code_generator"] is not None:
            self.code_generator = self.VALID_METHODS[method_name]["code_generator"](
                model_api=self.model_api,
                system_prompt=CODE_GENERATION_SYSTEM_PROMPT,
                verbose=self.verbose,
            )
        else:
            self.code_generator = None

    def generate_game(
        self,
        narrative: Optional[str] = None,
        narrative_path: Optional[str] = None,
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate a complete game

        Args:
            narratives: Optional narrative constraints or story elements
            narratives_path: Optional path to the narratives file, for saving purposes

        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        if self.verbose:
            print(f"\n{BLUE}Starting game generation process...{RESET}")

        try:
            # Step 1: Design the game using the selected method
            design = self.designer.design_game(narrative=narrative)

            # Add default number of players if needed by any component
            if isinstance(design, dict):
                design["num_players"] = 1  # Default to single player

            title = design.get("title", None)

            # Step 2: Generate code based on the design
            if self.code_generator is not None:
                html_code, js_files, title, game_instructions = (
                    self.code_generator.generate_code(design)
                )
            else:
                html_code, js_files, game_instructions = (
                    design.get("html_code", ""),
                    design.get("js_files", []),
                    design.get("game_instructions", ""),
                )

            # Step 3: Save the generated game
            game_path = self._save_game(
                title=title,
                html_code=html_code,
                js_files=js_files,
                game_instructions=game_instructions,
                narrative=narrative,
                narrative_path=narrative_path,
            )

            if self.verbose:
                print(f"{GREEN}Game generated successfully at: {game_path}{RESET}")

            return title

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in game generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _save_game(
        self,
        title: str,
        html_code: str,
        js_files: List[Tuple[str, str]],
        game_instructions: str,
        narrative: Optional[str] = None,
        narrative_path: Optional[str] = None,
    ) -> Path:
        """Save generated game files"""
        # Create safe title for directory name
        safe_title = (
            "".join(c for c in title if c.isalnum() or c in (" ", "_"))
            .replace(" ", "_")
            .lower()
        )

        # Create game directory with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        if narrative_path:
            game_dir = (
                Path("games")
                / self.model_name.split(":")[1]
                / self.method_name
                / narrative_path.split("/")[-1].replace(".json", "")
                / f"{safe_title}"
            )
        else:
            game_dir = (
                Path("games")
                / self.model_name.split(":")[1]
                / self.method_name
                / f"{safe_title}"
            )

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
                "narrative": narrative if narrative else "None",
                "narrative_path": narrative_path if narrative_path else "None",
                "game_instructions": game_instructions,
            },
            "generation_info": {
                "method": self.method_name,
                "model": self.model_name,
                "timestamp": timestamp,
            },
            "game_files": {
                "html": "index.html",
                "javascript": js_filenames,
                "log": "generation_log.json",
            },
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        with open(game_dir / "generation_log.json", "w", encoding="utf-8") as f:
            json.dump(self.model_api.get_call_history(), f, indent=2)

        return game_dir

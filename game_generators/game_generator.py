import os
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
import datetime
import json

from game_generators.utils import (
    ModelAPI,
)
from game_generators.prompts import VALID_GENRES, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.game_designer.simple_designer import SimpleDesigner
from game_generators.code_generator.p5js_generator import P5JSGenerator


class GameGenerator:
    """Controller class for game generation process"""

    VALID_METHODS = {
        # "conversation": ConversationalDesigner,
        # "character_driven": CharacterDrivenDesigner,
        # "judge_conversation": JudgeDesigner,
        "simple_prompt": SimpleDesigner,
        # "guide_complexity": GuideComplexityDesigner,
    }

    def __init__(
        self,
        method_name: str,
        model_name: str = "openai:gpt-3.5-turbo",
        config_path: str = "config/gamegen/base_prompt.yaml",
    ):
        """
        Initialize the game generator

        Args:
            method_name: Name of the game generation method to use
            model_name: Name of the AI model to use
            config_path: Path to configuration file
        """
        if method_name not in self.VALID_METHODS:
            raise ValueError(
                f"Invalid method name. Choose from: {list(self.VALID_METHODS.keys())}"
            )

        self.method_name = method_name
        self.model_name = model_name
        self.config_path = config_path

        # Initialize model API
        self.model_api = ModelAPI(model_name)

        # Initialize appropriate designer
        designer_class = self.VALID_METHODS[method_name]
        self.designer = designer_class(self.model_api, config_path)

        # Initialize code generator
        self.code_generator = P5JSGenerator(self.model_api)

    def generate_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate a complete game

        Args:
            genre: Game genre
            num_players: Number of players
            narratives: Optional narrative constraints or story elements
            debug: Whether to print debug information

        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        if genre not in VALID_GENRES:
            raise ValueError(f"Invalid genre. Choose from: {VALID_GENRES}")

        if debug:
            print(f"\n{BLUE}Starting game generation process...{RESET}")

        try:
            # Step 1: Design the game using the selected method
            design = self.designer.design_game(
                genre, num_players, narratives, debug=debug
            )

            # Ensure design has required fields
            if not isinstance(design, dict):
                design = {"full_response": str(design)}

            # Extract or generate game title
            title = design.get("title")
            if not title:
                if debug:
                    print(
                        f"{YELLOW}No title in design, generating from response{RESET}"
                    )
                title = "Untitled Game"  # Let code generator handle title extraction

            # Ensure we have game_design_text
            if "game_design_text" not in design:
                if debug:
                    print(
                        f"{YELLOW}Converting full response to game_design_text{RESET}"
                    )
                design["game_design_text"] = design.get("full_response", "")

            # Step 2: Generate code based on the design
            html_code, js_files = self.code_generator.generate_code(design, debug=debug)

            # Step 3: Save the generated game
            game_path = self._save_game(
                genre=genre,
                title=title,
                html_code=html_code,
                js_files=js_files,
                description=design.get("description", "No description available"),
                full_response=design.get("full_response", "No response available"),
                num_players=num_players,
            )

            if debug:
                print(f"{GREEN}Game generated successfully at: {game_path}{RESET}")

            return (
                html_code,
                js_files,
                title,
                design.get("description", ""),
                design.get("full_response", ""),
            )

        except Exception as e:
            if debug:
                print(f"\n{RED}Error in game generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _save_game(
        self,
        genre: str,
        title: str,
        html_code: str,
        js_files: List[Tuple[str, str]],
        description: str,
        full_response: str,
        num_players: int,
    ) -> Path:
        """Save generated game files"""
        # Create safe title for directory name
        safe_title = (
            "".join(c for c in title if c.isalnum() or c in (" ", "_"))
            .replace(" ", "_")
            .lower()
        )

        # Create game directory
        game_dir = (
            Path("games")
            / self.method_name
            / self.model_name.split(":")[1]
            / genre
            / safe_title
        )
        game_dir.mkdir(parents=True, exist_ok=True)

        # Save HTML
        with open(game_dir / "index.html", "w", encoding="utf-8") as f:
            f.write(html_code)

        # Save JavaScript files
        for filename, content in js_files:
            with open(game_dir / filename, "w", encoding="utf-8") as f:
                f.write(content)

        # Save description
        with open(game_dir / "description.txt", "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\n\n{description}")

        # Save generation log
        with open(game_dir / "generation_log.txt", "w", encoding="utf-8") as f:
            f.write(full_response)

        # Save metadata
        metadata = {
            "game_name": title,
            "game_description": description,
            "genre": genre,
            "num_players": num_players,
            "generation_method": self.method_name,
            "model": self.model_name,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return game_dir


def main():
    """Test the game generator"""
    generator = GameGenerator(
        method_name="conversation",
        model_name="openai:gpt-4",
        config_path="config/gamegen/base_prompt.yaml",
    )

    try:
        html_code, js_files, title, description, _ = generator.generate_game(
            genre="arcade",
            num_players=2,
            narratives="A space-themed game where players compete to collect resources",
            debug=True,
        )
        print(f"\n{GREEN}Successfully generated game: {title}{RESET}")
        print(f"{BLUE}Description:{RESET}\n{description}")

    except Exception as e:
        print(f"{RED}Error generating game: {str(e)}{RESET}")


if __name__ == "__main__":
    main()

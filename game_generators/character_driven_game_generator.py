from typing import Dict, Any, List, Tuple, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.code_generator.character_driven_p5js_generator import (
    CharacterDrivenP5JSGenerator,
)
from game_generators.game_generator import GameGenerator
from game_generators.game_designer.character_driven_designer import (
    CharacterDrivenDesigner,
)


class CharacterDrivenGameGenerator(GameGenerator):
    """
    Character-driven game code generator that enables characters to
    critique and improve their own implementation.
    """

    VALID_METHODS = {
        "character_driven": {
            "designer": CharacterDrivenDesigner,
            "code_generator": CharacterDrivenP5JSGenerator,
        },
    }

    def __init__(
        self,
        method_name: str,
        model_name: str = "openai:gpt-4",
        max_debate_times: int = 1,
        verbose: bool = False,
    ):
        """Initialize with the same parameters as base GameGenerator plus max_debate_times"""
        super().__init__(method_name, model_name, verbose=verbose)
        self.max_debate_times = max_debate_times
        self.verbose = verbose

    def generate_game(
        self,
        narratives: Optional[str] = None,
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate a character-driven game with the same interface as base GameGenerator

        Args:
            narratives: Optional narrative constraints

        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        try:
            if self.verbose:
                print(f"\n{BLUE}Starting character-driven game generation...{RESET}")

            # Step 1: Get initial design from designer
            design = self.designer.design_game(narratives)

            # Step 2: Generate initial code
            design_with_code = {**design, "mode": "initial_generation"}
            html_code, js_files = self.code_generator.generate_code(design_with_code)

            # Get the initial game.js code
            game_js_code = None
            for filename, content in js_files:
                if filename == "game.js":
                    game_js_code = content
                    break

            if not game_js_code and js_files:
                # If no explicit game.js but we have some JS file
                game_js_code = js_files[0][1]

            if not game_js_code:
                raise ValueError("No game.js code was generated")

            # Step 3-4: Loop through character feedback and code improvement steps
            character_definitions = design.get("character_definitions")
            design_text = design.get("game_design_text")

            debate_log = []
            for round_num in range(1, self.max_debate_times + 1):
                if self.verbose:
                    print(
                        f"\n{BLUE}Character Feedback Round {round_num}/{self.max_debate_times}:{RESET}"
                    )

                # Get environment feedback using the designer
                env_feedback = self.designer.get_environment_feedback(
                    game_js_code, design_text, self.code_generator.js_files
                )
                debate_log.append(
                    f"--- Round {round_num} ---\nEnvironment Feedback:\n{env_feedback}\n"
                )

                # Get character-specific feedback from each character using the designer
                char_feedback = {}
                # Get number of characters from character_definitions
                num_characters = (
                    len(character_definitions) if character_definitions else 1
                )
                for char_idx in range(1, num_characters + 1):
                    char_response = self.designer.get_character_feedback(
                        char_idx,
                        game_js_code,
                        character_definitions,
                        self.code_generator.js_files,
                    )
                    char_feedback[char_idx] = char_response
                    debate_log.append(
                        f"Character {char_idx} Feedback:\n{char_response}\n"
                    )

                # Apply the improvements to the code using the coder
                improved_js_files = self.code_generator.apply_character_improvements(
                    game_js_code, env_feedback, char_feedback, design_text
                )

                # Update game_js_code for the next iteration
                for filename, content in improved_js_files:
                    if filename == "game.js":
                        game_js_code = content
                        break

            # Final JS files are now stored in the code generator
            final_js_files = [
                (filename, content)
                for filename, content in self.code_generator.js_files.items()
            ]

            # Step 5: Generate final summary with game description and guidance
            final_design = self.designer.generate_final_summary(
                design_text, character_definitions, "\n".join(debate_log), game_js_code
            )

            # Update the design with the final summary
            design["guidance"] = self._extract_guidance(final_design)

            # Get an updated HTML file if needed
            html_code = self.code_generator.create_html_code(design["title"])

            # Save the game using parent class method
            game_path = self._save_game(
                title=design["title"],
                html_code=html_code,
                js_files=final_js_files,
                description=design.get("description", ""),
                full_response=design.get("full_response", "")
                + "\n\n"
                + "\n".join(debate_log),
                narratives=narratives,
                guidance=design.get("guidance", ""),
            )

            if self.verbose:
                print(f"{GREEN}Game generated successfully at: {game_path}{RESET}")

            return (
                html_code,
                final_js_files,
                design["title"],
                design.get("description", ""),
                design.get("full_response", "") + "\n\n" + "\n".join(debate_log),
            )

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in character-driven game generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
            raise

    def _extract_guidance(self, text: str) -> str:
        """Extract guidance from design document"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        raise ValueError("No guidance found in design document")

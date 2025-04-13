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

    def __init__(self, method_name: str, model_name: str = "openai:gpt-4"):
        """Initialize with the same parameters as base GameGenerator"""
        super().__init__(method_name, model_name)

    def generate_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate a character-driven game with the same interface as base GameGenerator

        Args:
            genre: Game genre
            num_players: Number of players
            narratives: Optional narrative constraints
            debug: Whether to print debug information

        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        try:
            if debug:
                print(f"\n{BLUE}Starting character-driven game generation...{RESET}")

            # Step 1: Get initial design from designer with character debate
            design = self.designer.design_game(
                genre, num_players, narratives, debug=debug
            )

            # Step 2: Generate initial code
            design_with_code = {**design, "mode": "initial_generation"}
            html_code, js_files = self.code_generator.generate_code(
                design_with_code, debug=debug
            )

            # Step 3: Simulate character feedback rounds
            design_with_feedback = {
                **design,
                "mode": "character_feedback",
                "current_code": js_files[0][1],  # Initial game.js code
            }
            _, improved_js_files = self.code_generator.generate_code(
                design_with_feedback, debug=debug
            )

            # Step 4: Generate final code with rendering
            design_with_rendering = {
                **design,
                "mode": "rendering",
                "improved_code": improved_js_files[0][1],
            }
            _, final_js_files = self.code_generator.generate_code(
                design_with_rendering, debug=debug
            )

            # Save the game using parent class method
            game_path = self._save_game(
                genre=genre,
                title=design["title"],
                html_code=html_code,
                js_files=final_js_files,
                description=design.get("description", ""),
                full_response=design.get("full_response", ""),
                num_players=num_players,
                narratives=narratives,
                guidance=design.get("guidance", ""),
            )

            if debug:
                print(f"{GREEN}Game generated successfully at: {game_path}{RESET}")

            return (
                html_code,
                final_js_files,
                design["title"],
                design.get("description", ""),
                design.get("full_response", ""),
            )

        except Exception as e:
            if debug:
                print(f"\n{RED}Error in character-driven game generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
            raise

    def _extract_character_definitions(self, design_text: str) -> str:
        """Extract character definitions from design text"""
        pattern = r"```characters\s*(.*?)```"
        match = re.search(pattern, design_text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def _simulate_character_code_review(
        self,
        current_js: str,
        character_definitions: str,
        game_design: str,
        rounds: int = 3,
    ) -> str:
        """Simulate characters reviewing and improving their implementation"""
        if self.debug:
            print(f"\n{BLUE}Starting character code review...{RESET}")

        for round in range(1, rounds + 1):
            if self.debug:
                print(f"\n{GREEN}Code Review Round {round}:{RESET}")

            # Environment reviews world mechanics
            env_feedback = self._get_environment_feedback(current_js, game_design)

            # Characters review their implementations
            char_feedback = self._get_character_feedback(
                current_js, character_definitions
            )

            # Apply improvements
            current_js = self._apply_code_improvements(
                current_js, env_feedback, char_feedback, game_design
            )

        return current_js

    def _get_environment_feedback(self, current_js: str, game_design: str) -> str:
        """Get feedback on environment implementation"""
        prompt = f"""As the Environment System, review the current implementation:

{current_js}

Based on the original design:
{game_design}

Provide specific feedback on:
1. How well the environment components are implemented
2. Whether they maintain independence from character states
3. If the world feels appropriately dynamic
4. Suggestions for improving environment mechanics

Focus on concrete code improvements, not general suggestions."""

        return self.model_api.call(prompt, debug=self.debug)

    def _get_character_feedback(
        self, current_js: str, character_definitions: str
    ) -> str:
        """Get feedback from characters on their implementation"""
        prompt = f"""As the implemented characters, review your code:

{current_js}

Based on your original definitions:
{character_definitions}

Provide specific feedback on:
1. How well your behaviors match your design
2. Whether your actions feel appropriate
3. If your interactions work as intended
4. Concrete code improvements needed

Focus on implementation details that would make you behave more naturally."""

        return self.model_api.call(prompt, debug=self.debug)

    def _apply_code_improvements(
        self, current_js: str, env_feedback: str, char_feedback: str, game_design: str
    ) -> str:
        """Apply suggested improvements to the code"""
        prompt = f"""Apply these improvement suggestions to the game code:

Current Code:
{current_js}

Environment Feedback:
{env_feedback}

Character Feedback:
{char_feedback}

Original Design:
{game_design}

Update the code to:
1. Implement suggested improvements
2. Maintain code structure and readability
3. Keep character behaviors distinct
4. Preserve environment independence

Return only the improved code in a ```javascript block."""

        response = self.model_api.call(prompt, debug=self.debug)

        # Extract code from response
        pattern = r"```javascript\s*(.*?)```"
        match = re.search(pattern, response, re.DOTALL)
        if match:
            return match.group(1).strip()
        return current_js

    def _generate_rendering_code(
        self, game_description: str, character_definitions: str, dynamics_js: str
    ) -> str:
        """Generate rendering code for the game dynamics"""
        # ... existing method ...

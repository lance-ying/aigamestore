from typing import Dict, Any, Optional
from game_generators.utils import ModelAPI

from game_generators.prompts import GREEN, YELLOW, RED, BLUE, RESET


class SimpleDesigner:
    """Simple designer that creates a basic game description"""

    def __init__(self, model_api: ModelAPI = None, system_prompt: str = None):
        """Initialize the simple designer (parameters not used)"""
        self.model_api = model_api
        self.system_prompt = system_prompt

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """
        Create a simple game description

        Args:
            genre: Game genre
            num_players: Number of players
            narratives: Optional narrative constraints

        Returns:
            text description of the game
        """
        description = f"You are creating a {genre} game with {num_players} characters where one character is controlled by the human player and {num_players-1} are AI agents. The game should be engaging and fun."
        if narratives:
            description += f" The narratives could be: {narratives}"

        description += f""" You should first create a GAME TITLE and then create a description of the game. Please provide the complete implementation in two code blocks:
1. First block labeled with ```description ```
2. GAME TITLE: <your game title here>
"""
        if debug:
            print(f"\n{BLUE}Generated description:{RESET}\n{description}")

        return {
            "game_design_text": description,
        }

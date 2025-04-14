from typing import Dict, Any, List, Tuple, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class CharacterDrivenDesigner:
    """
    Character-driven game designer that uses LLMs to simulate characters
    collaborating on game design through discussion.
    """

    def __init__(
        self,
        model_api: ModelAPI,
        system_prompt: str = None,
        debug: bool = False,
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.debug = debug

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Design a game through character-driven generation"""
        try:
            if self.debug:
                print(f"\n{BLUE}Starting character-driven design process...{RESET}")

            # Generate character and environment definitions
            character_definitions = self._sample_character_info(
                genre, num_players, narratives
            )
            if self.debug:
                print(
                    f"\n{GREEN}Generated character definitions:{RESET}\n{character_definitions}"
                )

            # Create final design document with guidance
            final_design = self._create_final_design(character_definitions)

            return {
                "title": self._extract_title(final_design),
                "description": self._extract_description(final_design),
                "guidance": self._extract_guidance(final_design),
                "game_design_text": final_design,
                "character_definitions": character_definitions,
                "full_response": character_definitions,
            }

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
            raise

    def _sample_character_info(
        self, genre: str, num_agents: int, narratives: Optional[str] = None
    ) -> str:
        """Generate character and environment definitions"""
        narrative_context = f"\nNarrative Context:\n{narratives}" if narratives else ""

        prompt = f"""Create engaging characters and environment for a {genre} game with {num_agents} characters (1 human player + {num_agents-1} AI).{narrative_context}

Please define:

1. Environment:
```environment
- Theme: [Game world theme]
- Global State: [Key variables that affect all characters]
- Components: [List of independent interactive elements]
```

2. Environment Components (up to 20):
```components
Component 1:
- Name: [Component name]
- Role: [Purpose in gameplay]
- State: [Variables and their ranges]
- Behavior: [How it changes independently]
- Appearance: [Visual description]
[Add more components...]
```

3. Characters:
```characters
Character 1 (Human Player):
- Name: [Character name]
- Role: [Gameplay role]
- State: [Key variables]
- Actions: [Available moves]
- Objectives: [Goals to achieve]
- Success/Failure: [Win/lose conditions]

[Repeat for each AI character...]
```

4. Character Relationships:
```relationships
- [Character A] & [Character B]: [Type of relationship]
[List all interesting character dynamics...]
```

IMPORTANT: Environment components must be truly independent, with their own behaviors and patterns that continue regardless of player actions."""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            debug=self.debug,
        )

    def _create_final_design(self, character_definitions: str) -> str:
        """Create the final design document with all required sections"""
        prompt = f"""Based on these character definitions:

{character_definitions}

Create a final game design document with these sections:

1. Title:
```title
[Catchy, thematic game title]
```

2. Description:
```description
[2-3 sentences explaining what makes the game exciting]
```

3. Start Screen Guidance:
```guidance
Welcome to [Game Name]!

[Engaging welcome message]

Controls:
[List key controls and their effects]

Meet the Characters:
[Introduce each character's role]

Pro Tip: [Share an interesting strategy]
```

4. Technical Design:
```technical
[Core mechanics and systems]
[Character behaviors]
[Environment interactions]
[Game flow]
```

Make it exciting and engaging while keeping all the depth from the design!"""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            debug=self.debug,
        )

    def _extract_title(self, text: str) -> str:
        """Extract title from design document"""
        pattern = r"```title\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        raise ValueError("No title found in design document")

    def _extract_description(self, text: str) -> str:
        """Extract description from design document"""
        pattern = r"```description\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        raise ValueError("No description found in design document")

    def _extract_guidance(self, text: str) -> str:
        """Extract guidance from design document"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        raise ValueError("No guidance found in design document")

    def get_environment_feedback(
        self, current_js: str, game_design: str, all_js_files: Dict[str, str] = None
    ) -> str:
        """Get feedback on environment implementation from environment's perspective"""
        # Prepare all code files for review
        code_to_review = ""
        if all_js_files:
            # Include all files in the review
            for filename, content in all_js_files.items():
                code_to_review += f"\n// File: {filename}\n{content}\n"
        else:
            # Fallback to just the main file
            code_to_review = current_js

        prompt = f"""As the Environment System, review the current implementation:

{code_to_review}

Based on the original design:
{game_design}

Provide specific feedback on:
1. How well the environment components are implemented
2. Whether they maintain independence from character states
3. If the world feels appropriately dynamic
4. Suggestions for improving environment mechanics

Focus on concrete suggestions in natural language, not code. Imagine you are the environment speaking about how you'd like to be improved."""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            debug=self.debug,
        )

    def get_character_feedback(
        self,
        char_idx: int,
        current_js: str,
        character_definitions: str,
        all_js_files: Dict[str, str] = None,
    ) -> str:
        """Get feedback from a specific character on their implementation"""
        # Extract this character's info using a more robust approach
        char_info = self._extract_character_info(char_idx, character_definitions)

        # Prepare all code files for review
        code_to_review = ""
        if all_js_files:
            # Include all files in the review
            for filename, content in all_js_files.items():
                code_to_review += f"\n// File: {filename}\n{content}\n"
        else:
            # Fallback to just the main file
            code_to_review = current_js

        prompt = f"""As Character {char_idx}, review your role in the game:

{char_info}

Review the current implementation:
{code_to_review}

Provide specific feedback on:
1. How well your character is implemented
2. What features would make your character more interesting to play or interact with
3. What interactions with other characters or environment elements would enhance gameplay
4. Any bugs or issues in your character's implementation

Express your feedback in natural language as if you were the character. Focus on what would make the game more engaging from your perspective.
"""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            debug=self.debug,
        )

    def _extract_character_info(self, char_idx: int, character_definitions: str) -> str:
        """Extract character information more robustly from character definitions"""
        # First try the ```characters section
        characters_pattern = r"```characters\s*(.*?)```"
        characters_match = re.search(
            characters_pattern, character_definitions, re.DOTALL
        )

        if characters_match:
            characters_section = characters_match.group(1)
            # Now find the specific character within this section
            char_pattern = (
                rf"Character\s+{char_idx}(?:\s*\(.*?\))?:(.*?)(?=Character\s+\d|$)"
            )
            char_match = re.search(
                char_pattern, characters_section, re.DOTALL | re.IGNORECASE
            )

            if char_match:
                return f"Character {char_idx}:{char_match.group(1).strip()}"

        # If not found in the ```characters section, try the entire text
        char_pattern = (
            rf"Character\s+{char_idx}(?:\s*\(.*?\))?:(.*?)(?=Character\s+\d|$)"
        )
        char_match = re.search(
            char_pattern, character_definitions, re.DOTALL | re.IGNORECASE
        )

        if char_match:
            return f"Character {char_idx}:{char_match.group(1).strip()}"

        # If we still can't find it, return a generic placeholder
        return f"Character {char_idx}: (No specific information found in character definitions)"

    def generate_final_summary(
        self,
        design_text: str,
        character_definitions: str,
        debate_log: str,
        final_code: str,
    ) -> str:
        """Generate a final summary with game description and guidance"""
        prompt = f"""Based on this game development process:

Original Design:
{design_text}

Character Definitions:
{character_definitions}

Development Discussion:
{debate_log}

Final Code:
{final_code}

Create a final game summary with these sections:

1. Title:
```title
[Catchy, thematic game title]
```

2. Description:
```description
[2-3 sentences explaining what makes the game exciting]
```

3. Start Screen Guidance:
```guidance
Welcome to [Game Name]!

[Engaging welcome message]

Controls:
[List key controls and their effects]

Meet the Characters:
[Introduce each character's role]

Pro Tip: [Share an interesting strategy]
```

Make it exciting and engaging while keeping all the depth from the design discussion and character feedback!"""

        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.system_prompt,
            debug=self.debug,
        )

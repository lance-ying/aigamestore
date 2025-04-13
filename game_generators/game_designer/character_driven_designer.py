from typing import Dict, Any, List, Tuple, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class CharacterDrivenDesigner:
    """
    Character-driven game designer that uses LLMs to simulate characters
    collaborating on game design through discussion.
    """

    def __init__(self, model_api: ModelAPI, system_prompt: str = None):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.debug = False

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """Design a game through character-driven discussion"""
        self.debug = debug
        try:
            if debug:
                print(f"\n{BLUE}Starting character-driven design process...{RESET}")

            # Step 1: Generate initial character and environment definitions
            character_definitions = self._sample_character_info(
                genre, num_players, narratives
            )
            if debug:
                print(
                    f"\n{GREEN}Generated character definitions:{RESET}\n{character_definitions}"
                )

            # Step 2: Simulate design discussion between characters
            final_design, design_log = self._simulate_design_debate(
                genre, num_players, character_definitions
            )

            # Step 3: Create final design document with guidance
            final_design = self._create_final_design(
                final_design, character_definitions, design_log
            )

            return {
                "title": self._extract_title(final_design),
                "description": self._extract_description(final_design),
                "guidance": self._extract_guidance(final_design),
                "game_design_text": final_design,
                "full_response": design_log,
            }

        except Exception as e:
            if debug:
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

        return self.model_api.call(prompt, debug=self.debug)

    def _simulate_design_debate(
        self, genre: str, num_players: int, character_definitions: str, rounds: int = 3
    ) -> Tuple[str, str]:
        """Simulate a design discussion between characters"""
        current_design = character_definitions
        debate_log = ""

        for r in range(1, rounds + 1):
            if self.debug:
                print(f"\n{BLUE}Design Discussion Round {r}:{RESET}")

            # Environment Agent suggests gameplay mechanics
            env_suggestions = self._environment_agent_suggestions(current_design, r)
            debate_log += f"\nRound {r} - Environment Agent:\n{env_suggestions}\n"

            # Character Agents suggest improvements
            for i in range(1, num_players + 1):
                char_suggestions = self._character_agent_suggestions(i, current_design)
                debate_log += f"\nRound {r} - Character {i}:\n{char_suggestions}\n"

            # Synthesize suggestions into updated design
            current_design = self._synthesize_suggestions(
                current_design, env_suggestions, char_suggestions
            )

        return current_design, debate_log

    def _environment_agent_suggestions(
        self, current_design: str, round_number: int
    ) -> str:
        """Get environment agent's suggestions for gameplay mechanics"""
        prompt = f"""As the Environment Designer, review the current game design:

{current_design}

Suggest improvements focusing on:
1. How environment components interact
2. Creating emergent gameplay through component behaviors
3. Making the game world feel alive and dynamic
4. Adding interesting environmental challenges

Keep suggestions focused on design, not implementation. Think about player experience and fun factor."""

        return self.model_api.call(prompt, debug=self.debug)

    def _character_agent_suggestions(
        self, agent_index: int, current_design: str
    ) -> str:
        """Get character agent's suggestions for their mechanics"""
        # Extract this character's info
        char_info = ""
        match = re.search(
            rf"Character {agent_index}:.*?(?=Character|\n\n|$)",
            current_design,
            re.DOTALL,
        )
        if match:
            char_info = match.group(0)

        prompt = f"""As Character {agent_index}, review your role in the game:

{char_info}

Suggest improvements focusing on:
1. Making your character more interesting to play/interact with
2. Creating fun interactions with other characters
3. Adding depth to your character's mechanics
4. Balancing challenge and satisfaction

Think about what would make your character more engaging while staying true to their role."""

        return self.model_api.call(prompt, debug=self.debug)

    def _synthesize_suggestions(
        self, current_design: str, env_suggestions: str, char_suggestions: str
    ) -> str:
        """Synthesize all suggestions into an updated design"""
        prompt = f"""Synthesize these design suggestions into an improved game design:

Current Design:
{current_design}

Environment Suggestions:
{env_suggestions}

Character Suggestions:
{char_suggestions}

Create an updated design that:
1. Incorporates the best suggestions
2. Maintains design consistency
3. Ensures all parts work together
4. Keeps focus on player engagement
5. Preserves the original character roles while adding depth

Format the response using the same structure as the current design."""

        return self.model_api.call(prompt, debug=self.debug)

    def _create_final_design(
        self, design: str, character_definitions: str, design_log: str
    ) -> str:
        """Create the final design document with all required sections"""
        prompt = f"""Based on this design discussion:

{design}

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

Make it exciting and engaging while keeping all the depth from the design discussion!"""

        return self.model_api.call(prompt, debug=self.debug)

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

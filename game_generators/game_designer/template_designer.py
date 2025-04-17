from typing import Dict, Any, Optional, List, Tuple
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class TemplateDesigner:
    """Designer that creates games through template-based, coarse-to-fine specification"""

    def __init__(
        self,
        model_name: str = "openai:gpt-4o",
        system_prompt: str = None,
        verbose: bool = False,
    ):
        """
        Initialize the template designer with model API and verbose option

        Args:
            model_name: API wrapper for the AI model
            system_prompt: Optional system prompt to override default
            verbose: Whether to print verbose information
        """
        self.model_api = ModelAPI(model_name)
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.verbose = verbose  # Store verbose as instance variable

    def design_game(self, narrative: Optional[str] = None) -> Dict[str, Any]:
        try:
            if self.verbose:
                print(f"\n{BLUE}Starting template-based design process...{RESET}")

            # Step 1: Sample environment and component information
            environment_info = self._sample_environment_info(narrative)
            if self.verbose:
                print(f"\n{GREEN}Environment Information:{RESET}\n{environment_info}")

            # Step 2: Generate core mechanics and interactions
            mechanics_info = self._generate_mechanics(environment_info)
            if self.verbose:
                print(f"\n{GREEN}Core Mechanics:{RESET}\n{mechanics_info}")

            # Step 3: Define progression and evolution
            progression_info = self._design_progression_system(
                environment_info, mechanics_info
            )
            if self.verbose:
                print(f"\n{GREEN}Progression System:{RESET}\n{progression_info}")

            # Step 4: Create final design
            game_title, final_design = self._create_final_design(
                {
                    "environment": environment_info,
                    "mechanics": mechanics_info,
                    "progression": progression_info,
                }
            )

            # Generate code structure
            fuzzy_code = self._generate_fuzzy_code(game_title, final_design)
            complete_design = self._format_complete_design(final_design, fuzzy_code)

            if self.verbose:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {game_title}")

            return {
                "title": game_title,
                "game_design_text": complete_design,
                "fuzzy_code": fuzzy_code,
                "environment": environment_info,
                "mechanics": mechanics_info,
                "progression": progression_info,
                "final_design": final_design,
            }

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _sample_environment_info(self, narrative: Optional[str]) -> str:
        """Generate detailed environment and component definitions"""
        prompt = f"""Based on this narrative:
<narrative_context>
{narrative if narrative else 'Create something wildly imaginative!'}
</narrative_context>

Please provide a detailed breakdown of the game environment in the following format:

<environment>
1. Theme:
    - Overall aesthetic and atmosphere
    - Time and setting
    - Visual style and mood
2. Global State:
    - What resources or scores are tracked?
    - What global conditions affect gameplay?
    - How does time or progression work?
3. Components:
    - Name and purpose
    - Autonomous behavior pattern
    - How it evolves over time
    - How it affects gameplay
4. Interactions:
    - What chain reactions can occur?
    - What emergent behaviors might arise?
    - How do components affect each other?
</environment>"""

        response = self._call_model_api(prompt, system_prompt=self.system_prompt)
        return self._extract_section(response, "environment")

    def _generate_mechanics(self, environment_info: str) -> str:
        """Generate detailed mechanics and interaction systems"""
        prompt = f"""Based on this environment:
<environment_info>
{environment_info}
</environment_info>

Design the core gameplay mechanics in the following format:

<mechanics>
1. Core:
    - What are the basic actions available?
    - How do controls translate to interesting results?
    - What makes the moment-to-moment gameplay engaging?
2. Advanced:
    - What special abilities or moves are possible?
    - What advanced techniques can players discover?
    - How do different mechanics combine?
3. Interactions:
    - How do players interact with environment components?
    - What unexpected combinations are possible?
    - What "wow" moments can emerge from these systems?
</mechanics>"""

        response = self._call_model_api(prompt, system_prompt=self.system_prompt)
        return self._extract_section(response, "mechanics")

    def _design_progression_system(
        self, environment_info: str, mechanics_info: str
    ) -> str:
        """Design the progression and evolution systems"""
        prompt = f"""Based on the environment and mechanics:
<environment>
{environment_info}
</environment>

<mechanics>
{mechanics_info}
</mechanics>

Design how the game evolves over time in the following format:

<progression>
1. Characters:
    - What characters are in the game?
    - What are their capabilities?
    - What are their motivations?
    - What are their goals?
2. Evolution:
    - How does the game evolve over time?
    - How does the characters evolve over time?
    - How does the environment evolve over time?
    - How does the mechanics evolve over time?
</progression>
"""

        response = self._call_model_api(prompt, system_prompt=self.system_prompt)
        return self._extract_section(response, "progression")

    def _create_final_design(self, components: Dict[str, str]) -> str:
        """Create final detailed design"""
        prompt = f"""Based on all these components:

Environment:
{components['environment']}

Mechanics:
{components['mechanics']}

Progression:
{components['progression']}

Create a complete, implementation-ready game design that includes:

<game_title>
...(Your appealing game title here)
</game_title>

<game_design>

1. Game Description:
[Polished description of core concept and features for what the game is about, should be fun and engaging]

2. Game Guidance:
[Write an engaging start screen message that:
- Welcomes players
- Explains basic controls
- Hints at deeper mechanics
- Teases future surprises]

3. Technical Design:
- Complete mechanics specification
- Character behavior definitions
- Progression system details
- Interaction rules

4. Implementation Notes:
- Core systems for game (clear, bug-free, etc.)
- Visual requirements (appealing to the eye, easy to understand, etc.)
</game_design>

Remember: The game should constantly surprise players with new mechanics, combinations, and challenges!"""

        response = self._call_model_api(prompt, system_prompt=self.system_prompt)

        return self._extract_section(response, "game_title"), self._extract_section(
            response, "game_design"
        )

    def _format_complete_design(self, final_design: str, fuzzy_code: str) -> str:
        """Format the complete design document with fuzzy code structure"""
        return f"""
<game_design>
{final_design}
</game_design>

<fuzzy_code>
{fuzzy_code}
</fuzzy_code>
"""

    def _extract_section(self, text: str, section: str) -> str:
        """Extract content from XML-style section tags"""
        # pattern = f"<{section}>(.*?)</{section}>"
        pattern = f"<{section}>\s*(.*?)\s*</{section}>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text

    def _extract_nested_section(self, text: str, parent: str, child: str) -> str:
        """Extract content from nested XML-style section tags"""
        parent_content = self._extract_section(text, parent)
        if parent_content:
            return self._extract_section(parent_content, child)
        return ""

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        return self._extract_section(text, "title")

    def _call_model_api(self, prompt: str, system_prompt: str = None) -> str:
        """Call the model API with proper prompts"""
        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=system_prompt or self.system_prompt,
            verbose=self.verbose,
        )

    def _generate_fuzzy_code(self, game_title: str, final_design: str) -> str:
        """Generate a rough code structure"""
        prompt = f"""Based on this final design:
<game_title>
{game_title}
</game_title>

<game_design>
{final_design}
</game_design>

Create a fuzzy code in JavaScript that faithfully follows the design, which serves as a guide for a detailed implementation from scratch.
- Your fuzzy code should be written in a way that is easy to understand and implement.
- Your fuzzy code is going to guide the code generator to generate the final code, so it should be detailed and complete, but not too verbose in terms of detailed implementation. The more guidance and more detailed about the requirements, the better.

Your fuzzy code MUST be wrapped in code block in the format:

<code>
...(Your fuzzy code with detailed docstrings here)
</code>
"""
        fuzzy_code = self._call_model_api(prompt, system_prompt=self.system_prompt)
        return self._extract_section(fuzzy_code, "code")

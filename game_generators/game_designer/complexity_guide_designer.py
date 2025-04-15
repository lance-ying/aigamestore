from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class ComplexityGuideDesigner:
    """Designer that creates complex and imaginative game designs"""

    def __init__(
        self, model_api: ModelAPI, system_prompt: str = None, debug: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.debug = debug

    def design_game(
        self,
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create complex game design with wild imagination"""
        try:
            if self.debug:
                print(f"\n{BLUE}Starting imaginative design process...{RESET}")

            prompt = self._create_prompt(narratives)
            final_design = self._call_model_api(prompt, self.system_prompt)

            # Extract components
            title = self._extract_title(final_design)
            description = self._extract_description(final_design)
            guidance = self._extract_guidance(final_design)

            # Extract the full design plan (excluding meta discussion)
            game_design_text = self._extract_design_plan(final_design)

            if self.debug:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {title}")
                print(f"Description: {description}")
                print(f"Guidance: {guidance}")

            return {
                "title": title,
                "description": description,
                "game_design_text": game_design_text,
                "game_guidance": guidance,
                "full_response": final_design,
            }

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _create_prompt(self, narratives: Optional[str]) -> str:
        """Create the imaginative design prompt"""
        return f"""Let's create an extraordinarily imaginative and complex game that pushes creative boundaries while remaining engaging and playable.

NARRATIVE CONTEXT:
{narratives if narratives else "Create a wildly imaginative storyline that defies conventional gaming tropes!"}

Design a game that incorporates:

1. INNOVATIVE MECHANICS
- Invent mechanics that haven't been seen before
- Create unexpected combinations of familiar elements
- Design systems that evolve and surprise players
- Think beyond traditional control schemes
- Layer multiple interacting systems

2. DYNAMIC COMPLEXITY
- Progressive complexity that unfolds naturally
- Emergent gameplay from system interactions
- Meaningful choices with cascading effects
- Hidden depth beneath simple controls
- Rewarding mastery and experimentation

3. ENGAGING PROGRESSION
- Non-linear skill development
- Discoverable advanced techniques
- Multiple valid approaches to challenges
- Secrets that change gameplay fundamentally
- Meta-progression that adds new dimensions

4. WILD IMAGINATION
- Break conventional genre boundaries
- Subvert player expectations cleverly
- Create memorable "wow" moments
- Include mind-bending plot twists
- Design reality-warping mechanics

Please provide the design in this format:

<game_title>
[An intriguing, memorable title]
</game_title>

<game_description>
[A compelling description that captures the game's unique elements and wild imagination]
</game_description>

<game_guidance>
[Engaging, concise instructions that hint at hidden depth]
</game_guidance>

<design_plan>
[Detailed design document covering:
- Core Mechanics & Systems
- Progression & Complexity
- Player Experience
- Visual Style
- Technical Requirements]
</design_plan>

Make it WILD but IMPLEMENTABLE - push creative boundaries while keeping it feasible in p5.js!"""

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "Untitled Game"

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        pattern = r"<game_description>\s*(.*?)\s*</game_description>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No description provided."

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance from text"""
        pattern = r"<game_guidance>\s*(.*?)\s*</game_guidance>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No guidance provided."

    def _extract_design_plan(self, text: str) -> str:
        """Extract the full design plan"""
        pattern = r"<design_plan>\s*(.*?)\s*</design_plan>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No design plan provided."

    def _call_model_api(self, prompt: str, system_prompt: str = None) -> str:
        """Call the model API with proper prompts"""
        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=system_prompt,
            debug=self.debug,
        )

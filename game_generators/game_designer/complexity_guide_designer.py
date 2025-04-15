from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class ComplexityGuideDesigner:
    """Designer that creates complex and imaginative game designs through guided discussion"""

    def __init__(
        self, model_api: ModelAPI, system_prompt: str = None, debug: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.debug = debug

    def design_game(
        self,
        narrative: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create complex game design through guided discussion"""
        try:
            if self.debug:
                print(f"\n{BLUE}Starting imaginative design process...{RESET}")

            # Phase 1: Initial Brainstorming
            initial_ideas = self._brainstorm_initial_ideas(narrative)
            if self.debug:
                print(f"\n{GREEN}Initial Ideas:{RESET}\n{initial_ideas}")

            # Phase 2: Complexity Discussion
            complex_ideas = self._explore_complexity(initial_ideas)
            if self.debug:
                print(f"\n{GREEN}Complexity Layer:{RESET}\n{complex_ideas}")

            # Phase 3: Final Design Plan
            final_design = self._create_final_design(initial_ideas, complex_ideas)
            if self.debug:
                print(f"\n{GREEN}Final Design:{RESET}\n{final_design}")

            # Extract components
            title = self._extract_title(final_design)
            game_design_text = self._extract_design_plan(final_design)

            if self.debug:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {title}")
                print(f"Design: {game_design_text}")

            return {"title": title, "game_design_text": game_design_text}

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _brainstorm_initial_ideas(self, narratives: Optional[str]) -> str:
        """Initial brainstorming phase for core concepts"""
        prompt = f"""Let's start with some wild, creative brainstorming for a game based on this narrative:
{narratives if narratives else "Create something wildly imaginative!"}

Think about:
1. What unique core mechanics could make this game special?
2. What unexpected twists on familiar gameplay elements could we add?
3. What would make players go "wow, I've never seen that before"?
4. How could the game surprise and delight players?

Don't worry about implementation yet - let's dream big and be creative!"""

        return self._call_model_api(
            user_prompt=prompt, system_prompt=self.system_prompt
        )

    def _explore_complexity(self, initial_ideas: str) -> str:
        """Explore ways to add depth and complexity"""
        prompt = f"""Awesome initial ideas! Now let's add layers of depth and complexity:

Building on these ideas:
<initial_concepts>
{initial_ideas}
</initial_concepts>

Let's explore:
1. How could these mechanics interact in unexpected ways?
2. What emergent gameplay might arise from these systems?
3. How could we add hidden depth that players discover gradually?
4. What secrets or advanced techniques could we layer in?
5. How could the game evolve and surprise players over time?

Think about making it deep but accessible - complexity that emerges naturally!"""

        return self._call_model_api(
            user_prompt=prompt, system_prompt=self.system_prompt
        )

    def _create_final_design(self, initial_ideas: str, complex_ideas: str) -> str:
        """Create final design plan incorporating all elements"""
        prompt = f"""Let's pull everything together into a cohesive design:

Initial Concepts:
<initial_concepts>
{initial_ideas}
</initial_concepts>

Complexity Layers:
<complexity_layers>
{complex_ideas}
</complexity_layers>

Please provide a complete design in this format:

<game_title>
[An intriguing, memorable title that captures the game's essence]
</game_title>

<design_plan>
[Detailed design document covering:

1. Core Mechanics
- Primary gameplay systems
- Key interactions
- Control scheme

2. Progression & Complexity
- How mechanics layer and combine
- How complexity unfolds
- Hidden depth and discoveries

3. Player Experience
- Learning curve
- "Wow" moments
- Secrets and mastery

4. Visual Style
- Art direction
- Feedback systems
- Visual effects

5. Technical Requirements
- Key systems needed
- Important considerations
- Implementation approach]
</design_plan>

Make it WILD but IMPLEMENTABLE - push creative boundaries while keeping it feasible in p5.js!"""

        return self._call_model_api(
            user_prompt=prompt, system_prompt=self.system_prompt
        )

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "Untitled Game"

    def _extract_design_plan(self, text: str) -> str:
        """Extract the full design plan"""
        pattern = r"<design_plan>\s*(.*?)\s*</design_plan>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No design plan provided."

    def _call_model_api(self, user_prompt: str, system_prompt: str = None) -> str:
        """Call the model API with proper prompts"""
        return self.model_api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt or self.system_prompt,
            debug=self.debug,
        )

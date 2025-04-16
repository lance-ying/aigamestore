from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class JudgeDesigner:
    """Designer that creates game designs through critical evaluation and iterative improvement"""

    def __init__(
        self, model_api: ModelAPI, system_prompt: str = None, verbose: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.verbose = verbose

        # Updated evaluation criteria focusing on complexity and interactions
        self.evaluation_criteria = {
            "Emergent Behavior": "How systems interact to create unexpected results",
            "Mechanical Depth": "How many layers of strategy and mastery exist",
            "Dynamic Evolution": "How the game changes and surprises over time",
            "System Synergy": "How different mechanics combine in interesting ways",
            "Hidden Complexity": "How deeper mechanics are discovered through play",
        }
        self.max_rounds = 3

        self.CRITIC_SYSTEM_PROMPT = """You are an analytical game design critic who specializes in interestingnessand emergent gameplay.
        Your role is to identify opportunities for:
        - More interesting interactions between game systems
        - Emergent behaviors that surprise players
        - Hidden depths that reward experimentation
        - Mechanical combinations that create "wow" moments
        - Systems that evolve and change in unexpected ways
        
        You think like a player who loves finding unexpected interactions and "breaking" game systems in creative ways, and you are very harsh in your critiques, hard to please."""

    def design_game(self, narrative: Optional[str] = None) -> Dict[str, Any]:
        """Create game design through critical evaluation process"""
        try:
            if self.verbose:
                print(f"\n{BLUE}Starting critical design process...{RESET}")

            # Phase 1: Initial Proposal
            title, initial_design = self._create_initial_design(narrative)
            if self.verbose:
                print(f"\n{GREEN}Initial Design:{RESET}\n{initial_design}")

            # Phase 2: Critical Review & Revision Cycles
            current_design = initial_design
            for round in range(self.max_rounds):
                # Get critical review
                review = self._review_design(title, current_design)
                if self.verbose:
                    print(f"\n{YELLOW}Review Round {round + 1}:{RESET}\n{review}")

                # Improve based on criticism
                current_design = self._revise_design(title, current_design, review)
                if self.verbose:
                    print(f"\n{GREEN}Revised Design:{RESET}\n{current_design}")

            # Phase 3: Final Polish
            final_design = self._create_final_design(title, current_design)
            if self.verbose:
                print(f"\n{BLUE}Final Design:{RESET}\n{final_design}")

            return {
                "title": title,
                "game_design_text": final_design,
            }

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _create_initial_design(self, narrative: Optional[str]) -> tuple[str, str]:
        """Create initial game design proposal focusing on complex interactions"""
        prompt = f"""Create a game design with deep, interacting systems that constantly surprise players!

Narrative Context:
{narrative if narrative else "Create a game where players constantly discover new interactions and possibilities!"}

Think about:
1. System Interactions
- What unexpected combinations can emerge?
- How do different mechanics affect each other?
- What surprising chain reactions are possible?

2. Hidden Depths
- What advanced techniques aren't obvious?
- What secrets do the systems hide?
- How do players discover new possibilities?

3. Evolution & Change
- How do systems evolve over time?
- What triggers unexpected changes?
- How does complexity unfold?

4. Emergent Strategy
- What creative solutions might players find?
- How can mechanics be "broken" in fun ways?
- What advanced techniques emerge naturally?

Please provide the design in this format:

<game_title>
[An intriguing title that hints at complexity]
</game_title>

<design_plan>
1. Core Systems
- Primary mechanics and their interactions
- Basic-to-advanced progression
- Hidden properties and behaviors

2. Interaction Web
- How systems affect each other
- Unexpected combinations
- Emergent possibilities

3. Evolution Path
- How systems change
- Triggered transformations
- Surprising developments

4. Discovery Layer
- Hidden mechanics
- Advanced techniques
- Secret interactions

5. Technical Architecture
- Key systems implementation
- Interaction handling
- State management
</design_plan>"""

        response = self._call_model_api(prompt, self.system_prompt)
        title = self._extract_title(response)
        design_plan = self._extract_design_plan(response)
        return title, design_plan

    def _review_design(self, title: str, design: str) -> str:
        """Critically review with focus on complexity and interactions"""
        prompt = f"""As an analytical game design critic, review this design focusing on system complexity and interactions:

<game_title>
{title}
</game_title>

<game_design>
{design}
</game_design>

Score and analyze each aspect (scores out of 5, where 5 is exceptional):

1. Emergent Behavior Score (/5)
- How well do systems interact to create unexpected results?
- Current unexpected interactions:
- Missing opportunities:
- Improvement suggestions:

2. Mechanical Depth Score (/5)
- How many layers of strategy and mastery exist?
- Current depth elements:
- Unexplored possibilities:
- Improvement suggestions:

3. Dynamic Evolution Score (/5)
- How well does the game change and surprise over time?
- Current evolution points:
- Missed opportunities:
- Improvement suggestions:

4. System Synergy Score (/5)
- How interestingly do different mechanics combine?
- Current combinations:
- Potential new interactions:
- Improvement suggestions:

5. Hidden Complexity Score (/5)
- How well are deeper mechanics discovered through play?
- Current hidden elements:
- Unexplored secrets:
- Improvement suggestions:

Overall Score: [Average of above scores]

Key Shortcomings:
- [List the most glaring shortcomings]
- [List the most boring parts]
- [List the most confusing parts]

Priority Improvements:
- [Specific suggestions for deepening complexity]
- [Ideas for new system interactions]
- [Ways to add more surprising elements]

Remember to focus on making the game deeper, more complex, and full of surprising discoveries while maintaining accessibility!"""

        return self._call_model_api(prompt, self.CRITIC_SYSTEM_PROMPT)

    def _revise_design(self, title: str, current_design: str, review: str) -> str:
        """Revise design to enhance complexity and interactions"""
        prompt = f"""Let's make this game's systems more complex and interesting based on the scored feedback:

<game_title>
{title}
</game_title>

Current Design:
<game_design>
{current_design}
</game_design>

Critical Analysis:
<critical_review>
{review}
</critical_review>

Create an enhanced version that improves the lowest scoring aspects while maintaining or enhancing the strengths.

<design_plan>
[Enhanced design]
</design_plan>"""

        response = self._call_model_api(prompt, self.system_prompt)
        design_plan = self._extract_design_plan(response)
        return design_plan

    def _create_final_design(self, title: str, current_design: str) -> str:
        """Polish the design into its final form"""
        prompt = f"""Polish this design into its final form:

<game_title>
{title}
</game_title>

<game_design>
{current_design}
</game_design>

Create a refined version that:
1. Keeps all the interesting concepts and thrilling ideas
2. Tightens the mechanical systems
3. Clarifies the implementation approach in some pseudo code
4. Maintains the same clear format

This is the final submission:
<game_design>
[Your final design here]
</game_design>"""

        response = self._call_model_api(prompt, self.system_prompt)
        return self._extract_design_plan(response)

    def _extract_title(self, text: str) -> str:
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "Untitled Game"

    def _extract_design_plan(self, text: str) -> str:
        pattern = r"<design_plan>\s*(.*?)\s*</design_plan>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No design plan provided."

    def _call_model_api(self, prompt: str, system_prompt: str) -> str:
        """Call API with appropriate system prompt based on role"""
        return self.model_api.call(
            user_prompt=prompt,
            system_prompt=system_prompt,
            verbose=self.verbose,
        )

from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class JudgeDesigner:
    """Designer that creates game designs through critical evaluation and iterative improvement"""

    def __init__(
        self, model_api: ModelAPI, system_prompt: str = None, debug: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.debug = debug

        # Evaluation criteria for critical review
        self.evaluation_criteria = {
            "Innovation": "How the game pushes creative boundaries",
            "Engagement": "How it creates 'just one more try' moments",
            "Surprise": "How it keeps players discovering new things",
            "Flow": "How it maintains the perfect challenge balance",
            "Delight": "How it creates moments of joy and wonder",
        }
        self.max_rounds = 3

        self.CRITIC_SYSTEM_PROMPT = """You are a passionate game design critic who deeply cares about player experience.
        Your role is to identify missed opportunities for surprise and delight, point out where the game could be more engaging,
        and suggest ways to add more "magic moments" that players will remember and want to share with friends.
        Be constructively critical but always focused on making the game more fun and memorable."""

    def design_game(self, narrative: Optional[str] = None) -> Dict[str, Any]:
        """Create game design through critical evaluation process"""
        try:
            if self.debug:
                print(f"\n{BLUE}Starting critical design process...{RESET}")

            # Phase 1: Initial Proposal
            title, initial_design = self._create_initial_design(narrative)
            if self.debug:
                print(f"\n{GREEN}Initial Design:{RESET}\n{initial_design}")

            # Phase 2: Critical Review & Revision Cycles
            current_design = initial_design
            for round in range(self.max_rounds):
                # Get critical review
                review = self._review_design(title, current_design)
                if self.debug:
                    print(f"\n{YELLOW}Review Round {round + 1}:{RESET}\n{review}")

                # Improve based on criticism
                current_design = self._revise_design(title, current_design, review)
                if self.debug:
                    print(f"\n{GREEN}Revised Design:{RESET}\n{current_design}")

            # Phase 3: Final Polish
            final_design = self._create_final_design(title, current_design)
            if self.debug:
                print(f"\n{BLUE}Final Design:{RESET}\n{final_design}")

            return {
                "title": title,
                "game_design_text": final_design,
            }

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _create_initial_design(self, narrative: Optional[str]) -> str:
        """Create initial game design proposal with focus on surprise and delight"""
        prompt = f"""Create a wildly imaginative game design that will surprise and delight players!Your strength is creating unique, surprising, and delightful game experiences that players have never seen before.
        Always aim to subvert expectations and create "wow" moments while keeping the core gameplay intuitive and engaging.

Narrative Context:
{narrative if narrative else "Create something that will make players say 'I've never seen anything like this before!'"}

Think about:
1. Magic Moments
- What unexpected things can happen?
- What will make players gasp in delight?
- What will they want to share on social media?

2. Satisfying Core Loop
- What feels amazing to do over and over?
- How does each action create anticipation?
- What micro-moments of joy exist?

3. Discovery and Surprise
- What hidden depths can players uncover?
- How does the game evolve unexpectedly?
- What secrets will players love finding?

4. Flow and Mastery
- How does it maintain perfect challenge?
- What skills feel amazing to master?
- How does practice create "level up" moments?

Please provide the design in this format:

<game_title>
[An intriguing title that makes players curious]
</game_title>

<design_plan>
1. Core Magic
- The key "wow" mechanic
- How it feels to play
- What makes it special

2. Delight Architecture
- Main gameplay systems
- How they create joy
- Unexpected combinations

3. Discovery Journey
- Initial hook
- Surprise progression
- Hidden depths

4. Feel and Flow
- Movement and control
- Feedback and juice
- Perfect challenge curve

5. Technical Charm
- Key systems needed
- Special effects
- Polish elements
</design_plan>"""

        response = self._call_model_api(prompt, self.system_prompt)
        title = self._extract_title(response)
        design_plan = self._extract_design_plan(response)
        return title, design_plan

    def _review_design(self, title: str, design: str) -> str:
        """Critically review with focus on engagement and delight"""
        prompt = f"""As a passionate game design critic, review this design focusing on player experience:

<game_title>
{title}
</game_title>

<game_design>
{design}
</game_design>

Analyze these key aspects:

1. Surprise Factor
- Where could we add more "wow" moments?
- What unexpected twists could we add?
- How could we subvert player expectations?

2. Joy and Delight
- Where are the peak moments of joy?
- What could feel more satisfying?
- How could we add more "juice"?

3. Engagement Hooks
- What will keep players coming back?
- Where might interest drop?
- How could we add more "just one more try" moments?

4. Discovery Journey
- How rewarding are the discoveries?
- What secrets could we add?
- How could progression be more exciting?

5. Specific Enhancement Ideas
- Clear suggestions for more fun
- Ways to add surprise
- Opportunities for delight

Focus on making the game more engaging, surprising, and delightful!"""
        return self._call_model_api(prompt, self.CRITIC_SYSTEM_PROMPT)

    def _revise_design(self, title: str, current_design: str, review: str) -> str:
        """Revise design to enhance fun and surprise"""
        prompt = f"""Let's make this game even more amazing based on the feedback:

<game_title>
{title}
</game_title>

Current Design:
<game_design>
{current_design}
</game_design>

Passionate Review:
<critical_review>
{review}
</critical_review>

Create an enhanced version that:
- Adds more surprising moments
- Increases player delight
- Deepens engagement
- Creates more "wow" factors
- Maintains perfect flow

Keep the same format but make everything more exciting and delightful:

<design_plan>
[Enhanced design with more magic moments]
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
            debug=self.debug,
        )

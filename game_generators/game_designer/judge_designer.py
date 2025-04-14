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

        # Enhanced evaluation criteria focusing on dynamics
        self.evaluation_criteria = {
            "Surprise Factor": "How well it introduces unexpected elements and twists",
            "Evolution": "How the gameplay changes and grows over time",
            "Depth": "How many layers of strategy and mechanics exist",
            "Engagement": "How well it maintains player interest",
            "Feasibility": "How well it can be implemented in p5.js",
        }
        self.required_score = 4  # Minimum score needed for good rating
        self.max_rounds = 3  # Maximum discussion rounds

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create game design through critical evaluation"""
        try:
            if self.debug:
                print(f"\n{BLUE}Starting judged design process...{RESET}")

            context = {
                "genre": genre,
                "num_players": num_players,
                "narratives": narratives,
                "conversation_history": [],
                "key_points": set(),
                "previous_ratings": {},
                "improvement_count": 0,
                "stagnant_rounds": 0,
                "total_rounds": 0,
            }

            # Initial creative proposal
            initial_proposal = self._get_initial_proposal(context)
            context["conversation_history"].append(("designer", initial_proposal))

            # Evaluation and improvement loop
            while not self._is_design_ready(context):
                # Evaluate current design
                evaluation = self._evaluate_design(context)
                context["conversation_history"].append(("judge", evaluation))

                # If design isn't ready, get improvements
                if not self._is_design_ready(context):
                    improved_design = self._get_improvements(evaluation, context)
                    context["conversation_history"].append(
                        ("designer", improved_design)
                    )

            # Create final design with guidance
            final_design = self._create_final_design(context)

            if self.debug:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {self._extract_title(final_design)}")
                print(f"Description: {self._extract_description(final_design)}")

            return {
                "title": self._extract_title(final_design),
                "description": self._extract_description(final_design),
                "game_design_text": self._format_complete_design(context, final_design),
                "game_guidance": self._extract_guidance(final_design),
                "full_response": self._format_discussion_log(context),
            }

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _get_initial_proposal(self, context: dict) -> str:
        """Get initial creative game proposal with focus on dynamic gameplay"""
        prompt = f"""Create a {context['genre']} game that constantly surprises players! Think about:

1. Core Innovation:
- What's the primary mechanic that makes players say "I've never seen this before!"?
- How does it combine familiar controls (arrows, space, shift) in unexpected ways?

2. Dynamic Evolution:
- How does the game change as players progress?
- What new mechanics or twists are introduced in later levels?
- How do enemies/challenges evolve over time?

3. Layered Complexity:
- What hidden mechanics do players discover?
- How do different game elements interact in surprising ways?
- What advanced techniques can skilled players develop?

4. AI Behavior Progression:
- How do the {context['num_players']-1} AI agents learn or adapt?
- What unique personality quirks make each AI memorable?
- How do AI behaviors combine to create unexpected situations?

Narrative Context:
{context['narratives'] if context['narratives'] else 'Create a story with surprising twists that fits the genre'}

Please provide:
1. Game Title:
[Your catchy title]

2. Game Description:
[Core concept and how it evolves]

3. Game Guidance:
```guidance
[Write an engaging start screen message that:
- Hints at hidden depths
- Explains basic controls
- Teases future surprises
- Gives essential starting tips]
```

4. Progression Design:
- Level 1: Basic mechanics and tutorial
- Level 2-3: Introducing twists and combinations
- Level 4+: Advanced mechanics and surprises
- Final stage: Ultimate challenge combining everything

5. Detailed Mechanics:
[Full gameplay systems with focus on evolution and interaction]"""

        return self._call_model_api(prompt, self.system_prompt)

    def _evaluate_design(self, context: dict) -> str:
        """Critically evaluate the current design with focus on dynamics"""
        current_design = context["conversation_history"][-1][1]

        prompt = f"""As a critical game design judge, evaluate this {context['genre']} game design focusing on player engagement and surprise:

{current_design}

Rate each aspect (1-5, with specific reasons):

1. Surprise Factor (/5):
- Does it have genuine "wow" moments?
- Are there unexpected mechanics or combinations?
- How well does it subvert player expectations?

2. Evolution (/5):
- How meaningfully does gameplay change over time?
- Are new mechanics introduced at a good pace?
- Do challenges evolve in interesting ways?

3. Depth (/5):
- Are there multiple layers of strategy?
- Can players discover advanced techniques?
- How do different mechanics interact?

4. Engagement (/5):
- Will it keep players interested?
- Are there meaningful choices?
- Does complexity increase naturally?

5. Feasibility (/5):
- Can this be implemented in p5.js?
- Are the mechanics technically possible?
- Is the scope manageable?

Provide:
RATINGS: [List scores]
STRENGTHS: [What creates genuine surprise and engagement]
WEAKNESSES: [What feels static or predictable]
FOCUS: [How to add more dynamic elements]"""

        return self._call_model_api(prompt, self.system_prompt)

    def _get_improvements(self, evaluation: str, context: dict) -> str:
        """Get improvements based on evaluation, focusing on dynamic elements"""
        prompt = f"""Based on this evaluation:
{evaluation}

Enhance this {context['genre']} game design by adding more surprising and dynamic elements:

1. Add unexpected twists:
- New mechanic combinations
- Surprising level changes
- Interesting AI behavior patterns

2. Deepen the progression:
- More meaningful evolution
- Hidden advanced techniques
- Emergent gameplay possibilities

3. Create "wow" moments:
- Unexpected rewards
- Surprising interactions
- Dynamic challenge scaling

Provide the improved design with all sections:
1. Game Title
2. Game Description
3. Game Guidance (in ```guidance block)
4. Progression Design (with clear evolution)
5. Detailed Mechanics (including surprises)"""

        return self._call_model_api(prompt, self.system_prompt)

    def _is_design_ready(self, context: dict) -> bool:
        """Check if the design meets quality criteria"""
        if context["total_rounds"] >= self.max_rounds:
            return True

        # Parse latest evaluation
        if (
            context["conversation_history"]
            and context["conversation_history"][-1][0] == "judge"
        ):
            evaluation = context["conversation_history"][-1][1]
            ratings = self._parse_ratings(evaluation)

            # Count good scores
            good_scores = sum(
                1 for score in ratings.values() if score >= self.required_score
            )

            # Ready if most scores are good or we're not improving
            return good_scores >= 3 or context["stagnant_rounds"] >= 1

        return False

    def _create_final_design(self, context: dict) -> str:
        """Create final design with complete specification and dynamic elements"""
        last_design = next(
            msg
            for role, msg in reversed(context["conversation_history"])
            if role == "designer"
        )

        prompt = f"""Polish this {context['genre']} game design into its final form, ensuring it maintains excitement throughout:

Previous Design:
{last_design}

Create a complete design that includes:

1. Game Title:
[Final catchy title]

2. Game Description:
[Core concept and evolution]

3. Game Guidance:
```guidance
[Engaging start screen message that:
- Welcomes players
- Explains basic controls
- Hints at deeper mechanics
- Teases future surprises]
```

4. Progressive Complexity:
- Starting mechanics
- Evolution points
- Advanced techniques
- Hidden interactions

5. Level Design:
- Tutorial introduction
- Mechanic revelation points
- Surprise moments
- Ultimate challenges

6. Technical Implementation:
- Core systems
- Progressive difficulty scaling
- Dynamic AI behaviors
- Interactive elements

Remember: Every level should introduce something new or combine existing elements in surprising ways!"""

        return self._call_model_api(prompt, self.system_prompt)

    def _parse_ratings(self, evaluation: str) -> dict:
        """Parse numerical ratings from evaluation"""
        ratings = {}
        for aspect in self.evaluation_criteria.keys():
            pattern = rf"{aspect}:\s*(\d+)"
            match = re.search(pattern, evaluation, re.IGNORECASE)
            if match:
                ratings[aspect] = int(match.group(1))
        return ratings

    def _format_complete_design(self, context: dict, final_design: str) -> str:
        """Format the complete design document"""
        return f"""=== Complete Game Design Document ===

Genre: {context['genre']}
Players: {context['num_players']} (1 human + {context['num_players']-1} AI)
Narrative Context: {context['narratives'] if context['narratives'] else 'No specific narrative constraints'}

=== Design Evolution ===
{self._format_discussion_log(context)}

=== Final Design ===
{final_design}"""

    def _format_discussion_log(self, context: dict) -> str:
        """Format the complete discussion history"""
        log_parts = []
        for round_num, (role, message) in enumerate(context["conversation_history"], 1):
            log_parts.extend(
                [f"\n--- Round {(round_num + 1) // 2}: {role.title()} ---", message, ""]
            )
        return "\n".join(log_parts)

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        patterns = [
            r"Game Title:\s*(.*?)(?:\n|$)",
            r"Title:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "Untitled Game"

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        pattern = r"Game Description:\s*(.*?)(?:\n\n|\n(?=[A-Za-z]+:))"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return "No description provided."

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance from text"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if not match:
            raise ValueError(
                "No guidance block found in the final design. This is required for the start screen."
            )
        return match.group(1).strip()

    def _call_model_api(self, prompt: str, system_prompt: str = None) -> str:
        """Call the model API with proper prompts"""
        response = self.model_api.call(
            user_prompt=prompt,
            system_prompt=system_prompt,
            debug=self.debug,
        )
        return response

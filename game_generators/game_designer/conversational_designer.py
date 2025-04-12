from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class ConversationalDesigner:
    """Designer that creates game designs through multi-agent conversation"""

    def __init__(self, model_api: ModelAPI, system_prompt: str = None):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.max_discussion_rounds = 2

        # Commenter system prompt focuses on improving game design
        self.commenter_system_prompt = """You are an experienced game design critic focused on creating engaging and innovative p5.js games.
Your role is to analyze game designs and suggest improvements in these areas:

1. Player Experience:
   - Engagement: Is the core gameplay loop compelling?
   - Learning curve: Is it easy to understand but hard to master?
   - Controls: Are they intuitive and responsive?

2. Game Mechanics:
   - Innovation: Suggest unique combinations of basic mechanics
   - Balance: Ensure challenge scales well
   - Feedback: Clear indicators of success/failure

3. AI Behavior:
   - Personality: Each AI agent should have distinct behavior
   - Purpose: Every agent should serve a clear gameplay role
   - Interaction: Create interesting player-AI dynamics

4. Visual Design:
   - Clarity: Important elements should be easily identifiable
   - Style: Suggest cohesive visual themes
   - Animation: Recommend smooth, meaningful movements

5. Technical Feasibility:
   - Keep suggestions within p5.js capabilities
   - Focus on implementable features
   - Consider performance implications

Provide specific, actionable feedback that will make the game more engaging while staying technically feasible."""

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """Create game design through conversation"""
        try:
            if debug:
                print(f"\n{BLUE}Starting game design conversation...{RESET}")

            # Phase 1: Conversational Planning
            plan = self._conversational_planning(genre, num_players, narratives)

            # Extract final details
            title = self._extract_title(plan["final_proposal"])
            description = self._extract_description(plan["final_proposal"])
            guidance = self._extract_guidance(plan["final_proposal"])

            # Combine all discussion into game_design_text
            game_design_text = f"""Complete Game Design:

Title: {title}

Description:
{description}

Player Guidance:
{guidance}

Technical Details:
{plan['final_proposal']}

Design Evolution:
{plan['full_discussion']}"""

            if debug:
                print(f"\n{BLUE}Final Design:{RESET}")
                print(f"Title: {title}")
                print(f"Description: {description}")
                print(f"Guidance: {guidance}")

            return {
                "title": title,
                "description": description,
                "game_design_text": game_design_text,  # Complete design including discussion
                "game_guidance": guidance,
                "full_response": plan["full_discussion"],
            }

        except Exception as e:
            if debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _conversational_planning(
        self, genre: str, num_players: int, narratives: Optional[str]
    ) -> Dict[str, Any]:
        """Run the conversation between generator and commenter"""
        num_ai_agents = max(0, num_players - 1)

        initial_prompt = self._create_initial_prompt(genre, num_ai_agents, narratives)
        current_proposal = self._call_model_api(initial_prompt, self.system_prompt)

        discussion_history = []
        for round_num in range(self.max_discussion_rounds):
            # Get commenter feedback
            commenter_prompt = self._create_commenter_prompt(current_proposal)
            commenter_response = self._call_model_api(
                commenter_prompt, self.commenter_system_prompt
            )
            discussion_history.append(("commenter", commenter_response))

            # Get generator refinement
            refinement_prompt = self._create_refinement_prompt(commenter_response)
            current_proposal = self._call_model_api(
                refinement_prompt, self.system_prompt
            )
            discussion_history.append(("generator", current_proposal))

        # Format full discussion
        full_discussion = self._format_discussion(
            initial_prompt, current_proposal, discussion_history
        )

        return {
            "final_proposal": current_proposal,
            "discussion_history": discussion_history,
            "full_discussion": full_discussion,
        }

    def _create_initial_prompt(
        self, genre: str, num_ai_agents: int, narratives: Optional[str]
    ) -> str:
        return f"""Create a complete p5.js game design for a {genre} game with {num_ai_agents} AI-controlled agents.

Narrative Context:
{narratives if narratives else "Create an engaging storyline that fits the genre"}
        
Game Requirements:
1. Single human player with {num_ai_agents} AI opponents/allies
2. Controls:
   - Arrow keys or WASD for movement
   - Space bar for primary action
   - Shift key for special ability
3. Canvas size: 600x400 pixels
4. No audio required

Please provide a complete design including:
1. Game Title: Catchy and descriptive
2. Game Description: Core concept and unique features
3. Player Instructions: Controls and objectives
4. Game Mechanics:
   - Player abilities and controls
   - AI agent behaviors and purposes
   - Interaction systems
   - Scoring/progression
5. Technical Specifications:
   - Entity types and properties
   - State management
   - Collision handling
   - Win/lose conditions
6. Visual Design:
   - Art style
   - Animation concepts
   - UI elements

Format your response with clear sections using the headers above."""

    def _create_commenter_prompt(self, proposal: str) -> str:
        return f"""Review this game design proposal:
{proposal}

Analyze each aspect and suggest specific improvements:

1. Core Gameplay:
   - Is it engaging and unique?
   - What mechanics could be added or combined?
   - How could player-AI interactions be more interesting?

2. Technical Implementation:
   - Are the mechanics feasible in p5.js?
   - Any potential performance concerns?
   - Suggestions for efficient implementation?

3. Player Experience:
   - Is the learning curve appropriate?
   - Are controls intuitive?
   - Is feedback clear and meaningful?

4. Visual Design:
   - How could the visuals enhance gameplay?
   - Are important elements easily identifiable?
   - Suggestions for visual effects?

Provide specific, actionable feedback for each area."""

    def _create_refinement_prompt(self, feedback: str) -> str:
        return f"""Based on this feedback:
{feedback}

Please provide an improved, complete game design. Your response MUST include all these sections in order:

1. Game Title:
[Your title]

2. Game Description:
[Core concept and unique features]

3. Game Guidance:
```guidance
[Write an engaging start screen message that includes:
- Exciting welcome message
- Clear mission statement
- Control scheme
- Key gameplay tips
Make it fun and informative!]
```

4. Detailed Game Design:
   - Complete gameplay mechanics
   - AI agent behaviors
   - Interaction systems
   - Progression mechanics

5. Technical Specifications:
   - Entity definitions
   - State management
   - Physics/collision systems
   - Win/lose conditions

6. Visual Design:
   - Art style
   - Animation systems
   - Effects and polish

The guidance block will be shown directly on the game's start screen, so make it engaging and clear for players."""

    def _format_discussion(
        self, initial_prompt: str, final_proposal: str, history: list
    ) -> str:
        discussion = [
            "=== Game Design Discussion ===\n",
            "Initial Request:",
            initial_prompt,
            "\n=== Discussion Rounds ===\n",
        ]

        for round_num, (role, message) in enumerate(history, 1):
            discussion.extend(
                [f"--- Round {round_num//2 + 1}: {role.title()} ---", message, ""]
            )

        discussion.extend(["=== Final Design ===", final_proposal])

        return "\n".join(discussion)

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        patterns = [
            r"Title:\s*(.*?)(?:\n|$)",
            r"GAME TITLE:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "Untitled Game"

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        patterns = [
            r"Description:\s*(.*?)(?:\n\n|\n(?=[A-Za-z]+:))",
            r"Game Description:\s*(.*?)(?:\n\n|\n(?=[A-Za-z]+:))",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return text

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance block from text"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if not match:
            raise ValueError(
                "No guidance block found in the final design. This is required for the start screen."
            )
        return match.group(1).strip()

    def _call_model_api(self, prompt: str, system_prompt: str = None) -> str:
        """Call the model API with proper prompts"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.model_api.call(
            user_prompt=prompt, system_prompt=system_prompt, debug=True
        )

        return response

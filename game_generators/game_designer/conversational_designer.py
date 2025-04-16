from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class ConversationalDesigner:
    """Designer that creates game designs through multi-agent conversation"""

    def __init__(
        self, model_api: ModelAPI, system_prompt: str = None, verbose: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT
        self.verbose = verbose

        self.max_discussion_rounds = 2

        # Use the commenter system prompt from conv_gamegen
        self.commenter_system_prompt = """You are an experienced game design critic with a focus on innovation.
Your role is to:
1. Analyze proposed game designs and push for more creative solutions
2. Suggest specific improvements for:
   - Novelty: Look for opportunities to add unexpected twists
   - Innovation: Identify ways to combine mechanics in unique ways
   - Player engagement: Focus on surprising and delightful interactions
   - Game mechanics: Challenge conventional approaches
   - Visual appeal: Suggest unique visual elements
   - User experience: Balance innovation with usability
3. Keep suggestions practical within p5.js constraints
4. Focus on constructive feedback that enhances uniqueness
5. Question traditional genre conventions and suggest creative alternatives"""

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create game design through conversation"""
        try:
            if self.verbose:
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

            if self.verbose:
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
            if self.verbose:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _conversational_planning(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str],
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
        # Use format similar to conv_gamegen's initial prompt
        return f"""Let's create an innovative single-player **{genre}** game with {num_ai_agents} AI-controlled agents.

Game Structure:
- One player-controlled character using these controls:
  - Arrow keys or WASD for movement
  - Space bar for primary action
  - Shift key for special ability
- {num_ai_agents} computer-controlled agents that interact with the player
- Each AI agent should have its own behavior and purpose

{narratives if narratives else ""}

Please propose:
1. A catchy game title
2. Core game concept focusing on player interaction with AI agents
3. Novel mechanics for the player character
4. Creative objectives involving the AI agents
5. Clear player instructions
6. At least two unique gameplay elements
7. Innovative ways to use the control scheme

Think about:
- How can the AI agents create interesting challenges?
- What unique interactions can occur between player and AI agents?
- How can we make the single player controls feel responsive and fun?"""

    def _create_commenter_prompt(self, proposal: str) -> str:
        # Use format similar to conv_gamegen's commenter prompt
        return f"""Review this game proposal:
{proposal}

How can we make this game more innovative and unique? Focus on:
1. Unexpected gameplay mechanics
2. Novel twists on familiar elements
3. Surprising player interactions
4. Creative combinations of mechanics
5. Unique visual elements
6. Innovative progression systems

Consider:
- What conventional elements could be replaced with more creative alternatives?
- How can we surprise players while maintaining engaging gameplay?
- What unique mechanics could make this game memorable?"""

    def _create_refinement_prompt(self, feedback: str) -> str:
        # Use format similar to conv_gamegen's refinement prompt
        return f"""Consider this feedback on your game proposal:
{feedback}

Please provide an improved version that emphasizes innovation and includes:
1. Game title (keep it catchy and relevant)
2. Game description: A clear, concise summary of the game concept and unique features
3. Game Guidance:
```guidance
[Write an engaging start screen message that:
- Welcomes players
- Explains basic controls
- Shows main objectives
- Gives essential tips]
```
4. Novel mechanics and unique interactions
5. Creative win/lose conditions
6. Innovative progression system
7. Unexpected visual elements

Format your response with clear sections:
Title: [Game Title]
Description: [2-3 sentences describing the game]
Game Guidance: [Must be wrapped in ```guidance code block as shown above]
[Rest of the game details]"""

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
            user_prompt=prompt,
            system_prompt=system_prompt,
            verbose=self.verbose,
        )

        return response

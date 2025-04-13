from typing import Dict, Any, Optional
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class ComplexityGuideDesigner:
    """Designer that creates game designs through guided complexity discussions"""

    def __init__(self, model_api: ModelAPI, system_prompt: str = None):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """Create game design through guided discussion"""
        try:
            if debug:
                print(f"\n{BLUE}Starting guided design process...{RESET}")

            # Phase 1: Initial Brainstorming
            mechanics_response = self._brainstorm_mechanics(
                genre, num_players, narratives, debug
            )

            # Phase 2: Complexity Discussion
            complexity_response = self._discuss_complexity(mechanics_response, debug)

            # Phase 3: Final Design
            final_design = self._create_final_design(
                mechanics_response, complexity_response, debug
            )

            # Extract components
            title = self._extract_title(final_design)
            description = self._extract_description(final_design)

            # Combine everything into game_design_text
            game_design_text = self._format_complete_design(
                genre,
                num_players,
                narratives,
                mechanics_response,
                complexity_response,
                final_design,
            )

            if debug:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {title}")
                print(f"Description: {description}")

            return {
                "title": title,
                "description": description,
                "game_design_text": game_design_text,
                "game_guidance": self._extract_guidance(final_design),
                "full_response": game_design_text,
            }

        except Exception as e:
            if debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _brainstorm_mechanics(
        self, genre: str, num_players: int, narratives: Optional[str], debug: bool
    ) -> str:
        """Initial casual brainstorming phase"""
        prompt = f"""Hey there! Let's kick off a fun brainstorming session for creating an awesome {genre} game.

I'm thinking we could make something really unique with:
- 1 player character
- {num_players-1} AI buddies/opponents
- A fresh take on {genre} gameplay

Story Vibe:
{narratives if narratives else "We can create any cool story that fits!"}

Just throwing ideas around:
- What if we added an unexpected twist to how {genre} games usually work?
- Maybe the AI characters could do something surprising?
- Any cool ways we could use simple controls (arrow keys, space, shift) to do unexpected things?

Don't worry about technical stuff yet - let's just dream up some fun ideas!
What kind of surprising mechanics could make players go "Whoa, that's cool!"?"""

        if debug:
            print(f"\n{BLUE}[Brainstorm] Getting Creative{RESET}")
            print(f"Prompt: {prompt}")

        return self._call_model_api(prompt, self.system_prompt)

    def _discuss_complexity(self, mechanics_response: str, debug: bool) -> str:
        """Casual discussion about making the game engaging"""
        prompt = f"""Cool ideas so far! Let's chat about making these fun:

{mechanics_response}

I'm curious:
- How could we make these mechanics feel natural to pick up?
- What if the challenges grew in unexpected ways?
- Maybe the AI could learn or change as you play?
- What little details could make everything feel satisfying?

Think about those "just one more try" moments - what makes games hard to put down?
How could we surprise players while keeping things fair and fun?"""

        if debug:
            print(f"\n{BLUE}[Chat] Making It Fun{RESET}")
            print(f"Prompt: {prompt}")

        return self._call_model_api(prompt, self.system_prompt)

    def _create_final_design(
        self, mechanics_response: str, complexity_response: str, debug: bool
    ) -> str:
        """Wrap up the design with complete but natural specification"""
        prompt = f"""Alright, we've got some really fun ideas going:

The Cool Stuff:
{mechanics_response}

Making It Work:
{complexity_response}

Let's pull it all together! Could you write up a complete design that includes:

1. Game Title:
[Something catchy that captures the fun!]

2. Game Description:
[What makes this game special? What's the "wow" factor?]

3. Game Guidance:
```guidance
[Write this like you're telling a friend how to play:
- A welcoming "Hey, ready to play?" kind of intro
- What makes this game exciting
- Quick rundown of controls
- A few "pro tips" that make players feel clever
Make it sound fun!]
```

4. The Details:
- Gameplay Feel: [How does it flow? What makes it satisfying?]
- AI Personality: [What makes each AI character interesting?]
- Getting Better: [How do players improve? What secrets might they discover?]
- Victory & Defeat: [What makes winning feel great? How to bounce back from losing?]

5. The Look:
- Style: [What's the vibe? How does it catch the eye?]
- Screen Layout: [What do players need to see? How do we keep it clear?]
- Special Effects: [What makes awesome moments feel awesome?]

Keep that creative spark we discussed, but make sure it's something we can actually build!"""

        if debug:
            print(f"\n{BLUE}[Wrapping Up] The Final Plan{RESET}")
            print(f"Prompt: {prompt}")

        return self._call_model_api(prompt, self.system_prompt)

    def _format_complete_design(
        self,
        genre: str,
        num_players: int,
        narratives: str,
        mechanics: str,
        complexity: str,
        final_design: str,
    ) -> str:
        """Format the complete design document in a natural way"""
        return f"""=== The Game Plan ===

What We're Making:
- A fresh take on {genre} games
- {num_players} total characters ({num_players-1} AI + you!)
- Story Elements: {narratives if narratives else 'Created during design'}

=== How We Got Here ===

[Round 1] The Big Ideas:
{mechanics}

[Round 2] Making It Awesome:
{complexity}

[Round 3] Putting It All Together:
{final_design}"""

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
        return self.model_api.call(
            user_prompt=prompt, system_prompt=system_prompt, debug=True
        )

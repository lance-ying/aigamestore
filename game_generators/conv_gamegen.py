import os
import re
import random
from typing import Tuple, List, Optional, Dict, Any, Literal
from openai import OpenAI
from langchain.prompts import PromptTemplate
import datetime

from game_generators.base_game_generator import BaseGameGenerator

# Import additional clients based on model type
try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google import genai
except ImportError:
    genai = None

from game_generators.utils import GREEN, YELLOW, RESET


class ConvGameGen(BaseGameGenerator):
    """
    Conversational game generator that uses two agents:
    1. Game Generator - Creates games following instructions and requirements
    2. Commenter - Suggests improvements and refinements
    """

    method_name = "conversation"

    def __init__(
        self,
        config_path: str = "config/gamegen/base_prompt.yaml",
        model_name: str = "openai:o3-mini",
    ):
        """
        Initialize the simple prompt generator

        Args:
            config_path: Path to the configuration YAML file
            model_name: Name of the AI model to use with provider prefix
                        Format: "provider:model" (e.g., "openai:o3-mini", "claude:claude-3-haiku", "gemini:gemini-1.5-flash")
        """
        super().__init__(config_path)
        # Parse model provider and name
        self.model_provider, self.model = self._parse_model_name(model_name)
        # Initialize appropriate client based on model provider
        self.client = self._initialize_client()

        # Add configuration for discussion rounds
        self.max_discussion_rounds = 2

        # Add fixed actions
        self.actions = "arrow keys, shift, space bar, w, a, s, d"

        # Update generator system prompt to include action constraints
        self.generator_system_prompt = """You are a creative and innovative game generator focused on creating unique p5.js games.
Your role is to:
1. Create novel and unexpected game mechanics that surprise players
2. Think beyond traditional game conventions while using the fixed action space:
   - Arrow keys (LEFT, UP, RIGHT, DOWN)
   - WASD keys
   - Space bar
   - Shift key
3. Combine mechanics in interesting and unique ways within these controls
4. Follow technical requirements while being creative
5. Write clean, well-documented code
6. Ensure all game mechanics are clearly explained
7. Maintain visual appeal while keeping implementation practical
8. Always provide a clear title and game instructions for players"""

        # Update commenter system prompt to focus on innovation
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

    def _parse_model_name(self, model_name: str) -> Tuple[str, str]:
        """
        Parse the model name string to extract provider and model name

        Args:
            model_name: String in format "provider:model"

        Returns:
            Tuple of (provider, model)
        """
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.lower(), model
        else:
            # Default to OpenAI if no provider specified
            return "openai", model_name

    def _initialize_client(self):
        """
        Initialize the appropriate client based on the model provider

        Returns:
            Initialized client for the selected model provider
        """
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        elif self.model_provider == "claude":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' package is required to use Claude models. Install it with 'pip install anthropic'."
                )
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        elif self.model_provider == "gemini":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' package is required to use Gemini models. Install it with 'pip install google-generativeai'."
                )
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            return genai

        else:
            raise ValueError(
                f"Unsupported model provider: {self.model_provider}. Supported providers are 'openai', 'claude', and 'gemini'."
            )

    def generate_prompt(self, genre: str, num_players: int) -> str:
        """
        Generate the game creation prompt using LangChain's PromptTemplate
        Reused from SimplePromptGen
        """
        # Fixed actions for each agent, matching the original implementation
        actions = "arrow keys, shift, space bar, w, a, s, d"

        template = (
            "Generate a interesting engaging continual {genre} game with intelligent{num_agents} agents using p5.js. All agents should be controllable by the game itself, as the player is only controlling one character."
            "The game must be playable on a basic HTML webpage.\n"
            "Game details:\n"
            "- Genre: {genre}\n"
            "- Number of players: {num_players}\n"
            "- Total number of agents: {num_agents}\n"
            "- Number of controllable agents: 1\n"
            "- Actions available for each controllable agent: {actions}\n"
            "- Decide the state of the game and the state of each agent with variables and their types ranges.\n"
            "- Decide the objectives for success and failure conditions and the rewards for each agent.\n"
            "- Decide the random initial conditions of the game and the initial state of each agent for each restart of the game.\n"
            "- On success or failure, the game should be over with a message to the human player in the game window.\n"
            "- The gameplay should be engaging and interesting and should look aesthetically pleasing.\n"
            "- Mention the name of the game and the actions in the html above the game canvas.\n"
            "- No audio should be used.\n"
        )

        prompt_template = PromptTemplate(
            input_variables=["genre", "num_agents", "actions"],
            template=template,
        )

        return prompt_template.format(
            genre=genre,
            num_players=num_players,
            num_agents=num_players - 1,
            actions=actions,
        )

    def generate_instructions(self) -> str:
        """
        Generate instructions based on configuration requirements

        Returns:
            str: Instructions string
        """
        requirements = self.config.get("requirements", {})
        allowed_libraries = requirements.get(
            "allowed_libraries",
            {"p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"},
        )

        instructions = "Your generated game should follow these requirements:\n"

        if allowed_libraries:
            instructions += "- You can use these libraries:\n"
            for lib, url in allowed_libraries.items():
                instructions += f"  * {lib}: {url}\n"

        if not requirements.get("audio", False):
            instructions += "- Do not use audio in the game\n"

        if requirements.get("start_end_screen", True):
            instructions += "- Include a start screen and a game over screen\n"

        return instructions

    def generate_game(
        self, genre: str, num_players: int
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate game through conversation and code generation phases

        Args:
            genre: Game genre
            num_players: Number of players/agents

        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        # Validate genre
        if genre not in self.valid_genres:
            genre = random.choice(self.valid_genres)

        # Phase 1: Conversational Planning
        plan = self._conversational_planning(genre, num_players)

        # Phase 2: Code Generation
        code_gen_prompt = self._create_code_gen_prompt(plan, genre, num_players)
        code_response = self._call_model_api(code_gen_prompt)

        # Parse HTML and JavaScript from the response
        code_blocks = self._parse_code_blocks(code_response)

        # Extract HTML and JavaScript code
        html_code = code_blocks.get("html", [""])[0] if code_blocks.get("html") else ""
        js_code = (
            code_blocks.get("javascript", [""])[0]
            if code_blocks.get("javascript")
            else ""
        )

        # Create js_files list format
        js_files = [("game.js", js_code)] if js_code else []

        # Get title and description from the planning phase
        game_title = plan.get("title", f"A {genre} Game")
        description = plan.get(
            "description",
            f"A {genre} game with 1 player and {num_players - 1} intelligent agents",
        )

        # Combine all responses for the conversation log
        full_response = f"""Planning Phase Discussion:
{plan['full_plan']}

Generated Code:
{code_response}"""

        # Save files to disk
        self._save_generated_files(
            genre=genre,
            title=game_title,
            html_code=html_code,
            js_files=js_files,
            description=description,
            full_response=full_response,
            num_players=num_players,
        )

        return html_code, js_files, game_title, description, full_response

    def _save_generated_files(
        self,
        genre: str,
        title: str,
        html_code: str,
        js_files: List[Tuple[str, str]],
        description: str,
        full_response: str,
        num_players: int,
    ):
        """
        Save all generated files to disk
        """
        from pathlib import Path
        import json
        import re

        # Create safe title for directory name
        safe_title = (
            "".join(c for c in title if c.isalnum() or c in (" ", "_"))
            .replace(" ", "_")
            .lower()
        )

        # Create game directory
        game_dir = Path("games") / self.method_name / self.model / genre / safe_title
        game_dir.mkdir(parents=True, exist_ok=True)

        # Extract HTML and JS code from conversation log if they weren't provided directly
        if not html_code or not js_files:
            # Look for code blocks with markdown formatting
            html_match = re.search(r"```html\s*(.*?)\s*```", full_response, re.DOTALL)
            js_match = re.search(
                r"```javascript\s*(.*?)\s*```", full_response, re.DOTALL
            )

            if html_match:
                html_code = html_match.group(1).strip()
            if js_match:
                js_code = js_match.group(1).strip()
                js_files = [("game.js", js_code)]

        # Save HTML
        if html_code:
            with open(game_dir / "index.html", "w", encoding="utf-8") as f:
                f.write(html_code)
                print(f"Saved index.html")

        # Save JavaScript files
        for filename, content in js_files:
            with open(game_dir / filename, "w", encoding="utf-8") as f:
                f.write(content)
                print(f"Saved {filename}")

        # Create a formatted game summary
        game_summary = self._create_game_summary(title, description, genre, num_players)

        # Save description with enhanced format
        with open(game_dir / "description.txt", "w", encoding="utf-8") as f:
            f.write(game_summary)
            print(f"Saved description.txt")

        # Save conversation log
        with open(game_dir / "conversation_log.txt", "w", encoding="utf-8") as f:
            f.write(full_response)
            print(f"Saved conversation_log.txt")

        # Enhanced metadata with more game details
        metadata = {
            "game_name": title,
            "game_description": description,
            "game_summary": game_summary,
            "genre": genre,
            "num_players": num_players,
            "num_autonomous_agents": num_players - 1,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": f"{self.model_provider}:{self.model}",
            "controls": self.actions,
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            print(f"Saved metadata.json")

        print(f"\nAll files saved in: {game_dir}")

    def _create_game_summary(
        self, title: str, description: str, genre: str, num_players: int
    ) -> str:
        """
        Create a user-friendly game summary focusing on gameplay rather than implementation
        """
        # Clean up the description by removing technical details
        cleaned_description = re.sub(
            r"using p5\.js|implementation|technical|function|variable|code",
            "",
            description,
            flags=re.IGNORECASE,
        )
        cleaned_description = re.sub(
            r"\s+", " ", cleaned_description
        ).strip()  # Clean up extra spaces

        summary_parts = [
            f"Game Title: {title}",
            f"\nGame Type: {genre.capitalize()} game",
            f"\nDescription:\n{cleaned_description}",
            "\nControls:",
            "- Arrow Keys or WASD: Movement",
            "- Space Bar: Action/Jump",
            "- Shift Key: Special Action",
            "\nHow to Play:",
        ]

        # Extract and clean up instructions from description
        instructions_match = re.search(
            r"instructions:?\s*(.*?)(?=\n\n|\n*$)",
            description,
            re.IGNORECASE | re.DOTALL,
        )
        if instructions_match:
            # Clean up instructions to focus on gameplay
            instructions = instructions_match.group(1).strip()
            instructions = re.sub(
                r"using p5\.js|implementation|technical|function|variable|code",
                "",
                instructions,
                flags=re.IGNORECASE,
            )
            instructions = re.sub(r"\s+", " ", instructions).strip()
            summary_parts.append(instructions)
        else:
            # Provide basic gameplay instructions
            summary_parts.append(
                "1. Use movement controls to navigate\n"
                "2. Press Space to perform main actions\n"
                "3. Use Shift for special abilities\n"
                "4. Follow on-screen prompts during gameplay"
            )

        return "\n".join(summary_parts)

    def _conversational_planning(self, genre: str, num_players: int) -> dict:
        """
        Enhanced conversational planning with multiple rounds of discussion
        """
        # Calculate number of AI-controlled agents
        num_ai_agents = max(0, num_players - 1)

        # Update initial prompt to be explicit about single player + AI agents
        initial_prompt = f"""Let's create an innovative single-player **{genre}** game with {num_ai_agents} AI-controlled agents.

Game Structure:
- One player-controlled character using these controls:
  - {self.actions}
- {num_ai_agents} computer-controlled agents that interact with the player
- Each AI agent should have its own behavior and purpose

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

        print(f"\n{GREEN}[Generator - Initial Proposal (Round 1)]{RESET}")
        current_proposal = self._call_model_api(
            initial_prompt, self.generator_system_prompt
        )
        print(f"{YELLOW}{current_proposal}{RESET}")

        final_proposal = current_proposal
        improvements_history = []

        # Multiple rounds of discussion
        for round_num in range(self.max_discussion_rounds):
            # Update commenter prompt
            commenter_prompt = f"""Review this game proposal:
{current_proposal}

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

            print(f"\n{GREEN}[Commenter - Feedback (Round {round_num + 1})]{RESET}")
            commenter_response = self._call_model_api(
                commenter_prompt, self.commenter_system_prompt
            )
            print(f"{YELLOW}{commenter_response}{RESET}")

            improvements_history.append(commenter_response)

            # Update refinement prompt to explicitly request formatted description and instructions
            refinement_prompt = f"""Consider this feedback on your game proposal:
{commenter_response}

Please provide an improved version that emphasizes innovation and includes:
1. Game title (keep it catchy and relevant)
2. Game description: A clear, concise summary of the game concept and unique features
3. Instructions: Step-by-step guide on how to play the game, including:
   - Basic controls and what they do
   - Main objectives
   - Special mechanics or features
   - Scoring system (if applicable)
4. Novel mechanics and unique interactions
5. Creative win/lose conditions
6. Innovative progression system
7. Unexpected visual elements

Format your response with clear sections:
Title: [Game Title]
Description: [2-3 sentences describing the game]
Instructions: [Clear steps for playing]
[Rest of the game details]"""

            print(f"\n{GREEN}[Generator - Refinement (Round {round_num + 1})]{RESET}")
            current_proposal = self._call_model_api(
                refinement_prompt, self.generator_system_prompt
            )
            print(f"{YELLOW}{current_proposal}{RESET}")

            final_proposal = current_proposal

        # Extract final details
        title_match = re.search(
            r"title:?\s*(.*?)(?:\n|$)", final_proposal, re.IGNORECASE
        )
        description_match = re.search(
            r"description:?\s*(.*?)(?:\n|$)", final_proposal, re.IGNORECASE
        )
        instructions_match = re.search(
            r"instructions:?\s*(.*?)(?:\n|$)", final_proposal, re.IGNORECASE
        )

        # Fix the string formatting in the return statement
        discussion_history = "\n".join(
            f"Round {i+1} Feedback:\n{feedback}"
            for i, feedback in enumerate(improvements_history)
        )

        return {
            "title": title_match.group(1).strip() if title_match else None,
            "description": (
                description_match.group(1).strip() if description_match else None
            ),
            "instructions": (
                instructions_match.group(1).strip() if instructions_match else None
            ),
            "full_plan": {
                "initial_proposal": current_proposal,
                "discussion_history": discussion_history,
                "final_proposal": final_proposal,
            },
        }

    def _create_code_gen_prompt(self, plan: dict, genre: str, num_players: int) -> str:
        """
        Create the code generation prompt based on the game plan and base configuration
        """
        # Get HTML template from config
        html_template = self.config.get("templates", {}).get("html", "")

        # Get p5.js URL from config
        p5js_url = (
            self.config.get("requirements", {})
            .get("allowed_libraries", {})
            .get("p5.js", "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js")
        )

        # Get control scheme from config
        controls = self.config.get("constraints", {}).get("controls", [])
        control_info = "Controls available:\n"
        for control in controls:
            if isinstance(control, dict):
                for key, value in control.items():
                    if key == "arrow_keys":
                        control_info += f"- Arrow keys (LEFT: {value['left']}, UP: {value['up']}, RIGHT: {value['right']}, DOWN: {value['down']})\n"
                    elif key == "wasd_keys":
                        control_info += f"- WASD keys (W: {value['w']}, A: {value['a']}, S: {value['s']}, D: {value['d']})\n"
            else:
                if control == "space_bar":
                    control_info += "- Space bar (keyCode 32)\n"
                elif control == "shift_key":
                    control_info += "- Shift key (keyCode 16)\n"

        # Get library requirements
        libraries = self.config.get("requirements", {}).get("allowed_libraries", {})
        library_info = "Required libraries:\n"
        for lib, url in libraries.items():
            library_info += f"- {lib}: {url}\n"

        # Default HTML template if none provided in config
        default_html = """<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <style>
      body {{
        margin: 0;
        padding: 20px 0 0 0;
        overflow: hidden;
        background: #222;
        color: #fff;
        font-family: sans-serif;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }}
      canvas {{
        width: 800px !important;
        height: 600px !important;
        display: block;
      }}
    </style>
  </head>
  <body>
    <!-- Load the p5.js library from CDN -->
    <script src="{p5js_url}"></script>
    <!-- Load game code -->
    <script src="game.js"></script>
  </body>
</html>"""

        # Format the HTML template with title and p5.js URL
        formatted_html = (
            html_template.format(title=plan.get("title", "Game"), p5js_url=p5js_url)
            if html_template
            else default_html.format(title=plan.get("title", "Game"), p5js_url=p5js_url)
        )

        # Update key mappings to be more implementation-focused
        key_mappings = """
IMPLEMENTATION NOTES (Keep these technical details in comments only, not visible to players):
Key handling must use these exact values:
1. Arrow keys (keyCode) or WASD keys (key.toLowerCase()):
   LEFT_ARROW (37), UP_ARROW (38), RIGHT_ARROW (39), DOWN_ARROW (40)
   'w', 'a', 's', 'd'
3. Special keys (keyCode):
   SHIFT, SPACE
4. You could choose to use all of the keys or SOME of them.

Required key handling structure:
```javascript
function keyPressed() {
  if (gameState === "start") {
    // Start game with any valid key
    gameState = "playing";
    initGame();
    return;
  }
  
  if (gameState === "playing") {
    // Handle movement keys with proper state tracking
    switch(keyCode) {
      case LEFT_ARROW: playerKeys.left = true; break;
      case 'w': playerKeys.left = true; break;
      case RIGHT_ARROW: playerKeys.right = true; break;
      case 'd': playerKeys.right = true; break;
      // ... other keys
    }
    
    // Handle special actions
    if (keyCode === SPACE) {
      // Special action logic
    }
  }
}

function keyReleased() {
  if (gameState === "playing") {
    // Reset key states when released
    switch(keyCode) {
      case LEFT_ARROW: playerKeys.left = false; break;
      // ... other keys
    }
  }
}
```

CRITICAL REQUIREMENTS:
1. Key Handling:
   - Track key states for smooth movement (pressed/released)
   - Handle multiple simultaneous key presses
   - Prevent key actions in wrong game states
   - Use exact key values as specified above

2. Player-Facing Instructions:
   - Show only user-friendly control descriptions
   - NO technical details or key codes in visible text
   - Example: "Arrow Keys: Move" (not "Arrow Keys (37,38,39,40)")
   - Clear, concise action descriptions

3. Game State Management:
   - Maintain proper game states (start, playing, gameover)
   - Only process relevant keys in each state
   - Ensure smooth state transitions

4. Movement Implementation:
   - Responsive, smooth character movement
   - Proper boundary checking
   - Consistent movement speed
   - No input lag or stuttering

5. Testing Requirements:
   - Test all control combinations
   - Verify smooth movement in all directions
   - Check state transitions
   - Ensure no key conflicts"""

        return f"""Generate a p5.js game based on the following detailed plan:

{plan['full_plan']['final_proposal']}

---------------------------------------------------
Here are the requirements for the game code implementation:

You should follow the example html here:
{formatted_html}

Here are the key mappings for the game code implementation:
{key_mappings}

Technical Requirements:
- The game must be playable on a basic HTML webpage
- Include start screen with:
  * Game title: "{plan.get('title', 'Game')}"
  * User-friendly control instructions
  * Clear gameplay objectives
- Include game over screen with win/lose message
- No audio should be used
- The game should be visually appealing

Game Features:
- Start screen: {self.config.get('constraints', {}).get('features', {}).get('require_start_screen', True)}
- Game over screen: {self.config.get('constraints', {}).get('features', {}).get('require_game_over_screen', True)}
- Score display: {self.config.get('constraints', {}).get('features', {}).get('require_score_display', True)}

Quality Control Checklist:
✓ Smooth, responsive controls
✓ Clear, non-technical instructions
✓ Proper game state management
✓ Tested all key combinations
✓ No visible key codes in game text
✓ Consistent movement behavior
✓ Proper collision detection
✓ Working state transitions

Please provide your code in two markdown code blocks with specific language tags:

1. First block should be HTML code with ```html tag
2. Second block should be JavaScript code with ```javascript tag"""

    def _call_model_api(self, prompt: str, system_prompt: str = None) -> str:
        """
        Enhanced model API call that includes system prompts

        Args:
            prompt: The prompt to send to the model
            system_prompt: Optional system prompt to set agent role
        """
        # Print the prompts
        if system_prompt:
            print(f"\n{GREEN}System Prompt:{RESET}\n{system_prompt}")
        print(f"\n{GREEN}User Prompt:{RESET}\n{prompt}")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Get response from appropriate model
        if self.model_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, max_completion_tokens=8000
            )
            response_text = response.choices[0].message.content

        elif self.model_provider == "claude":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=messages,
            )
            response_text = response.content[0].text

        elif self.model_provider == "gemini":
            model = self.client.GenerativeModel(model_name=self.model)
            response = model.generate_content(messages)
            response_text = response.text

        else:
            raise ValueError(f"Unsupported model provider: {self.model_provider}")

        # Print the model's response
        print(f"\n{YELLOW}Model Response:{RESET}\n{response_text}")

        # Add control scheme reminder to system prompt if it exists
        if system_prompt:
            system_prompt += "\nIMPORTANT: Always use only the specified control scheme: arrow keys, WASD, space bar, and shift key. No other inputs are allowed."

        return response_text

    def _parse_html_js_blocks(self, response_text: str) -> Tuple[str, str]:
        """
        Extract HTML and JavaScript code blocks from the response

        Args:
            response_text: Full response text from the model

        Returns:
            Tuple of (html_code, js_code)
        """
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        html_code = html_match.group(1).strip() if html_match else ""
        js_code = js_match.group(1).strip() if js_match else ""

        return html_code, js_code

    def _parse_code_blocks(self, response_text: str) -> dict:
        """
        Parse the response text to extract HTML and JavaScript code blocks

        Args:
            response_text: Full response text from the model

        Returns:
            dict containing HTML and JavaScript code blocks
        """
        code_blocks = {}
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        if html_match:
            code_blocks["html"] = [html_match.group(1).strip()]
        if js_match:
            code_blocks["javascript"] = [js_match.group(1).strip()]

        return code_blocks

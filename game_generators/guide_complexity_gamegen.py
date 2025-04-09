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


class GuideComplexityGameGen(BaseGameGenerator):
    """
    Simple game generator that uses a single-shot prompt to generate games
    based on the approach in generate_game_singleshot.py
    """

    method_name = "guide_complexity"

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
            "Generate a interesting engaging continual {genre} game with intelligent{num_agents} agents using p5.js. "
            "The game must be playable on a basic HTML webpage.\n"
            "Game details:\n"
            "- Genre: {genre}\n"
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
            genre=genre, num_agents=num_players, actions=actions
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
            "description", f"A {genre} game with {num_players} agents"
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

        # Save description
        with open(game_dir / "description.txt", "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\n\n{description}")
            print(f"Saved description.txt")

        # Save conversation log
        with open(game_dir / "conversation_log.txt", "w", encoding="utf-8") as f:
            f.write(full_response)
            print(f"Saved conversation_log.txt")

        # Save metadata
        metadata = {
            "game_name": title,
            "game_description": description,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": f"{self.model_provider}:{self.model}",
            "genre": genre,
            "num_players": num_players,
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            print(f"Saved metadata.json")

        print(f"\nAll files saved in: {game_dir}")

    def _conversational_planning(self, genre: str, num_players: int) -> dict:
        """
        Conduct a conversation to plan the game design

        Returns:
            dict containing game plan details
        """

        initial_prompt = f"""Hey there! Let's kick off a fun brainstorming session for creating an awesome {genre} game for {num_players} players.
Imagine some cool, unexpected mechanics that could make the game not just engaging, but really fun. 
What unique ideas do you have to shake up the usual {genre} experience?"""

        print(f"\n{GREEN}[Planning Phase - Brainstorm Kickoff]{RESET}")
        print(f"{GREEN}{initial_prompt}{RESET}")
        mechanics_response = self._call_model_api(initial_prompt)
        print(f"{YELLOW}{mechanics_response}{RESET}")

        complexity_prompt = f"""Cool ideas so far:
{mechanics_response}

Now, let's chat more casually—how might we balance these fun twists so the game stays both exciting and easy to pick up?
What surprising interactions or playful challenges could naturally emerge from these ideas?"""

        print(f"\n{GREEN}[Planning Phase - Fun Twists Discussion]{RESET}")
        print(f"{GREEN}{complexity_prompt}{RESET}")
        complexity_response = self._call_model_api(complexity_prompt)
        print(f"{YELLOW}{complexity_response}{RESET}")

        final_prompt = f"""Alright, based on our laid-back brainstorm:
{mechanics_response}
{complexity_response}

Now, let's wrap it up with a final game plan that includes:
1. A catchy, fun title for the game
2. A brief, creative description of what makes the gameplay enjoyable
3. The key mechanics and how they interact in a playful way
4. Conditions that define winning and losing in a fun context
5. How the challenge gradually ramps up to keep players engaged

Share your final, inspiring game plan!"""

        print(f"\n{GREEN}[Planning Phase - Final Brainstorm]{RESET}")
        print(f"{GREEN}{final_prompt}{RESET}")
        final_response = self._call_model_api(final_prompt)
        print(f"{YELLOW}{final_response}{RESET}")

        # Extract plan details from the final response
        title_match = re.search(
            r"title:?\s*(.*?)(?:\n|$)", final_response, re.IGNORECASE
        )
        description_match = re.search(
            r"description:?\s*(.*?)(?:\n|$)", final_response, re.IGNORECASE
        )

        return {
            "title": title_match.group(1).strip() if title_match else None,
            "description": (
                description_match.group(1).strip() if description_match else None
            ),
            "full_plan": final_response,
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

        return f"""Generate a p5.js game based on the following detailed plan:

{plan['full_plan']}

Technical Requirements:
{control_info}
{library_info}
- The game must be playable on a basic HTML webpage
- Include start and game over screens with clear instructions
- No audio should be used
- The game should be visually appealing

Game Features (from configuration):
- Start screen: {self.config.get('constraints', {}).get('features', {}).get('require_start_screen', True)}
- Game over screen: {self.config.get('constraints', {}).get('features', {}).get('require_game_over_screen', True)}
- Score display: {self.config.get('constraints', {}).get('features', {}).get('require_score_display', True)}

Please provide your code in two markdown code blocks with specific language tags:

1. First block should be HTML code with ```html tag:
```html
{formatted_html}
```

2. Second block should be JavaScript code with ```javascript tag:
```javascript
// Game implementation here
```

Make sure each code block is properly formatted with the correct language tag and triple backticks.
The JavaScript code should contain the complete game implementation following the plan and requirements above."""

    def _call_model_api(self, prompt: str) -> str:
        """
        Call the appropriate model API based on the provider

        Args:
            prompt: The prompt to send to the model

        Returns:
            str: The model's response text
        """
        if self.model_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model, messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        elif self.model_provider == "claude":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text

        elif self.model_provider == "gemini":
            model = self.client.GenerativeModel(model_name=self.model)
            response = model.generate_content(prompt)
            return response.text

        else:
            raise ValueError(f"Unsupported model provider: {self.model_provider}")

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

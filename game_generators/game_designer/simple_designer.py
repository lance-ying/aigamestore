from typing import Dict, Any, Optional, Tuple, List, Union
import re
from game_generators.utils import ModelAPI
from game_generators.prompts import (
    GREEN,
    YELLOW,
    RED,
    BLUE,
    RESET,
    CANVAS_SIZE,
    CONTROL_SCHEME,
    FORMAT_HTML_TEMPLATE,
)


class SimpleDesigner:
    """Simple designer that creates game design and code"""

    def __init__(
        self, model_api: ModelAPI = None, system_prompt: str = None, debug: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt
        self.p5js_url = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"
        self.debug = debug

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create game design and implementation

        Args:
            genre: Game genre
            num_players: Number of players
            narratives: Optional narrative constraints

        Returns:
            Dict containing game design and code
        """
        try:
            # Create the prompt
            prompt = self._create_prompt(genre, num_players, narratives)

            if self.debug:
                print(f"\n{GREEN}Generated prompt:{RESET}\n{prompt}")

            # Get response from model
            response = self.model_api.call(
                user_prompt=prompt,
                system_prompt=self.system_prompt,
                debug=self.debug,
            )

            # Extract title
            title = self._extract_title(response)
            if self.debug:
                print(f"\n{BLUE}Extracted title:{RESET} {title}")

            # Extract description
            description = self._extract_description(response)
            if self.debug:
                print(f"\n{BLUE}Extracted description:{RESET}\n{description}")

            # Extract guidance
            guidance = self._extract_guidance(response)
            if self.debug:
                print(f"\n{BLUE}Extracted guidance:{RESET}\n{guidance}")

            # Extract code blocks
            js_code = self._extract_code_block(response, "javascript")
            html_code = self._extract_code_block(response, "html") or ""

            # If HTML is empty or doesn't contain proper script tags, create it
            if not html_code or "<script src=" not in html_code:
                if isinstance(js_code, dict):
                    js_includes = "\n    ".join(
                        f'<script src="{filename}"></script>'
                        for filename in js_code.keys()
                    )
                else:
                    js_includes = '<script src="game.js"></script>'

                html_code = FORMAT_HTML_TEMPLATE.format(
                    title=title, p5js_url=self.p5js_url, js_includes=js_includes
                )

            if self.debug:
                print(f"\n{BLUE}Extracted JavaScript code:{RESET}")
                if isinstance(js_code, dict):
                    for filename, code in js_code.items():
                        print(f"\n{YELLOW}{filename}:{RESET}\n{code}")
                else:
                    print(f"\n{YELLOW}game.js:{RESET}\n{js_code}")
                print(f"\n{BLUE}Extracted HTML code:{RESET}\n{html_code}")

            # Convert js_code to proper format
            if isinstance(js_code, dict):
                js_files = [(filename, code) for filename, code in js_code.items()]
            else:
                js_files = [("game.js", js_code or "")]

            return {
                "title": title,
                "description": description,
                "game_design_text": description,
                "game_guidance": guidance,
                "html_code": html_code,
                "js_files": js_files,
                "full_response": response,
            }

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _create_prompt(
        self, genre: str, num_players: int, narratives: Optional[str] = None
    ) -> str:
        """Create the complete prompt for game design and code generation"""
        # Create HTML example with proper script tags
        html_example = FORMAT_HTML_TEMPLATE.format(
            title="{title}", p5js_url=self.p5js_url  # Keep as template placeholder
        )

        prompt = f"""Create a complete p5.js game based on these requirements:

Game Specifications:
1. Genre: {genre}
2. Players: {num_players} total ({num_players-1} AI agents + 1 human player)
3. Narrative: {narratives if narratives else 'Create an engaging storyline'}

Technical Specifications:
1. Canvas Size: {CANVAS_SIZE['width']}x{CANVAS_SIZE['height']} pixels
2. Controls: Arrow keys or WASD for movement, SPACE for actions
3. Required Elements:
- Start screen with instructions
- Main gameplay
- Game over condition
- Basic score or progress tracking

Please provide your response in the following format:
1. First, provide a GAME TITLE: <your title>

2. Then, provide a ```description block with the game concept and mechanics

3. Then, provide a ```guidance block with game instructions that will show on the start screen.
   Make it engaging and fun but informative! Include:
   - A catchy welcome message
   - The mission/objective of the game
   - Clear control instructions (keys and what they do)
   Format it in a way that's easy to read on the start screen!

4. Finally, provide the implementation in two code blocks:
   - ```html block for index.html
   - ```javascript block for game.js, you should use Entity-Component-System (ECS) pattern for the code and follow the naming convention for xxxEntity, xxxComponent, xxxSystem.

HTML structure and some pre-defined code:
```html
{html_example}
```
"""
        return prompt

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        patterns = [
            r"GAME TITLE:\s*(.*?)(?:\n|$)",
            r"title:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return "Untitled Game"

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        pattern = r"```description\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text  # Return full text if no description block found

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance/instructions from text"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "No guidance provided."  # Default if not found

    def _extract_code_block(
        self, text: str, language: str
    ) -> Union[str, Dict[str, str]]:
        """Extract code blocks from text"""
        if language == "javascript":
            # First try to find named JavaScript files
            js_files = {}
            pattern = rf"```javascript:([\w.]+)\s*(.*?)```"
            matches = re.finditer(pattern, text, re.DOTALL)

            for match in matches:
                filename = match.group(1)
                code = match.group(2).strip()
                # Remove filename if it appears at the start of the code
                if code.startswith(f":{filename}"):
                    code = code[len(filename) + 1 :].strip()
                js_files[filename] = code

            if js_files:
                return js_files

            # If no named files found, look for generic javascript block
            pattern = rf"```javascript\s*(.*?)```"
            match = re.search(pattern, text, re.DOTALL)
            if match:
                code = match.group(1).strip()
                # If code starts with ":game.js" or similar, remove it
                if code.startswith(":"):
                    code = code.split("\n", 1)[1].strip()
                return code

            return ""

        else:
            # For HTML, just extract the content
            pattern = rf"```{language}\s*(.*?)```"
            match = re.search(pattern, text, re.DOTALL)
            return match.group(1).strip() if match else ""

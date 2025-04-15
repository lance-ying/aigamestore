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
    FORMAT_HTML_TEMPLATE,
    CODE_GENERATION_SYSTEM_PROMPT,
)
import os


class InstructionSimpleDesigner:
    """Simple designer that creates game design and code"""

    def __init__(
        self, model_api: ModelAPI = None, system_prompt: str = None, debug: bool = False
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt or CODE_GENERATION_SYSTEM_PROMPT
        self.p5js_url = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"
        self.debug = debug

    def design_game(
        self,
        narrative: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create game design and implementation with debugging steps
        """
        try:
            # Generate initial game design
            prompt = self._create_prompt(narrative)
            if self.debug:
                print(f"\n{GREEN}Generated prompt:{RESET}\n{prompt}")

            response = self.model_api.call(
                user_prompt=prompt,
                system_prompt=self.system_prompt,
                debug=self.debug,
            )

            # Extract initial components
            title = self._extract_title(response)
            js_code = self._extract_code_block(response, "javascript")
            html_code = self._extract_code_block(response, "html") or ""

            # Convert js_code to proper format and ensure directories exist
            if isinstance(js_code, dict):
                js_files = []
                for filename, code in js_code.items():
                    js_files.append((filename, code))
            else:
                js_files = [("game.js", js_code or "")]

            return {"title": title, "html_code": html_code, "js_files": js_files}

        except Exception as e:
            if self.debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _create_prompt(self, narratives: Optional[str] = None) -> str:
        """Create the complete prompt for game design and code generation"""

        p5js_guidelines = """* Don't use any external assets.
* Include a index.html to run the game (don't include anything in the index.html file except for the game).
* Use ES6 modules (import/export) for all JavaScript files - do not use Node.js require() statements.
* Use p5.js in instance mode. When using ES6 modules, access p5 from the global scope with `const p5 = window.p5;` rather than trying to import it directly.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Make sure the game has a clear goal and win state.
* Implement professional-looking and polished graphics. Careful with flickering.
* Start screen: Start the game with clear instructions on how to play (the player has to press Enter to start the game)
* [IMPORTANT] The game must be fully functional and error-free!
"""

        description = f"""Game Specifications:
{narratives if narratives else 'Not specified, you should create an engaging storyline first.'}"""

        prompt = f"""TASK: Implement a game in p5.js based on the following description:
<description>
{description}
</description>

<p5js_guidelines>
{p5js_guidelines}
</p5js_guidelines>

Here is a template for the HTML code:
{FORMAT_HTML_TEMPLATE.format(title='YOUR_GAME_TITLE', p5js_url=self.p5js_url)}

---------------------------------------------------------
REQUIREMENT: You should output things in the following format:
<game_title>
... (game title)
</game_title>

For each file, you should output the following:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

Output HTML as the last file:
<code filename="index.html">
... (html code)
</code>
"""
        return prompt

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fallback patterns if new format not found
        fallback_patterns = [
            r"GAME TITLE:\s*(.*?)(?:\n|$)",
            r"title:\s*(.*?)(?:\n|$)",
            r"<title>(.*?)</title>",
        ]

        for pattern in fallback_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return "Untitled Game"

    def _extract_code_block(
        self, text: str, language: str
    ) -> Union[str, Dict[str, str]]:
        """Extract code blocks from text, supporting folder structures in filenames"""
        # Extract code blocks and save in respective files
        code_blocks = re.findall(
            r"<code filename=\"(.*?)\">(.*?)</code>", text, re.DOTALL
        )

        if language == "javascript":
            js_files = {}
            for filename, code in code_blocks:
                if filename.endswith(".js"):
                    # Clean up code block markers
                    code = re.sub("```(python|javascript|html|xml)?", "", code)
                    # Normalize path separators to use forward slashes
                    normalized_filename = filename.replace("\\", "/")
                    js_files[normalized_filename] = code.strip()

            # If no JS files found, create a default game.js
            if not js_files:
                if self.debug:
                    print(
                        f"{YELLOW}Warning: No JS files found, creating default game.js{RESET}"
                    )
                js_files["game.js"] = "// Default game.js - Generated empty file\n"

            return js_files
        else:
            # For HTML, find the first HTML file
            for filename, code in code_blocks:
                if filename.endswith(".html"):
                    code = re.sub("```(python|javascript|html|xml)?", "", code)
                    return code.strip()
            return ""

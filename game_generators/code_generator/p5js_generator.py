from typing import Tuple, List, Dict, Any, Union
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import (
    CODE_GENERATION_SYSTEM_PROMPT,
    FORMAT_HTML_TEMPLATE,
    CANVAS_SIZE,
)


class P5JSGenerator:
    """Generate p5.js code for a game"""

    def __init__(
        self,
        model_api: ModelAPI,
        system_prompt: str = CODE_GENERATION_SYSTEM_PROMPT,
        verbose: bool = False,
    ):
        self.model_api = model_api
        self.system_prompt = system_prompt
        self.p5js_url = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"
        self.verbose = verbose

    def _create_user_prompt(self, title: str, game_concept: str) -> str:
        """Create the user prompt for code generation"""
        return f"""
---------------------------------------------------------
TASK: Implement a game in p5.js based on the following description:

<game_title>
{title}
</game_title>

<description>
{game_concept}
</description>

<p5js_guidelines>
* Don't use any external assets.
* Include a index.html to run the game (don't include anything in the index.html file except for the game).
* Use ES6 modules (import/export) for all JavaScript files - do not use Node.js require() statements.
* Use p5.js in instance mode. When using ES6 modules, access p5 from the global scope with `const p5 = window.p5;` rather than trying to import it directly.
* Use a finite state machine for the player character.
* Make sure the player's controls and parameters are coherent with the gameplay and physics.
* Make sure the game has a clear goal and win state.
* Implement professional-looking and polished graphics. Careful with flickering.
* Start screen: Start the game with clear instructions on how to play (the player has to press Enter to start the game)
* [IMPORTANT] The game must be fully functional and error-free!
</p5js_guidelines>

Here is a template for the HTML code:
{FORMAT_HTML_TEMPLATE.format(title='YOUR_GAME_TITLE', p5js_url=self.p5js_url)}

---------------------------------------------------------
REQUIREMENT: 
<game_title>
... (Create a title if it hasn't been specified)
</game_title>

<game_instructions>
... (Create interesting and clear instructions for the game: how to play, what to do, etc.)
</game_instructions>

For each file, you should output the following:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

Output HTML as the last file:
<code filename="index.html">
... (html code)
</code>
"""

    def _extract_code_block(
        self, text: str, language: str
    ) -> Union[str, Dict[str, str]]:
        """Extract code blocks from text"""
        # Extract all code blocks first
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
                if self.verbose:
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

    def _extract_game_instructions(self, text: str) -> str:
        """Extract the game instructions from the text"""
        pattern = r"<game_instructions>\s*(.*?)\s*</game_instructions>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def generate_code(
        self, design: Dict[str, Any]
    ) -> Tuple[str, List[Tuple[str, str]]]:
        """Generate complete game code from design"""
        try:
            if self.verbose:
                print(f"\n{BLUE}Starting code generation...{RESET}")

            title = design.get("title", "NOT SPECIFIED!")
            # Extract game concept from design
            game_concept = design.get("game_design_text")
            if not game_concept:
                raise ValueError("Design must include 'game_design_text'")

            # Generate game code
            user_prompt = self._create_user_prompt(title, game_concept)
            response = self.model_api.call(
                user_prompt=user_prompt,
                system_prompt=self.system_prompt,
                verbose=self.verbose,
            )

            # Extract code blocks
            js_code = self._extract_code_block(response, "javascript")
            html_code = self._extract_code_block(response, "html") or ""
            game_instructions = self._extract_game_instructions(response)

            # Format HTML if needed
            if not html_code or "<script src=" not in html_code:
                if isinstance(js_code, dict):
                    js_includes = '<script type="module" src="game.js"></script>'
                else:
                    js_includes = '<script type="module" src="game.js"></script>'

                html_code = FORMAT_HTML_TEMPLATE.format(
                    title=design.get("title", "Game"),
                    p5js_url=self.p5js_url,
                    js_includes=js_includes,
                )

            # Convert js_code to proper format
            if isinstance(js_code, dict):
                js_files = [(filename, code) for filename, code in js_code.items()]
            else:
                js_files = [("game.js", js_code or "")]

            if title == "NOT SPECIFIED!":
                title = self._extract_title(response)

            return html_code, js_files, title, game_instructions

        except Exception as e:
            if self.verbose:
                print(f"\n{RED}Error in code generation:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _extract_title(self, text: str) -> str:
        """Extract the title from the text"""
        pattern = r"<game_title>\s*(.*?)\s*</game_title>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "Untitled Game"

    def _validate_js_code(self, js_files: Dict[str, str]) -> Dict[str, str]:
        """Validate JavaScript code files"""
        if self.verbose:
            print(f"\n{BLUE}Validating JavaScript code...{RESET}")

        try:
            validated_files = {}

            for filename, code in js_files.items():
                if self.verbose:
                    print(f"\n{BLUE}Validating {filename}:{RESET}")

                # Basic validation - ensure code is not empty
                if not code.strip():
                    if self.verbose:
                        print(f"{YELLOW}Empty code in {filename}, skipping{RESET}")
                    continue

                # Check for required functions in game.js only
                if filename == "game.js":
                    required_functions = ["setup", "draw"]
                    missing = [
                        func
                        for func in required_functions
                        if f"function {func}" not in code
                    ]

                    if missing and self.verbose:
                        print(
                            f"{YELLOW}Warning: Missing required functions in game.js: {', '.join(missing)}{RESET}"
                        )

                validated_files[filename] = code

            if self.verbose:
                print(f"{GREEN}JavaScript validation complete{RESET}")

            return validated_files

        except Exception as e:
            if self.verbose:
                print(f"{RED}Error in JavaScript validation: {str(e)}{RESET}")
            raise

    def _validate_html_code(self, code: str, title: str) -> str:
        """Validate and clean up HTML code"""
        if self.verbose:
            print(f"\n{BLUE}HTML validation:{RESET}")
            print(f"Input code length: {len(code)}")

        try:
            # If code doesn't match our template structure, use template
            if not ("<html" in code and "<canvas" in code):
                if self.verbose:
                    print(f"{YELLOW}Invalid HTML structure, using template{RESET}")

                # Create script tags for all JS files
                js_includes = "\n".join(
                    [
                        f'    <script src="{js_file}"></script>'
                        for js_file in ["game.js", "player.js", "enemies.js"]
                        if js_file in code
                    ]
                )

                # If no JS files found, include at least game.js
                if not js_includes:
                    js_includes = '    <script src="game.js"></script>'

                return FORMAT_HTML_TEMPLATE.format(
                    title=title, p5js_url=self.p5js_url, js_includes=js_includes
                )

            # Ensure canvas size is correct
            code = re.sub(
                r"createCanvas\(\d+,\s*\d+\)",
                f"createCanvas({CANVAS_SIZE['width']}, {CANVAS_SIZE['height']})",
                code,
            )

            # Ensure p5.js is included
            if self.p5js_url not in code:
                insert_point = code.find("</head>")
                if insert_point != -1:
                    code = (
                        code[:insert_point]
                        + f'\n<script src="{self.p5js_url}"></script>\n'
                        + code[insert_point:]
                    )

            # Ensure game.js is included
            if "game.js" not in code:
                insert_point = code.find("</body>")
                if insert_point != -1:
                    code = (
                        code[:insert_point]
                        + '\n<script src="game.js"></script>\n'
                        + code[insert_point:]
                    )

            if self.verbose:
                print(f"{GREEN}HTML validation complete{RESET}")

            return code

        except Exception as e:
            if self.verbose:
                print(f"{RED}Error in HTML validation: {str(e)}{RESET}")
                print("HTML code that caused error:")
                print(code)
            raise

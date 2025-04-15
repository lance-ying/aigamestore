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
    CODE_GENERATION_SYSTEM_PROMPT,
)
import os


class SimpleDesigner:
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
        narratives: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create game design and implementation with debugging steps
        """
        try:
            # Generate initial game design
            prompt = self._create_prompt(narratives)
            if self.debug:
                print(f"\n{GREEN}Generated prompt:{RESET}\n{prompt}")

            response = self.model_api.call(
                user_prompt=prompt,
                system_prompt=self.system_prompt,
                debug=self.debug,
            )

            # Extract initial components
            title = self._extract_title(response)
            description = self._extract_description(response)
            guidance = self._extract_guidance(response)
            js_code = self._extract_code_block(response, "javascript")
            html_code = self._extract_code_block(response, "html") or ""

            # Format HTML if needed
            if not html_code or "<script src=" not in html_code:
                if isinstance(js_code, dict):
                    # Group files by directory for better organization in HTML
                    js_files_by_dir = {}
                    for filename in js_code.keys():
                        dir_path = os.path.dirname(filename)
                        if dir_path not in js_files_by_dir:
                            js_files_by_dir[dir_path] = []
                        js_files_by_dir[dir_path].append(filename)

                    # Create script tags grouped by directory
                    js_includes_parts = []
                    for dir_path, files in sorted(js_files_by_dir.items()):
                        if dir_path:
                            js_includes_parts.append(f"\n    <!-- {dir_path}/ -->")
                        for filename in sorted(files):
                            js_includes_parts.append(
                                f'    <script type="module" src="{filename}"></script>'
                            )
                    js_includes = "\n".join(js_includes_parts)
                else:
                    js_includes = '<script type="module" src="game.js"></script>'

                html_code = FORMAT_HTML_TEMPLATE.format(
                    title=title, p5js_url=self.p5js_url, js_includes=js_includes
                )

            # Convert js_code to proper format and ensure directories exist
            if isinstance(js_code, dict):
                js_files = []
                for filename, code in js_code.items():
                    # Create directory if it doesn't exist
                    dir_path = os.path.dirname(filename)
                    if dir_path:
                        try:
                            os.makedirs(dir_path, exist_ok=True)
                            if self.debug:
                                print(f"{GREEN}Created directory: {dir_path}{RESET}")
                        except Exception as e:
                            if self.debug:
                                print(
                                    f"{YELLOW}Warning: Could not create directory {dir_path}: {e}{RESET}"
                                )
                    js_files.append((filename, code))
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

    def _create_prompt(self, narratives: Optional[str] = None) -> str:
        """Create the complete prompt for game design and code generation"""

        p5js_guidelines = """* Don't use any external assets.
        * Include a index.html to run the game.
        * Use p5.js in instance mode.
        * Follow strict Entity-Component-System (ECS) architecture.
        * Implement all required entities, components and systems.
        * Make sure the game has clear goals and win conditions.
        * Start with instructions screen (press Enter to start).
        * Design for single-player gameplay.
        * Ensure smooth performance and polished graphics."""

        description = f"""Game Specifications:
        {narratives if narratives else 'Not specified, you should create an engaging storyline first'}"""

        prompt = f"""TASK: Implement a game in p5.js based on the following description:
    <description>
    {description}
    </description>

    <p5js_guidelines>
    {p5js_guidelines}
    </p5js_guidelines>

    Here is a template for the HTML code:
    <template_html_code>
    "{FORMAT_HTML_TEMPLATE}"
    </template_html_code>

    REQUIREMENT:
    You should output things in the following format:
    <game_title>
    ... (game title)
    </game_title>

    <game_description>
    ... (game description)
    </game_description>

    <game_guidance>
    ... (game guidance to display on the start screen, keep it short, fun and engaging)
    </game_guidance>

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

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        pattern = r"<game_description>\s*(.*?)\s*</game_description>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fallback to old format if new format not found
        fallback_pattern = r"```description\s*(.*?)```"
        match = re.search(fallback_pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        return "No description provided."

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance/instructions from text"""
        pattern = r"<game_guidance>\s*(.*?)\s*</game_guidance>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        # Fallback to old format if new format not found
        fallback_pattern = r"```guidance\s*(.*?)```"
        match = re.search(fallback_pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

        return "No guidance provided."

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

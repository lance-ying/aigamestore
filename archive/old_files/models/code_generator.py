from pathlib import Path
import os
import re
import json
from typing import Dict, Any, Tuple, Optional, List
from dataclasses import dataclass
from datetime import datetime


@dataclass
class GameConfig:
    """Game configuration data class"""

    genre: str
    num_players: int
    model_name: str

    @property
    def model_id(self) -> str:
        """Get the actual model ID for API calls"""
        MODEL_MAPPING = {
            "o3-mini": "o3-mini",
            "gpt-4o": "gpt-4o",
            "claude-3.7": "claude-3-7-sonnet-20250219",
            "gemini-2.0": "gemini-2.0-flash-exp",
            # "deepseek-r1": "deepseek-coder-r1-distilled",  # Added support
        }
        return MODEL_MAPPING.get(self.model_name, self.model_name)


class CodeGenerator:
    """Game code generator that supports multiple AI models"""

    VALID_GENRES = [
        "action",
        "arcade",
        "platformer",
        "sports",
        "stealth",
        "strategy",
        "puzzle",
        "shooting",
        "racing",
        "adventure",
    ]

    def __init__(self, config: GameConfig):
        self.config = config
        self._init_client()

    def _init_client(self):
        """Initialize API clients for different models"""
        if self.config.model_name.startswith(("gpt", "o3")):
            try:
                from openai import OpenAI

                if not os.environ.get("OPENAI_API_KEY"):
                    raise RuntimeError("OPENAI_API_KEY environment variable is not set")
                self.client = OpenAI()
            except ImportError:
                raise RuntimeError("OpenAI Python package is not installed")

        elif self.config.model_name.startswith("claude"):
            try:
                from anthropic import Anthropic

                if not os.environ.get("ANTHROPIC_API_KEY"):
                    raise RuntimeError(
                        "ANTHROPIC_API_KEY environment variable is not set"
                    )
                self.client = Anthropic()
            except ImportError:
                raise RuntimeError("Anthropic Python package is not installed")

        elif self.config.model_name.startswith("gemini"):
            try:
                import google.generativeai as genai

                if not os.environ.get("GOOGLE_API_KEY"):
                    raise RuntimeError("GOOGLE_API_KEY environment variable is not set")
                genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
                self.client = genai
            except ImportError:
                raise RuntimeError(
                    "Google GenerativeAI Python package is not installed"
                )
        else:
            raise ValueError(f"Unsupported model: {self.config.model_name}")

    def generate_prompt(self) -> str:
        """Generate the game creation prompt"""
        return (
            f"Generate an interesting and fun {self.config.genre} game with {self.config.num_players} characters. "
            "One character will be controlled by a human player and the rest will be controlled by AI.\n"
            "First, write the description of the game that is fun and engaging. You should label the description with ```description and ```.\n"
            "Requirements:\n"
            "- The game must be playable in a web browser using JavaScript key codes for controls: \n"
            "  * Arrow keys (keyCode 37/38/39/40 for LEFT/UP/RIGHT/DOWN) \n"
            "  * Space bar (key === ' ') \n"
            "  * Shift key (keyCode === SHIFT or keyCode === 16) \n"
            "  * WASD keys (key === 'w'/'a'/'s'/'d' or key === 'W'/'A'/'S'/'D') \n"
            "- No audio should be used in the game.\n"
            "- You can use any JavaScript library (like p5.js [https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js]) for the game.\n"
            "- Ensure that the game code has correctly implemented game mechanics to the game description.\n"
            "- There should be a start screen with instructions and a game over screen with the score.\n"
            "- Please provide a creative title for your game at the beginning, prefixed with 'GAME TITLE: '.\n"
            "- Ensure proper key event handling with correct JavaScript key codes.\n"
            "Then, generate the game code as two markdown blocks (the JavaScript code is later stored in game.js):\n"
            "1. ```html for the HTML code\n"
            "2. ```javascript for the JavaScript code\n"
        )

    def generate_game(self) -> Tuple[str, str, str, str]:
        """
        Generate game code using the specified model
        Returns: Tuple of (html_code, js_code, game_title, full_response)
        """
        prompt = self.generate_prompt()

        if self.config.model_name.startswith(("gpt", "o3")):
            response = self.client.chat.completions.create(
                model=self.config.model_id,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.choices[0].message.content

        elif self.config.model_name.startswith("claude"):
            response = self.client.messages.create(
                model=self.config.model_id,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text

        elif self.config.model_name.startswith("gemini"):
            model = self.client.GenerativeModel(self.config.model_id)
            response = model.generate_content(prompt)
            response_text = response.text

        html_code, js_code, description = self._parse_code_blocks(response_text)
        game_title = self._extract_game_title(response_text)

        if not html_code:
            raise ValueError("Failed to generate valid HTML code")

        return html_code, js_code, game_title, description, response_text

    def _parse_code_blocks(
        self, response_text: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """Extract HTML and JavaScript code blocks from the response"""
        description_match = re.search(
            r"```description\s*(.*?)```", response_text, re.DOTALL
        )
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        description = description_match.group(1).strip() if description_match else None
        html_code = html_match.group(1).strip() if html_match else None
        js_code = js_match.group(1).strip() if js_match else None

        if html_code and not js_code and "<script" in html_code:
            return html_code, None

        return html_code, js_code, description

    def _extract_game_title(self, response_text: str) -> str:
        """Extract game title from the response text"""
        title_match = re.search(
            r"GAME TITLE:\s*(.*?)(?:\n|$)", response_text, re.IGNORECASE
        )
        if title_match:
            return title_match.group(1).strip()

        html_match = re.search(r"<title>(.*?)</title>", response_text, re.IGNORECASE)
        if html_match:
            return html_match.group(1).strip()

        return "Untitled Game"

    def create_game_folder(self, base_dir: Path) -> Tuple[Path, int]:
        """
        Create a new game folder under 'games/MODEL_NAME/GENRE/game_{i}'

        Args:
            model_name: Name of the model used
            genre: Game genre

        Returns:
            Tuple of (folder_path, game_index)
        """
        base_path = base_dir / self.config.model_name / self.config.genre
        base_path.mkdir(parents=True, exist_ok=True)

        # Find the next game index
        existing_folders = [
            d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("game_")
        ]
        next_index = 1

        if existing_folders:
            indices = [
                int(f.name.split("_")[1])
                for f in existing_folders
                if f.name.split("_")[1].isdigit()
            ]
            if indices:
                next_index = max(indices) + 1

        game_folder = base_path / f"game_{next_index}"
        game_folder.mkdir(exist_ok=True)

        return game_folder, next_index

    def save_game(
        self,
        html_code: str,
        js_code: str,
        game_title: str,
        description: str,
        full_response: str,
        base_dir: Path,
    ) -> Tuple[str, int]:
        """
        Save generated game files and metadata following the folder structure:
        games/MODEL_NAME/GENRE/game_{i}/

        Args:
            html_code: Generated HTML code
            js_code: Generated JavaScript code
            config: Game configuration
            game_title: Title of the game

        Returns:
            Tuple of (game_folder_path, game_index)
        """
        try:
            game_folder, game_index = self.create_game_folder(base_dir)

            if js_code and "game.js" not in html_code:
                html_code = html_code.replace(
                    "</body>", '<script src="game.js"></script>\n</body>'
                )
            with open(game_folder / "index.html", "w", encoding="utf-8") as f:
                f.write(html_code)

            if js_code:
                with open(game_folder / "game.js", "w", encoding="utf-8") as f:
                    f.write(js_code)

            with open(game_folder / "full_response.txt", "w", encoding="utf-8") as f:
                f.write(full_response)

            with open(game_folder / "description.txt", "w", encoding="utf-8") as f:
                f.write(description)

            metadata = {
                "genre": self.config.genre,
                "num_players": self.config.num_players,
                "model_name": self.config.model_name,
                "game_title": game_title,
                "game_description": description,
                "game_index": game_index,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            with open(game_folder / "metadata.json", "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)

            return str(game_folder), game_index

        except Exception as e:
            raise RuntimeError(f"Failed to save game files: {e}")

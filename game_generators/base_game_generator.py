import os
import re
import yaml
from typing import Tuple, Optional, Dict, Any, List
from pathlib import Path
from abc import ABC, abstractmethod


class BaseGameGenerator(ABC):
    """Base class for game generators"""

    def __init__(self, config_path: str = "config/gamegen/base_prompt.yaml"):
        """
        Initialize the base game generator
        
        Args:
            config_path: Path to the configuration YAML file
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.template_path = "templates/base_game.html"
        self.games_dir = "games"
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
            
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _load_template(self) -> str:
        """Load the base HTML template"""
        if not os.path.exists(self.template_path):
            raise FileNotFoundError(f"Template file not found: {self.template_path}")
            
        with open(self.template_path, 'r') as f:
            return f.read()
    
    @abstractmethod
    def generate_prompt(self, genre: str, num_players: int) -> str:
        """
        Generate the game creation prompt
        
        Args:
            genre: Game genre
            num_players: Number of players
            
        Returns:
            str: Generated prompt
        """
        pass

    @abstractmethod
    def generate_instructions(self):
        """
        Generate instructions on the requirements on output with resources that the model can use and the format of the output based on the config.
        """
        self.generate_default_instructions()

    def generate_default_instructions(self):
        """
        Generate default instructions on the requirements on output with resources that the model can use and the format of the output based on the config.
        """
        requirements = self.config.get("requirements", {})
        allowed_libraries = requirements.get("allowed_libraries", {"p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"})
        
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
    
    @abstractmethod
    def generate_game(self, genre: str, num_players: int) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate game code using the specified model
        
        Args:
            genre: Game genre
            num_players: Number of players
            
        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
            where js_files is a list of tuples (filename, content)
        """
        pass
    
    def _parse_code_blocks(self, response_text: str) -> Tuple[List[Tuple[str, str]], Optional[str]]:
        """
        Extract JavaScript code blocks and description from the response
        
        Args:
            response_text: Full response text from the model
            
        Returns:
            Tuple of (js_files, description) where js_files is a list of tuples (filename, content)
        """
        description_match = re.search(
            r"```description\s*(.*?)```", response_text, re.DOTALL
        )
        
        # Find all JavaScript blocks with optional filenames
        js_blocks = re.finditer(
            r"```javascript(?:\s*\[(.*?)\])?\s*(.*?)```", 
            response_text, 
            re.DOTALL
        )

        description = description_match.group(1).strip() if description_match else None
        js_files = []
        
        for block in js_blocks:
            filename = block.group(1).strip() if block.group(1) else "game.js"
            content = block.group(2).strip()
            js_files.append((filename, content))

        return js_files, description

    def _extract_game_title(self, response_text: str) -> str:
        """
        Extract game title from the response text
        
        Args:
            response_text: Full response text from the model
            
        Returns:
            str: Extracted game title or "Untitled Game" if not found
        """
        title_match = re.search(
            r"```game_title\s*(.*?)```", response_text, re.DOTALL
        )
        if title_match:
            return title_match.group(1).strip()

        title_match = re.search(
            r"GAME TITLE:\s*(.*?)(?:\n|$)", response_text, re.IGNORECASE
        )
        if title_match:
            return title_match.group(1).strip()

        return "Untitled Game"

    def _generate_html(self, game_title: str, description: str, js_files: List[Tuple[str, str]]) -> str:
        """
        Generate the final HTML by combining the template with game-specific content
        
        Args:
            game_title: Title of the game
            description: Game description
            js_files: List of tuples (filename, content) for JavaScript files
            
        Returns:
            str: Final HTML code
        """
        template = self._load_template()
        
        # Replace placeholders
        html = template.replace("{{GAME_TITLE}}", game_title)
        html = html.replace("{{GAME_DESCRIPTION}}", description)
        
        # Generate script tags for each JavaScript file
        script_tags = "\n".join([
            f'<script src="{filename}"></script>'
            for filename, _ in js_files
        ])
        html = html.replace("{{JAVASCRIPT_FILES}}", script_tags)
        
        return html

    def _save_game_files(self, game_title: str, html_content: str, js_files: List[Tuple[str, str]]) -> str:
        """
        Save the game files to a directory
        
        Args:
            game_title: Title of the game
            html_content: HTML content to save
            js_files: List of tuples (filename, content) for JavaScript files
            
        Returns:
            str: Path to the game directory
        """
        # Create a safe directory name from the game title
        safe_title = re.sub(r'[^\w\-_\. ]', '_', game_title)
        game_dir = os.path.join(self.games_dir, safe_title)
        
        # Create the game directory if it doesn't exist
        os.makedirs(game_dir, exist_ok=True)
        
        # Save HTML file
        html_path = os.path.join(game_dir, "index.html")
        with open(html_path, 'w') as f:
            f.write(html_content)
        
        # Save JavaScript files
        for filename, content in js_files:
            js_path = os.path.join(game_dir, filename)
            with open(js_path, 'w') as f:
                f.write(content)
        
        return game_dir

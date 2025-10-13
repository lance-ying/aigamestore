from abc import ABC, abstractmethod
import re
from typing import Any, Dict, List, Optional, Tuple, Union

from llm_interface.model_api import ModelAPI


class GameGenerator(ABC):
    """Abstract base class for game generation methods."""

    def __init__(
        self,
        model_name: str = "anthropic:claude-4-sonnet",
        temperature: float = 1.0,
        top_p: float = 1.0,
        verbose: bool = False,
        thinking: bool = False,
        thinking_budget: Optional[int] = 5000,
        prompt_config: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.model_name = model_name
        self.verbose = verbose
        self.temperature = temperature
        self.top_p = top_p
        self.thinking = thinking
        self.thinking_budget = thinking_budget
        self.model_api = ModelAPI(model_name)
        self.prompt_config: Dict[str, Any] = prompt_config or {}

    @abstractmethod
    def generate_user_prompt(self, game_concept: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def generate_game(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        pass

    # Parsing helpers
    def extract_game_design(self, text: str) -> str:
        match = re.search(r"<game_design>\s*(.*?)\s*</game_design>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def extract_automated_testing_code(self, text: str) -> str:
        match = re.search(r"<automated_testing_code>\s*(.*?)\s*</automated_testing_code>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def extract_code_block(self, text: str, language: str = "javascript") -> Union[str, Dict[str, str]]:
        code_blocks = re.findall(r"<code filename=\"(.*?)\">(.*?)</code>", text, re.DOTALL)
        if language == "javascript":
            js_files: Dict[str, str] = {}
            for filename, code in code_blocks:
                if filename.endswith(".js"):
                    cleaned = re.sub("```(javascript|js)?", "", code)
                    js_files[filename.replace("\\", "/")] = cleaned.strip()
            if not js_files:
                js_files["game.js"] = "// Default game.js - Generated empty file\n"
            return js_files
        else:
            for filename, code in code_blocks:
                if filename.endswith(".html"):
                    return re.sub("```(html|xml)?", "", code).strip()
            return ""

    def extract_title(self, text: str) -> str:
        match = re.search(r"<game_title>\s*(.*?)\s*</game_title>", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        for pattern in [r"GAME TITLE:\s*(.*?)(?:\n|$)", r"title:\s*(.*?)(?:\n|$)", r"<title>(.*?)</title>"]:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return "Untitled Game"

    def extract_game_description(self, text: str) -> str:
        match = re.search(r"<game_description>\s*(.*?)\s*</game_description>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def extract_game_controls(self, text: str) -> str:
        match = re.search(r"<game_controls>\s*(.*?)\s*</game_controls>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def extract_game_plan(self, text: str) -> str:
        match = re.search(r"<plan>\s*(.*?)\s*</plan>", text, re.DOTALL)
        return match.group(1).strip() if match else ""



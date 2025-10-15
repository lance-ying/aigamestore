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
        from utils.saving_utils.model_output_parser import extract_automated_testing_code as _eatc
        return _eatc(text)

    def extract_automated_testing(self, text: str) -> str:
        match = re.search(r"<automated_testing>\s*(.*?)\s*</automated_testing>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    def parse_automated_testing(self, automated_testing_block: str) -> Dict[str, Dict[str, str]]:
        """
        Parse the <automated_testing> block into a structured mapping for VLM.

        Returns a mapping with keys like 'TEST_1' and corresponding button id 'test_1_ModeBtn',
        each mapping to a dict with 'test_description', 'strategy_description', 'expected_outcome' and
        mirrored short keys 'description', 'strategy', 'expected'.
        """
        if not automated_testing_block:
            return {}

        tests: Dict[str, Dict[str, str]] = {}
        # Find blocks like <TEST_1> ... </TEST_1>
        for m in re.finditer(r"<(TEST_\d+)>\s*(.*?)\s*</\1>", automated_testing_block, re.DOTALL):
            test_tag = m.group(1)  # e.g., TEST_1
            body = m.group(2)
            def _extract(tag: str) -> str:
                mm = re.search(rf"<{tag}>\s*(.*?)\s*</{tag}>", body, re.DOTALL)
                return (mm.group(1).strip() if mm else "").strip()

            test_desc = _extract("test_description")
            strat_desc = _extract("strategy_description")
            expected = _extract("expected_outcome")

            entry = {
                "test_description": test_desc,
                "strategy_description": strat_desc,
                "expected_outcome": expected,
                # Short mirrors for consumers expecting these keys
                "description": test_desc,
                "strategy": strat_desc,
                "expected": expected,
            }

            # Save under 'TEST_n'
            tests[test_tag] = entry
            # Also save under button id convention: 'test_n_ModeBtn'
            try:
                idx = test_tag.split("_")[1]
                button_id = f"test_{idx.lower()}_ModeBtn"
                tests[button_id] = entry
            except Exception:
                pass

        return tests

    def extract_code_block(self, text: str, language: str = "javascript") -> Union[str, Dict[str, str]]:
        from utils.saving_utils.model_output_parser import extract_code_block as _ecb
        return _ecb(text, language)

    def extract_title(self, text: str) -> str:
        from utils.saving_utils.model_output_parser import extract_title as _et
        return _et(text)

    def extract_game_description(self, text: str) -> str:
        from utils.saving_utils.model_output_parser import extract_game_description as _egd
        return _egd(text)

    def extract_game_controls(self, text: str) -> str:
        from utils.saving_utils.model_output_parser import extract_game_controls as _egc
        return _egc(text)

    def extract_game_plan(self, text: str) -> str:
        from utils.saving_utils.model_output_parser import extract_game_plan as _egp
        return _egp(text)

    def extract_automated_testing(self, text: str) -> str:
        from utils.saving_utils.model_output_parser import extract_automated_testing as _eat
        return _eat(text)

    def parse_automated_testing(self, automated_testing_block: str) -> Dict[str, Dict[str, str]]:
        from utils.saving_utils.model_output_parser import parse_automated_testing as _pat
        return _pat(automated_testing_block)



from typing import Any, Dict, List, Optional, Tuple

from generators.base import GameGenerator
from utils.saving_utils.file_writer import save_game_baseline_concept as save_game  # reuse pathing for now
from evaluators.basic_test.runner import test_game as run_basic_test


class SinglePromptWithTestingGenerator(GameGenerator):
    """Generate full game from a given concept in one pass with automated tests in output."""

    def generate_user_prompt(self, game_concept: Optional[str] = None) -> str:
        with open("prompts/generation/single_prompt_basic_instructions.md", "r") as f:
            instructions = f.read()
        task = f"""
<task>
Implement a complete, fun, and error-free p5.js game for the following concept:
{game_concept or 'Design your own short concept and implement it.'}
</task>
"""
        example_html = ""
        try:
            with open("html_templates/single_prompt_with_testing.html", "r") as tf:
                example_html = tf.read()
        except Exception:
            example_html = ""
        output_instructions = (
            "\n<example_html>\n" + example_html + "</example_html>\n\n"
            "<output_instructions>\n"
            "Output the code plan and game files in this format with NO OTHER TEXT:\n\n"
            "<game_description>\n...\n</game_description>\n\n"
            "<game_controls>\n...\n</game_controls>\n\n"
            "<automated_testing>\n...\n</automated_testing>\n\n"
            "For the javascript files:\n<code filename=\"{name}.{extension}\">\n...\n</code>\n\n"
            "HTML following the <example_html> template (output last):\n<code filename=\"index.html\">\n...\n</code>\n"
            "</output_instructions>\n"
        )
        return instructions + "\n" + task + output_instructions

    def get_system_prompt(self) -> str:
        with open("prompts/generation/single_prompt_basic_sysprompt.md", "r") as f:
            return f.read()

    def generate_game(self, game_concept: Optional[str] = None) -> Dict[str, Any]:
        user_prompt = self.generate_user_prompt(game_concept)
        system_prompt = self.get_system_prompt()
        response = self.model_api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            verbose=self.verbose,
            temperature=self.temperature,
            top_p=self.top_p,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )

        if isinstance(response, dict) and "response" in response:
            content = response["response"]
        else:
            content = str(response)

        title = self.extract_title(content)
        game_description = self.extract_game_description(content)
        game_controls = self.extract_game_controls(content)
        html_code = self.extract_code_block(content, "html") or ""
        js_map = self.extract_code_block(content, "javascript")
        js_files: List[Tuple[str, str]] = list(js_map.items())  # type: ignore[arg-type]

        intermediate = {"full_response": content, "call_history": self.model_api.get_call_history()}

        game_dir = save_game(
            title=title,
            html_code=html_code,
            js_files=js_files,
            game_description=game_description,
            game_controls=game_controls,
            game_concept=game_concept or title,
            intermediate_outputs=intermediate,
        )

        basic = run_basic_test(str(game_dir), duration=10, timeout=20)

        return {
            "title": title,
            "game_dir": game_dir,
            "basic_test": basic,
        }



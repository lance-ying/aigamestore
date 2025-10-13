from typing import Any, Dict, List, Optional, Tuple

from generators.base import GameGenerator
from utils.saving_utils.file_writer import save_game_single_prompt as save_game
from utils.prompt_formatting.prompt_utils import build_user_prompt, build_system_prompt
from utils.prompt_formatting.html_template_utils import render_html_template
from evaluators.basic_test.runner import test_game as run_basic_test


class SinglePromptWithTestingGenerator(GameGenerator):
    """Generate full game from a given concept in one pass with automated tests in output."""

    def generate_user_prompt(self, game_concept: Optional[str] = None) -> str:
        # user prompt assembled from common and specific parts
        instructions = build_user_prompt("single_prompt_with_testing", self.prompt_config)
        task = f"""
<task>
Implement a complete, fun, and error-free p5.js game for the following concept:
{game_concept or 'Design your own short concept and implement it.'}
</task>
"""
        libs = self.prompt_config.get("libraries_allowed") or ["p5.js", "p5.collide2D"]
        example_html = render_html_template("html_templates/single_prompt_with_testing.html", libs)
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
        return build_system_prompt()

    def generate_game(self, game_concept: Optional[str] = None, forced_game_index: Optional[int] = None) -> Dict[str, Any]:
        # If concept is a path, read it
        if game_concept and isinstance(game_concept, str):
            from pathlib import Path
            p = Path(game_concept)
            if p.exists():
                try:
                    text = p.read_text(encoding="utf-8").strip()
                    if p.suffix in (".yml", ".yaml") and text.startswith("concept:"):
                        lines = text.splitlines()
                        if len(lines) == 1 and ":" in lines[0]:
                            game_concept = lines[0].split(":", 1)[1].strip()
                        else:
                            block = []
                            for ln in lines[1:]:
                                if ln.startswith("  "):
                                    block.append(ln[2:])
                            game_concept = "\n".join(block).strip() or text
                    else:
                        game_concept = text
                except Exception:
                    pass
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
            forced_game_index=forced_game_index,
            output_folder=self.prompt_config.get("output_folder"),
            intermediate_outputs=intermediate,
        )

        basic = run_basic_test(str(game_dir), duration=10, timeout=20)

        return {
            "title": title,
            "game_dir": game_dir,
            "basic_test": basic,
        }



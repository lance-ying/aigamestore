from typing import Any, Dict, List, Optional, Tuple

from generators.base import GameGenerator
from utils.saving_utils.file_writer import save_game_baseline_concept


class BaselineConceptAndGameGenerator(GameGenerator):
    """Generate concept and game code in one pass."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    def generate_user_prompt(self, game_concept: Optional[str] = None) -> str:
        instructions = self.get_baseline_instructions()
        output_format = self.get_baseline_output_format()
        task = (
            "\n<task>\nPropose an interesting and novel game concept, then implement a fun and playable game expanding on that concept.\n</task>"
        )
        return instructions + task + output_format

    def get_baseline_instructions(self) -> str:
        with open("prompts/generation/baseline_concept_and_game_instructions.md", "r") as f:
            return f.read()

    def get_system_prompt(self) -> str:
        with open("prompts/generation/baseline_concept_and_game_sysprompt.md", "r") as f:
            return f.read()

    def get_baseline_output_format(self) -> str:
        # Kept concise; same structure as archive with example html and output tags
        template = ""
        try:
            with open("html_templates/baseline_concept_and_game.html", "r") as tf:
                template = tf.read()
        except Exception:
            template = ""
        return (
            "\n<example_html>\n" + template + "</example_html>\n\n"
            "<output_instructions>\n"
            "Output the code plan and game files in this format with NO OTHER TEXT:\n\n"
            "<game_concept>\n...\n</game_concept>\n\n"
            "<game_description>\n...\n</game_description>\n\n"
            "<game_controls>\n...\n</game_controls>\n\n"
            "For the javascript files:\n<code filename=\"{name}.{extension}\">\n...\n</code>\n\n"
            "HTML following the <example_html> template (output last):\n<code filename=\"index.html\">\n...\n</code>\n"
            "</output_instructions>\n"
        )

    def extract_game_concept(self, text: str) -> str:
        import re

        m = re.search(r"<game_concept>\s*(.*?)\s*</game_concept>", text, re.DOTALL)
        return m.group(1).strip() if m else ""

    def generate_game(self, game_concept: Optional[str] = None, concept_path: Optional[str] = None) -> Dict[str, Any]:
        user_prompt = self.generate_user_prompt()
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
            thinking_content = response.get("thinking", "")
            content = response["response"]
            conversation_log = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": content},
            ]
            if thinking_content:
                conversation_log.append({"role": "thinking", "content": thinking_content})
            response_text = content
        else:
            conversation_log = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": str(response)},
            ]
            response_text = str(response)

        generated_game_concept = self.extract_game_concept(response_text)
        title = self.extract_title(response_text)
        game_description = self.extract_game_description(response_text)
        game_controls = self.extract_game_controls(response_text)
        html_code = self.extract_code_block(response_text, "html") or ""
        js_code_dict = self.extract_code_block(response_text, "javascript")
        js_files: List[Tuple[str, str]] = list(js_code_dict.items())  # type: ignore[arg-type]

        # prepare intermediate outputs with call history for token usage in metadata
        intermediate = {"full_response": response_text, "call_history": self.model_api.get_call_history()}

        game_dir = save_game_baseline_concept(
            title=title,
            html_code=html_code,
            js_files=js_files,
            game_description=game_description,
            game_controls=game_controls,
            game_concept=generated_game_concept,
            intermediate_outputs=intermediate,
            conversation_log=conversation_log,
        )

        return {
            "title": title,
            "html_code": html_code,
            "js_files": js_files,
            "game_description": game_description,
            "game_controls": game_controls,
            "game_dir": game_dir,
            "game_concept": generated_game_concept,
        }



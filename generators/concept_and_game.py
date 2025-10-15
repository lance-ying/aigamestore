from typing import Any, Dict, List, Optional, Tuple

from generators.base import GameGenerator
from utils.saving_utils.file_writer import save_game_baseline_concept
from pathlib import Path
from utils.prompt_formatting.prompt_utils import build_user_prompt, build_system_prompt
from utils.prompt_formatting.html_template_utils import render_html_template


class BaselineConceptAndGameGenerator(GameGenerator):
    """Generate concept and game code in one pass."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    def generate_user_prompt(self, game_concept: Optional[str] = None) -> str:
        prompt = build_user_prompt("concept_and_game", self.prompt_config)
        task = (
            "\n<task>\nPropose an interesting and novel game concept, then implement a fun and playable game expanding on that concept.\n</task>"
        )
        return prompt + task + self.get_baseline_output_format()

    def get_baseline_instructions(self) -> str:
        with open("prompts/generation/baseline_concept_and_game_instructions.md", "r") as f:
            base = f.read()
        # Append previous concepts from game_concepts directory to steer away from duplicates
        try:
            concepts_dir = Path("game_concepts")
            previous: List[str] = []
            if concepts_dir.exists():
                for p in sorted(concepts_dir.glob("game_*.yaml")):
                    try:
                        text = p.read_text(encoding="utf-8").strip()
                        concept_value = ""
                        if text.startswith("concept:"):
                            # naive YAML parse for the single key
                            lines = text.splitlines()
                            if len(lines) >= 1:
                                # single-line value on the same line as key
                                if len(lines) == 1 and ":" in lines[0]:
                                    concept_value = lines[0].split(":", 1)[1].strip()
                                else:
                                    # block scalar case; join wrapped lines into one
                                    block: List[str] = []
                                    for ln in lines[1:]:
                                        if ln.startswith("  "):
                                            block.append(ln[2:].strip())
                                    concept_value = " ".join([b for b in " ".join(block).split()])
                        if concept_value:
                            previous.append(f'- "{concept_value}"')
                    except Exception:
                        continue
            prev_block = "\n".join(previous[-200:])  # limit size
            base = base.replace("{previous_concepts_text}", prev_block)
        except Exception:
            base = base.replace("{previous_concepts_text}", "")
        return base

    def get_system_prompt(self) -> str:
        return build_system_prompt()

    def get_baseline_output_format(self) -> str:
        # Render template and then load instructions from prompts file
        libs = self.prompt_config.get("libraries_allowed") or ["p5.js", "p5.collide2D"]
        template = render_html_template("html_templates/baseline_concept_and_game.html", libs)
        from pathlib import Path
        out_path = self.prompt_config.get("output_instructions") or "prompts/output_instructions/baseline_concept_and_game.md"
        text = ""
        try:
            p = Path(out_path)
            if p.exists():
                text = p.read_text(encoding="utf-8")
        except Exception:
            text = ""
        if text:
            return text.replace("{example_html}", template)
        return f"\n<example_html>\n{template}\n</example_html>\n\n<output_instructions>\n</output_instructions>\n"

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
        intermediate = {
            "full_response": response_text,
            "call_history": self.model_api.get_call_history(),
            "generation_params": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "thinking": self.thinking,
                "thinking_budget": self.thinking_budget,
                "model": self.model_name,
            },
        }

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



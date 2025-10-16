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
        # Load output instructions from prompts file, fallback to default path
        import os
        import re
        from pathlib import Path
        out_path = self.prompt_config.get("output_instructions") or "prompts/output_instructions/single_prompt_with_testing.md"
        text = ""
        try:
            p = Path(out_path)
            if p.exists():
                text = p.read_text(encoding="utf-8")
        except Exception:
            text = ""
        if text:
            output_instructions = text.replace("{example_html}", example_html)
        else:
            # Minimal fallback if file missing
            output_instructions = f"\n<example_html>\n{example_html}\n</example_html>\n\n<output_instructions>\n</output_instructions>\n"
        
        # Remove automated testing from output instructions if disabled
        if not self.prompt_config.get("include_testing", True):
            output_instructions = re.sub(
                r"Write the automated testing plan:.*?</automated_testing>",
                "",
                output_instructions,
                flags=re.DOTALL
            )
            # Clean up extra blank lines
            output_instructions = re.sub(r'\n\n\n+', '\n\n', output_instructions)
        
        return instructions + "\n" + task + output_instructions

    def get_system_prompt(self) -> str:
        return build_system_prompt()

    def generate_game(self, game_concept: Optional[str] = None, forced_game_index: Optional[int] = None) -> Dict[str, Any]:
        # If concept is a path, read it
        if game_concept and isinstance(game_concept, str):
            from pathlib import Path
            import json
            import yaml  # type: ignore
            p = Path(game_concept)
            if p.exists():
                try:
                    # Prefer YAML/JSON parsing to avoid clipping
                    if p.suffix in (".yml", ".yaml"):
                        data = yaml.safe_load(p.read_text(encoding="utf-8"))
                        if isinstance(data, dict) and "concept" in data:
                            game_concept = str(data.get("concept") or "").strip()
                        else:
                            # Fallback to raw text if unexpected format
                            game_concept = p.read_text(encoding="utf-8").strip()
                    elif p.suffix == ".json":
                        data = json.loads(p.read_text(encoding="utf-8"))
                        if isinstance(data, dict) and "concept" in data:
                            game_concept = str(data.get("concept") or "").strip()
                        else:
                            # Fallback to raw text if unexpected format
                            game_concept = p.read_text(encoding="utf-8").strip()
                    else:
                        game_concept = p.read_text(encoding="utf-8").strip()
                except Exception:
                    try:
                        game_concept = p.read_text(encoding="utf-8").strip()
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
            thinking_content = response.get("thinking", "")
        else:
            content = str(response)
            thinking_content = ""

        title = self.extract_title(content)
        game_description = self.extract_game_description(content)
        game_controls = self.extract_game_controls(content)
        automated_testing_block = self.extract_automated_testing(content)
        automated_testing = self.parse_automated_testing(automated_testing_block)
        html_code = self.extract_code_block(content, "html") or ""
        js_map = self.extract_code_block(content, "javascript")
        js_files: List[Tuple[str, str]] = list(js_map.items())  # type: ignore[arg-type]

        # Build a conversation log like baseline mode for parity
        conversation_log: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": content},
        ]
        if thinking_content:
            conversation_log.append({"role": "thinking", "content": thinking_content})

        intermediate = {
            "full_response": content,
            "call_history": self.model_api.get_call_history(),
            "automated_testing": automated_testing,
            "generation_params": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "thinking": self.thinking,
                "thinking_budget": self.thinking_budget,
                "model": self.model_name,
            },
        }

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
            conversation_log=conversation_log,
        )

        # Only run basic test if include_testing is not explicitly disabled
        basic = None
        if self.prompt_config.get("include_testing", True):
            basic = run_basic_test(str(game_dir), duration=10, timeout=20)

        return {
            "title": title,
            "game_dir": game_dir,
            "basic_test": basic,
        }



from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

from gamegen_methods.game_generator_base import GameGenerator


class FeedbackTuningGenerator(GameGenerator):
    """
    Tune an existing game's code based on human feedback.

    This generator reads an existing game's files (HTML and JavaScript) from a directory
    and a human feedback text file, then asks the LLM to update only what is necessary
    to satisfy the feedback while preserving working behavior.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.temperature = kwargs.get("temperature", 0.6)
        self.top_p = kwargs.get("top_p", 0.9)
    
    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Unused in feedback tuning. Present to satisfy the abstract interface.
        """
        return ""

    def _read_game_files(self, game_dir: Path) -> Dict[str, str]:
        """
        Read index.html and all .js files (recursively) from the game directory.

        Returns a mapping of relative file paths (posix style) to content.
        """
        files: Dict[str, str] = {}
        # HTML
        html_path = game_dir / "index.html"
        if html_path.exists():
            files["index.html"] = html_path.read_text(encoding="utf-8")
        # JS
        for js_path in game_dir.rglob("*.js"):
            rel = js_path.relative_to(game_dir).as_posix()
            files[rel] = js_path.read_text(encoding="utf-8")
        return files

    def _build_user_prompt(self, feedback_text: str, files: Dict[str, str], use_planning: bool = True) -> str:
        """
        Build a tuning prompt that includes feedback and current code.
        
        Args:
            feedback_text: User feedback describing the issue
            files: Dictionary of filename -> content
            use_planning: If True, prompt includes analysis/planning step
        """
        files_blob_parts: List[str] = []
        for rel_path, content in files.items():
            files_blob_parts.append(
                f"<file name=\"{rel_path}\">\n{content}\n</file>"
            )
        files_blob = "\n\n".join(files_blob_parts)

        if use_planning:
            output_format = """
<output_instructions>
IMPORTANT: Your response must have TWO sections in this exact order:

1. First, output your analysis in <analysis> tags:
<analysis>
- Issue identified: [clear description of the root cause]
- Files affected: [list the specific files that need changes]
- Changes needed: [brief summary of what fixes to apply]
</analysis>

2. Then, output ONLY the updated files in this format:
<code filename="{name}.{extension}">
... (complete file contents with fixes applied)
</code>

Only output files that are being changed. Do not include commentary outside these tags.
If you change HTML, include the full updated index.html.
Keep the game playable and preserve the existing physics engine (p5.js or Matter.js).
</output_instructions>
"""
        else:
            output_format = """
<output_instructions>
You must output ONLY updated files in this format. If a file is unchanged, you may re-output
its original content verbatim. Do not include commentary outside these tags.

For each updated or unchanged file:
<code filename="{name}.{extension}">
... (file contents)
</code>

If you change HTML, include the full updated index.html in a final <code filename="index.html"> block.
Keep the game playable and preserve p5.js or Matter.js usage if present.
</output_instructions>
"""

        task = f"""
<task>
You are improving an existing browser game. Apply the human feedback precisely while preserving
existing working features. Only modify what is necessary to achieve the requested changes, and
ensure the result remains playable. Avoid regressions.

<human_feedback>
{feedback_text}
</human_feedback>

<existing_files>
{files_blob}
</existing_files>
</task>
"""

        instructions = (
            "You are a senior game developer focused on safe, minimal, high-impact edits. "
            "Prefer small, surgical changes over rewrites. Keep file names and structure stable. "
            "Maintain consistent coding style and avoid introducing external dependencies."
        )

        return instructions + "\n" + task + output_format

    def generate_game(
        self,
        game_concept: str = "",
        concept_path: Optional[str] = None,
        *,
        game_dir: Optional[str] = None,
        feedback_path: Optional[str] = None,
        feedback_text: Optional[str] = None,
        use_planning: bool = True,
    ) -> Dict[str, Any]:
        """
        Tune an existing game using human feedback.

        Args:
            game_concept: Unused for tuning; accepted for interface compatibility.
            concept_path: If provided, used for directory naming via save_games.
            game_dir: Path to existing generated game directory (must contain index.html and .js files).
            feedback_path: Path to a text file with human feedback/instructions.
            feedback_text: Direct feedback text (alternative to feedback_path).
            use_planning: If True, prompt LLM to output analysis before fixes.

        Returns:
            Dictionary containing summary and the path to the tuned game directory.
        """
        if game_dir is None:
            raise ValueError("'game_dir' must be provided for feedback_tuning.")
        
        if feedback_path is None and feedback_text is None:
            raise ValueError("Either 'feedback_path' or 'feedback_text' must be provided.")

        game_dir_path = Path(game_dir)
        if not game_dir_path.exists():
            raise FileNotFoundError(f"Game directory not found: {game_dir}")

        files = self._read_game_files(game_dir_path)
        if "index.html" not in files:
            raise FileNotFoundError("index.html not found in the provided game directory.")

        # Get feedback text from file or direct parameter
        if feedback_text is None:
            feedback_text = Path(feedback_path).read_text(encoding="utf-8")

        # Build prompt and call model
        user_prompt = self._build_user_prompt(feedback_text, files, use_planning=use_planning)
        
        if use_planning:
            system_prompt = (
                "You are a precise game debugger and code editor. Always:\n"
                "1. First analyze the issue carefully to identify the root cause\n"
                "2. Plan which files need changes and what fixes to apply\n"
                "3. Then output the corrected code\n\n"
                "Apply changes to meet feedback, maintain playability, and preserve existing architecture."
            )
        else:
            system_prompt = (
                "You are a precise code editor for web-based games. Apply changes to meet feedback, "
                "maintain playability, and output files using <code filename=\"...\"> blocks only."
            )

        if self.verbose:
            print("Calling LLM to tune existing game based on human feedback...")

        response = self.model_api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            verbose=self.verbose,
            temperature=self.temperature,
            top_p=self.top_p,
        )

        conversation_log = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": response},
        ]

        # Extract analysis if present
        analysis = None
        if use_planning:
            import re
            analysis_match = re.search(r'<analysis>(.*?)</analysis>', response, re.DOTALL)
            if analysis_match:
                analysis = analysis_match.group(1).strip()
                if self.verbose:
                    print("\n=== Analysis ===")
                    print(analysis)
                    print("================\n")

        # Extract updated files
        updated_html = self.extract_code_block(response, "html") or ""
        updated_js_dict = self.extract_code_block(response, "javascript")

        # Merge: default to original if not provided/updated
        final_html = updated_html if updated_html else files.get("index.html", "")

        merged_js: Dict[str, str] = {}
        # Start with originals
        for rel_path, content in files.items():
            if rel_path.endswith(".js"):
                merged_js[rel_path] = content
        # Apply updates
        for rel_path, content in updated_js_dict.items():
            if rel_path.endswith(".js"):
                merged_js[rel_path] = content

        js_files_list: List[Tuple[str, str]] = [(k, v) for k, v in sorted(merged_js.items())]

        # Try to read prior metadata for title/concept
        prior_title = "Tuned Game"
        prior_concept = "Tuned from feedback"
        prior_genre: Optional[str] = None
        try:
            meta_path = game_dir_path / "metadata.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                prior_title = meta.get("game_info", {}).get("title", prior_title)
                prior_concept = meta.get("game_info", {}).get("concept", prior_concept)
                prior_genre = meta.get("game_info", {}).get("genre", None)
                # Prefer original concept_path for consistent foldering if present
                if concept_path is None:
                    concept_path = meta.get("game_info", {}).get("concept_path", None)
        except Exception:
            pass

        # Save tuned version as a new sample under this generator's method directory
        out_dir = self.save_games(
            title=prior_title,
            html_code=final_html,
            js_files=js_files_list,
            game_description="",
            game_controls="",
            game_concept=prior_concept,
            game_plan="",
            game_design=None,
            automated_testing=None,
            concept_path=concept_path,
            genre=prior_genre,
            intermediate_outputs={
                "feedback_text": feedback_text,
                "source_game_dir": str(game_dir_path),
            },
            conversation_log=conversation_log,
            use_ecs=self.use_ecs,
            use_baseline=self.use_baseline,
        )

        if self.verbose:
            print(f"Tuned game saved to: {out_dir}")

        return {
            "title": prior_title,
            "html_code": final_html,
            "js_files": js_files_list,
            "game_description": "",
            "game_controls": "",
            "game_dir": out_dir,
            "game_plan": "",
            "automated_testing": None,
            "analysis": analysis,  # Include analysis for display
        }



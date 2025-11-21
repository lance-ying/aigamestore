from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from llm_interface.model_api import ModelAPI


def _read_game_files(game_dir: str) -> Dict[str, str]:
    """
    Read index.html and all .js files (recursively) from the game directory.

    Returns a mapping of relative file paths (posix style) to content.
    """
    files: Dict[str, str] = {}
    game_path = Path(game_dir)

    # HTML
    html_path = game_path / "index.html"
    if html_path.exists():
        files["index.html"] = html_path.read_text(encoding="utf-8")

    # JS files
    for js_path in game_path.rglob("*.js"):
        rel = js_path.relative_to(game_path).as_posix()
        files[rel] = js_path.read_text(encoding="utf-8")

    return files


def _apply_updates(game_dir: str, updates: Dict[str, str]) -> List[str]:
    """Apply file updates to the game directory."""
    updated: List[str] = []
    base = Path(game_dir)

    for rel_path, content in updates.items():
        out = base / rel_path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8")
        updated.append(rel_path)

    return updated


class FeedbackFixIterator:
    """
    Iterator that fixes games based on human feedback.

    Uses LLM to analyze feedback and apply targeted fixes while preserving
    working functionality.
    """

    def __init__(
        self,
        model: str = "anthropic:claude-4.5-sonnet",
        temperature: float = 0.6,
        thinking: bool = True,
        thinking_budget: Optional[int] = 8000,
    ) -> None:
        self.api = ModelAPI(model)
        self.model = model
        self.temperature = temperature
        self.thinking = thinking
        self.thinking_budget = thinking_budget

    def _build_user_prompt(
        self,
        feedback_text: str,
        files: Dict[str, str],
        use_planning: bool = True
    ) -> str:
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
You must output ONLY updated files in this format. If a file is unchanged, do not output it.

For each updated file:
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

    def iterate(
        self,
        game_dir: str,
        feedback: str,
        *,
        debug_prompts: bool = False,
        use_planning: bool = True,
        in_place: bool = True,
    ) -> Dict[str, Any]:
        """
        Fix a game based on human feedback.

        Args:
            game_dir: Path to game directory containing index.html and .js files
            feedback: Human feedback describing what needs to be fixed
            debug_prompts: If True, save prompts to evaluation/prompts/
            use_planning: If True, LLM outputs analysis before fixes
            in_place: If True, update files in place; otherwise requires output_dir

        Returns:
            Dictionary with:
                - analysis: Analysis of the issue (if use_planning=True)
                - updated_files: List of file paths that were updated
                - response: Full LLM response text
        """
        game_path = Path(game_dir)
        if not game_path.exists():
            raise FileNotFoundError(f"Game directory not found: {game_dir}")

        if not (game_path / "index.html").exists():
            raise FileNotFoundError(f"index.html not found in {game_dir}")

        # Read current game files
        files = _read_game_files(game_dir)

        # Build prompt
        user_prompt = self._build_user_prompt(feedback, files, use_planning=use_planning)

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

        # Save prompts if debug mode
        if debug_prompts:
            try:
                prompts_dir = game_path / "evaluation" / "prompts"
                prompts_dir.mkdir(parents=True, exist_ok=True)
                (prompts_dir / "feedback_fix_system.txt").write_text(system_prompt, encoding="utf-8")
                (prompts_dir / "feedback_fix_user.txt").write_text(user_prompt, encoding="utf-8")
            except Exception:
                pass

        # Call LLM
        response = self.api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=self.temperature,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )

        # Handle dict response (when thinking=True) or string response
        if isinstance(response, dict):
            response_text = response.get("response", "")
            thinking_text = response.get("thinking", "")
        else:
            response_text = response
            thinking_text = ""

        # Extract analysis if present
        analysis = None
        if use_planning:
            analysis_match = re.search(r'<analysis>(.*?)</analysis>', response_text, re.DOTALL)
            if analysis_match:
                analysis = analysis_match.group(1).strip()

        # Extract updated files
        updated_files_dict: Dict[str, str] = {}

        # Extract HTML
        html_match = re.search(
            r'<code\s+filename=["\']index\.html["\']\s*>(.*?)</code>',
            response_text,
            re.DOTALL | re.IGNORECASE
        )
        if html_match:
            updated_files_dict["index.html"] = html_match.group(1).strip()

        # Extract JS files
        for match in re.finditer(
            r'<code\s+filename=["\']([^"\']+\.js)["\']\s*>(.*?)</code>',
            response_text,
            re.DOTALL | re.IGNORECASE
        ):
            filename = match.group(1)
            content = match.group(2).strip()
            updated_files_dict[filename] = content

        # Apply updates
        if in_place and updated_files_dict:
            updated = _apply_updates(game_dir, updated_files_dict)
        else:
            updated = []

        return {
            "analysis": analysis,
            "updated_files": updated,
            "response": response_text,
            "thinking": thinking_text,
            "num_files_updated": len(updated),
        }


def run_feedback_fix(
    game_dir: str,
    feedback: str,
    *,
    model: str = "anthropic:claude-4.5-sonnet",
    use_planning: bool = True,
    debug_prompts: bool = False,
) -> Dict[str, Any]:
    """
    Convenience function to run feedback fix iteration.

    Args:
        game_dir: Path to game directory
        feedback: Human feedback text
        model: Model name to use
        use_planning: Whether to include analysis step
        debug_prompts: Whether to save prompts

    Returns:
        Result dictionary from iterate()
    """
    iterator = FeedbackFixIterator(model=model)
    return iterator.iterate(
        game_dir,
        feedback,
        debug_prompts=debug_prompts,
        use_planning=use_planning,
        in_place=True,
    )

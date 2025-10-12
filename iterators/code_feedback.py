import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from llm_interface.model_api import ModelAPI


def read_js_files(game_dir: str) -> List[Tuple[str, str]]:
    files: List[Tuple[str, str]] = []
    for root, _, fs in os.walk(game_dir):
        for f in fs:
            if f.endswith(".js"):
                p = Path(root) / f
                files.append((str(p.relative_to(game_dir)), p.read_text(encoding="utf-8")))
    return files


def apply_updates(game_dir: str, updates: Dict[str, str]) -> List[str]:
    updated: List[str] = []
    base = Path(game_dir)
    for rel, content in updates.items():
        out = base / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8")
        updated.append(rel)
    return updated


def iterate_once(
    game_dir: str,
    feedback: str,
    model: str = "anthropic:claude-3.7-sonnet",
    temperature: float = 1.0,
    thinking: bool = True,
    thinking_budget: Optional[int] = 8000,
) -> Dict[str, Any]:
    api = ModelAPI(model)
    js_files = read_js_files(game_dir)

    # Build prompt: provide feedback and current files; ask for updated files only
    file_blobs = "\n\n".join(
        [f"<file name=\"{name}\">\n```javascript\n{content}\n```\n</file>" for name, content in js_files]
    )
    system = (
        "You are a senior JavaScript game developer. Improve the game strictly based on FEEDBACK.\n"
        "Return ONLY the updated files using <code filename=\"...\"> blocks."
    )
    user = (
        f"<feedback>\n{feedback}\n</feedback>\n\n"
        f"<files>\n{file_blobs}\n</files>\n\n"
        "Update minimal files to address issues; do not add unrelated features."
    )

    resp = api.call(
        user_prompt=user,
        system_prompt=system,
        temperature=temperature,
        thinking=thinking,
        thinking_budget=thinking_budget,
    )
    content = resp["response"] if isinstance(resp, dict) and "response" in resp else str(resp)

    # Parse updated files
    import re

    updates: Dict[str, str] = {}
    for m in re.finditer(r"<code filename=\"(.*?)\">(.*?)</code>", content, re.DOTALL):
        fname, code = m.group(1), m.group(2)
        code = re.sub("```(javascript|js)?", "", code).strip()
        updates[fname] = code

    updated_files = apply_updates(game_dir, updates) if updates else []

    # Write iteration metadata
    token_usage = None
    hist = api.get_call_history()
    if hist:
        token_usage = hist[-1].get("token_usage")

    meta = {
        "feedback": feedback,
        "updated_files": updated_files,
        "token_usage": token_usage,
    }
    (Path(game_dir) / "iteration_metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta



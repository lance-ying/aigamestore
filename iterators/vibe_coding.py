from typing import Any, Dict, Optional
from pathlib import Path
import json

from llm_iterface.model_api import ModelAPI
from .code_feedback import read_js_files, apply_updates


def improve_fun(game_dir: str, model: str = "anthropic:claude-3.7-sonnet", thinking: bool = True, thinking_budget: Optional[int] = 8000) -> Dict[str, Any]:
    api = ModelAPI(model)
    js_files = read_js_files(game_dir)

    files_blob = "\n\n".join([f"<file name=\"{n}\">\n```javascript\n{c}\n```\n</file>" for n, c in js_files])
    system = (
        "You are a veteran game designer/programmer. Make the game more fun while preserving concept and controls.\n"
        "Return ONLY updated files using <code filename=\"...\"> blocks."
    )
    user = (
        "<goal>Make the gameplay more fun, responsive, and rewarding without breaking inputs or structure.</goal>\n"
        "Focus changes: feedback, pacing, challenge curve, juice (visuals), clarity of goals, and winability.\n\n"
        f"<files>\n{files_blob}\n</files>"
    )

    resp = api.call(user_prompt=user, system_prompt=system, thinking=thinking, thinking_budget=thinking_budget)
    content = resp["response"] if isinstance(resp, dict) and "response" in resp else str(resp)

    import re

    updates: Dict[str, str] = {}
    for m in re.finditer(r"<code filename=\"(.*?)\">(.*?)</code>", content, re.DOTALL):
        fname, code = m.group(1), m.group(2)
        code = re.sub("```(javascript|js)?", "", code).strip()
        updates[fname] = code

    updated_files = apply_updates(game_dir, updates) if updates else []

    token_usage = None
    hist = api.get_call_history()
    if hist:
        token_usage = hist[-1].get("token_usage")

    meta = {"mode": "vibe_coding", "updated_files": updated_files, "token_usage": token_usage}
    (Path(game_dir) / "iteration_metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta



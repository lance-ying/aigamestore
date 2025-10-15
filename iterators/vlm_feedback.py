from __future__ import annotations

from typing import Any, Dict, List

from iterators.base import CodeIterator


def run_vlm_feedback_iteration(game_dir: str, feedback_items: List[str], *, model: str, max_iters: int = 1) -> Dict[str, Any]:
    combined = "\n\n".join(feedback_items)
    it = CodeIterator(model=model)
    last: Dict[str, Any] = {}
    for _ in range(max_iters):
        last = it.iterate(game_dir, combined)
    return last




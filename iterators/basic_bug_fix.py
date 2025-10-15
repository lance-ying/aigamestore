from __future__ import annotations

from typing import Any, Dict

from iterators.base import CodeIterator


def run_basic_bug_fix(game_dir: str, feedback: str, *, model: str, max_iters: int = 1) -> Dict[str, Any]:
    it = CodeIterator(model=model)
    last: Dict[str, Any] = {}
    for _ in range(max_iters):
        last = it.iterate(game_dir, feedback)
    return last

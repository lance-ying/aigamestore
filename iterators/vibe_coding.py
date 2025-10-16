from __future__ import annotations

from typing import Any, Dict

from iterators.base import CodeIterator


def run_vibe_coding(game_dir: str, concept: str, *, model: str, max_iters: int = 1) -> Dict[str, Any]:
    feedback = (
        "Improve the game to be more fun, responsive, and engaging while preserving the concept and controls.\n"
        + f"Concept: {concept}\n"
        + "Ensure the game passes automated basic testing."
    )
    it = CodeIterator(model=model)
    last: Dict[str, Any] = {}
    for _ in range(max_iters):
        last = it.iterate(game_dir, feedback)
    return last



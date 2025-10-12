import json
from typing import Any, Dict, List, Tuple

from evaluators.vlm.record import record_gameplay_tests
from evaluators.vlm.gemini_api import GeminiEvaluator


async def evaluate_game_folder(game_dir: str, prompt_template: str, model: str = "gemini-2.5-flash-preview-04-17") -> Dict[str, Any]:
    results: Dict[str, Any] = {"game_path": game_dir, "evaluations": []}
    recs: List[Tuple[str, str, Dict[str, str]]] = await record_gameplay_tests(game_dir)
    ev = GeminiEvaluator(model_name=model)
    for test_mode, video_path, meta in recs:
        test_description = meta.get("description") or meta.get("test_description") or ""
        strategy_description = meta.get("strategy") or meta.get("strategy_description") or ""
        expected_outcome = meta.get("expected") or meta.get("expected_outcome") or ""
        prompt = prompt_template.format(
            test_mode=test_mode,
            test_description=test_description,
            strategy_description=strategy_description,
            expected_outcome=expected_outcome,
        )
        text = ev.evaluate_video(video_path, prompt)
        results["evaluations"].append(
            {
                "test_mode": test_mode,
                "video": video_path,
                "metadata": meta,
                "feedback": text or "",
            }
        )
    return results



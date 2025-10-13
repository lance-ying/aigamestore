import argparse
import json
from pathlib import Path
from typing import Any, Dict
import os

from evaluators.basic_test.runner import test_game as run_basic
from evaluators.vlm.gemini_api import GeminiEvaluator
from evaluators.vlm.run import evaluate_game_folder

try:
    import yaml  # type: ignore
except Exception:
    yaml = None


def load_config(path: str) -> Dict[str, Any]:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if p.suffix in [".yml", ".yaml"] and yaml:
        return yaml.safe_load(text)
    return json.loads(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate game from a config")
    parser.add_argument("--config", required=True)
    parser.add_argument("--target", required=False, help="Game directory or video path")
    parser.add_argument("--debug", action="store_true", help="Enable verbose debug logs for basic testing")
    args = parser.parse_args()

    cfg = load_config(args.config)
    mode = cfg.get("mode")

    if mode == "basic_test":
        game_path = args.target or cfg.get("game_path")
        if not game_path:
            raise ValueError("basic_test requires --target or game_path in config")
        res = run_basic(
            game_path,
            duration=int(cfg.get("duration", 10)),
            timeout=int(cfg.get("timeout", 20)),
            debug=bool(args.debug or cfg.get("debug", False)),
        )
        print(json.dumps(res))
        return 0

    if mode == "vlm":
        # If target is a directory, record tests and evaluate each; else treat as direct video
        target = args.target or cfg.get("target") or cfg.get("video")
        prompt = cfg.get("prompt", "Evaluate gameplay quality and success.")
        model = cfg.get("model", "gemini-2.5-flash-preview-04-17")
        if target and os.path.isdir(target):
            import asyncio
            res = asyncio.get_event_loop().run_until_complete(evaluate_game_folder(target, prompt, model))
            print(json.dumps(res))
            return 0
        if not target:
            raise ValueError("vlm requires --target (game folder or video path) or target/video in config")
        ev = GeminiEvaluator(model_name=model)
        text = ev.evaluate_video(target, prompt)
        print(text or "")
        return 0

    raise ValueError(f"Unknown evaluation mode: {mode}")


if __name__ == "__main__":
    raise SystemExit(main())



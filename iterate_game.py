import argparse
import json
from pathlib import Path
from typing import Any, Dict

from iterators.code_feedback import iterate_once as run_code_feedback
from iterators.vibe_coding import improve_fun as run_vibe_coding

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
    parser = argparse.ArgumentParser(description="Iterate on a game given a config")
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    cfg = load_config(args.config)
    mode = cfg.get("mode")
    if mode == "code_feedback":
        game_dir = cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("code_feedback requires game_dir in config")
        res = run_code_feedback(
            game_dir=game_dir,
            feedback=cfg.get("feedback", ""),
            model=cfg.get("model", "anthropic:claude-3.7-sonnet"),
            thinking=bool(cfg.get("thinking", True)),
            thinking_budget=cfg.get("thinking_budget", 8000),
        )
        print(json.dumps(res))
        return 0
    if mode == "vibe_coding":
        game_dir = cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("vibe_coding requires game_dir in config")
        res = run_vibe_coding(
            game_dir=game_dir,
            model=cfg.get("model", "anthropic:claude-3.7-sonnet"),
            thinking=bool(cfg.get("thinking", True)),
            thinking_budget=cfg.get("thinking_budget", 8000),
        )
        print(json.dumps(res))
        return 0
    raise ValueError(f"Unknown iteration mode: {mode}")


if __name__ == "__main__":
    raise SystemExit(main())



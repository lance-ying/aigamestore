import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict

from iterators.base import CodeIterator
from iterators.vibe_coding import run_vibe_coding
from iterators.feedback_fix import FeedbackFixIterator

try:
    import yaml  # type: ignore
except Exception:
    yaml = None

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    # Remove surrounding quotes if present
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


def load_config(path: str) -> Dict[str, Any]:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if p.suffix in [".yml", ".yaml"] and yaml:
        return yaml.safe_load(text)
    return json.loads(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Iterate on a game given a config")
    parser.add_argument("--config", required=True)
    parser.add_argument("--output_dir", help="Optional output directory for non in-place modes")
    parser.add_argument("--game_folder", help="Path to game folder (for basic_bug_fix reading evaluation/basic_test/feedback.md)")
    args = parser.parse_args()

    cfg = load_config(args.config)
    mode = cfg.get("mode")
    if mode in ("code_iterator", "code_feedback", "basic_testing_fix"):
        # Backward compatible: "code_feedback" maps to the same iterator but requires explicit feedback
        game_dir = cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("code_iterator requires game_dir in config")
        feedback = cfg.get("feedback")
        if not feedback:
            # Allow passing via CLI flag
            parser2 = argparse.ArgumentParser(add_help=False)
            parser2.add_argument("--feedback")
            # Re-parse known args only
            known, _ = parser2.parse_known_args()
            feedback = getattr(known, "feedback", None)
        if not feedback:
            raise ValueError("code_iterator requires 'feedback' (no fallback text is provided)")
        it = CodeIterator(
            model=cfg.get("model", "anthropic:claude-3.7-sonnet"),
            temperature=float(cfg.get("temperature", 1.0)),
            thinking=bool(cfg.get("thinking", True)),
            thinking_budget=cfg.get("thinking_budget", 8000),
        )
        # basic_testing_fix implies in-place; otherwise allow output_dir switch via config/CLI
        in_place = True if mode in ("code_feedback", "basic_testing_fix") else bool(cfg.get("in_place", False))
        output_dir = args.output_dir or cfg.get("output_dir")
        res = it.iterate(game_dir, feedback, in_place=in_place, output_dir=output_dir)
        print(json.dumps(res))
        return 0
    if mode == "basic_bug_fix":
        game_dir = args.game_folder or cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("basic_bug_fix requires --game_folder or game_dir in config")
        bt_dir = Path(game_dir) / "evaluation" / "basic_test"
        fb_path = bt_dir / "feedback.md"
        if not bt_dir.exists() or not fb_path.exists():
            raise SystemExit("Missing evaluation/basic_test/feedback.md. Run basic_test first.")
        feedback = fb_path.read_text(encoding="utf-8")
        it = CodeIterator(
            model=cfg.get("model", "anthropic:claude-3.7-sonnet"),
            temperature=float(cfg.get("temperature", 1.0)),
            thinking=bool(cfg.get("thinking", True)),
            thinking_budget=cfg.get("thinking_budget", 8000),
        )
        res = it.iterate(game_dir, feedback, in_place=True, output_dir=None)
        print(json.dumps(res))
        return 0
    if mode == "vibe_coding":
        game_dir = cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("vibe_coding requires game_dir in config")
        res = run_vibe_coding(
            game_dir=game_dir,
            model=cfg.get("model", "anthropic:claude-3.7-sonnet"),
            max_iters=int(cfg.get("max_iters", 1)),
        )
        print(json.dumps(res))
        return 0
    if mode == "feedback_fix":
        game_dir = cfg.get("game_dir") or cfg.get("target")
        if not game_dir:
            raise ValueError("feedback_fix requires game_dir in config")
        feedback = cfg.get("feedback")
        if not feedback:
            # Allow passing via CLI flag
            parser2 = argparse.ArgumentParser(add_help=False)
            parser2.add_argument("--feedback")
            known, _ = parser2.parse_known_args()
            feedback = getattr(known, "feedback", None)
        if not feedback:
            raise ValueError("feedback_fix requires 'feedback' text")
        it = FeedbackFixIterator(
            model=cfg.get("model", "anthropic:claude-4.5-sonnet"),
            temperature=float(cfg.get("temperature", 0.6)),
            thinking=bool(cfg.get("thinking", True)),
            thinking_budget=cfg.get("thinking_budget", 8000),
        )
        res = it.iterate(
            game_dir=game_dir,
            feedback=feedback,
            use_planning=bool(cfg.get("use_planning", True)),
            in_place=bool(cfg.get("in_place", True)),
        )
        print(json.dumps(res))
        return 0
    raise ValueError(f"Unknown iteration mode: {mode}")


if __name__ == "__main__":
    raise SystemExit(main())



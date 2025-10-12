import argparse
import json
from pathlib import Path
from typing import Any, Dict

from generators.concept_and_game.generator import BaselineConceptAndGameGenerator
from generators.single_prompt_with_testing.generator import SinglePromptWithTestingGenerator

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
    parser = argparse.ArgumentParser(description="Generate a game from a config")
    parser.add_argument("--config", required=True, help="Path to generator config file")
    parser.add_argument("--game_index", type=int, required=False, help="Override next game index for output folder")
    parser.add_argument("--concept", type=str, required=False, help="Path to concept file to drive generation (single_prompt)")
    args = parser.parse_args()

    cfg = load_config(args.config)
    method = cfg.get("method", "concept_and_game")
    model = cfg.get("model", "openai:o4-mini")
    thinking = bool(cfg.get("thinking", False))
    thinking_budget = cfg.get("thinking_budget")
    temperature = cfg.get("temperature", 1.0)
    top_p = cfg.get("top_p", 1.0)

    if method == "concept_and_game":
        gen = BaselineConceptAndGameGenerator(
            model_name=model,
            verbose=True,
            thinking=thinking,
            thinking_budget=thinking_budget,
            temperature=temperature,
            top_p=top_p,
        )
        result = gen.generate_game()
    elif method == "single_prompt_with_testing":
        gen = SinglePromptWithTestingGenerator(
            model_name=model,
            verbose=True,
            thinking=thinking,
            thinking_budget=thinking_budget,
            temperature=temperature,
            top_p=top_p,
        )
        # Prefer CLI --concept if provided; else, config concept path
        concept_arg = args.concept or cfg.get("concept")
        result = gen.generate_game(concept_arg, forced_game_index=args.game_index)
    else:
        raise ValueError(f"Unknown method: {method}")

    # If user provided game_index, and path matches baseline structure, adjust
    override = args.game_index
    game_dir = result.get("game_dir")
    if override is not None and game_dir:
        from pathlib import Path
        p = Path(game_dir)
        # Support baseline concept path structure
        if p.name.startswith("sample_") and p.parent.name.startswith("game_") and p.parent.parent.name == "baseline_concept_game":
            base = p.parent.parent
            new_game = base / f"game_{override:04d}"
            new_game.mkdir(parents=True, exist_ok=True)
            new_sample = new_game / p.name
            # Move tree
            import shutil
            shutil.move(str(p), str(new_sample))
            # Remove old empty game dir if empty
            try:
                p.parent.rmdir()
            except Exception:
                pass
            game_dir = new_sample
    print(str(game_dir or ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



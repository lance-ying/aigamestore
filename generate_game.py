import argparse
import json
from pathlib import Path
from typing import Any, Dict
import yaml
from generators import BaselineConceptAndGameGenerator, SinglePromptWithTestingGenerator

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
    parser.add_argument("--output_folder", type=str, required=False, help="Custom output folder name under games/")
    parser.add_argument("--debug_prompts", action="store_true", help="Only build and print/save prompts; no model call")
    parser.add_argument("--debug_prompts_out", type=str, required=False, help="Optional file path to save built prompts")
    args = parser.parse_args()

    cfg = load_config(args.config)
    method = cfg.get("method", "concept_and_game")
    model = cfg.get("model", "openai:o4-mini")
    thinking = bool(cfg.get("thinking", False))
    thinking_budget = cfg.get("thinking_budget")
    temperature = cfg.get("temperature", 1.0)
    top_p = cfg.get("top_p", 1.0)
    prompt_config = {
        "libraries_allowed": cfg.get("libraries_allowed"),
        "actions_allowed": cfg.get("actions_allowed"),
        "canvas_width": cfg.get("canvas_width", 600),
        "canvas_height": cfg.get("canvas_height", 400),
        "output_folder": cfg.get("output_folder") or args.output_folder,
    }

    # Concept argument (used for single_prompt_with_testing)
    concept_arg = args.concept or cfg.get("concept")

    if method == "concept_and_game":
        gen = BaselineConceptAndGameGenerator(
            model_name=model,
            verbose=True,
            thinking=thinking,
            thinking_budget=thinking_budget,
            temperature=temperature,
            top_p=top_p,
            prompt_config=prompt_config,
        )
        if args.debug_prompts:
            system_prompt = gen.get_system_prompt()
            user_prompt = gen.generate_user_prompt()
            combined = (
                "=== SYSTEM PROMPT ===\n" + system_prompt + "\n\n" +
                "=== USER PROMPT ===\n" + user_prompt + "\n"
            )
            print(combined)
            if args.debug_prompts_out:
                Path(args.debug_prompts_out).write_text(combined, encoding="utf-8")
            return 0
        result = gen.generate_game()
    elif method == "single_prompt_with_testing":
        gen = SinglePromptWithTestingGenerator(
            model_name=model,
            verbose=True,
            thinking=thinking,
            thinking_budget=thinking_budget,
            temperature=temperature,
            top_p=top_p,
            prompt_config=prompt_config,
        )
        if args.debug_prompts:
            system_prompt = gen.get_system_prompt()
            user_prompt = gen.generate_user_prompt(concept_arg)
            combined = (
                "=== SYSTEM PROMPT ===\n" + system_prompt + "\n\n" +
                "=== USER PROMPT ===\n" + (user_prompt or "") + "\n"
            )
            print(combined)
            if args.debug_prompts_out:
                Path(args.debug_prompts_out).write_text(combined, encoding="utf-8")
            return 0
        result = gen.generate_game(concept_arg, forced_game_index=args.game_index)
    else:
        raise ValueError(f"Unknown method: {method}")

    # If user provided game_index, and path matches baseline structure, adjust
    override = args.game_index
    game_dir = result.get("game_dir")
    if override is not None and game_dir:
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

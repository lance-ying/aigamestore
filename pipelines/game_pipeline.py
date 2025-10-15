import argparse
from pathlib import Path
from typing import Optional

from pipelines.engine import run_pipeline


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Run game generation/evaluation/iteration pipelines")
    parser.add_argument("--pipeline", required=True, help="Path to pipeline YAML (e.g., configs/pipelines/single_prompt_basic.yaml)")
    parser.add_argument("--concept", help="Path to concept YAML/text file or raw text")
    parser.add_argument("--game_folder", help="Path to existing game directory to operate on")
    parser.add_argument("--debug_prompts", action="store_true", help="Save prompts under evaluation/prompts/")
    args = parser.parse_args(argv)

    pipeline_path = args.pipeline
    # If not an existing path, try resolving under configs/pipelines/
    if not Path(pipeline_path).exists():
        candidate = Path("configs") / "pipelines" / pipeline_path
        if candidate.exists():
            pipeline_path = str(candidate)
        else:
            raise SystemExit(f"Pipeline YAML not found: {pipeline_path}")

    res = run_pipeline(pipeline_path, concept=args.concept, game_folder=args.game_folder, debug_prompts=bool(args.debug_prompts))
    print(res)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
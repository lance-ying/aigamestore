import argparse
from typing import Optional

from evaluators.vlm.gemini_api import GeminiEvaluator


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="VLM evaluation using Gemini")
    parser.add_argument("video", help="Path to gameplay video")
    parser.add_argument("--prompt", type=str, default="Evaluate gameplay quality and success.")
    parser.add_argument("--model", type=str, default="gemini-2.5-flash-preview-04-17")
    args = parser.parse_args(argv)

    ev = GeminiEvaluator(model_name=args.model)
    out = ev.evaluate_video(args.video, args.prompt)
    print(out or "")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



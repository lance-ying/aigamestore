#!/usr/bin/env python3
"""Generate-test-fix loop.

Generates a browser game with an inline automated-testing plan, runs the
Playwright-based basic-test harness against the generated game, and iterates
LLM-driven fixes until the game passes or `--max-iters` is exhausted.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

THIS_DIR = Path(__file__).resolve().parent
REVIEW_UI_DIR = THIS_DIR.parent / "review_ui"
for p in (THIS_DIR, REVIEW_UI_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from llm_client import ModelClient
from source_clients import fetch_source_details
from generate import (
    DEFAULT_MODEL,
    DEFAULT_OUTPUT_ROOT,
    LIBRARY_LABELS,
    LIBRARY_PROMPT_NOTES,
    build_game_context,
    ensure_required_files,
    load_env_file,
    make_initial_concept,
    next_game_dir,
    normalize_library_name,
    parse_response,
    render_example_html,
)
from evaluators.basic_test.core.basic_test import test_game

PROMPT_PATH = THIS_DIR / "prompt_with_testing.md"


def build_testing_prompt(game_context: str, library: str) -> Tuple[str, str]:
    system_prompt = (
        "You are an expert JavaScript game developer. "
        f"Build small, clean, playable browser games with {LIBRARY_LABELS[library]}. "
        "Prefer simple readable modules over giant files or heavy abstractions. "
        "Always emit an automated-testing plan alongside the code."
    )
    template = PROMPT_PATH.read_text(encoding="utf-8")
    html_template = render_example_html(library, "Game Title", "One short description of the game.")
    user_prompt = (
        template.replace("{game_context}", game_context)
        .replace("{library_name}", LIBRARY_LABELS[library])
        .replace("{library_prompt_notes}", LIBRARY_PROMPT_NOTES[library])
        .replace("{example_html}", html_template)
    )
    return system_prompt, user_prompt


def parse_testing_block(response_text: str) -> Optional[str]:
    match = re.search(r"<automated_testing>(.*?)</automated_testing>", response_text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else None


def write_game_files(game_dir: Path, files: Dict[str, str]) -> None:
    for filename, content in files.items():
        destination = game_dir / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")


def format_test_feedback(result: Dict[str, Any]) -> str:
    lines: List[str] = ["# Basic Test Report"]
    lines.append(f"Status: {'PASSED' if result.get('test_result') else 'FAILED'}")
    lines.append("")
    lines.append("## Summary")
    start = result.get("start_on_enter") or {}
    inter = result.get("interaction") or {}
    lines.append(f"- Loaded: {'OK' if result.get('loaded') else 'FAIL'}")
    lines.append(
        f"- Start on Enter: {'OK' if start.get('passed') else 'FAIL'} "
        f"(phase {start.get('phase_before')} -> {start.get('phase_after')}, "
        f"visual={'changed' if start.get('visual_changed') else 'no-change'})"
    )
    lines.append(
        f"- Interaction: {'OK' if inter.get('passed') else 'FAIL'} "
        f"(state={'changed' if inter.get('state_changed') else 'no-change'}, "
        f"visual={'changed' if inter.get('visual_changed') else 'no-change'})"
    )
    page_errors = result.get("page_errors") or []
    if page_errors:
        lines.extend(["", "## Page errors"])
        lines.extend(f"- {e}" for e in page_errors[:10])
    console_errors = result.get("console_errors") or {}
    if console_errors:
        lines.extend(["", "## Console messages (sample)"])
        for k, msgs in console_errors.items():
            if msgs:
                lines.append(f"- {k}: {msgs[:5]}")
    if not inter.get("passed"):
        lines.extend([
            "",
            "Inputs did not produce state or visual changes. Ensure the game responds to "
            "Space, arrow keys, Z, and Shift, and that `window.getGameState()` reflects "
            "the current phase.",
        ])
    return "\n".join(lines)


def read_current_files(game_dir: Path) -> Dict[str, str]:
    files: Dict[str, str] = {}
    html = game_dir / "index.html"
    if html.exists():
        files["index.html"] = html.read_text(encoding="utf-8")
    for js in game_dir.rglob("*.js"):
        rel = js.relative_to(game_dir).as_posix()
        files[rel] = js.read_text(encoding="utf-8")
    return files


def build_fix_prompt(library: str, feedback: str, files: Dict[str, str], testing_plan: Optional[str]) -> Tuple[str, str]:
    system_prompt = (
        f"You are fixing a {LIBRARY_LABELS[library]} browser game so it passes an automated "
        "smoke test (load, press ENTER to start, then random gameplay keys). "
        "Apply the minimal change that addresses the feedback while preserving working behavior."
    )
    file_blocks = "\n\n".join(
        f'<file name="{name}">\n{content}\n</file>' for name, content in files.items()
    )
    testing_section = f"<automated_testing>\n{testing_plan}\n</automated_testing>\n\n" if testing_plan else ""
    user_prompt = (
        f"{testing_section}"
        f"<feedback>\n{feedback}\n</feedback>\n\n"
        f"<current_files>\n{file_blocks}\n</current_files>\n\n"
        "Return exactly one updated file in this format and nothing else:\n"
        '<updated_code filename="RELATIVE_PATH">\n'
        "... (full updated file contents)\n"
        "</updated_code>\n"
    )
    return system_prompt, user_prompt


def parse_fix_response(response_text: str) -> Optional[Tuple[str, str]]:
    match = re.search(
        r'<updated_code\s+filename=["\']([^"\']+)["\']\s*>(.*?)</updated_code>',
        response_text,
        re.DOTALL | re.IGNORECASE,
    )
    if not match:
        return None
    filename = match.group(1).strip()
    content = match.group(2)
    content = re.sub(r"^\s*```(?:javascript|js|html)?\n", "", content)
    content = re.sub(r"\n```\s*$", "", content)
    return filename, content.strip()


def run_test(game_dir: Path, duration: int, timeout: int) -> Dict[str, Any]:
    return test_game(str(game_dir), duration=duration, timeout=timeout)


def main() -> int:
    load_env_file()

    parser = argparse.ArgumentParser(description="Generate-test-fix loop for browser games")
    parser.add_argument("--source", choices=["steam", "app_store"], required=True)
    parser.add_argument("--url", required=True)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--library", default="p5js")
    parser.add_argument("--game-index", type=int, default=None)
    parser.add_argument("--summary-only", action="store_true")
    parser.add_argument("--output-root", default=str(DEFAULT_OUTPUT_ROOT))
    parser.add_argument("--max-iters", type=int, default=2, help="Max LLM fix passes after the initial generation")
    parser.add_argument("--duration", type=int, default=10, help="Seconds of simulated play per test run")
    parser.add_argument("--timeout", type=int, default=30, help="Hard timeout per test run (seconds)")
    args = parser.parse_args()

    library = normalize_library_name(args.library)
    details = fetch_source_details(args.source, args.url)
    concept = build_game_context(details, include_full_description=not args.summary_only)
    system_prompt, user_prompt = build_testing_prompt(concept, library)

    output_root = Path(args.output_root).expanduser().resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    client = ModelClient(args.model)
    print("[generate] calling model for initial draft + testing plan...")
    response_text = client.call(system_prompt=system_prompt, user_prompt=user_prompt)

    files, parsed_meta = parse_response(response_text)
    files = ensure_required_files(
        files,
        fallback_title=details.get("name", "Untitled Game"),
        fallback_description=make_initial_concept(details),
        library=library,
    )
    if "index.html" not in files or not any(name.endswith(".js") for name in files):
        raise RuntimeError("Model response is missing index.html or any .js files")

    testing_plan = parse_testing_block(response_text)

    game_dir = next_game_dir(output_root, args.game_index)
    game_dir.mkdir(parents=True, exist_ok=True)
    write_game_files(game_dir, files)

    eval_dir = game_dir / "evaluation" / "basic_test"
    eval_dir.mkdir(parents=True, exist_ok=True)

    iteration_log: List[Dict[str, Any]] = []

    print(f"[test] running basic_test on {game_dir}")
    result = run_test(game_dir, args.duration, args.timeout)
    feedback = format_test_feedback(result)
    (eval_dir / "results_iter_00.json").write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    (eval_dir / "feedback_iter_00.md").write_text(feedback, encoding="utf-8")
    iteration_log.append({"iter": 0, "test_result": bool(result.get("test_result")), "feedback_path": "evaluation/basic_test/feedback_iter_00.md"})

    iter_index = 0
    while not result.get("test_result") and iter_index < args.max_iters:
        iter_index += 1
        print(f"[fix] iteration {iter_index}/{args.max_iters}: requesting fix...")
        current = read_current_files(game_dir)
        fix_system, fix_user = build_fix_prompt(library, feedback, current, testing_plan)
        fix_response = client.call(system_prompt=fix_system, user_prompt=fix_user)
        parsed = parse_fix_response(fix_response)
        if not parsed:
            print(f"[fix] iteration {iter_index}: model did not return an <updated_code> block; stopping.")
            (eval_dir / f"fix_iter_{iter_index:02d}_unparsed.txt").write_text(fix_response, encoding="utf-8")
            break
        rel, content = parsed
        target = game_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        print(f"[fix] iteration {iter_index}: updated {rel}")

        print(f"[test] re-running basic_test (iter {iter_index})")
        result = run_test(game_dir, args.duration, args.timeout)
        feedback = format_test_feedback(result)
        (eval_dir / f"results_iter_{iter_index:02d}.json").write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
        (eval_dir / f"feedback_iter_{iter_index:02d}.md").write_text(feedback, encoding="utf-8")
        iteration_log.append({
            "iter": iter_index,
            "updated_file": rel,
            "test_result": bool(result.get("test_result")),
            "feedback_path": f"evaluation/basic_test/feedback_iter_{iter_index:02d}.md",
        })

    metadata = {
        "game_info": {
            "title": parsed_meta.get("game_title") or details.get("name") or game_dir.name,
            "description": parsed_meta.get("game_description") or concept,
            "controls": parsed_meta.get("game_controls") or "",
            "concept": concept,
        },
        "source_info": {
            "source": details.get("source"),
            "source_label": details.get("source_label"),
            "url": details.get("url"),
            "app_id": details.get("app_id"),
            "name": details.get("name"),
        },
        "generation_info": {
            "model": args.model,
            "library": library,
            "timestamp": datetime.now().isoformat(),
            "output_shape": sorted(files.keys()),
            "max_iters": args.max_iters,
            "passed": bool(result.get("test_result")),
            "iterations": iteration_log,
        },
        "automated_testing_plan": testing_plan,
    }
    (game_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (game_dir / "concept.txt").write_text(concept, encoding="utf-8")
    (game_dir / "prompt.txt").write_text(user_prompt, encoding="utf-8")
    (game_dir / "response.txt").write_text(response_text, encoding="utf-8")
    if testing_plan:
        (game_dir / "automated_testing.md").write_text(testing_plan, encoding="utf-8")

    final = "PASSED" if result.get("test_result") else "FAILED"
    print(f"[done] {game_dir} ({final} after {iter_index} fix iteration(s))")
    print(str(game_dir))
    return 0 if result.get("test_result") else 1


if __name__ == "__main__":
    raise SystemExit(main())

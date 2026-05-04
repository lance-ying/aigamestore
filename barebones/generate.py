#!/usr/bin/env python3
"""Standalone barebones game generator."""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from llm_client import ModelClient
from source_clients import fetch_source_details


DEFAULT_MODEL = "google:gemini-3.1-pro-preview"
DEFAULT_OUTPUT_ROOT = THIS_DIR / "generated"
PROMPT_PATH = THIS_DIR / "prompt.md"
TEMPLATE_PATH = THIS_DIR / "output_template.html"
LIBRARY_ALIASES = {
    "p5js": "p5js",
    "p5.js": "p5js",
    "matterjs": "matterjs",
    "matter.js": "matterjs",
    "threejs": "threejs",
    "three.js": "threejs",
}
LIBRARY_LABELS = {
    "p5js": "p5.js",
    "matterjs": "matter.js",
    "threejs": "three.js",
}
LIBRARY_PROMPT_NOTES = {
    "p5js": (
        "Use p5.js in instance mode. Create the canvas inside `#game-root` and expose the game instance as "
        "`window.gameInstance` if convenient."
    ),
    "matterjs": (
        "Use matter.js for physics and p5.js for rendering. Load matter.js from a script tag, read it from "
        "`window.Matter`, and render the game into `#game-root`."
    ),
    "threejs": (
        "Use three.js with ES module imports inside `game.js`. Build the scene in `#game-root`, create a camera, "
        "renderer, lights, and animate with `requestAnimationFrame`."
    ),
}


def load_env_file() -> None:
    env_file = THIS_DIR / ".env"
    if env_file.exists():
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip()
            if value and value[0] in ("'", '"') and value[-1] == value[0]:
                value = value[1:-1]
            os.environ[key.strip()] = value


def make_initial_concept(details: Dict[str, str]) -> str:
    summary = (details.get("summary") or "").strip()
    description = (details.get("description") or "").strip()
    if summary:
        return summary
    if not description:
        return f"Create a small browser game inspired by {details.get('name', 'this game')}."
    first_block = description.split("\n\n", 1)[0].strip()
    if len(first_block) <= 320:
        return first_block
    sentence_parts = re.split(r"(?<=[.!?])\s+", first_block)
    concept = " ".join(sentence_parts[:2]).strip()
    if concept:
        return concept[:320]
    return first_block[:320].rstrip() + "..."


def build_game_context(details: Dict[str, str], include_full_description: bool) -> str:
    concept = make_initial_concept(details)
    lines = [
        f"Name: {details.get('name', 'Unknown Game')}",
        f"Source: {details.get('source_label', 'Unknown')}",
        f"URL: {details.get('url', '')}",
        "",
        "Short Concept:",
        concept,
    ]
    description = (details.get("description") or "").strip()
    if include_full_description and description:
        lines.extend(["", "Source Description:", description])
    return "\n".join(lines).strip()


def normalize_library_name(raw_value: str) -> str:
    key = raw_value.strip().lower()
    if key not in LIBRARY_ALIASES:
        raise ValueError(f"Unsupported library '{raw_value}'. Use p5js, matterjs, or threejs.")
    return LIBRARY_ALIASES[key]


def render_example_html(library: str, title: str, description: str) -> str:
    script_tags = {
        "p5js": (
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>\n'
            '    <script type="module" src="game.js"></script>'
        ),
        "matterjs": (
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>\n'
            '    <script src="https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js"></script>\n'
            '    <script type="module" src="game.js"></script>'
        ),
        "threejs": '    <script type="module" src="game.js"></script>',
    }[library]
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    return (
        template.replace("{game_title}", title)
        .replace("{game_description}", description)
        .replace("{library_script_tags}", script_tags)
    )


def build_prompt(game_context: str, library: str) -> Tuple[str, str]:
    system_prompt = (
        "You are an expert JavaScript game developer. "
        f"Build small, clean, playable browser games with {LIBRARY_LABELS[library]}. "
        "Prefer simple readable modules over giant files or heavy abstractions."
    )
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    html_template = render_example_html(library, "Game Title", "One short description of the game.")
    user_prompt = prompt_template.replace("{game_context}", game_context)
    user_prompt = user_prompt.replace("{library_name}", LIBRARY_LABELS[library])
    user_prompt = user_prompt.replace("{library_prompt_notes}", LIBRARY_PROMPT_NOTES[library])
    user_prompt = user_prompt.replace("{example_html}", html_template)
    return system_prompt, user_prompt


def parse_response(response_text: str) -> Tuple[Dict[str, str], Dict[str, str]]:
    blocks: Dict[str, str] = {}
    metadata: Dict[str, str] = {}

    for tag in ("game_title", "game_description", "game_controls"):
        match = re.search(rf"<{tag}>\s*(.*?)\s*</{tag}>", response_text, re.DOTALL | re.IGNORECASE)
        if match:
            metadata[tag] = match.group(1).strip()

    for match in re.finditer(
        r"<code\s+filename=[\"']([^\"']+)[\"']\s*>(.*?)</code>",
        response_text,
        re.DOTALL | re.IGNORECASE,
    ):
        filename = match.group(1).strip()
        content = match.group(2).strip()
        blocks[filename] = content

    return blocks, metadata


def ensure_required_files(
    files: Dict[str, str],
    fallback_title: str,
    fallback_description: str,
    library: str,
) -> Dict[str, str]:
    normalized = dict(files)
    js_files = [name for name in normalized if name.endswith(".js")]
    if "index.html" not in normalized and js_files:
        normalized["index.html"] = render_example_html(library, fallback_title, fallback_description)
    return normalized


def next_game_dir(output_root: Path, forced_index: Optional[int]) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    if forced_index is not None:
        return output_root / f"game_{forced_index:04d}"

    existing = []
    for item in output_root.iterdir():
        if item.is_dir() and re.fullmatch(r"game_\d{4}", item.name):
            existing.append(int(item.name.split("_")[1]))
    next_index = (max(existing) + 1) if existing else 0
    return output_root / f"game_{next_index:04d}"


def save_game(
    *,
    output_root: Path,
    forced_index: Optional[int],
    files: Dict[str, str],
    details: Dict[str, str],
    concept: str,
    model: str,
    library: str,
    raw_response: Optional[str],
    parsed_meta: Dict[str, str],
    prompt_text: str,
) -> Path:
    game_dir = next_game_dir(output_root, forced_index)
    game_dir.mkdir(parents=True, exist_ok=True)

    for filename, content in files.items():
        destination = game_dir / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")

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
            "model": model,
            "library": library,
            "timestamp": datetime.now().isoformat(),
            "output_shape": sorted(files.keys()),
        },
    }
    (game_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (game_dir / "concept.txt").write_text(concept, encoding="utf-8")
    (game_dir / "prompt.txt").write_text(prompt_text, encoding="utf-8")
    if raw_response is not None:
        (game_dir / "response.txt").write_text(raw_response, encoding="utf-8")
    return game_dir


def print_debug_prompt(system_prompt: str, user_prompt: str) -> None:
    print("=== SYSTEM PROMPT ===")
    print(system_prompt)
    print()
    print("=== USER PROMPT ===")
    print(user_prompt)


def main() -> int:
    load_env_file()

    parser = argparse.ArgumentParser(description="Standalone barebones game generator")
    parser.add_argument("--source", choices=["steam", "app_store"], required=True)
    parser.add_argument("--url", required=True, help="Steam or App Store URL")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument(
        "--library",
        default="p5js",
        help="Game library: p5js, matterjs, threejs (also accepts p5.js, matter.js, three.js)",
    )
    parser.add_argument("--game-index", type=int, default=None)
    parser.add_argument("--summary-only", action="store_true", help="Do not include the full source description in the prompt")
    parser.add_argument("--skip-generation", action="store_true", help="Stop after writing prompt and concept artifacts")
    parser.add_argument("--debug-prompt", action="store_true", help="Print the assembled prompt")
    parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Output directory for generated games (default: barebones/generated)",
    )
    args = parser.parse_args()

    library = normalize_library_name(args.library)
    details = fetch_source_details(args.source, args.url)
    concept = build_game_context(details, include_full_description=not args.summary_only)
    system_prompt, user_prompt = build_prompt(concept, library)

    output_root = Path(args.output_root).expanduser().resolve()

    if args.debug_prompt:
        print_debug_prompt(system_prompt, user_prompt)

    if args.skip_generation:
        placeholder_files = {
            "index.html": render_example_html(
                library,
                details.get("name", "Untitled Game"),
                make_initial_concept(details),
            )
        }
        game_dir = save_game(
            output_root=output_root,
            forced_index=args.game_index,
            files=placeholder_files,
            details=details,
            concept=concept,
            model=args.model,
            library=library,
            raw_response=None,
            parsed_meta={},
            prompt_text=user_prompt,
        )
        print(str(game_dir))
        return 0

    client = ModelClient(args.model)
    response_text = client.call(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )
    files, parsed_meta = parse_response(response_text)
    files = ensure_required_files(
        files,
        fallback_title=details.get("name", "Untitled Game"),
        fallback_description=make_initial_concept(details),
        library=library,
    )

    if "index.html" not in files:
        raise RuntimeError("Model response did not include index.html or any JavaScript files to synthesize one")
    if not any(name.endswith(".js") for name in files):
        raise RuntimeError("Model response did not include any JavaScript files")

    game_dir = save_game(
        output_root=output_root,
        forced_index=args.game_index,
        files=files,
        details=details,
        concept=concept,
        model=args.model,
        library=library,
        raw_response=response_text,
        parsed_meta=parsed_meta,
        prompt_text=user_prompt,
    )
    print(str(game_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

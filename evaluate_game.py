import argparse
import json
from pathlib import Path
from typing import Any, Dict
import os

from evaluators.basic_test.runner import test_game as run_basic
from evaluators.vlm.gemini_api import GeminiEvaluator
from evaluators.vlm.run import evaluate_game_folder
from utils.saving_utils.eval_writer import ensure_eval_subdir, write_json

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

try:
    from rich import box
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    RICH_OK = True
    _console = Console()
except Exception:
    RICH_OK = False
    _console = None  # type: ignore

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


def _print_basic_test_results(res: Dict[str, Any]) -> None:
    if not RICH_OK:
        print(json.dumps(res, indent=2))
        return
    ok = bool(res.get("test_result"))
    title = "BASIC TEST: PASSED" if ok else "BASIC TEST: FAILED"
    border = "green" if ok else "red"

    table = Table.grid(expand=True)
    # Top line: show three core checks
    loaded_ok = bool(res.get("loaded"))
    start_obj = res.get("start_on_enter") or {}
    start_ok = bool(start_obj.get("passed"))
    inter_obj = res.get("interaction") or {}
    inter_ok = bool(inter_obj.get("passed"))
    table.add_row(
        f"Loaded: {'[green]True[/]' if loaded_ok else '[red]False[/]'}  |  Start on Enter: {'[green]OK[/]' if start_ok else '[red]FAIL[/]'}  |  Interaction: {'[green]OK[/]' if inter_ok else '[red]FAIL[/]'}"
    )
    # Add details for start and interaction
    if start_obj:
        table.add_row(
            f"Start details → phase: {start_obj.get('phase_before')} → {start_obj.get('phase_after')} | visual: {'changed' if start_obj.get('visual_changed') else 'no-change'}"
        )
    if inter_obj:
        table.add_row(
            f"Interaction details → state: {'changed' if inter_obj.get('state_changed') else 'no-change'} | visual: {'changed' if inter_obj.get('visual_changed') else 'no-change'}"
        )

    page_errors = res.get("page_errors") or []
    console_errors = res.get("console_errors") or {}
    request_failures = res.get("request_failures") or []

    if page_errors:
        table.add_row(f"[bold]Page errors[/]: {len(page_errors)}")
        for e in page_errors[:5]:
            table.add_row(f"  [red]{e}[/]")
    if console_errors:
        table.add_row("[bold]Console messages[/]:")
        for level, msgs in list(console_errors.items())[:3]:
            sample = msgs[:2] if isinstance(msgs, list) else []
            table.add_row(f"  {level}: {sample}")
    if request_failures:
        table.add_row(f"[bold]HTTP issues[/]: {len(request_failures)} (showing up to 3)")
        for f in request_failures[:3]:
            table.add_row(f"  {f.get('status', '')} {f.get('method', '')} {f.get('url', '')}")

    _console.print(Panel.fit(table, title=title, border_style=border, box=box.ROUNDED))


def _format_basic_feedback(res: Dict[str, Any]) -> str:
    lines = []
    lines.append("# Basic Test Report")
    status = "PASSED" if res.get("test_result") else "FAILED"
    lines.append(f"Status: {status}")
    lines.append("")
    lines.append("## Summary")
    loaded_ok = bool(res.get("loaded"))
    start = res.get("start_on_enter") or {}
    inter = res.get("interaction") or {}
    lines.append(f"- Loaded: {'OK' if loaded_ok else 'FAIL'}")
    lines.append(f"- Start on Enter: {'OK' if start.get('passed') else 'FAIL'} (phase {start.get('phase_before')} → {start.get('phase_after')}, visual={'changed' if start.get('visual_changed') else 'no-change'})")
    lines.append(f"- Interaction: {'OK' if inter.get('passed') else 'FAIL'} (state={'changed' if inter.get('state_changed') else 'no-change'}, visual={'changed' if inter.get('visual_changed') else 'no-change'})")
    lines.append("")
    pes = res.get("page_errors") or []
    if pes:
        lines.append("## Page errors")
        for e in pes:
            lines.append(f"- {e}")
        lines.append("")
    ce = res.get("console_errors") or {}
    if ce:
        lines.append("## Console messages (sample)")
        try:
            for k, msgs in ce.items():
                if msgs:
                    lines.append(f"- {k}: {msgs[:5]}")
        except Exception:
            pass
        lines.append("")
    rf = res.get("request_failures") or []
    if rf:
        lines.append("## HTTP issues (sample)")
        for f in rf[:10]:
            lines.append(f"- {f}")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate game from a config")
    parser.add_argument("--config", required=True)
    parser.add_argument("--game_folder", required=False, help="Game directory containing index.html and game files")
    parser.add_argument("--debug", action="store_true", help="Enable verbose debug logs for basic testing")
    parser.add_argument("--save_video_only", action="store_true", help="Record and save videos only; skip VLM model call")
    parser.add_argument("--debug_prompts", action="store_true", help="Record videos and print VLM prompts once; also save videos")
    args = parser.parse_args()

    cfg = load_config(args.config)
    mode = cfg.get("mode")

    if mode == "basic_test":
        game_path = args.game_folder or cfg.get("game_folder") or cfg.get("game_path")
        if not game_path:
            raise ValueError("basic_test requires --game_folder or game_folder in config")
        res = run_basic(
            game_path,
            duration=int(cfg.get("duration", 10)),
            timeout=int(cfg.get("timeout", 20)),
            debug=bool(args.debug or cfg.get("debug", False)),
            save_dir=str(ensure_eval_subdir(game_path, "basic_test")),
        )
        # Save under evaluation/basic_test/results.json
        out_dir = ensure_eval_subdir(game_path, "basic_test")
        # Do not embed keypress_log in results.json; persist separately
        klog = res.pop("keypress_log", None)
        write_json(Path(out_dir) / "results.json", res)
        # Save keypress log (always write; empty list if none)
        if klog is None:
            klog = []
        write_json(Path(out_dir) / "keypress_log.json", klog)
        # Save feedback.md for iterator consumption
        try:
            (Path(out_dir) / "feedback.md").write_text(_format_basic_feedback(res), encoding="utf-8")
        except Exception:
            pass
        _print_basic_test_results(res)
        return 0

    if mode == "vlm":
        # Only support evaluating from a game folder (records videos internally)
        target = args.game_folder or cfg.get("game_folder") or cfg.get("target") or cfg.get("video")
        prompt = cfg.get("prompt", "Evaluate gameplay quality and success.")
        model = cfg.get("model", "gemini-2.5-flash")
        if not target or not os.path.isdir(target):
            raise ValueError("vlm requires --game_folder or game_folder in config (path to a game directory)")
        import asyncio
        # Pull optional duration and resolution from config
        duration = int(cfg.get("capture_seconds", cfg.get("duration", 10)))
        res_w_h = cfg.get("resolution") or cfg.get("size")
        resolution = None
        try:
            if isinstance(res_w_h, (list, tuple)) and len(res_w_h) == 2:
                resolution = (int(res_w_h[0]), int(res_w_h[1]))
        except Exception:
            resolution = None

        res = asyncio.get_event_loop().run_until_complete(
            evaluate_game_folder(
                target,
                prompt,
                model,
                save_video_only=bool(args.save_video_only),
                debug_prompts=bool(args.debug_prompts),
                duration=duration,
                resolution=resolution,
            )
        )
        # Save VLM results under evaluations/vlm_evaluations
        out_dir = ensure_eval_subdir(target, "..", "evaluations", "vlm_evaluations")
        write_json(Path(out_dir) / "results.json", res)
        if RICH_OK:
            ok_count = sum(1 for e in (res.get("evaluations") or []) if (e.get("feedback") or "").strip())
            _console.print(Panel.fit(f"VLM evaluations: {ok_count}", title="VLM", border_style="cyan", box=box.ROUNDED))
        else:
            print(json.dumps(res))
        return 0

    raise ValueError(f"Unknown evaluation mode: {mode}")


if __name__ == "__main__":
    raise SystemExit(main())



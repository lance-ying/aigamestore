from __future__ import annotations

import argparse
import asyncio
import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml  # type: ignore

# Generators
from generators.concept_and_game import BaselineConceptAndGameGenerator
from generators.single_prompt_with_testing import SinglePromptWithTestingGenerator

# Evaluators
from evaluators.basic_test.core.basic_test import test_game as run_basic_test

# VLM evaluator helper (async)
try:
    from evaluators.vlm.run import evaluate_game_folder as vlm_evaluate_game_folder  # type: ignore
except Exception:
    vlm_evaluate_game_folder = None  # type: ignore

# Iterators
from iterators.base import CodeIterator

from utils.saving_utils.file_writer import save_game_single_prompt, save_game_baseline_concept  # noqa: F401 (import validates module availability)
from utils.saving_utils.eval_writer import (
    ensure_eval_subdir,
    write_json,
    copy_into,
)


@dataclass
class StepResult:
    name: str
    status: str
    game_dir: Optional[str] = None
    artifacts: Dict[str, Any] = field(default_factory=dict)


class PipelineContext:
    def __init__(self, concept: Optional[str] = None, game_folder: Optional[str] = None, debug_prompts: bool = False) -> None:
        self.data: Dict[str, Any] = {}
        if concept:
            self.data["concept"] = concept
        if game_folder:
            self.data["game_dir"] = game_folder
        self.data["debug_prompts"] = debug_prompts

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self.data[key] = value


def _should_run(condition: Optional[str], previous: Dict[str, StepResult]) -> bool:
    if not condition:
        return True
    condition = condition.strip()
    if condition.startswith("failed(") and condition.endswith(")"):
        step_name = condition[len("failed(") : -1]
        res = previous.get(step_name)
        return bool(res and res.status == "failed")
    if condition.startswith("succeeded(") and condition.endswith(")"):
        step_name = condition[len("succeeded(") : -1]
        res = previous.get(step_name)
        return bool(res and res.status == "ok")
    # Unknown condition; default to True
    return True


def _load_yaml(yaml_path: str) -> Dict[str, Any]:
    with open(yaml_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _read_concept_text(concept_path: str) -> str:
    p = Path(concept_path)
    try:
        if p.suffix in (".yml", ".yaml"):
            data = yaml.safe_load(p.read_text(encoding="utf-8"))
            if isinstance(data, dict) and "concept" in data:
                return str(data.get("concept") or "").strip()
        return p.read_text(encoding="utf-8").strip()
    except Exception:
        return ""


def _save_debug_prompt(game_dir: str, name: str, content: str) -> None:
    out_dir = ensure_eval_subdir(game_dir, "prompts")
    out = Path(out_dir) / f"{name}.txt"
    try:
        out.write_text(content, encoding="utf-8")
    except Exception:
        pass


def run_generator(step_conf: Dict[str, Any], ctx: PipelineContext) -> StepResult:
    name = step_conf.get("name") or "generator"
    config = step_conf.get("config") or {}
    model = config.get("model")
    prompt_config = config.get("prompt_config") or {}
    verbose = bool(config.get("verbose", False))
    thinking = bool(config.get("thinking", False))
    thinking_budget = config.get("thinking_budget")

    if name == "concept_and_game":
        gen = BaselineConceptAndGameGenerator(
            model_name=model or "anthropic:claude-4-sonnet",
            verbose=verbose,
            thinking=thinking,
            thinking_budget=thinking_budget,
            prompt_config=prompt_config,
        )
        if ctx.get("debug_prompts"):
            try:
                up = gen.generate_user_prompt()
                _save_debug_prompt(ctx.get("game_dir") or os.getcwd(), "concept_and_game_user", up)
            except Exception:
                pass
        out = gen.generate_game()
        game_dir = str(out.get("game_dir"))
        ctx.set("game_dir", game_dir)
        return StepResult(name=name, status="ok", game_dir=game_dir, artifacts=out)

    if name == "single_prompt_with_testing":
        concept_path_or_text = ctx.get("concept")
        gen = SinglePromptWithTestingGenerator(
            model_name=model or "anthropic:claude-4-sonnet",
            verbose=verbose,
            thinking=thinking,
            thinking_budget=thinking_budget,
            prompt_config=prompt_config,
        )
        if ctx.get("debug_prompts"):
            try:
                up = gen.generate_user_prompt(_read_concept_text(concept_path_or_text) if concept_path_or_text else None)
                _save_debug_prompt(ctx.get("game_dir") or os.getcwd(), "single_prompt_user", up)
            except Exception:
                pass
        out = gen.generate_game(concept_path_or_text)
        game_dir = str(out.get("game_dir"))
        ctx.set("game_dir", game_dir)
        return StepResult(name=name, status="ok", game_dir=game_dir, artifacts=out)

    raise ValueError(f"Unknown generator step name: {name}")


def run_evaluator(step_conf: Dict[str, Any], ctx: PipelineContext) -> StepResult:
    name = step_conf.get("name") or "evaluator"
    config = step_conf.get("config") or {}
    game_dir = str(ctx.get("game_dir"))

    if name == "basic_test":
        duration = int(config.get("duration", 10))
        timeout = int(config.get("timeout", 20))
        debug = bool(config.get("debug", False))
        res = run_basic_test(game_dir, duration=duration, timeout=timeout, debug=debug, save_dir=str(ensure_eval_subdir(game_dir, "basic_test")))
        # Save artifacts
        out_dir = ensure_eval_subdir(game_dir, "basic_test")
        # Strip keypress_log from results.json; save separately
        klog = res.pop("keypress_log", None)
        write_json(Path(out_dir) / "results.json", res)
        # Persist keypress log (always write; empty list if none)
        if klog is None:
            klog = []
        write_json(Path(out_dir) / "keypress_log.json", klog)
        # Write feedback.md for iterators
        try:
            fb = _format_basic_feedback_for_pipeline(res)
            (Path(out_dir) / "feedback.md").write_text(fb, encoding="utf-8")
        except Exception:
            pass
        status = "ok" if bool(res.get("test_result")) else "failed"
        return StepResult(name=name, status=status, game_dir=game_dir, artifacts={"results": res, "output_dir": out_dir})

    if name == "vlm":
        if vlm_evaluate_game_folder is None:
            return StepResult(name=name, status="failed", game_dir=game_dir, artifacts={"error": "VLM evaluator unavailable"})
        model = config.get("model", "gemini-2.5-flash")
        capture_seconds = int(config.get("capture_seconds", 30))
        # For now, rely on internal defaults of record/evaluator; pass model only
        async def _run() -> Dict[str, Any]:
            # evaluators.vlm.run internally records tests and calls Gemini
            return await vlm_evaluate_game_folder(game_dir, prompt_template="{test_description}\n{strategy_description}\n{expected_outcome}", model=model)

        results: Dict[str, Any]
        try:
            results = asyncio.run(_run())
        except RuntimeError:
            # If already in an event loop (rare), create a new one
            loop = asyncio.new_event_loop()
            results = loop.run_until_complete(_run())
            loop.close()

        # Save under evaluation/vlm/<timestamp>
        vlm_dir = ensure_eval_subdir(game_dir, os.path.join("vlm"))
        # Store summary
        write_json(Path(vlm_dir) / "results.json", results)

        # Optionally copy videos into evaluation directory if they live elsewhere
        try:
            evals = results.get("evaluations") or []
            videos_dir = Path(vlm_dir) / "videos"
            videos_dir.mkdir(parents=True, exist_ok=True)
            for e in evals:
                v = e.get("video")
                if isinstance(v, str) and v and os.path.exists(v):
                    copy_into(v, videos_dir)
        except Exception:
            pass

        return StepResult(name=name, status="ok", game_dir=game_dir, artifacts={"results": results, "output_dir": vlm_dir})

    raise ValueError(f"Unknown evaluator step name: {name}")


def _format_basic_fail_feedback(results: Dict[str, Any]) -> str:
    lines: List[str] = ["Automated basic testing failed. Address the following issues succinctly:"]
    if not results.get("loaded"):
        lines.append("- The game failed to load successfully.")
    if results.get("page_errors"):
        lines.append("- Page errors:")
        for e in results.get("page_errors", [])[:10]:
            lines.append(f"  - {e}")
    if results.get("console_errors"):
        lines.append("- Console messages:")
        try:
            for k, msgs in results.get("console_errors", {}).items():
                if msgs:
                    lines.append(f"  - {k}: {msgs[:5]}")
        except Exception:
            pass
    if not results.get("interaction_changes"):
        lines.append("- No state or visual changes observed during interactions. Ensure inputs update game state and canvas.")
    return "\n".join(lines)


def _format_basic_feedback_for_pipeline(res: Dict[str, Any]) -> str:
    lines: List[str] = []
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


def run_iterator(step_conf: Dict[str, Any], ctx: PipelineContext) -> StepResult:
    name = step_conf.get("name") or "iterator"
    config = step_conf.get("config") or {}
    game_dir = str(ctx.get("game_dir"))
    model = config.get("model") or "anthropic:claude-3.7-sonnet"
    temperature = float(config.get("temperature", 1.0))
    thinking = bool(config.get("thinking", False))
    thinking_budget = config.get("thinking_budget")
    max_iters = int(config.get("max_iters", 1))

    iterator = CodeIterator(model=model, temperature=temperature, thinking=thinking, thinking_budget=thinking_budget)
    # Common output control for iterators
    in_place = bool(config.get("in_place", False))
    output_dir_cfg = config.get("output_dir")

    if name == "basic_bug_fix":
        # Read feedback.md generated by basic_test
        bt_dir = Path(game_dir) / "evaluation" / "basic_test"
        fb_path = bt_dir / "feedback.md"
        if not bt_dir.exists() or not fb_path.exists():
            return StepResult(
                name=name,
                status="failed",
                game_dir=game_dir,
                artifacts={"error": "Missing evaluation/basic_test/feedback.md. Run basic_test first."},
            )
        feedback = fb_path.read_text(encoding="utf-8")
        out_dir = ensure_eval_subdir(game_dir, os.path.join("iteration", "basic_bug_fix"))
        status = "failed"
        last_meta: Dict[str, Any] = {}
        for _ in range(max_iters):
            meta = iterator.iterate(
                game_dir,
                feedback,
                debug_prompts=bool(ctx.get("debug_prompts")),
                in_place=True,  # basic bug fix always in-place per spec
                output_dir=None,
            )
            last_meta = meta
            write_json(Path(out_dir) / "last_iteration.json", meta)
            # Re-test
            again = run_basic_test(game_dir, duration=int(config.get("duration", 10)), timeout=int(config.get("timeout", 20)))
            write_json(Path(out_dir) / "post_test.json", again)
            if bool(again.get("test_result")):
                status = "ok"
                break
        return StepResult(name=name, status=status, game_dir=game_dir, artifacts={"iteration": last_meta, "output_dir": out_dir})

    if name == "vibe_coding":
        # Read concept text from metadata
        concept_text = ""
        try:
            meta = json.loads((Path(game_dir) / "metadata.json").read_text(encoding="utf-8"))
            concept_text = meta.get("game_info", {}).get("concept") or ""
        except Exception:
            pass
        feedback = (
            "Improve the game to be more fun and engaging while strictly adhering to the original concept.\n"
            + f"Concept: {concept_text}\n"
            + "Maintain existing controls and ensure the game passes automated basic testing."
        )
        # Determine external output_dir if provided; otherwise, keep under evaluation
        out_dir = output_dir_cfg or ensure_eval_subdir(game_dir, os.path.join("iteration", "vibe_coding"))
        status = "failed"
        last_meta: Dict[str, Any] = {}
        for _ in range(max_iters):
            meta = iterator.iterate(
                game_dir,
                feedback,
                debug_prompts=bool(ctx.get("debug_prompts")),
                in_place=bool(config.get("in_place", False)) == True and not output_dir_cfg,
                output_dir=out_dir if not bool(config.get("in_place", False)) and out_dir else None,
            )
            last_meta = meta
            write_json(Path(out_dir) / "last_iteration.json", meta)
            again = run_basic_test(game_dir, duration=int(config.get("duration", 10)), timeout=int(config.get("timeout", 20)))
            write_json(Path(out_dir) / "post_test.json", again)
            if bool(again.get("test_result")):
                status = "ok"
                break
        return StepResult(name=name, status=status, game_dir=game_dir, artifacts={"iteration": last_meta, "output_dir": out_dir})

    if name == "vlm_feedback":
        # Aggregate VLM feedback saved previously under evaluation/vlm/results.json
        vlm_dir = ensure_eval_subdir(game_dir, "vlm")
        results_path = Path(vlm_dir) / "results.json"
        feedback_texts: List[str] = []
        try:
            if results_path.exists():
                vlm_res = json.loads(results_path.read_text(encoding="utf-8"))
                for e in vlm_res.get("evaluations", []) or []:
                    t = e.get("feedback") or ""
                    mode = e.get("test_mode") or ""
                    if t:
                        feedback_texts.append(f"[{mode}] {t}")
        except Exception:
            pass
        combined = ("\n\n".join(feedback_texts)) or "Make targeted improvements to fun and clarity based on playthrough observations."
        out_dir = output_dir_cfg or ensure_eval_subdir(game_dir, os.path.join("iteration", "vlm_feedback"))
        status = "failed"
        last_meta: Dict[str, Any] = {}
        for _ in range(max_iters):
            meta = iterator.iterate(
                game_dir,
                combined,
                debug_prompts=bool(ctx.get("debug_prompts")),
                in_place=bool(config.get("in_place", False)) == True and not output_dir_cfg,
                output_dir=out_dir if not bool(config.get("in_place", False)) and out_dir else None,
            )
            last_meta = meta
            write_json(Path(out_dir) / "last_iteration.json", meta)
            again = run_basic_test(game_dir, duration=int(config.get("duration", 10)), timeout=int(config.get("timeout", 20)))
            write_json(Path(out_dir) / "post_test.json", again)
            if bool(again.get("test_result")):
                status = "ok"
                break
        return StepResult(name=name, status=status, game_dir=game_dir, artifacts={"iteration": last_meta, "output_dir": out_dir})

    raise ValueError(f"Unknown iterator step name: {name}")


def run_pipeline(pipeline_yaml: str, *, concept: Optional[str], game_folder: Optional[str], debug_prompts: bool = False) -> Dict[str, Any]:
    spec = _load_yaml(pipeline_yaml)
    required = spec.get("requires") or []
    steps: List[Dict[str, Any]] = spec.get("steps") or []

    if "concept" in required and not concept:
        raise ValueError("Pipeline requires --concept")
    if "game_folder" in required and not game_folder:
        raise ValueError("Pipeline requires --game_folder")

    ctx = PipelineContext(concept=concept, game_folder=game_folder, debug_prompts=debug_prompts)
    results: Dict[str, StepResult] = {}

    for step in steps:
        stype = step.get("type")
        sname = step.get("name") or stype
        condition = step.get("when")
        if not _should_run(condition, results):
            continue

        if stype == "generator":
            res = run_generator(step, ctx)
        elif stype == "evaluator":
            res = run_evaluator(step, ctx)
        elif stype == "iterator":
            res = run_iterator(step, ctx)
        else:
            raise ValueError(f"Unknown step type: {stype}")

        results[sname] = res

    # Summarize
    summary = {
        key: {
            "status": val.status,
            "game_dir": val.game_dir,
            "artifacts": list(val.artifacts.keys()),
        }
        for key, val in results.items()
    }
    return {"summary": summary, "context": ctx.data}




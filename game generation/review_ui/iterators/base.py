from __future__ import annotations

import os
import json
import shutil
import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from llm_interface.model_api import ModelAPI
from utils.prompt_formatting import prompt_utils


def _read_js_files(game_dir: str) -> List[Tuple[str, str]]:
    files: List[Tuple[str, str]] = []
    for root, _dirs, fs in os.walk(game_dir):
        for f in fs:
            if f.endswith(".js"):
                p = Path(root) / f
                files.append((str(p.relative_to(game_dir)), p.read_text(encoding="utf-8")))
    return files


def _apply_updates(game_dir: str, updates: Dict[str, str]) -> List[str]:
    updated: List[str] = []
    base = Path(game_dir)
    for rel, content in updates.items():
        out = base / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8")
        updated.append(rel)
    return updated


class CodeIterator:
    """Base code iterator that updates only JavaScript files using LLM feedback."""

    def __init__(
        self,
        model: str = "anthropic:claude-3.7-sonnet",
        temperature: float = 1.0,
        thinking: bool = True,
        thinking_budget: Optional[int] = 8000,
    ) -> None:
        self.api = ModelAPI(model)
        self.model = model
        self.temperature = temperature
        self.thinking = thinking
        self.thinking_budget = thinking_budget

    def iterate(
        self,
        game_dir: str,
        feedback: str,
        *,
        debug_prompts: bool = False,
        output_dir: Optional[str] = None,
        in_place: bool = True,
    ) -> Dict[str, Any]:
        js_files = _read_js_files(game_dir)

        # Prepare instruction template and output instructions using prompt utils
        try:
            hard_constraints = prompt_utils.format_hard_constraints({})
            code_instructions = prompt_utils.build_code_instructions({})
        except Exception:
            hard_constraints = ""
            code_instructions = ""

        instr_path = Path("prompts/iterator/iteration_instructions.md")
        instructions = instr_path.read_text(encoding="utf-8") if instr_path.exists() else ""
        if "{hard_constraints}" in instructions:
            instructions = instructions.replace("{hard_constraints}", hard_constraints)
        if "{code_instructions}" in instructions:
            instructions = instructions.replace("{code_instructions}", code_instructions)

        out_instr_path = Path("prompts/output_instructions/iterator.md")
        output_instructions = out_instr_path.read_text(encoding="utf-8") if out_instr_path.exists() else ""

        # Build prompt: provide feedback and current files; ask for single updated file only
        file_blobs = "\n\n".join(
            [f"<file name=\"{name}\">\n```javascript\n{content}\n```\n</file>" for name, content in js_files]
        )

        system = prompt_utils.build_system_prompt("prompts/common/system_prompt.md")
        user = (
            f"{instructions}\n\n"
            f"<feedback>\n{feedback}\n</feedback>\n\n"
            f"<current_files>\n{file_blobs}\n</current_files>\n\n"
            f"{output_instructions}"
        )

        if debug_prompts:
            try:
                prompts_dir = Path(game_dir) / "evaluation" / "prompts"
                prompts_dir.mkdir(parents=True, exist_ok=True)
                (prompts_dir / "iterator_system.txt").write_text(system, encoding="utf-8")
                (prompts_dir / "iterator_user.txt").write_text(user, encoding="utf-8")
            except Exception:
                pass

        resp = self.api.call(
            user_prompt=user,
            system_prompt=system,
            temperature=self.temperature,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )
        content = resp["response"] if isinstance(resp, dict) and "response" in resp else str(resp)

        # Parse single updated file
        import re

        updated_filename: Optional[str] = None
        updated_code: Optional[str] = None
        m = re.search(r"<updated_code filename=\"(.*?)\">(.*?)</updated_code>", content, re.DOTALL)
        if m:
            updated_filename = m.group(1).strip()
            updated_code = m.group(2)
            # strip code fences if present
            updated_code = re.sub(r"^```(javascript|js)?\n", "", updated_code).strip()
            updated_code = re.sub(r"\n```$", "", updated_code).strip()

        # Determine iteration index and prepare destinations
        updated_files: List[str] = []
        iter_index = 0
        iter_folder_name = "iter_00"
        backup_dir: Optional[Path] = None
        destination_root = Path(game_dir) if in_place or not output_dir else Path(output_dir)

        if in_place or not output_dir:
            # In-place: backup entire current game into .previous_code/iter_%02d
            prev_root = Path(game_dir) / ".previous_code"
            prev_root.mkdir(exist_ok=True)
            existing_iters = sorted([p for p in prev_root.glob("iter_*") if p.is_dir()])
            iter_index = len(existing_iters)
            iter_folder_name = f"iter_{iter_index:02d}"
            backup_dir = prev_root / iter_folder_name
            backup_dir.mkdir(parents=True, exist_ok=True)

            # Copy current game into backup (excluding bookkeeping dirs)
            for item in os.listdir(game_dir):
                if item in (".previous_code", "iteration_info"):
                    continue
                src = Path(game_dir) / item
                dst = backup_dir / item
                if src.is_dir():
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
        else:
            # Out-of-place: copy current game to output_dir
            destination_root.mkdir(parents=True, exist_ok=True)
            # Determine iter index under destination iteration_info
            it_info_root = destination_root / "iteration_info"
            if it_info_root.exists():
                existing_iters = sorted([p for p in it_info_root.glob("iter_*") if p.is_dir()])
                iter_index = len(existing_iters)
            else:
                iter_index = 0
            iter_folder_name = f"iter_{iter_index:02d}"

            for item in os.listdir(game_dir):
                if item in (".previous_code", "iteration_info"):
                    continue
                src = Path(game_dir) / item
                dst = destination_root / item
                if src.is_dir():
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)

        # Apply update: only the single returned file into destination_root
        if updated_filename and updated_code is not None:
            updates = {updated_filename: updated_code}
            updated_files = _apply_updates(str(destination_root), updates)

        # Collect token usage metadata
        token_usage = None
        hist = self.api.get_call_history()
        if hist:
            token_usage = hist[-1].get("token_usage")

        # Write iteration logs and metadata next to the destination
        it_info_root = destination_root / "iteration_info"
        it_info_dir = it_info_root / iter_folder_name
        it_info_dir.mkdir(parents=True, exist_ok=True)

        # Write raw artifacts
        (it_info_dir / "system_prompt.txt").write_text(system, encoding="utf-8")
        (it_info_dir / "user_prompt.txt").write_text(user, encoding="utf-8")
        (it_info_dir / "full_response.txt").write_text(content, encoding="utf-8")

        meta = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": self.model,
            "temperature": self.temperature,
            "thinking": self.thinking,
            "thinking_budget": self.thinking_budget,
            "feedback": feedback,
            "updated_filename": updated_filename,
            "updated_files": updated_files,
            "backup_dir": str(backup_dir) if backup_dir else None,
            "destination_dir": str(destination_root),
            "token_usage": token_usage,
        }
        (it_info_dir / "metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

        return meta




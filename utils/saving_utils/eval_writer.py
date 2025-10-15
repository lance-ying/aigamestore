from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any


def ensure_eval_subdir(game_dir: str, *subpaths: str) -> str:
    base = Path(game_dir) / "evaluation"
    full = base
    for sp in subpaths:
        if sp:
            # support nested paths like "vlm/videos"
            full = full / sp
    full.mkdir(parents=True, exist_ok=True)
    return str(full)


def _sanitize_for_json(obj: Any, _seen: set[int] | None = None) -> Any:
    if _seen is None:
        _seen = set()
    oid = id(obj)
    if oid in _seen:
        return None
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    if isinstance(obj, dict):
        _seen.add(oid)
        return {str(k): _sanitize_for_json(v, _seen) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        _seen.add(oid)
        return [_sanitize_for_json(v, _seen) for v in obj]
    # Fallback: coerce to string
    try:
        return str(obj)
    except Exception:
        return None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        text = json.dumps(data, indent=2)
    except Exception:
        safe = _sanitize_for_json(data)
        text = json.dumps(safe, indent=2)
    path.write_text(text, encoding="utf-8")


def copy_into(src_path: str, dst_dir: Path) -> str | None:
    dst_dir.mkdir(parents=True, exist_ok=True)
    base = os.path.basename(src_path)
    name, ext = os.path.splitext(base)
    ts = int(time.time())
    dst_path = dst_dir / f"{name}_{ts}{ext}"
    shutil.copy2(src_path, dst_path)
    return str(dst_path)

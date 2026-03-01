from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import datetime
import json
import yaml  # type: ignore

def save_game_baseline_concept(
    title: str,
    html_code: str,
    js_files: List[Tuple[str, str]],
    game_description: str,
    game_controls: str,
    game_concept: str,
    intermediate_outputs: Optional[Dict[str, Any]] = None,
    conversation_log: Optional[List[Dict[str, str]]] = None,
) -> Path:
    base_dir = Path("games") / "baseline_concept_game"
    base_dir.mkdir(parents=True, exist_ok=True)

    existing_games = [
        int(d.name.split("_")[1]) for d in base_dir.iterdir() if d.is_dir() and d.name.startswith("game_")
    ]
    next_game_number = (max(existing_games) + 1) if existing_games else 0

    game_dir = base_dir / f"game_{next_game_number:04d}"
    game_dir.mkdir(parents=True, exist_ok=True)

    existing_samples = [
        int(d.name.split("_")[1]) for d in game_dir.iterdir() if d.is_dir() and d.name.startswith("sample_")
    ]
    next_sample = (max(existing_samples) + 1) if existing_samples else 0

    sample_dir = game_dir / f"sample_{next_sample}"
    sample_dir.mkdir(parents=True, exist_ok=True)

    (sample_dir / "index.html").write_text(html_code, encoding="utf-8")

    js_filenames: List[str] = []
    for filename, content in js_files:
        file_path = sample_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        js_filenames.append(filename)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    # Attempt to include token usage summary if available in a recent call
    token_summary = None
    try:
        # Import here to avoid circular deps
        from llm_interface.model_api import ModelAPI  # type: ignore
        # Not instantiating; rely on generators to pass intermediate_outputs with call_history if needed
        pass
    except Exception:
        pass

    metadata = {
        "game_info": {
            "title": title,
            "concept": game_concept,
            "description": game_description,
            "controls": game_controls,
            "automated_testing": {},
            "playability": False,
        },
        "generation_info": {
            "method": "BaselineConceptAndGameGenerator",
            "timestamp": timestamp,
            "game_number": f"game_{next_game_number:04d}",
            "sample_index": f"sample_{next_sample}",
            "model": None,
            "token_usage": None,
        },
        "game_files": {"html": "index.html", "javascript": js_filenames, "log": "generation_log.json"},
    }
    (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    if conversation_log:
        (sample_dir / "generation_log.json").write_text(
            json.dumps(conversation_log, indent=2), encoding="utf-8"
        )

    if intermediate_outputs:
        # If model call history present, extract last call token usage and model
        call_history = intermediate_outputs.get("call_history") if isinstance(intermediate_outputs, dict) else None
        if isinstance(call_history, list) and call_history:
            last = call_history[-1] if isinstance(call_history[-1], dict) else None
            if isinstance(last, dict):
                model_name = last.get("model")
                if isinstance(model_name, str) and model_name:
                    metadata["generation_info"]["model"] = model_name
                tu = last.get("token_usage")
                if isinstance(tu, dict):
                    # Coerce nulls to integers (0) for robustness
                    pt = tu.get("prompt_tokens") or 0
                    ct = tu.get("completion_tokens") or 0
                    tt = tu.get("total_tokens") or (pt + ct)
                    metadata["generation_info"]["token_usage"] = {
                        "prompt_tokens": int(pt),
                        "completion_tokens": int(ct),
                        "total_tokens": int(tt),
                    }
                (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        # Persist automated testing block if provided as structured mapping
        auto = intermediate_outputs.get("automated_testing") if isinstance(intermediate_outputs, dict) else None
        if isinstance(auto, dict):
            metadata["game_info"]["automated_testing"] = auto
            (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        # Persist generation params (temperature, top_p, thinking, etc.) if provided
        gen_params = intermediate_outputs.get("generation_params") if isinstance(intermediate_outputs, dict) else None
        if isinstance(gen_params, dict):
            metadata["generation_info"]["params"] = {
                "temperature": gen_params.get("temperature"),
                "top_p": gen_params.get("top_p"),
                "thinking": gen_params.get("thinking"),
                "thinking_budget": gen_params.get("thinking_budget"),
                "model": gen_params.get("model"),
            }
            (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        (sample_dir / "intermediate_outputs.json").write_text(
            json.dumps(intermediate_outputs, indent=2), encoding="utf-8"
        )


    concepts_dir = Path("game_concepts")
    concepts_dir.mkdir(parents=True, exist_ok=True)
    concept_path = concepts_dir / f"game_{next_game_number:04d}.yaml"
    # Prefer YAML if available; else write a minimal YAML string
    with open(concept_path, "w", encoding="utf-8") as yf:
        yaml.safe_dump({"concept": game_concept.strip()}, yf, sort_keys=False)

    return sample_dir


def save_game_single_prompt(
    title: str,
    html_code: str,
    js_files: List[Tuple[str, str]],
    game_description: str,
    game_controls: str,
    game_concept: str,
    forced_game_index: Optional[int] = None,
    intermediate_outputs: Optional[Dict[str, Any]] = None,
    conversation_log: Optional[List[Dict[str, str]]] = None,
    output_folder: Optional[str] = None,
) -> Path:
    """Save generated game files for single_prompt_with_testing under games/single_prompt_with_testing.

    If forced_game_index is provided, saves under that specific game_{index} directory.
    """
    base_dir = Path("games") / (output_folder or "single_prompt_with_testing")
    base_dir.mkdir(parents=True, exist_ok=True)

    if forced_game_index is not None and forced_game_index >= 0:
        next_game_number = forced_game_index
    else:
        existing_games = [
            int(d.name.split("_")[1]) for d in base_dir.iterdir() if d.is_dir() and d.name.startswith("game_")
        ]
        next_game_number = (max(existing_games) + 1) if existing_games else 0

    game_dir = base_dir / f"game_{next_game_number:04d}"
    game_dir.mkdir(parents=True, exist_ok=True)

    existing_samples = [
        int(d.name.split("_")[1]) for d in game_dir.iterdir() if d.is_dir() and d.name.startswith("sample_")
    ]
    next_sample = (max(existing_samples) + 1) if existing_samples else 0

    sample_dir = game_dir / f"sample_{next_sample}"
    sample_dir.mkdir(parents=True, exist_ok=True)

    (sample_dir / "index.html").write_text(html_code, encoding="utf-8")

    js_filenames: List[str] = []
    for filename, content in js_files:
        file_path = sample_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        js_filenames.append(filename)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    metadata = {
        "game_info": {
            "title": title,
            "concept": game_concept,
            "description": game_description,
            "controls": game_controls,
            "automated_testing": {},
            "playability": False,
        },
        "generation_info": {
            "method": "SinglePromptWithTestingGenerator",
            "timestamp": timestamp,
            "game_number": f"game_{next_game_number:04d}",
            "sample_index": f"sample_{next_sample}",
            "model": None,
            "token_usage": None,
        },
        "game_files": {"html": "index.html", "javascript": js_filenames, "log": "generation_log.json"},
    }
    (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    if conversation_log:
        (sample_dir / "generation_log.json").write_text(
            json.dumps(conversation_log, indent=2), encoding="utf-8"
        )

    if intermediate_outputs:
        # Extract model and token usage from call_history, if present
        call_history = intermediate_outputs.get("call_history") if isinstance(intermediate_outputs, dict) else None
        if isinstance(call_history, list) and call_history:
            last = call_history[-1] if isinstance(call_history[-1], dict) else None
            if isinstance(last, dict):
                model_name = last.get("model")
                if isinstance(model_name, str) and model_name:
                    metadata["generation_info"]["model"] = model_name
                tu = last.get("token_usage")
                if isinstance(tu, dict):
                    pt = tu.get("prompt_tokens") or 0
                    ct = tu.get("completion_tokens") or 0
                    tt = tu.get("total_tokens") or (pt + ct)
                    metadata["generation_info"]["token_usage"] = {
                        "prompt_tokens": int(pt),
                        "completion_tokens": int(ct),
                        "total_tokens": int(tt),
                    }
                (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        # Persist automated testing mapping if present
        auto = intermediate_outputs.get("automated_testing") if isinstance(intermediate_outputs, dict) else None
        if isinstance(auto, dict):
            metadata["game_info"]["automated_testing"] = auto
            (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        # Persist generation params (temperature, top_p, thinking, etc.) if provided
        gen_params = intermediate_outputs.get("generation_params") if isinstance(intermediate_outputs, dict) else None
        if isinstance(gen_params, dict):
            metadata["generation_info"]["params"] = {
                "temperature": gen_params.get("temperature"),
                "top_p": gen_params.get("top_p"),
                "thinking": gen_params.get("thinking"),
                "thinking_budget": gen_params.get("thinking_budget"),
                "model": gen_params.get("model"),
            }
            (sample_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        (sample_dir / "intermediate_outputs.json").write_text(
            json.dumps(intermediate_outputs, indent=2), encoding="utf-8"
        )

    return sample_dir


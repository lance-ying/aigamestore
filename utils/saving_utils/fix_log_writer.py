"""
Utility for saving fix operation logs from the GUI interface.

Saves comprehensive logs of each fix operation including prompts, responses,
analysis, token usage, and metadata.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import json
import datetime


def update_fix_log_index(game_name: str, fix_id: str, log_path: Path, metadata: Dict[str, Any]) -> None:
    """
    Update the centralized fix log index.
    
    Args:
        game_name: Name of the game
        fix_id: Fix ID (e.g., "fix_001_20251121_153045")
        log_path: Path to the log directory
        metadata: Metadata dictionary
    """
    try:
        # Get project root (assume we're in utils/saving_utils/)
        project_root = Path(__file__).parent.parent.parent
        index_dir = project_root / "data" / "fix_logs"
        index_dir.mkdir(parents=True, exist_ok=True)
        index_file = index_dir / "index.json"
        
        # Load existing index
        if index_file.exists():
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    index = json.load(f)
            except (json.JSONDecodeError, IOError):
                index = {}
        else:
            index = {}
        
        # Add or update entry
        if game_name not in index:
            index[game_name] = []
        
        # Check if fix already exists (update) or add new
        fix_entry = {
            "fix_id": fix_id,
            "timestamp": metadata.get("timestamp"),
            "log_path": str(log_path),
            "success": metadata.get("success", True),
            "error": metadata.get("error"),
            "updated_files_count": len(metadata.get("updated_files", [])),
            "token_usage": metadata.get("token_usage", {}),
        }
        
        # Remove old entry if exists and add new one
        index[game_name] = [f for f in index[game_name] if f.get("fix_id") != fix_id]
        index[game_name].append(fix_entry)
        
        # Sort by timestamp (newest first)
        index[game_name].sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Save index
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps(index, indent=2, ensure_ascii=False))
    except Exception:
        # Silently fail - index is optional
        pass


def save_fix_log(
    game_dir: Path,
    fix_data: Dict[str, Any],
) -> Path:
    """
    Save a fix operation log to the game's fix_logs directory.
    
    Args:
        game_dir: Path to the game directory
        fix_data: Dictionary containing all fix information:
            - feedback: Original user feedback
            - analysis: AI analysis (optional)
            - system_prompt: System prompt sent to LLM
            - user_prompt: User prompt with game files
            - full_response: Complete LLM response
            - thinking: Thinking output (optional)
            - updated_files: List of files that were updated
            - backup_path: Path to backup directory
            - model: Model name
            - temperature: Temperature setting
            - thinking: Whether thinking was enabled
            - thinking_budget: Thinking budget
            - use_planning: Whether planning mode was used
            - token_usage: Token usage dict
            - success: Whether fix was successful
            - error: Error message if failed (optional)
            - timestamp: Timestamp of the fix (optional, will be generated if not provided)
    
    Returns:
        Path to the created log directory
    """
    # Create fix_logs directory
    fix_logs_dir = game_dir / "fix_logs"
    fix_logs_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate fix ID and timestamp
    if "timestamp" in fix_data:
        timestamp_obj = fix_data["timestamp"]
        if isinstance(timestamp_obj, str):
            # Try to parse if it's a string
            try:
                timestamp_obj = datetime.datetime.fromisoformat(timestamp_obj.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                timestamp_obj = datetime.datetime.now()
        elif not isinstance(timestamp_obj, datetime.datetime):
            timestamp_obj = datetime.datetime.now()
        timestamp = timestamp_obj
    else:
        timestamp = datetime.datetime.now()
    
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    timestamp_iso = timestamp.isoformat()
    
    # Find next fix number
    existing_fixes = [
        d.name for d in fix_logs_dir.iterdir()
        if d.is_dir() and d.name.startswith("fix_") and d.name.count("_") >= 2
    ]
    
    if existing_fixes:
        # Extract fix numbers
        fix_numbers = []
        for fix_name in existing_fixes:
            try:
                # Format: fix_001_20251121_153045
                parts = fix_name.split("_")
                if len(parts) >= 2 and parts[0] == "fix":
                    fix_num = int(parts[1])
                    fix_numbers.append(fix_num)
            except (ValueError, IndexError):
                continue
        
        next_fix_num = max(fix_numbers) + 1 if fix_numbers else 1
    else:
        next_fix_num = 1
    
    # Create fix directory
    fix_id = f"fix_{next_fix_num:03d}_{timestamp_str}"
    fix_log_dir = fix_logs_dir / fix_id
    fix_log_dir.mkdir(parents=True, exist_ok=True)
    
    # Save individual files
    try:
        # Save feedback
        if "feedback" in fix_data and fix_data["feedback"]:
            (fix_log_dir / "feedback.txt").write_text(
                fix_data["feedback"], encoding="utf-8"
            )
        
        # Save analysis
        if "analysis" in fix_data and fix_data["analysis"]:
            (fix_log_dir / "analysis.txt").write_text(
                fix_data["analysis"], encoding="utf-8"
            )
        
        # Save system prompt
        if "system_prompt" in fix_data and fix_data["system_prompt"]:
            (fix_log_dir / "system_prompt.txt").write_text(
                fix_data["system_prompt"], encoding="utf-8"
            )
        
        # Save user prompt
        if "user_prompt" in fix_data and fix_data["user_prompt"]:
            (fix_log_dir / "user_prompt.txt").write_text(
                fix_data["user_prompt"], encoding="utf-8"
            )
        
        # Save full response
        if "full_response" in fix_data and fix_data["full_response"]:
            (fix_log_dir / "full_response.txt").write_text(
                fix_data["full_response"], encoding="utf-8"
            )
        
        # Save thinking output
        if "thinking" in fix_data and fix_data["thinking"]:
            (fix_log_dir / "thinking.txt").write_text(
                fix_data["thinking"], encoding="utf-8"
            )
        
        # Save updated files as JSON
        if "updated_files" in fix_data:
            updated_files = fix_data["updated_files"]
            if isinstance(updated_files, list):
                (fix_log_dir / "updated_files.json").write_text(
                    json.dumps(updated_files, indent=2), encoding="utf-8"
                )
        
        # Save token usage as JSON
        if "token_usage" in fix_data and fix_data["token_usage"]:
            (fix_log_dir / "token_usage.json").write_text(
                json.dumps(fix_data["token_usage"], indent=2), encoding="utf-8"
            )
        
        # Create comprehensive metadata.json
        metadata = {
            "fix_id": fix_id,
            "timestamp": timestamp_iso,
            "timestamp_display": timestamp_str,
            "game_path": str(game_dir),
            "game_name": game_dir.name,
            "user_feedback": fix_data.get("feedback", ""),
            "model": {
                "name": fix_data.get("model", "unknown"),
                "temperature": fix_data.get("temperature", 0.6),
                "thinking": fix_data.get("thinking", False),
                "thinking_budget": fix_data.get("thinking_budget"),
            },
            "use_planning": fix_data.get("use_planning", True),
            "analysis": fix_data.get("analysis"),
            "updated_files": fix_data.get("updated_files", []),
            "backup_path": str(fix_data.get("backup_path", "")),
            "token_usage": fix_data.get("token_usage", {}),
            "success": fix_data.get("success", True),
            "error": fix_data.get("error"),
        }
        
        (fix_log_dir / "metadata.json").write_text(
            json.dumps(metadata, indent=2), encoding="utf-8"
        )
        
        # Update centralized index (optional, fails silently)
        try:
            update_fix_log_index(game_dir.name, fix_id, fix_log_dir, metadata)
        except Exception:
            pass
        
    except Exception as e:
        # If saving individual files fails, at least try to save metadata with error
        try:
            error_metadata = {
                "fix_id": fix_id,
                "timestamp": timestamp_iso,
                "timestamp_display": timestamp_str,
                "game_path": str(game_dir),
                "game_name": game_dir.name,
                "error": f"Error saving log files: {e}",
                "success": False,
            }
            (fix_log_dir / "metadata.json").write_text(
                json.dumps(error_metadata, indent=2), encoding="utf-8"
            )
        except Exception:
            pass  # If even metadata fails, just return the directory path
        raise
    
    return fix_log_dir


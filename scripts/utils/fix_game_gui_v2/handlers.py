"""
Gradio event handlers for the Game Fix GUI.

This module contains all the event handler functions that respond to
user interactions in the Gradio interface.
"""

import shutil
import sys
from pathlib import Path
from typing import Tuple
import gradio as gr

# Add parent directory to path for imports
_project_root = Path(__file__).parent.parent.parent.parent.resolve()
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# Import external project modules FIRST (before local utils module to avoid name conflict)
from iterators.feedback_fix import FeedbackFixIterator

# Import the project's utils package directly from the file system to avoid name conflict
# We need to do this before any local utils imports happen
_utils_saving_utils_path = _project_root / 'utils' / 'saving_utils' / 'fix_log_writer.py'
if _utils_saving_utils_path.exists():
    import importlib.util
    _spec = importlib.util.spec_from_file_location('fix_log_writer', _utils_saving_utils_path)
    _fix_log_module = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_fix_log_module)
    save_fix_log = _fix_log_module.save_fix_log
else:
    # Fallback: try normal import (might fail if local utils is already imported)
    from utils.saving_utils.fix_log_writer import save_fix_log

# Handle imports for both script execution and module import
# Import local utils module LAST and with a different name to avoid shadowing
try:
    from .config import PROJECT_ROOT, SCRIPT_DIR, COLOR_EMOJIS
    from .games import list_games
    from .backups import list_backups, create_backup
    from .flags import get_game_flag
    from .iframe import get_game_iframe_html
    # Import local utils module with explicit name to avoid conflict
    # Use importlib to avoid creating 'utils' name in namespace
    import importlib
    _local_utils = importlib.import_module('scripts.utils.fix_game_gui_v2.utils')
    send_notification = _local_utils.send_notification
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    from scripts.utils.fix_game_gui_v2.config import PROJECT_ROOT, SCRIPT_DIR, COLOR_EMOJIS
    from scripts.utils.fix_game_gui_v2.games import list_games
    from scripts.utils.fix_game_gui_v2.backups import list_backups, create_backup
    from scripts.utils.fix_game_gui_v2.flags import get_game_flag
    from scripts.utils.fix_game_gui_v2.iframe import get_game_iframe_html
    # Import local utils module
    import importlib
    _local_utils = importlib.import_module('scripts.utils.fix_game_gui_v2.utils')
    send_notification = _local_utils.send_notification


def refresh_games(directory: str = "games/games", sort_by: str = "alphabetical") -> gr.Dropdown:
    """Refresh the games dropdown list."""
    # Convert "alphabetical" to None for list_games
    sort_param = None if sort_by == "alphabetical" else sort_by
    games = list_games(directory, sort_by=sort_param)
    choices = []
    for g in games:
        display_name = g['title']
        
        # Add color indicator if flagged
        flag_color = g.get('flag_color')
        if flag_color and flag_color in COLOR_EMOJIS:
            emoji = COLOR_EMOJIS[flag_color]
            display_name = f"{emoji} {display_name}"
        
        if g['backup_count'] > 0:
            display_name += f" ({g['backup_count']} backup{'s' if g['backup_count'] > 1 else ''})"
        choices.append((display_name, g['path']))
    
    if not choices:
        choices = [("No games found", "")]
    
    return gr.Dropdown(choices=choices, value=choices[0][1] if choices else "")


def on_game_selected_minimal(game_path: str) -> Tuple[str, gr.Dropdown, str]:
    """
    Handle game selection event (minimal version).
    
    Returns:
        Tuple of (iframe_html, backup_dropdown, current_flag_color)
    """
    if not game_path:
        return "", gr.Dropdown(choices=[]), "none"
    
    game_dir = Path(game_path)
    
    # Calculate the path relative to the project root for the HTTP server
    # The server now serves from PROJECT_ROOT, so we need paths relative to that
    try:
        game_relative_path_from_root = game_dir.relative_to(SCRIPT_DIR)
    except ValueError:
        # If game_dir is not under SCRIPT_DIR, try to use it as-is if it's absolute
        if game_dir.is_absolute():
            # For absolute paths, try to make them relative to project root
            try:
                game_relative_path_from_root = game_dir.relative_to(PROJECT_ROOT)
            except ValueError:
                # Fallback: use just the name (shouldn't happen in normal usage)
                game_relative_path_from_root = Path(game_dir.name)
        else:
            # For relative paths, assume they're already relative to project root
            game_relative_path_from_root = game_dir
    
    # Get iframe HTML
    iframe_html = get_game_iframe_html(str(game_relative_path_from_root))
    
    # Get backups
    backups = list_backups(game_path)
    backup_choices = backups if backups else [("No backups", "")]
    
    # Get current flag color
    flag_color = get_game_flag(game_path)
    current_flag = flag_color if flag_color else "none"
    
    return iframe_html, gr.Dropdown(choices=backup_choices), current_flag


def refresh_game_preview(game_path: str) -> str:
    """
    Refresh the game preview iframe with cache busting.
    
    Returns:
        Updated iframe HTML
    """
    if not game_path:
        return "<p>No game selected</p>"
    
    game_dir = Path(game_path)
    
    # Calculate the path relative to the project root for the HTTP server
    try:
        game_relative_path_from_root = game_dir.relative_to(SCRIPT_DIR)
    except ValueError:
        # If game_dir is not under SCRIPT_DIR, try to use it as-is if it's absolute
        if game_dir.is_absolute():
            try:
                game_relative_path_from_root = game_dir.relative_to(PROJECT_ROOT)
            except ValueError:
                game_relative_path_from_root = Path(game_dir.name)
        else:
            game_relative_path_from_root = game_dir
    
    # Get iframe HTML with cache busting enabled
    return get_game_iframe_html(str(game_relative_path_from_root), cache_bust=True)


def fix_game_action(game_path: str, feedback: str, model: str = "anthropic:claude-4.5-sonnet") -> Tuple[str, gr.Dropdown, str]:
    """
    Apply fixes to the selected game.
    
    Args:
        game_path: Path to the game directory
        feedback: User feedback describing the issue
        model: Model to use for fixing (default: "anthropic:claude-4.5-sonnet")
    
    Returns:
        Tuple of (status_message, updated_backup_dropdown, updated_iframe_html)
    """
    if not game_path:
        return "Error: No game selected", gr.Dropdown(), ""
    
    if not feedback.strip():
        return "Error: Please provide feedback", gr.Dropdown(), ""
    
    game_dir = Path(game_path)
    
    status_lines = [
        "Game Fix Tool",
        "=" * 60,
        ""
    ]
    
    # Create backup
    try:
        backup_path = create_backup(game_dir)
        status_lines.append(f"Backup created: {backup_path.name}")
        status_lines.append("")
    except Exception as e:
        return f"Error creating backup: {e}", gr.Dropdown(), ""
    
    # Initialize iterator
    status_lines.append("Reading game files...")
    
    try:
        iterator = FeedbackFixIterator(
            model=model,  
            temperature=0.6,
            thinking=True,
            thinking_budget=8000,
        )
    except Exception as e:
        return "\n".join(status_lines) + f"\nError initializing iterator: {e}", gr.Dropdown(), ""
    
    # Apply fix
    status_lines.append("Sending to AI for analysis...")
    status_lines.append("   (this may take 30-60 seconds...)")
    status_lines.append("")
    
    # Send notification that fix has started
    game_name = game_dir.name
    send_notification(
        "Fix Started",
        f"Analyzing {game_name}...\nThis may take 30-60 seconds."
    )
    
    try:
        result = iterator.iterate(
            game_dir=str(game_dir),
            feedback=feedback,
            debug_prompts=False,
            use_planning=True,
            in_place=True,
        )
        
        token_usage_info = ""
        try:
            call_history = iterator.api.get_call_history()
            if call_history:
                last_call = call_history[-1]
                token_usage = last_call.get("token_usage", {})
                input_tokens = token_usage.get("prompt_tokens") or token_usage.get("input_tokens")
                output_tokens = token_usage.get("completion_tokens") or token_usage.get("output_tokens")
                total_tokens = token_usage.get("total_tokens")
                
                if input_tokens is not None or output_tokens is not None:
                    token_usage_info = "\n"
                    token_usage_info += "Token Usage:\n"
                    token_usage_info += "=" * 60 + "\n"
                    if input_tokens is not None:
                        token_usage_info += f"  Input tokens:  {input_tokens:,}\n"
                    if output_tokens is not None:
                        token_usage_info += f"  Output tokens: {output_tokens:,}\n"
                    if total_tokens is not None:
                        token_usage_info += f"  Total tokens:  {total_tokens:,}\n"
                    token_usage_info += "=" * 60 + "\n"
        except Exception as e:
            token_usage_info = f"\n(Note: Could not retrieve token usage: {e})\n"
        
        # Display analysis if present
        analysis = result.get("analysis")
        if analysis:
            status_lines.append("Analysis:")
            for line in analysis.strip().split('\n'):
                status_lines.append(f"   {line}")
            status_lines.append("")
        
        # Display results
        num_files = result.get("num_files_updated", 0)
        updated_files = result.get("updated_files", [])
        
        if num_files > 0:
            status_lines.append(f"Applied fixes to {num_files} file(s):")
            for file in updated_files:
                status_lines.append(f"   - {file}")
            status_lines.append("")
        else:
            status_lines.append("No files were updated. The AI may not have found issues to fix.")
            status_lines.append("")
        
        status_lines.append(token_usage_info)
        
        # Save fix log
        log_saved = False
        log_path = None
        try:
            # Collect all data for logging
            call_history = iterator.api.get_call_history()
            token_usage_dict = {}
            if call_history:
                last_call = call_history[-1]
                token_usage = last_call.get("token_usage", {})
                token_usage_dict = {
                    "input_tokens": token_usage.get("prompt_tokens") or token_usage.get("input_tokens"),
                    "output_tokens": token_usage.get("completion_tokens") or token_usage.get("output_tokens"),
                    "total_tokens": token_usage.get("total_tokens"),
                }
            
            fix_log_data = {
                "feedback": feedback,
                "analysis": result.get("analysis"),
                "system_prompt": result.get("system_prompt", ""),
                "user_prompt": result.get("user_prompt", ""),
                "full_response": result.get("full_response") or result.get("response", ""),
                "thinking_text": result.get("thinking", ""),  # Text output from thinking mode
                "updated_files": result.get("updated_files", []),
                "backup_path": str(backup_path),
                "model": iterator.model,
                "temperature": iterator.temperature,
                "thinking": iterator.thinking,  # Boolean flag for thinking mode enabled
                "thinking_budget": iterator.thinking_budget,
                "use_planning": True,  # Always True in GUI
                "token_usage": token_usage_dict,
                "success": True,
                "error": None,
            }
            
            log_path = save_fix_log(game_dir, fix_log_data)
            log_saved = True
            # Show relative path from game directory
            try:
                relative_log_path = log_path.relative_to(game_dir)
                status_lines.append(f"Fix log saved: {relative_log_path}")
            except ValueError:
                status_lines.append(f"Fix log saved: {log_path.name}")
            status_lines.append("")
        except Exception as log_error:
            # Don't fail the fix operation if logging fails
            status_lines.append(f"(Note: Could not save fix log: {log_error})")
            status_lines.append("")
        
        status_lines.append(f"Backup saved: {backup_path.name}")
        status_lines.append("Done!")
        status_lines.append("")
        status_lines.append("=" * 60)
        status_lines.append("Try the game again. If issues persist:")
        status_lines.append("  - Restore from backup")
        status_lines.append("  - Or provide more detailed feedback")
        if log_saved and log_path:
            try:
                relative_log_path = log_path.relative_to(game_dir)
                status_lines.append(f"  - View fix log: {game_dir.name}/{relative_log_path}")
            except ValueError:
                status_lines.append(f"  - View fix log: {log_path}")
        
        # Send success notification
        files_updated = num_files if num_files > 0 else 0
        send_notification(
            "Fix Complete ✓",
            f"{game_name} fixed successfully!\n{files_updated} file(s) updated."
        )
        
    except Exception as e:
        status_lines.append(f"\nError during fix generation: {e}")
        status_lines.append(f"\nBackup preserved at: {backup_path}")
        
        # Try to save error log
        try:
            # Get model info from iterator if available
            model_name = model
            temperature = 0.6
            thinking = True
            thinking_budget = 8000
            if 'iterator' in locals():
                model_name = iterator.model
                temperature = iterator.temperature
                thinking = iterator.thinking
                thinking_budget = iterator.thinking_budget
            
            error_log_data = {
                "feedback": feedback,
                "backup_path": str(backup_path),
                "model": model_name,
                "temperature": temperature,
                "thinking": thinking,
                "thinking_budget": thinking_budget,
                "use_planning": True,
                "success": False,
                "error": str(e),
            }
            save_fix_log(game_dir, error_log_data)
        except Exception:
            pass  # Ignore logging errors for error cases
        
        # Send error notification
        send_notification(
            "Fix Failed ✗",
            f"Error fixing {game_name}:\n{str(e)[:100]}"
        )
    
    # Update backup list
    backups = list_backups(game_path)
    backup_choices = backups if backups else [("No backups found", "")]
    
    # Generate updated iframe with cache busting to force reload
    game_dir = Path(game_path)
    try:
        game_relative_path_from_root = game_dir.relative_to(SCRIPT_DIR)
    except ValueError:
        if game_dir.is_absolute():
            try:
                game_relative_path_from_root = game_dir.relative_to(PROJECT_ROOT)
            except ValueError:
                game_relative_path_from_root = Path(game_dir.name)
        else:
            game_relative_path_from_root = game_dir
    updated_iframe = get_game_iframe_html(str(game_relative_path_from_root), cache_bust=True)
    
    return "\n".join(status_lines), gr.Dropdown(choices=backup_choices), updated_iframe


def restore_backup_action(game_path: str, backup_path: str) -> Tuple[str, str]:
    """
    Restore a game from backup.
    
    Returns:
        Tuple of (status_message, updated_iframe_html)
    """
    if not game_path or not backup_path:
        return "Error: No game or backup selected", ""
    
    if backup_path == "No backups found":
        return "Error: No valid backup selected", ""
    
    game_dir = Path(game_path)
    backup_dir = Path(backup_path)
    
    if not backup_dir.exists():
        return f"Error: Backup not found: {backup_path}", ""
    
    status_lines = [
        "Restoring from backup...",
        f"   Backup: {backup_dir.name}",
        ""
    ]
    
    try:
        # Remove current directory
        if game_dir.exists():
            shutil.rmtree(game_dir)
        
        # Restore from backup
        shutil.copytree(backup_dir, game_dir)
        
        status_lines.append("Restored successfully!")
        status_lines.append("")
        status_lines.append("The game has been restored to the backed up state.")
        
        # Generate updated iframe with cache busting to force reload
        game_dir = Path(game_path)
        try:
            game_relative_path_from_root = game_dir.relative_to(SCRIPT_DIR)
        except ValueError:
            if game_dir.is_absolute():
                try:
                    game_relative_path_from_root = game_dir.relative_to(PROJECT_ROOT)
                except ValueError:
                    game_relative_path_from_root = Path(game_dir.name)
            else:
                game_relative_path_from_root = game_dir
        updated_iframe = get_game_iframe_html(str(game_relative_path_from_root), cache_bust=True)
        
        return "\n".join(status_lines), updated_iframe
    
    except Exception as e:
        status_lines.append(f"Error restoring backup: {e}")
        return "\n".join(status_lines), ""


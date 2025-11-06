#!/usr/bin/env python3
"""
Gradio GUI for fixing games with natural language feedback.

This provides a web-based interface to:
- Browse games in public/games/
- Preview games in an iframe
- Write feedback and apply fixes
- Manage backups

Usage:
    uv run python fix_game_gui.py
    uv run python fix_game_gui.py --port 7860
    uv run python fix_game_gui.py --share  # Create public URL
"""
# /// script
# dependencies = ["gradio", "anthropic", "openai", "pyyaml"]
# ///

import argparse
import json
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import http.server
import socketserver

import gradio as gr

# Import existing fix_game logic
from iterators.feedback_fix import FeedbackFixIterator

# Load environment variables
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


# Global HTTP server for serving games
GAME_SERVER_PORT = 5141
SCRIPT_DIR = Path(__file__).parent.resolve()  # Store the script directory
game_server = None
game_server_thread = None

# Configuration for multiple game directories
GAME_DIRECTORIES = {
    "Game Platform": "public/games",
    "Batch 103125": "public/games_gen_halloween",
    "Batch 110325": "public/new_batch_110325",
    "Batch 110425": "public/batch_110425",
}


def start_game_server(games_dir: str = "public/games"):
    """Start a simple HTTP server to serve game files."""
    global game_server, game_server_thread
    
    if game_server is not None:
        return  # Already running
    
    # Change to the public directory (parent of games_dir)
    public_dir = SCRIPT_DIR / "public"
    os.chdir(public_dir)
    
    class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress log messages
        
        def do_GET(self):
            # Intercept do_GET to add no-cache headers
            # Let parent handle the file serving
            path = self.translate_path(self.path)
            
            try:
                f = open(path, 'rb')
            except OSError:
                self.send_error(404, "File not found")
                return None
            
            try:
                self.send_response(200)
                self.send_header("Content-type", self.guess_type(path))
                fs = os.fstat(f.fileno())
                self.send_header("Content-Length", str(fs[6]))
                # Critical: Add no-cache headers
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.end_headers()
                
                self.copyfile(f, self.wfile)
            finally:
                f.close()
    
    try:
        game_server = socketserver.TCPServer(("", GAME_SERVER_PORT), QuietHTTPRequestHandler)
        game_server_thread = threading.Thread(target=game_server.serve_forever, daemon=True)
        game_server_thread.start()
        print(f"Game server started on http://localhost:{GAME_SERVER_PORT}")
    except OSError as e:
        print(f"Could not start game server on port {GAME_SERVER_PORT}: {e}")


def count_backups(game_path: str) -> int:
    """Count number of backups for a game."""
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    parent_dir = game_dir.parent
    backup_pattern = f"{game_dir.name}_backup_"
    
    count = 0
    for item in parent_dir.iterdir():
        if item.is_dir() and item.name.startswith(backup_pattern):
            count += 1
    
    return count


def list_games(games_dir: str = "public/games") -> List[Dict[str, str]]:
    """
    Scan games directory and return list of games with metadata.
    
    Returns:
        List of dicts with 'title', 'dir_name', 'path', and 'backup_count' keys
    """
    # Use absolute path from script directory to avoid issues with directory changes
    games_path = SCRIPT_DIR / games_dir
    
    if not games_path.exists():
        return []
    
    games = []
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip backup directories
        if '_backup_' in item.name:
            continue
        
        # Skip hidden directories
        if item.name.startswith('.'):
            continue
        
        # Check if index.html exists
        if not (item / "index.html").exists():
            continue
        
        # Try to get title from metadata
        title = item.name  # Default to directory name
        metadata_path = item / "metadata.json"
        
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                # Try to get title from game_info
                if metadata.get('game_info', {}).get('title'):
                    title = metadata['game_info']['title']
                    if title == 'Untitled Game':
                        title = item.name
            except Exception:
                pass
        
        # Count backups for this game
        backup_count = count_backups(str(item))
        
        games.append({
            'title': title,
            'dir_name': item.name,
            'path': str(item),
            'backup_count': backup_count
        })
    
    # Sort by title
    games.sort(key=lambda x: x['title'].lower())
    
    return games


def get_game_metadata(game_path: str) -> Dict[str, str]:
    """
    Extract metadata from game directory.
    
    Returns:
        Dict with title, description, controls, path
    """
    # Ensure absolute path
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    metadata_path = game_dir / "metadata.json"
    
    result = {
        'title': game_dir.name,
        'description': '',
        'controls': '',
        'path': str(game_dir)
    }
    
    if not metadata_path.exists():
        return result
    
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        game_info = metadata.get('game_info', {})
        
        # Extract title
        if game_info.get('title'):
            result['title'] = game_info['title']
        
        # Extract description
        if game_info.get('description'):
            result['description'] = game_info['description']
        
        # Extract controls
        if game_info.get('controls'):
            result['controls'] = game_info['controls']
    
    except Exception as e:
        print(f"Error reading metadata: {e}")
    
    return result


def get_game_iframe_html(game_relative_path_from_public: str, cache_bust: bool = False) -> str:
    """
    Generate HTML for game iframe with aggressive cache busting.
    
    Args:
        game_relative_path_from_public: The path of the game directory relative to the 'public' folder.
                                      e.g., "games/snake-io" or "games_gen_halloween/bounce-and-collect-s0"
        cache_bust: If True, adds timestamp to force reload
        
    Returns:
        HTML string with iframe
    """
    import time
    timestamp = int(time.time() * 1000)
    
    # Generate unique ID for the iframe
    iframe_id = f"game-iframe-{timestamp}"
    
    # Construct game_url using the provided relative path from public
    game_url = f"http://localhost:{GAME_SERVER_PORT}/{game_relative_path_from_public}/index.html"
    
    # Add cache busting parameter to force reload
    if cache_bust:
        game_url += f"?v={timestamp}"
    
    # Very aggressive reload script that clears all caches
    reload_script = ""
    if cache_bust:
        reload_script = f"""
        <script>
        (function() {{
            var iframe = document.getElementById('{iframe_id}');
            if (iframe) {{
                // Method 1: Clear iframe completely and recreate
                setTimeout(function() {{
                    var parent = iframe.parentNode;
                    var newIframe = document.createElement('iframe');
                    newIframe.id = '{iframe_id}';
                    newIframe.src = iframe.src;
                    newIframe.style.cssText = 'width: 100%; height: 100%; border: none; display: block;';
                    newIframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    newIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
                    newIframe.setAttribute('tabindex', '0');
                    parent.removeChild(iframe);
                    parent.appendChild(newIframe);
                    
                    // Method 2: Force reload inside iframe after it loads
                    newIframe.onload = function() {{
                        try {{
                            newIframe.contentWindow.location.reload(true);
                        }} catch(e) {{
                            console.log('Hard reload attempted');
                        }}
                    }};
                }}, 50);
            }}
        }})();
        </script>
        """
    
    html = f"""
    <div style="width: 100%; position: relative;" id="game-container-{timestamp}">
        <div style="width: 100%; height: 1000px; border: 1px solid #333; border-radius: 4px; overflow: hidden; background: #000;">
            <iframe 
                id="{iframe_id}"
                src="{game_url}" 
                style="width: 100%; height: 100%; border: none; display: block; transform: scale(1.0); transform-origin: top left;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                tabindex="0"
            ></iframe>
        </div>
        {reload_script}
    </div>
    """
    
    return html


def list_backups(game_path: str) -> List[Tuple[str, str]]:
    """
    List all backups for a game.
    
    Returns:
        List of tuples (display_name, backup_path)
    """
    # Ensure absolute path
    game_dir = Path(game_path) if Path(game_path).is_absolute() else SCRIPT_DIR / game_path
    parent_dir = game_dir.parent
    backup_pattern = f"{game_dir.name}_backup_"
    
    backups = []
    
    for item in parent_dir.iterdir():
        if not item.is_dir():
            continue
        
        if not item.name.startswith(backup_pattern):
            continue
        
        # Extract timestamp from backup name
        try:
            timestamp_str = item.name.replace(backup_pattern, '')
            # Parse timestamp: YYYYMMDD_HHMMSS
            dt = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            display_name = dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            display_name = item.name
        
        backups.append((display_name, str(item)))
    
    # Sort by timestamp (newest first)
    backups.sort(reverse=True)
    
    return backups


def create_backup(game_dir: Path) -> Path:
    """Create a timestamped backup of the game directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = game_dir.parent / f"{game_dir.name}_backup_{timestamp}"
    
    shutil.copytree(game_dir, backup_path)
    return backup_path


# Gradio event handlers

def refresh_games(directory: str = "public/games") -> gr.Dropdown:
    """Refresh the games dropdown list."""
    games = list_games(directory)
    choices = []
    for g in games:
        display_name = g['title']
        if g['backup_count'] > 0:
            display_name += f" ({g['backup_count']} backup{'s' if g['backup_count'] > 1 else ''})"
        choices.append((display_name, g['path']))
    
    if not choices:
        choices = [("No games found", "")]
    
    return gr.Dropdown(choices=choices, value=choices[0][1] if choices else "")


def on_game_selected_minimal(game_path: str) -> Tuple[str, gr.Dropdown]:
    """
    Handle game selection event (minimal version).
    
    Returns:
        Tuple of (iframe_html, backup_dropdown)
    """
    if not game_path:
        return "", gr.Dropdown(choices=[])
    
    game_dir = Path(game_path)
    
    # Calculate the path relative to the 'public' directory for the HTTP server
    public_root = SCRIPT_DIR / "public"
    try:
        game_relative_path_from_public = game_dir.relative_to(public_root)
    except ValueError:
        # If game_dir is not under public_root, fallback to just the name
        # (this shouldn't happen in normal usage, but handle gracefully)
        game_relative_path_from_public = Path(game_dir.name)
    
    # Get iframe HTML
    iframe_html = get_game_iframe_html(str(game_relative_path_from_public))
    
    # Get backups
    backups = list_backups(game_path)
    backup_choices = backups if backups else [("No backups", "")]
    
    return iframe_html, gr.Dropdown(choices=backup_choices)


def refresh_game_preview(game_path: str) -> str:
    """
    Refresh the game preview iframe with cache busting.
    
    Returns:
        Updated iframe HTML
    """
    if not game_path:
        return "<p>No game selected</p>"
    
    game_dir = Path(game_path)
    
    # Calculate the path relative to the 'public' directory for the HTTP server
    public_root = SCRIPT_DIR / "public"
    try:
        game_relative_path_from_public = game_dir.relative_to(public_root)
    except ValueError:
        # If game_dir is not under public_root, fallback to just the name
        game_relative_path_from_public = Path(game_dir.name)
    
    # Get iframe HTML with cache busting enabled
    return get_game_iframe_html(str(game_relative_path_from_public), cache_bust=True)


def fix_game_action(game_path: str, feedback: str) -> Tuple[str, gr.Dropdown, str]:
    """
    Apply fixes to the selected game.
    
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
            model="anthropic:claude-3.5-haiku",  # Changed to Claude Haiku
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
        
        status_lines.append(f"Backup saved: {backup_path.name}")
        status_lines.append("Done!")
        status_lines.append("")
        status_lines.append("=" * 60)
        status_lines.append("Try the game again. If issues persist:")
        status_lines.append("  - Restore from backup")
        status_lines.append("  - Or provide more detailed feedback")
        
    except Exception as e:
        status_lines.append(f"\nError during fix generation: {e}")
        status_lines.append(f"\nBackup preserved at: {backup_path}")
    
    # Update backup list
    backups = list_backups(game_path)
    backup_choices = backups if backups else [("No backups found", "")]
    
    # Generate updated iframe with cache busting to force reload
    game_dir = Path(game_path)
    public_root = SCRIPT_DIR / "public"
    try:
        game_relative_path_from_public = game_dir.relative_to(public_root)
    except ValueError:
        game_relative_path_from_public = Path(game_dir.name)
    updated_iframe = get_game_iframe_html(str(game_relative_path_from_public), cache_bust=True)
    
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
        public_root = SCRIPT_DIR / "public"
        try:
            game_relative_path_from_public = game_dir.relative_to(public_root)
        except ValueError:
            game_relative_path_from_public = Path(game_dir.name)
        updated_iframe = get_game_iframe_html(str(game_relative_path_from_public), cache_bust=True)
        
        return "\n".join(status_lines), updated_iframe
    
    except Exception as e:
        status_lines.append(f"Error restoring backup: {e}")
        return "\n".join(status_lines), ""


def build_interface():
    """Build the Gradio interface."""
    
    # Start game server
    start_game_server()
    
    # Get initial games list from first directory
    initial_dir = list(GAME_DIRECTORIES.values())[0]
    games = list_games(initial_dir)
    game_choices = []
    for g in games:
        display_name = g['title']
        if g['backup_count'] > 0:
            display_name += f" ({g['backup_count']} backup{'s' if g['backup_count'] > 1 else ''})"
        game_choices.append((display_name, g['path']))
    
    if not game_choices:
        game_choices = [("No games found", "")]
    
    # Custom CSS for sleek dark mode code-style interface
    custom_css = """
    * {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
    }
    .gradio-container {
        max-width: 100% !important;
        background-color: #0d1117 !important;
    }
    body {
        background-color: #0d1117 !important;
    }
    .dark, .dark * {
        background-color: #0d1117 !important;
        color: #c9d1d9 !important;
    }
    button {
        border-radius: 4px !important;
        font-size: 13px !important;
        background-color: #21262d !important;
        border: 1px solid #30363d !important;
        color: #c9d1d9 !important;
    }
    button:hover {
        background-color: #30363d !important;
    }
    .dropdown, input, textarea {
        font-size: 13px !important;
        border-radius: 4px !important;
        background-color: #0d1117 !important;
        border: 1px solid #30363d !important;
        color: #c9d1d9 !important;
    }
    label {
        color: #c9d1d9 !important;
    }
    """
    
    with gr.Blocks(title="Game Fix", theme=gr.themes.Monochrome(), css=custom_css) as app:
        
        with gr.Row():
            # Left: Game Preview (wider)
            with gr.Column(scale=5):
                refresh_game_btn = gr.Button("Refresh Game", size="sm")
                game_iframe = gr.HTML(value="<p>Select a game</p>")
            
            # Right: Controls (narrower)
            with gr.Column(scale=2):
                # Directory selector dropdown
                directory_dropdown = gr.Dropdown(
                    choices=[(name, path) for name, path in GAME_DIRECTORIES.items()],
                    value=initial_dir,
                    label="Directory",
                    interactive=True
                )
                
                game_dropdown = gr.Dropdown(
                    choices=game_choices,
                    value=game_choices[0][1] if game_choices else "",
                    label="Game",
                    interactive=True
                )
                refresh_btn = gr.Button("Refresh Games List", size="sm")
                
                feedback_input = gr.Textbox(
                    label="Feedback",
                    lines=8,
                    placeholder="Describe the issue..."
                )
                fix_btn = gr.Button("Apply Fix")
                
                status_output = gr.Textbox(
                    label="Status",
                    lines=12,
                    interactive=False
                )
                
                with gr.Accordion("Backups", open=False):
                    backup_list = gr.Dropdown(
                        choices=[("No backups", "")],
                        label="Select Backup",
                        interactive=True
                    )
                    restore_btn = gr.Button("Restore")
        
        # Wire up events
        # When directory changes, refresh game list
        directory_dropdown.change(
            fn=refresh_games,
            inputs=[directory_dropdown],
            outputs=[game_dropdown]
        )
        
        refresh_btn.click(
            fn=refresh_games,
            inputs=[directory_dropdown],
            outputs=[game_dropdown]
        )
        
        refresh_game_btn.click(
            fn=refresh_game_preview,
            inputs=[game_dropdown],
            outputs=[game_iframe]
        )
        
        game_dropdown.change(
            fn=on_game_selected_minimal,
            inputs=[game_dropdown],
            outputs=[game_iframe, backup_list]
        )
        
        fix_btn.click(
            fn=fix_game_action,
            inputs=[game_dropdown, feedback_input],
            outputs=[status_output, backup_list, game_iframe]
        )
        
        restore_btn.click(
            fn=restore_backup_action,
            inputs=[game_dropdown, backup_list],
            outputs=[status_output, game_iframe]
        )
        
        # Load first game on startup
        app.load(
            fn=on_game_selected_minimal,
            inputs=[game_dropdown],
            outputs=[game_iframe, backup_list]
        )
    
    return app


def main():
    parser = argparse.ArgumentParser(description="Game Fix GUI")
    parser.add_argument(
        "--port",
        type=int,
        default=7860,
        help="Port to run Gradio server (default: 7860)"
    )
    parser.add_argument(
        "--share",
        action="store_true",
        help="Create a public Gradio link"
    )
    
    args = parser.parse_args()
    
    app = build_interface()
    
    print("\n" + "="*60)
    print("Game Fix GUI")
    print("="*60)
    print(f"\nStarting Gradio interface on http://localhost:{args.port}")
    print(f"Game server running on http://localhost:{GAME_SERVER_PORT}")
    print("\nPress Ctrl+C to stop\n")
    
    app.launch(
        server_port=args.port,
        server_name="0.0.0.0",
        share=args.share,
        inbrowser=True
    )


if __name__ == "__main__":
    main()


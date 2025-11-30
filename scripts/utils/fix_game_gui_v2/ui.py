"""
Gradio UI building for the Game Fix GUI.

This module contains the build_interface function that creates and wires up
all the Gradio UI components.
"""

import sys
from pathlib import Path

# Handle imports for both script execution and module import
try:
    from .config import GAME_DIRECTORIES, COLOR_EMOJIS
    from .server import start_game_server
    from .games import list_games
    from .flags import update_flag_counts, set_flag_action
    from .handlers import (
        refresh_games,
        on_game_selected_minimal,
        refresh_game_preview,
        fix_game_action,
        restore_backup_action,
    )
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    
    from scripts.utils.fix_game_gui_v2.config import GAME_DIRECTORIES, COLOR_EMOJIS
    from scripts.utils.fix_game_gui_v2.server import start_game_server
    from scripts.utils.fix_game_gui_v2.games import list_games
    from scripts.utils.fix_game_gui_v2.flags import update_flag_counts, set_flag_action
    from scripts.utils.fix_game_gui_v2.handlers import (
        refresh_games,
        on_game_selected_minimal,
        refresh_game_preview,
        fix_game_action,
        restore_backup_action,
    )

import gradio as gr


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
        
        # Add color indicator if flagged
        flag_color = g.get('flag_color')
        if flag_color and flag_color in COLOR_EMOJIS:
            emoji = COLOR_EMOJIS[flag_color]
            display_name = f"{emoji} {display_name}"
        
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
    
    with gr.Blocks(title="Game Fix") as app:
        # Inject custom CSS using gr.HTML
        gr.HTML(f"<style>{custom_css}</style>", visible=False)
        
        with gr.Row():
            # Left: Flag Counts and Status (narrow)
            with gr.Column(scale=1, min_width=250):
                flag_counts_html = gr.HTML(value=update_flag_counts(initial_dir))
                status_output = gr.Textbox(
                    label="Status",
                    lines=12,
                    interactive=False
                )
            
            # Middle: Game Preview (wider)
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
                
                sort_dropdown = gr.Dropdown(
                    choices=[
                        ("Alphabetical", "alphabetical"),
                        ("Last Modified", "last_modified"),
                        ("Last Added", "last_added"),
                    ],
                    value="alphabetical",
                    label="Sort By",
                    interactive=True
                )
                
                game_dropdown = gr.Dropdown(
                    choices=game_choices,
                    value=game_choices[0][1] if game_choices else "",
                    label="Game",
                    interactive=True
                )
                refresh_btn = gr.Button("Refresh Games List", size="sm")
                
                # Flag management UI
                with gr.Row():
                    flag_color_dropdown = gr.Dropdown(
                        choices=[
                            ("None (Clear Flag)", "none"),
                            ("🔴 Red", "red"),
                            ("🟡 Yellow", "yellow"),
                            ("🟢 Green", "green"),
                            ("🔵 Blue", "blue"),
                            ("🟣 Purple", "purple"),
                        ],
                        value="none",
                        label="Flag Color",
                        interactive=True
                    )
                    set_flag_btn = gr.Button("Set Flag", size="sm")
                
                model_dropdown = gr.Dropdown(
                    choices=[
                        ("Claude 4.5 Sonnet", "anthropic:claude-4.5-sonnet"),
                        ("Gemini 3 Pro Preview", "google:gemini-3-pro-preview"),
                    ],
                    value="anthropic:claude-4.5-sonnet",
                    label="Model",
                    interactive=True
                )
                
                feedback_input = gr.Textbox(
                    label="Feedback",
                    lines=8,
                    placeholder="Describe the issue..."
                )
                fix_btn = gr.Button("Apply Fix")
                
                with gr.Accordion("Backups", open=False):
                    backup_list = gr.Dropdown(
                        choices=[("No backups", "")],
                        label="Select Backup",
                        interactive=True
                    )
                    restore_btn = gr.Button("Restore")
        
        # Wire up events
        # When directory changes, refresh game list and flag counts
        directory_dropdown.change(
            fn=refresh_games,
            inputs=[directory_dropdown, sort_dropdown],
            outputs=[game_dropdown]
        )
        directory_dropdown.change(
            fn=update_flag_counts,
            inputs=[directory_dropdown],
            outputs=[flag_counts_html]
        )
        
        # When sort changes, refresh game list
        sort_dropdown.change(
            fn=refresh_games,
            inputs=[directory_dropdown, sort_dropdown],
            outputs=[game_dropdown]
        )
        
        refresh_btn.click(
            fn=refresh_games,
            inputs=[directory_dropdown, sort_dropdown],
            outputs=[game_dropdown]
        )
        refresh_btn.click(
            fn=update_flag_counts,
            inputs=[directory_dropdown],
            outputs=[flag_counts_html]
        )
        
        refresh_game_btn.click(
            fn=refresh_game_preview,
            inputs=[game_dropdown],
            outputs=[game_iframe]
        )
        
        game_dropdown.change(
            fn=on_game_selected_minimal,
            inputs=[game_dropdown],
            outputs=[game_iframe, backup_list, flag_color_dropdown]
        )
        
        # Flag management events
        set_flag_btn.click(
            fn=set_flag_action,
            inputs=[game_dropdown, flag_color_dropdown, directory_dropdown, sort_dropdown],
            outputs=[game_dropdown, flag_counts_html, status_output]
        )
        
        fix_btn.click(
            fn=fix_game_action,
            inputs=[game_dropdown, feedback_input, model_dropdown],
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
            outputs=[game_iframe, backup_list, flag_color_dropdown]
        )
        app.load(
            fn=update_flag_counts,
            inputs=[directory_dropdown],
            outputs=[flag_counts_html]
        )
    
    return app


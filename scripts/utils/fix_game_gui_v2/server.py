"""
HTTP server for serving game files.

This module handles starting and managing the HTTP server that serves
game files to the Gradio interface.
"""

import os
import sys
import threading
import http.server
import socketserver
from pathlib import Path

# Handle imports for both script execution and module import
try:
    from .config import PROJECT_ROOT, GAME_SERVER_PORT
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import PROJECT_ROOT, GAME_SERVER_PORT

# Global server state
game_server = None
game_server_thread = None


def start_game_server(games_dir: str = "games/games"):
    """Start a simple HTTP server to serve game files."""
    global game_server, game_server_thread
    
    if game_server is not None:
        return  # Already running
    
    # Change to the project root directory (base directory for serving)
    # This allows serving both games/ and archive/games/ directories
    if not PROJECT_ROOT.exists():
        raise FileNotFoundError(f"Project root not found: {PROJECT_ROOT}")
    os.chdir(PROJECT_ROOT)
    
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


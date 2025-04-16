import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright


def test_p5_game(game_files: dict, debug: bool = False):
    """Run a p5.js game and access frameCount variable.
    
    Args:
        game_files: Dictionary with file paths as keys and file contents as values
        debug: If True, show the browser window
    """
    # Create a temporary directory to hold the game files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Find and write HTML file
        html_file = None
        for file_path, content in game_files.items():
            if file_path.endswith('.html'):
                html_file = os.path.join(temp_dir, os.path.basename(file_path))
                with open(html_file, 'w') as f:
                    f.write(content)
                break
        
        if not html_file:
            raise ValueError("No HTML file found in game files")
        
        # Write other files
        for file_path, content in game_files.items():
            if not file_path.endswith('.html'):
                full_path = os.path.join(temp_dir, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, 'w') as f:
                    f.write(content)
        
        with sync_playwright() as p:
            browser = p.firefox.launch(headless=not debug)
            page = browser.new_page(viewport={"width": 600, "height": 400})
            
            # Load the game
            page.goto(f"file://{html_file}")
            
            # Wait for game to initialize
            page.wait_for_timeout(1000)
            
            # Access frameCount variable
            # frame_count = page.evaluate("frameCount")
            # frame_count = page.evaluate("window.gameInstance.frameCount")
            # frame_count = page.evaluate("window.gameInstance.draw")
            breakpoint()
            print(f"Current frame count: {frame_count}")
            
            # Keep running for a few seconds and print frame count
            for _ in range(5):
                page.wait_for_timeout(1000)
                frame_count = page.evaluate("frameCount")
                print(f"Current frame count: {frame_count}")
            
            browser.close()
            
    finally:
        # Clean up temp directory
        import shutil
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    # Example usage with the cloudy game
    game_dir = Path("game-eval/games_v3/claude-3.7-sonnet/instruction_simple_prompt/game_0000/cloudy_with_a_chance")
    
    # Read all game files
    game_files = {}
    for file_path in game_dir.glob("**/*"):
        if file_path.is_file():
            rel_path = str(file_path.relative_to(game_dir))
            with open(file_path, 'r') as f:
                game_files[rel_path] = f.read()
    
    # Run the test
    test_p5_game(game_files, debug=True) 
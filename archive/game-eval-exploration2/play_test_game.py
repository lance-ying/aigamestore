import json
import argparse
import subprocess
import tempfile
import shutil
import os
from pathlib import Path
import socket

from coding_agent import CodingAgent


prompt_win_policy = """Implement a policy to win the game in the current directory.
First make sure you are able to properly control the player in the game using game logs as feedback.
Don't make the policy overly complex.
Modify the existing play_game.js. Don't modify any other files.
Use the assigned port {port} (do not use any other port).
Playwright is already installed. Run the script with `node play_game.js`. Don't use any other bash commands.
Save result.json, video.webm, and logs.txt in "results/play-game" (this folder should not contain any other files).
The results.json file should have a "gameOutcome" field with value "win"/"lose"/"timeout".
Stop when the win state is reached or if the game is completely impossible to win.
"""

prompt_random_policy = """Implement a purely random policy in play_game.js.
Use the assigned port {port} (do not use any other port).
The results.json file should have a "gameOutcome" field with value "win"/"lose"/"timeout".
Playwright is already installed. Run the script with `node play_game.js`. Don't use any other bash commands.
Stop directly when random policiy either reaches win/lose state or runs for more than a few minutes before timing out. One run is enough.
Don't try to implement a better policy than random.
"""

model = "claude-sonnet-4-20250514"


def run_coding_agent(prompt, code_dict, save_dir, model):
    """Run CodingAgent with a prompt and return the generated files."""
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="game_verify_")
    temp_path = Path(temp_dir)
    print(f"Using temp directory: {temp_path}")

    try:
        # Write existing files to temp directory
        for file_path, file_content in code_dict.items():
            file_full_path = temp_path / file_path
            file_full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_full_path, "w") as f:
                f.write(file_content)

        # Run npm install
        subprocess.run(["npm", "install"], cwd=temp_dir, check=True)
        
        # Use CodingAgent with temp directory as cwd
        agent = CodingAgent(model=model, verbose=True, cwd=str(temp_dir))
        result = agent.chat(prompt)
        
        # Copy generated files back
        shutil.copytree(temp_dir, save_dir / "code", dirs_exist_ok=True)

        return True
    except Exception as e:
        print(f"Error running coding agent: {e}")
        return False
    finally:
        # Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)

def verify_game(game_path, save_dir, model=model, port=None):
    game_path = Path(game_path)
    save_dir = Path(save_dir)
    template_dir = Path(__file__).parent / "template"
    
    # Load existing game code
    index_html = game_path / "index.html"
    game_js = game_path / "game.js"
    
    code_dict = {"index.html": index_html.read_text(), "game.js": game_js.read_text()}
    
    win_dir = save_dir / "win_policy"
    if not (win_dir / "code").exists():
        breakpoint()
        init_dir = win_dir / "init"
        init_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy game file
        shutil.copy(index_html, init_dir / "index.html")
        shutil.copy(game_js, init_dir / "game.js")
        
        # Copy template files for API step
        template_files = ["play_game_with_server.js", "package.json"]
        for template_file in template_files:
            template_path = template_dir / template_file
            if template_path.exists():
                shutil.copy(template_path, init_dir / template_file)
            else:
                print(f"Warning: Template file {template_file} not found")

        # rename play_game_with_server.js to play_game.js
        os.rename(init_dir / "play_game_with_server.js", init_dir / "play_game.js")
        
        # Create code dict with all files
        win_code_dict = {}
        for file_path in init_dir.rglob("*"):
            if file_path.is_file():
                win_code_dict[str(file_path.relative_to(init_dir))] = file_path.read_text()
        
        # Save prompt
        prompt = prompt_win_policy.format(port=port)
        with open(win_dir / "prompt.txt", "w") as f:
            f.write(prompt)
        
        success = run_coding_agent(prompt, win_code_dict, win_dir, model)
        if not success:
            print("Failed to generate win policy")
            return False
    
    # Test the game API
    # can_win = False
    # win_code_dir = win_dir / "code"
    # if (win_code_dir / "play_game.js").exists():
    #     print("Running play_game.js to test win policy...")
    #     try:
    #         result = subprocess.run(["node", "play_game.js"], cwd=win_code_dir, capture_output=True, text=True, timeout=30)
    #         if result.returncode == 0:
    #             print("✓ Win policy test passed")
    #             can_win = True
    #         else:
    #             print(f"✗ Win policy test failed: {result.stderr}")
    #     except subprocess.TimeoutExpired:
    #         print("✗ Win policy test timed out after 30 seconds")
    #     finally:
    #         # Kill any remaining node processes in the directory
    #         subprocess.run(["pkill", "-f", f"node.*{win_code_dir}"], capture_output=True)
    
    results_path = win_dir / "results" / "play-game" / "results.json"
    llm_can_win = False
    if results_path.exists():
        results = json.load(results_path.read_text())
        outcome = results["gameOutcome"]
        if outcome == "win":
            llm_can_win = True

    if llm_can_win:
        return {"llm_can_win": True, "rdm_can_win": None}



    # Generate random policy
    rdm_dir = save_dir / "rdm_policy"
    if not (rdm_dir / "code").exists():
        init_dir = rdm_dir / "init"
        init_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy game file
        shutil.copy(index_html, init_dir / "index.html")
        shutil.copy(game_js, init_dir / "game.js")
        
        # Copy template files for API step
        template_files = ["play_game_with_server.js", "package.json"]
        for template_file in template_files:
            template_path = template_dir / template_file
            if template_path.exists():
                shutil.copy(template_path, init_dir / template_file)
            else:
                print(f"Warning: Template file {template_file} not found")

        # rename play_game_with_server.js to play_game.js
        os.rename(init_dir / "play_game_with_server.js", init_dir / "play_game.js")
        
        # Create code dict with all files
        rdm_code_dict = {}
        for file_path in init_dir.rglob("*"):
            if file_path.is_file():
                rdm_code_dict[str(file_path.relative_to(init_dir))] = file_path.read_text()
        
        # Save prompt
        prompt = prompt_random_policy.format(port=port)
        with open(rdm_dir / "prompt.txt", "w") as f:
            f.write(prompt)
        
        # Generate random policy using CodingAgent
        success = run_coding_agent(prompt, rdm_code_dict, rdm_dir, model)
        if not success:
            print("Failed to generate random policy")
            return False

    results_path = rdm_dir / "results" / "play-game" / "results.json"
    rdm_can_win = False
    if results_path.exists():
        results = json.load(results_path.read_text())
        outcome = results["gameOutcome"]
        if outcome == "win":
            rdm_can_win = True

    return {"llm_can_win": llm_can_win, "rdm_can_win": rdm_can_win}



def find_available_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
        return port

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify a generated game by adding API and logging")
    parser.add_argument("game_path", help="Path to the generated game directory")
    parser.add_argument("--save-dir", required=False, help="Directory to save verification results")
    parser.add_argument("--model", default=model, help="Model to use")
    parser.add_argument("--port", required=False, help="Port to use")
    
    args = parser.parse_args()

    if args.save_dir is None:
        args.save_dir = Path(args.game_path) / "play_test_game"
    
    if args.port is None:
        args.port = find_available_port()

    success = verify_game(args.game_path, args.save_dir, args.model, args.port)

    
    if not success:
        exit(1)
